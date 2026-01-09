/* =========================================
   CUSTOMIZE PAGE LOGIC (FIXED GLOBAL SCOPE)
   ========================================= */

// --- GLOBAL VARIABLES ---
const PRICES = { card: 1999, tag: 899 };
let state = {
    mode: 'card', 
    imgScale: 1, imgRotate: 0,
    imageLoaded: false,
    texts: [], 
    selectedTextId: null,
    textColor: '#ffffff'
};

// DOM Element references (populated on load)
let mask, imgLayer, textCanvas, displayPrice;
let textPropsPanel, txtContent, txtFont, txtColor, txtSize;

/* =========================================
   1. GLOBAL FUNCTIONS (Attached to Window)
   ========================================= */

// Switch between Card and Tag
window.setMode = function(mode) {
    state.mode = mode;
    
    // Update Buttons
    const btnCard = document.getElementById('btn-card');
    const btnTag = document.getElementById('btn-tag');
    if(btnCard && btnTag) {
        btnCard.classList.toggle('active', mode === 'card');
        btnTag.classList.toggle('active', mode === 'tag');
    }
    
    // Update Shape
    const maskEl = document.getElementById('product-mask');
    const priceEl = document.getElementById('display-price');
    
    if (maskEl && priceEl) {
        if (mode === 'card') {
            maskEl.classList.remove('mode-tag');
            maskEl.classList.add('mode-card');
            priceEl.innerText = `₹${PRICES.card.toLocaleString()}`;
        } else {
            maskEl.classList.remove('mode-card');
            maskEl.classList.add('mode-tag');
            priceEl.innerText = `₹${PRICES.tag.toLocaleString()}`;
        }
    }
};

// Reset Image Position
window.resetImage = function() {
    document.getElementById('sl-scale').value = 1;
    document.getElementById('sl-rotate').value = 0;
    document.getElementById('sl-x').value = 0;
    document.getElementById('sl-y').value = 0;
    
    // Update internal state
    state.imgScale = 1;
    state.imgRotate = 0;
    state.x = 0;
    state.y = 0;
    
    // Update UI labels
    document.getElementById('val-scale').innerText = "100%";
    document.getElementById('val-rotate').innerText = "0°";
    
    updateImageTransform();
};

// Reset Text Position
window.resetTransforms = function() {
    window.resetImage(); // Reuse image reset
};

// Add New Text Layer
window.addTextLayer = function() {
    const id = Date.now();
    const textObj = {
        id: id,
        content: 'NEW TEXT',
        x: 50, y: 50,
        font: "'Syncopate', sans-serif",
        color: state.textColor, // Use auto-detected color
        size: 20
    };
    state.texts.push(textObj);
    renderTextElement(textObj);
    selectText(id);
};

// Delete Selected Text
window.deleteSelectedText = function() {
    if(!state.selectedTextId) return;
    const el = document.getElementById(`txt-${state.selectedTextId}`);
    if(el) el.remove();
    state.texts = state.texts.filter(t => t.id !== state.selectedTextId);
    state.selectedTextId = null;
    document.getElementById('text-properties').style.display = 'none';
};

// Finish / Add to Cart
window.finishDesign = function() {
    if (!state.imageLoaded) return alert("Please upload a design first!");
    
    const productName = state.mode === 'card' ? 'Custom Design Card' : 'Custom Design Tag';
    
    // Create summary
    let textSummary = state.texts.map(t => `${t.content} (${t.color})`).join(', ');
    const customTitle = `${productName} ${textSummary ? '['+textSummary+']' : ''}`;
    
    // Call global cart function
    if(window.addToCart) {
        window.addToCart(customTitle, PRICES[state.mode], document.getElementById('user-upload-img').src);
    } else {
        alert("Cart system not loaded.");
    }
};

// Auto Detect Color Button Click
window.triggerAutoColor = function() {
    autoDetectColor();
};

/* =========================================
   2. INITIALIZATION & EVENT LISTENERS
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    // Grab Elements
    mask = document.getElementById('product-mask');
    imgLayer = document.getElementById('user-upload-img');
    textCanvas = document.getElementById('text-canvas');
    displayPrice = document.getElementById('display-price');
    
    textPropsPanel = document.getElementById('text-properties');
    txtContent = document.getElementById('txt-content');
    txtFont = document.getElementById('txt-font');
    txtColor = document.getElementById('txt-color');
    txtSize = document.getElementById('txt-size');

    // Init Sliders
    document.querySelectorAll('input[type="range"]').forEach(input => {
        input.value = input.getAttribute('value');
    });

    // --- UPLOAD HANDLER ---
    document.getElementById('file-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                imgLayer.src = event.target.result;
                imgLayer.classList.add('active');
                
                document.getElementById('placeholder-msg').style.display = 'none';
                document.getElementById('fine-tune-panel').style.display = 'block';
                document.getElementById('text-controls-panel').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('fine-tune-panel').style.opacity = 1;
                    document.getElementById('text-controls-panel').style.opacity = 1;
                }, 10);
                
                document.getElementById('file-name').innerText = file.name;
                state.imageLoaded = true;
                
                // Reset & Detect Color
                window.resetImage();
                setTimeout(autoDetectColor, 300);
            }
            reader.readAsDataURL(file);
        }
    });

    // --- IMAGE SLIDERS ---
    document.getElementById('sl-scale').addEventListener('input', (e) => {
        state.imgScale = parseFloat(e.target.value);
        document.getElementById('val-scale').innerText = Math.round(state.imgScale * 100) + '%';
        updateImageTransform();
    });
    document.getElementById('sl-rotate').addEventListener('input', (e) => {
        state.imgRotate = parseInt(e.target.value);
        document.getElementById('val-rotate').innerText = state.imgRotate + '°';
        updateImageTransform();
    });
    document.getElementById('sl-x').addEventListener('input', (e) => {
        state.x = parseInt(e.target.value);
        updateImageTransform();
    });
    document.getElementById('sl-y').addEventListener('input', (e) => {
        state.y = parseInt(e.target.value);
        updateImageTransform();
    });

    // --- TEXT CONTROLS (Global Input) ---
    // If user types in the main text input, add a layer if none exists, or update selected
    const mainTextInput = document.getElementById('custom-text-input');
    if(mainTextInput) {
        mainTextInput.addEventListener('change', (e) => { // Change triggers on enter/blur
             if(!state.selectedTextId && e.target.value.trim() !== "") {
                 window.addTextLayer();
                 // Update the newly created text
                 state.texts[state.texts.length-1].content = e.target.value;
                 document.getElementById(`txt-${state.texts[state.texts.length-1].id}`).innerText = e.target.value;
             }
        });
        
        mainTextInput.addEventListener('input', (e) => {
            if(state.selectedTextId) {
                updateSelectedText(e.target.value, 'content');
            }
        });
    }

    // Font Select
    document.getElementById('font-select').addEventListener('change', (e) => {
        if(state.selectedTextId) updateSelectedText(e.target.value, 'font');
        else state.font = e.target.value; // Save default for next text
    });

    // Color Picker
    document.getElementById('text-color-picker').addEventListener('input', (e) => {
        state.textColor = e.target.value;
        if(state.selectedTextId) updateSelectedText(e.target.value, 'color');
    });

    // --- 3D TILT ---
    const stage = document.getElementById('tilt-stage');
    if(stage) {
        stage.addEventListener('mousemove', (e) => {
            const rect = stage.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xRot = -((y - rect.height/2) / 20);
            const yRot = (x - rect.width/2) / 20;
            if(mask) mask.style.transform = `perspective(1000px) rotateX(${xRot}deg) rotateY(${yRot}deg)`;
        });
        stage.addEventListener('mouseleave', () => {
            if(mask) mask.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
        });
    }
});

/* =========================================
   INTERNAL HELPER FUNCTIONS
   ========================================= */

function updateImageTransform() {
    if(!state.imageLoaded) return;
    imgLayer.style.transform = `translate(-50%, -50%) translate(${state.x || 0}px, ${state.y || 0}px) rotate(${state.imgRotate}deg) scale(${state.imgScale})`;
}

function renderTextElement(textObj) {
    const el = document.createElement('div');
    el.id = `txt-${textObj.id}`;
    el.className = 'draggable-text';
    el.innerText = textObj.content;
    el.style.left = textObj.x + '%';
    el.style.top = textObj.y + '%';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.fontFamily = textObj.font;
    el.style.color = textObj.color;
    el.style.fontSize = textObj.size + 'px';
    
    // Drag Events
    el.addEventListener('mousedown', initDrag);
    el.addEventListener('touchstart', initDrag, {passive: false});
    
    // Click Select
    el.addEventListener('click', (e) => {
        e.stopPropagation();
        selectText(textObj.id);
    });

    textCanvas.appendChild(el);
}

function selectText(id) {
    state.selectedTextId = id;
    
    // Visual Highlight
    document.querySelectorAll('.draggable-text').forEach(el => el.classList.remove('selected'));
    const el = document.getElementById(`txt-${id}`);
    if(el) el.classList.add('selected');

    // Populate Controls
    const textObj = state.texts.find(t => t.id === id);
    if(textObj) {
        document.getElementById('custom-text-input').value = textObj.content;
        document.getElementById('font-select').value = textObj.font;
        document.getElementById('text-color-picker').value = textObj.color;
    }
}

function updateSelectedText(value, type) {
    if(!state.selectedTextId) return;
    const textObj = state.texts.find(t => t.id === state.selectedTextId);
    const el = document.getElementById(`txt-${state.selectedTextId}`);
    
    if(type === 'content') {
        textObj.content = value;
        el.innerText = value;
    } else if (type === 'font') {
        textObj.font = value;
        el.style.fontFamily = value;
    } else if (type === 'color') {
        textObj.color = value;
        el.style.color = value;
    }
}

function autoDetectColor() {
    if (!state.imageLoaded) return;
    
    const canvas = document.createElement('canvas');
   /* --- STEP 3: LOAD TEMPLATE FROM URL --- */
    // Paste this AFTER you define 'const canvas = ...'

    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');

    if (templateId) {
        console.log("Loading Template ID:", templateId);
        const db = firebase.firestore();
        
        db.collection("products").doc(templateId).get().then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                if (data.designTemplate) {
                    // Load the design onto the canvas
                    canvas.loadFromJSON(data.designTemplate, function() {
                        canvas.renderAll();
                        console.log("Template loaded successfully");
                    });
                }
            }
        }).catch((error) => {
            console.error("Error loading template:", error);
        });
    }
    const ctx = canvas.getContext('2d');
    canvas.width = imgLayer.naturalWidth;
    canvas.height = imgLayer.naturalHeight;
    ctx.drawImage(imgLayer, 0, 0);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let colorSum = 0;
    
    for(let x = 0; x < data.length; x+=40) {
        colorSum += Math.floor((data[x] + data[x+1] + data[x+2]) / 3);
    }
    
    const brightness = Math.floor(colorSum / (data.length / 40));
    let bestColor = (brightness < 128) ? '#ffffff' : '#000000';
    
    // Update State
    state.textColor = bestColor;
    document.getElementById('text-color-picker').value = bestColor;
    
    // Update any existing texts? No, just default for new ones.
}

/* --- DRAG LOGIC --- */
let dragItem = null;

function initDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    dragItem = e.target;
    selectText(parseInt(dragItem.id.split('-')[1]));
    
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', doDrag, {passive: false});
    document.addEventListener('touchend', stopDrag);
}

function doDrag(e) {
    if (!dragItem) return;
    e.preventDefault();
    
    const rect = textCanvas.getBoundingClientRect();
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

    let xPct = ((clientX - rect.left) / rect.width) * 100;
    let yPct = ((clientY - rect.top) / rect.height) * 100;

    // Constrain
    if(xPct < 0) xPct = 0; if(xPct > 100) xPct = 100;
    if(yPct < 0) yPct = 0; if(yPct > 100) yPct = 100;

    dragItem.style.left = xPct + '%';
    dragItem.style.top = yPct + '%';
    
    const id = parseInt(dragItem.id.split('-')[1]);
    const textObj = state.texts.find(t => t.id === id);
    if(textObj) {
        textObj.x = xPct;
        textObj.y = yPct;
    }
}

function stopDrag() {
    dragItem = null;
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', doDrag);
    document.removeEventListener('touchend', stopDrag);
}
