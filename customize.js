/* =========================================
   CUSTOMIZE PAGE LOGIC (FIXED SCOPE)
   ========================================= */

// Configuration
const PRICES = { card: 1999, tag: 899 };
let state = {
    mode: 'card', 
    imgScale: 1, imgRotate: 0,
    imageLoaded: false,
    texts: [], 
    selectedTextId: null
};

// DOM Elements
let mask, imgLayer, textCanvas, displayPrice;
let textPropsPanel, txtContent, txtFont, txtColor, txtSize;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    mask = document.getElementById('product-mask');
    imgLayer = document.getElementById('user-upload-img');
    textCanvas = document.getElementById('text-canvas');
    displayPrice = document.getElementById('display-price');
    
    textPropsPanel = document.getElementById('text-properties');
    txtContent = document.getElementById('txt-content');
    txtFont = document.getElementById('txt-font');
    txtColor = document.getElementById('txt-color');
    txtSize = document.getElementById('txt-size');

    // Initialize Sliders
    document.querySelectorAll('input[type="range"]').forEach(input => {
        input.value = input.getAttribute('value');
    });

    // --- EVENT LISTENERS ---
    
    // Image Upload
    document.getElementById('file-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                imgLayer.src = event.target.result;
                imgLayer.classList.add('active');
                
                document.getElementById('placeholder-msg').style.display = 'none';
                document.getElementById('image-controls').style.display = 'block';
                document.getElementById('text-section').style.display = 'block';
                document.getElementById('file-name').innerText = file.name;
                
                state.imageLoaded = true;
                
                // Auto-Detect Color
                setTimeout(autoDetectColor, 300);
            }
            reader.readAsDataURL(file);
        }
    });

    // Image Sliders
    document.getElementById('sl-scale').addEventListener('input', (e) => {
        state.imgScale = e.target.value;
        document.getElementById('val-scale').innerText = Math.round(state.imgScale * 100) + '%';
        updateImageTransform();
    });

    document.getElementById('sl-rotate').addEventListener('input', (e) => {
        state.imgRotate = e.target.value;
        document.getElementById('val-rotate').innerText = state.imgRotate + '°';
        updateImageTransform();
    });

    // Text Property Listeners
    if(txtContent) txtContent.addEventListener('input', updateSelectedText);
    if(txtFont) txtFont.addEventListener('change', updateSelectedText);
    if(txtColor) txtColor.addEventListener('input', updateSelectedText);
    if(txtSize) txtSize.addEventListener('input', updateSelectedText);

    // 3D Tilt Logic
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
   GLOBAL FUNCTIONS (Attached to Window)
   ========================================= */

// 1. Set Mode (Card vs Tag)
window.setMode = function(mode) {
    state.mode = mode;
    
    document.getElementById('btn-card').classList.toggle('active', mode === 'card');
    document.getElementById('btn-tag').classList.toggle('active', mode === 'tag');
    
    if (mode === 'card') {
        mask.classList.remove('mode-tag');
        mask.classList.add('mode-card');
        displayPrice.innerText = `₹${PRICES.card.toLocaleString()}`;
    } else {
        mask.classList.remove('mode-card');
        mask.classList.add('mode-tag');
        displayPrice.innerText = `₹${PRICES.tag.toLocaleString()}`;
    }
};

// 2. Reset Image
window.resetImage = function() {
    document.getElementById('sl-scale').value = 1;
    document.getElementById('sl-rotate').value = 0;
    // Trigger input events manually to update state
    document.getElementById('sl-scale').dispatchEvent(new Event('input'));
    document.getElementById('sl-rotate').dispatchEvent(new Event('input'));
};

function updateImageTransform() {
    if(!state.imageLoaded) return;
    imgLayer.style.transform = `translate(-50%, -50%) scale(${state.imgScale}) rotate(${state.imgRotate}deg)`;
}

// 3. Add Text Layer
window.addTextLayer = function() {
    const id = Date.now();
    const textObj = {
        id: id,
        content: 'NEW TEXT',
        x: 50, y: 50, // Center
        font: "'Syncopate', sans-serif",
        color: '#ffffff',
        size: 20
    };
    state.texts.push(textObj);
    renderTextElement(textObj);
    selectText(id);
};

// 4. Delete Text
window.deleteSelectedText = function() {
    if(!state.selectedTextId) return;
    const el = document.getElementById(`txt-${state.selectedTextId}`);
    if(el) el.remove();
    state.texts = state.texts.filter(t => t.id !== state.selectedTextId);
    state.selectedTextId = null;
    document.getElementById('text-properties').style.display = 'none';
};

// 5. Finish / Add to Cart
window.finishDesign = function() {
    if (!state.imageLoaded) return alert("Please upload a design first!");
    
    const productName = state.mode === 'card' ? 'Custom Design Card' : 'Custom Design Tag';
    
    // Create summary of text layers
    let textSummary = state.texts.map(t => `${t.content} (${t.color})`).join(', ');
    const customTitle = `${productName} ${textSummary ? '['+textSummary+']' : ''}`;
    
    // Assumes addToCart is globally available from script.js
    if(window.addToCart) {
        window.addToCart(customTitle, PRICES[state.mode], imgLayer.src);
    } else {
        alert("Cart system not connected.");
    }
};

/* --- HELPER FUNCTIONS --- */

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
        document.getElementById('text-properties').style.display = 'block';
        txtContent.value = textObj.content;
        txtFont.value = textObj.font;
        txtColor.value = textObj.color;
        txtSize.value = textObj.size;
    }
}

function updateSelectedText() {
    if(!state.selectedTextId) return;
    const textObj = state.texts.find(t => t.id === state.selectedTextId);
    const el = document.getElementById(`txt-${state.selectedTextId}`);
    
    // Update Data
    textObj.content = txtContent.value || " ";
    textObj.font = txtFont.value;
    textObj.color = txtColor.value;
    textObj.size = txtSize.value;

    // Update View
    el.innerText = textObj.content;
    el.style.fontFamily = textObj.font;
    el.style.color = textObj.color;
    el.style.fontSize = textObj.size + 'px';
}

// Drag Logic
let dragItem = null;

function initDrag(e) {
    e.preventDefault();
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

    // Boundaries
    if(xPct < 0) xPct = 0; if(xPct > 100) xPct = 100;
    if(yPct < 0) yPct = 0; if(yPct > 100) yPct = 100;

    dragItem.style.left = xPct + '%';
    dragItem.style.top = yPct + '%';
    
    // Update State
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

function autoDetectColor() {
    if (!state.imageLoaded) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = imgLayer.naturalWidth;
    canvas.height = imgLayer.naturalHeight;
    ctx.drawImage(imgLayer, 0, 0);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let colorSum = 0;
    // Sample pixels for speed
    for(let x = 0; x < data.length; x+=40) {
        colorSum += Math.floor((data[x] + data[x+1] + data[x+2]) / 3);
    }
    const brightness = Math.floor(colorSum / (data.length / 40));
    
    // Determine best contrast color
    let bestColor = (brightness < 128) ? '#ffffff' : '#000000';
    if (brightness > 100 && brightness < 150) bestColor = '#D4AF37'; // Gold for mid-tones

    // Set for NEW texts (doesn't change existing ones)
    if(txtColor) txtColor.value = bestColor;
}
