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

// 2. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');

    if (templateId) {
        loadTemplate(templateId);
    } else {
        setMode('card');
    }
    
    updateCartCount();
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
                    if(bgColor) document.getElementById('bg-color-picker').value = bgColor;
                    
                    // Re-apply mode to ensure shape is correct after load
                    if(data.type === 'tag') setMode('tag');
                    else setMode('card');
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
    // Background Color
    document.getElementById('bg-color-picker').addEventListener('input', function(e) {
        canvas.setBackgroundColor(e.target.value, canvas.renderAll.bind(canvas));
    });

    // Selection Events
    canvas.on('selection:created', updateControls);
    canvas.on('selection:updated', updateControls);
    canvas.on('selection:cleared', () => {
        document.getElementById('layer-controls').style.display = 'none';
    });

    // Text & Controls Inputs
    const props = ['txt-content', 'txt-font', 'txt-color', 'common-scale'];
    props.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', updateCanvasFromInput);
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
        if(id === 'txt-color') active.set('fill', val);
    }
    if(id === 'common-scale') active.scale(parseFloat(val));
    
    canvas.renderAll();
}

function updateControls() {
    const active = canvas.getActiveObject();
    if (!active) return;

    document.getElementById('layer-controls').style.display = 'block';
    
    // Show/Hide text tools
    const textTools = document.getElementById('text-tools');
    if (active.type === 'i-text') {
        textTools.style.display = 'block';
        document.getElementById('txt-content').value = active.text;
        document.getElementById('txt-font').value = active.fontFamily;
        document.getElementById('txt-color').value = active.fill;
    } else {
        textTools.style.display = 'none';
    }
    document.getElementById('common-scale').value = active.scaleX;
}

// 7. FINISH & SAVE
function finishDesign() {
    canvas.discardActiveObject();
    canvas.renderAll();

    // Export High Res Image
    const designImage = canvas.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 2 
    });

    const productID = currentProduct ? currentProduct.id : 'custom-' + Date.now();
    const productName = currentProduct ? currentProduct.name + " (Custom)" : "Custom Design";
    
    addToCart(productID, productName, currentPrice, designImage);
}

function addToCart(id, name, price, img) {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    cart.push({ id: id, name: name, price: price, img: img, qty: 1 });
    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    
    updateCartCount();
    toggleCart(); 
}

function exportDesignJSON() {
    const json = JSON.stringify(canvas.toJSON());
    navigator.clipboard.writeText(json).then(() => alert("Copied JSON!"));
}

// UTILS
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    let qty = cart.reduce((acc, item) => acc + item.qty, 0);
    const badge = document.getElementById('cart-count');
    if(badge) { badge.innerText = qty; badge.style.display = qty > 0 ? 'flex' : 'none'; }
}

function toggleCart() {
    document.getElementById('cart-drawer').classList.toggle('open');
    renderCartContents();
}

function closeAllDrawers() {
    document.getElementById('cart-drawer').classList.remove('open');
}

function renderCartContents() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    let total = 0;

    container.innerHTML = '';
    cart.forEach((item, index) => {
        total += item.price * item.qty;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.img}" style="width:60px; height:60px; object-fit:contain; background:#222; border-radius:4px;">
            <div style="flex:1; margin-left:10px;">
                <div style="color:white; font-size:0.9rem;">${item.name}</div>
                <div style="color:#888;">₹${item.price}</div>
            </div>
            <span onclick="removeItem(${index})" style="color:#ff4444; cursor:pointer;">×</span>
        `;
        container.appendChild(div);
    });
    if(totalEl) totalEl.innerText = "₹" + total;
}

function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    renderCartContents();
    updateCartCount();
}
