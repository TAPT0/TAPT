/* --- customize.js | FIXED: Round Tag Logic --- */

// 1. CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyBmCVQan3wclKDTG2yYbCf_oMO6t0j17wI",
    authDomain: "tapt-337b8.firebaseapp.com",
    databaseURL: "https://tapt-337b8-default-rtdb.firebaseio.com",
    projectId: "tapt-337b8",
    storageBucket: "tapt-337b8.firebasestorage.app",
    messagingSenderId: "887956121124",
    appId: "1:887956121124:web:6856680bf75aa3bacddab1",
    measurementId: "G-2CB8QXYNJY"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// INITIAL CANVAS SETUP
const canvas = new fabric.Canvas('editor-canvas', {
    width: 350,  
    height: 220, 
    backgroundColor: '#0a0a0a',
    preserveObjectStacking: true,
    selection: true
});

let currentProduct = null;
let currentPrice = 499;
let bgColorPicker = null;
let textColorPicker = null;
let gridEnabled = false;
let snapEnabled = false;
const gridSize = 20;

// 2. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');

    if (templateId) {
        loadTemplate(templateId);
    } else {
        setMode('card');
    }
    
    if(typeof window.updateCartCount === 'function') window.updateCartCount();
    setupEventListeners();
});

// 3. LOAD TEMPLATE
function loadTemplate(id) {
    db.collection("products").doc(id).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            currentProduct = { id: doc.id, ...data };
            currentPrice = data.price || 499;
            document.getElementById('display-price').innerText = "₹" + currentPrice;

            if (data.designTemplate) {
                canvas.loadFromJSON(data.designTemplate, function() {
                    canvas.renderAll();
                    // Sync color picker
                    const bgColor = canvas.backgroundColor;
                    if(bgColor && bgColorPicker) bgColorPicker.setColor(bgColor);
                    
                    // Re-apply mode to ensure shape is correct after load
                    if(data.type === 'tag') setMode('tag');
                    else setMode('card');
                    renderLayerPanel();
                });
            } else {
                if(data.type === 'tag') setMode('tag');
                else setMode('card');
            }
        }
    });
}

// 4. MODE SWITCHING (THE FIX IS HERE)
function setMode(mode) {
    const wrapper = document.getElementById('canvas-wrapper');
    const hole = document.getElementById('hw-hole');
    const ring = document.getElementById('hw-ring');
    const btnCard = document.getElementById('btn-card');
    const btnTag = document.getElementById('btn-tag');

    // Reset UI
    btnCard.classList.remove('active');
    btnTag.classList.remove('active');

    if (mode === 'card') {
        // --- CARD MODE (Rectangle) ---
        canvas.setDimensions({ width: 350, height: 220 });
        
        // Remove circular clipping
        canvas.clipPath = null;
        
        // CSS Updates
        wrapper.style.borderRadius = "15px"; 
        wrapper.style.width = "350px";
        wrapper.style.height = "220px";
        
        hole.style.display = 'none';
        ring.style.display = 'none';
        btnCard.classList.add('active');

    } else {
        // --- TAG MODE (2 Inch Round) ---
        // 2 inches approx 210px relative to screen size
        const tagSize = 210; 
        const radius = tagSize / 2;

        canvas.setDimensions({ width: tagSize, height: tagSize });

        // FABRIC JS CLIPPING (Makes the exported image round)
        const circleClip = new fabric.Circle({
            radius: radius,
            originX: 'center',
            originY: 'center',
            left: radius,
            top: radius
        });
        canvas.clipPath = circleClip;

        // CSS Updates (Makes the editor look round)
        wrapper.style.borderRadius = "50%"; 
        wrapper.style.width = tagSize + "px";
        wrapper.style.height = tagSize + "px";
        
        hole.style.display = 'block';
        ring.style.display = 'block';
        btnTag.classList.add('active');
    }
    
    // Resize background image if exists
    if(canvas.backgroundImage) {
        canvas.backgroundImage.scaleToWidth(canvas.width);
        canvas.backgroundImage.scaleToHeight(canvas.height);
    }
    
    canvas.renderAll();
}

// 5. CANVAS TOOLS
function addTextLayer() {
    const text = new fabric.IText('TAP TO EDIT', {
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: 'center',
        originY: 'center',
        fontFamily: 'Syncopate',
        fill: '#ffffff',
        fontSize: 20
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
}

function handleAddImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            fabric.Image.fromURL(e.target.result, function(img) {
                // Scale to fit nicely
                const scale = (canvas.width * 0.4) / img.width;
                img.scale(scale);
                canvas.add(img);
                canvas.centerObject(img);
                canvas.setActiveObject(img);
                canvas.renderAll();
            });
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function deleteSelected() {
    const active = canvas.getActiveObject();
    if (active) {
        canvas.remove(active);
        canvas.renderAll();
        document.getElementById('layer-controls').style.display = 'none';
    }
}

// 6. SETUP LISTENERS (Events)
function setupEventListeners() {
    // --- Initialize Color Pickers ---
    const pickrOptions = {
        theme: 'nano',
        swatches: [
            '#D4AF37', '#C0C0C0', '#000000', '#FFFFFF',
            '#F44336', '#E91E63', '#9C27B0', '#673AB7',
            '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
            '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
            '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'
        ],
        components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: {
                hex: true,
                rgba: true,
                hsla: true,
                input: true,
                clear: true,
                save: true
            }
        }
    };

    // Background Color Picker
    bgColorPicker = Pickr.create({ ...pickrOptions, el: '#bg-color-picker', default: '#0a0a0a' });
    bgColorPicker.on('save', (color) => {
        canvas.setBackgroundColor(color.toRGBA().toString(), canvas.renderAll.bind(canvas));
        bgColorPicker.hide();
    });

    // Text Color Picker
    textColorPicker = Pickr.create({ ...pickrOptions, el: '#txt-color-picker', default: '#ffffff' });
    textColorPicker.on('save', (color) => {
        const active = canvas.getActiveObject();
        if (active && active.type === 'i-text') {
            active.set('fill', color.toRGBA().toString());
            canvas.renderAll();
        }
        textColorPicker.hide();
    });

    // Selection Events
    canvas.on('selection:created', (e) => {
        updateControls();
        renderLayerPanel();
        checkContrast();
    });
    canvas.on('selection:updated', (e) => {
        updateControls();
        renderLayerPanel();
        checkContrast();
    });
    canvas.on('selection:cleared', () => {
        document.getElementById('layer-controls').style.display = 'none';
        renderLayerPanel();
    });

    // Layer Events
    canvas.on('object:added', renderLayerPanel);
    canvas.on('object:removed', renderLayerPanel);
    canvas.on('object:modified', renderLayerPanel);

    // Grid Snapping
    canvas.on('object:moving', (options) => {
        if (snapEnabled) {
            options.target.set({
                left: Math.round(options.target.left / gridSize) * gridSize,
                top: Math.round(options.target.top / gridSize) * gridSize
            });
        }
    });

    // Text & Controls Inputs
    const props = ['txt-content', 'txt-font', 'txt-size', 'txt-weight', 'txt-spacing', 'txt-lineheight', 'common-scale', 'img-opacity', 'img-x', 'img-y'];
    props.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', updateCanvasFromInput);
    });

    const alignButtons = ['align-left', 'align-center', 'align-right'];
    alignButtons.forEach(id => {
        document.getElementById(id).addEventListener('click', () => {
            const active = canvas.getActiveObject();
            if (active && active.type === 'i-text') {
                active.set('textAlign', id.split('-')[1]);
                canvas.renderAll();
                updateControls(); 
            }
        });
    });

    // Drag & Drop Support
    const wrapper = document.getElementById('canvas-wrapper');
    wrapper.addEventListener('dragover', (e) => { e.preventDefault(); });
    wrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const reader = new FileReader();
            reader.onload = (f) => {
                fabric.Image.fromURL(f.target.result, (img) => {
                    const scale = (canvas.width * 0.5) / img.width;
                    img.scale(scale);
                    canvas.add(img);
                    canvas.centerObject(img);
                    canvas.setActiveObject(img);
                    canvas.renderAll();
                });
            };
            reader.readAsDataURL(e.dataTransfer.files[0]);
        }
    });
}

function updateCanvasFromInput(e) {
    const active = canvas.getActiveObject();
    if (!active) return;
    const id = e.target.id;
    const val = e.target.value;

    if (active.type === 'i-text') {
        if(id === 'txt-content') active.set('text', val);
        if(id === 'txt-font') active.set('fontFamily', val);
        if(id === 'txt-size') active.set('fontSize', parseInt(val, 10));
        if(id === 'txt-weight') active.set('fontWeight', val);
        if(id === 'txt-spacing') active.set('charSpacing', parseInt(val, 10));
        if(id === 'txt-lineheight') active.set('lineHeight', parseFloat(val));
    }
    
    if (active.type === 'image') {
        if(id === 'img-opacity') active.set('opacity', parseFloat(val));
        if(id === 'img-x') active.set('left', parseFloat(val));
        if(id === 'img-y') active.set('top', parseFloat(val));
    }

    if(id === 'common-scale') active.scale(parseFloat(val));
    
    canvas.renderAll();
}

function updateControls() {
    const active = canvas.getActiveObject();
    if (!active) return;

    document.getElementById('layer-controls').style.display = 'block';
    
    const textTools = document.getElementById('text-tools');
    const imageTools = document.getElementById('image-tools');

    // Reset Tools
    textTools.style.display = 'none';
    imageTools.style.display = 'none';

    if (active.type === 'i-text') {
        textTools.style.display = 'block';
        document.getElementById('txt-content').value = active.text;
        document.getElementById('txt-font').value = active.fontFamily;
        if(textColorPicker) textColorPicker.setColor(active.fill);
        document.getElementById('txt-size').value = active.fontSize;
        document.getElementById('txt-weight').value = active.fontWeight;
        document.getElementById('txt-spacing').value = active.charSpacing || 0;
        document.getElementById('txt-lineheight').value = active.lineHeight || 1.2;

        // Update alignment buttons
        const align = active.textAlign || 'left';
        ['align-left', 'align-center', 'align-right'].forEach(id => {
            document.getElementById(id).classList.remove('active');
        });
        document.getElementById(`align-${align}`).classList.add('active');

    } else if (active.type === 'image') {
        imageTools.style.display = 'block';
        document.getElementById('img-opacity').value = active.opacity || 1;
        document.getElementById('img-x').value = Math.round(active.left || 0);
        document.getElementById('img-y').value = Math.round(active.top || 0);
    }
    
    document.getElementById('common-scale').value = active.scaleX || 1;
}

// --- LAYER MANAGEMENT ---
function renderLayerPanel() {
    const panel = document.getElementById('layer-panel');
    if (!panel) return;
    
    panel.innerHTML = '';
    const objects = canvas.getObjects().slice().reverse(); // Show top layers first
    const activeObj = canvas.getActiveObject();

    objects.forEach((obj, index) => {
        // Skip clip path objects if any
        if (obj === canvas.clipPath) return;

        const div = document.createElement('div');
        div.className = 'layer-item';
        if (activeObj === obj) div.classList.add('active');

        let icon = 'fa-layer-group';
        let name = 'Layer ' + (objects.length - index);

        if (obj.type === 'i-text') {
            icon = 'fa-font';
            name = obj.text || 'Text Layer';
        } else if (obj.type === 'image') {
            icon = 'fa-image';
            name = 'Image Layer';
        }

        div.innerHTML = `<i class="fas ${icon}"></i> <span>${name}</span>`;
        div.onclick = () => {
            canvas.setActiveObject(obj);
            canvas.renderAll();
        };

        panel.appendChild(div);
    });
}

function moveLayerUp() {
    const active = canvas.getActiveObject();
    if (active) {
        canvas.bringForward(active);
        canvas.renderAll();
        renderLayerPanel();
    }
}

function moveLayerDown() {
    const active = canvas.getActiveObject();
    if (active) {
        canvas.sendBackwards(active);
        canvas.renderAll();
        renderLayerPanel();
    }
}

// --- GRID SYSTEM ---
function toggleGrid() {
    gridEnabled = !gridEnabled;
    if (gridEnabled) {
        const gridGroup = new fabric.Group([], { selectable: false, evented: false, id: 'grid-lines' });
        
        for (let i = 0; i < (canvas.width / gridSize); i++) {
            gridGroup.addWithUpdate(new fabric.Line([ i * gridSize, 0, i * gridSize, canvas.height], { stroke: '#333', selectable: false }));
            gridGroup.addWithUpdate(new fabric.Line([ 0, i * gridSize, canvas.width, i * gridSize], { stroke: '#333', selectable: false }));
        }
        
        canvas.add(gridGroup);
        canvas.sendToBack(gridGroup);
    } else {
        const objects = canvas.getObjects();
        objects.forEach(obj => {
            if(obj.id === 'grid-lines') canvas.remove(obj);
        });
    }
    canvas.renderAll();
}

function toggleSnap() {
    snapEnabled = !snapEnabled;
}

// --- TEMPLATE SYSTEM ---
function saveTemplate() {
    const name = prompt("Enter a name for your design:");
    if (!name) return;

    const designJson = JSON.stringify(canvas.toJSON());
    const templates = JSON.parse(localStorage.getItem('TAPDTemplates')) || [];
    
    templates.push({
        name: name,
        date: new Date().toLocaleDateString(),
        json: designJson
    });

    localStorage.setItem('TAPDTemplates', JSON.stringify(templates));
    alert("Design saved successfully!");
    if(document.getElementById('saved-templates-list').style.display === 'block') {
        renderSavedTemplates();
    }
}

function toggleTemplates() {
    const list = document.getElementById('saved-templates-list');
    if (list.style.display === 'none') {
        list.style.display = 'block';
        renderSavedTemplates();
    } else {
        list.style.display = 'none';
    }
}

function renderSavedTemplates() {
    const list = document.getElementById('saved-templates-list');
    const templates = JSON.parse(localStorage.getItem('TAPDTemplates')) || [];
    
    list.innerHTML = '';
    if (templates.length === 0) {
        list.innerHTML = '<div style="color:#888; padding:10px; text-align:center;">No saved designs</div>';
        return;
    }

    templates.forEach((t, i) => {
        const div = document.createElement('div');
        div.className = 'layer-item';
        div.innerHTML = `
            <div style="flex:1" onclick="loadSavedTemplate(${i})">
                <div style="color:white; font-weight:bold;">${t.name}</div>
                <div style="color:#666; font-size:0.8rem;">${t.date}</div>
            </div>
            <i class="fas fa-trash" onclick="deleteSavedTemplate(${i})" style="color:#ff4444; cursor:pointer;"></i>
        `;
        list.appendChild(div);
    });
}

function loadSavedTemplate(index) {
    const templates = JSON.parse(localStorage.getItem('TAPDTemplates')) || [];
    if (templates[index]) {
        canvas.loadFromJSON(templates[index].json, function() {
            canvas.renderAll();
            renderLayerPanel();
            // Sync background color picker if applicable
            if(canvas.backgroundColor && bgColorPicker) {
                bgColorPicker.setColor(canvas.backgroundColor);
            }
        });
    }
}

function deleteSavedTemplate(index) {
    if(!confirm("Delete this design?")) return;
    
    const templates = JSON.parse(localStorage.getItem('TAPDTemplates')) || [];
    templates.splice(index, 1);
    localStorage.setItem('TAPDTemplates', JSON.stringify(templates));
    renderSavedTemplates();
}

/* --- REPLACE FROM LINE: function finishDesign() DOWNWARDS --- */

// 7. FINISH DESIGN & ADD TO CART
function finishDesign() {
    canvas.discardActiveObject();
    canvas.renderAll();

    // 1. Generate Image (For preview)
    const designImage = canvas.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 2 
    });

    // 2. Generate JSON (For editing later)
    const designJson = JSON.stringify(canvas.toJSON());

    const productID = currentProduct ? currentProduct.id : 'custom-' + Date.now();
    const productName = currentProduct ? currentProduct.name + " (Custom)" : "Custom Design";
    
    // Pass both Image AND Json
    if(window.addToCart) {
        window.addToCart(productName, currentPrice, designImage, productID, designJson);
    } else {
        alert("Cart Error: Please refresh the page.");
    }
}

// 8. ADMIN TOOL
function exportDesignJSON() {
    const json = JSON.stringify(canvas.toJSON());
    navigator.clipboard.writeText(json).then(() => {
        alert("Design JSON Copied! Paste into Admin Panel.");
    });
}

