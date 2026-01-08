/* =========================================
   CUSTOMIZE PAGE LOGIC (WITH SMART COLOR)
   ========================================= */

// Configuration
const PRICES = { card: 1999, tag: 899 };
let state = {
    mode: 'card', 
    scale: 1, rotate: 0, x: 0, y: 0,
    imageLoaded: false,
    text: '',
    font: "'Syncopate', sans-serif",
    textColor: '#ffffff'
};

// DOM Elements
const mask = document.getElementById('product-mask');
const imgLayer = document.getElementById('user-upload-img');
const textLayer = document.getElementById('text-layer');
const placeholder = document.getElementById('placeholder-msg');
const tunePanel = document.getElementById('fine-tune-panel');
const textPanel = document.getElementById('text-controls-panel');
const displayPrice = document.getElementById('display-price');
const fileName = document.getElementById('file-name');

// --- 1. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input[type="range"]').forEach(input => {
        input.value = input.getAttribute('value');
    });
});

// --- 2. MODE SWITCHING ---
function setMode(mode) {
    state.mode = mode;
    document.getElementById('btn-card').classList.toggle('active', mode === 'card');
    document.getElementById('btn-tag').classList.toggle('active', mode === 'tag');
    
    if (mode === 'card') {
        mask.classList.remove('mode-tag'); mask.classList.add('mode-card');
        displayPrice.innerText = `₹${PRICES.card.toLocaleString()}`;
    } else {
        mask.classList.remove('mode-card'); mask.classList.add('mode-tag');
        displayPrice.innerText = `₹${PRICES.tag.toLocaleString()}`;
    }
}

// --- 3. IMAGE UPLOAD & AUTO COLOR LOGIC ---
document.getElementById('file-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            imgLayer.src = event.target.result;
            imgLayer.classList.add('active');
            
            placeholder.style.display = 'none';
            tunePanel.style.display = 'block';
            textPanel.style.display = 'block';
            setTimeout(() => { tunePanel.style.opacity = 1; textPanel.style.opacity = 1; }, 10);
            fileName.innerText = file.name;
            
            state.imageLoaded = true;
            resetTransforms();
            
            // Trigger Smart Color Detection after image loads
            setTimeout(autoDetectColor, 300); 
        }
        reader.readAsDataURL(file);
    }
});

// --- 4. SMART COLOR DETECTION ALGORITHM ---
function autoDetectColor() {
    if (!state.imageLoaded) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Draw image to canvas to read pixels
    const img = document.getElementById('user-upload-img');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let r, g, b, avg;
    let colorSum = 0;

    // Analyze every 40th pixel for speed
    for(let x = 0, len = data.length; x < len; x+=40) {
        r = data[x];
        g = data[x+1];
        b = data[x+2];
        avg = Math.floor((r + g + b) / 3);
        colorSum += avg;
    }

    const brightness = Math.floor(colorSum / (data.length / 40));
    
    // Logic: If dark image (low brightness), text should be White. Else Black.
    let bestColor = (brightness < 128) ? '#ffffff' : '#000000';
    
    // If it's very middle-ground, stick to Gold for brand
    if (brightness > 100 && brightness < 150) bestColor = '#D4AF37';

    // Apply
    updateTextColor(bestColor);
    
    // Update Input Picker UI
    document.getElementById('text-color-picker').value = bestColor;
}

// --- 5. TEXT & FONT HANDLING ---
document.getElementById('custom-text-input').addEventListener('input', (e) => {
    state.text = e.target.value;
    textLayer.innerText = state.text || "YOUR NAME";
});

document.getElementById('font-select').addEventListener('change', (e) => {
    state.font = e.target.value;
    textLayer.style.fontFamily = state.font;
});

document.getElementById('text-color-picker').addEventListener('input', (e) => {
    updateTextColor(e.target.value);
});

function updateTextColor(color) {
    state.textColor = color;
    textLayer.style.color = color;
}

// --- 6. LIVE TWEAKING ---
function updateTransform() {
    if(!state.imageLoaded) return;
    imgLayer.style.transform = `translate(-50%, -50%) translate(${state.x}px, ${state.y}px) rotate(${state.rotate}deg) scale(${state.scale})`;
}

document.getElementById('sl-scale').addEventListener('input', (e) => {
    state.scale = parseFloat(e.target.value);
    document.getElementById('val-scale').innerText = Math.round(state.scale * 100) + '%';
    updateTransform();
});
document.getElementById('sl-rotate').addEventListener('input', (e) => {
    state.rotate = parseInt(e.target.value);
    document.getElementById('val-rotate').innerText = state.rotate + '°';
    updateTransform();
});
document.getElementById('sl-x').addEventListener('input', (e) => {
    state.x = parseInt(e.target.value);
    updateTransform();
});
document.getElementById('sl-y').addEventListener('input', (e) => {
    state.y = parseInt(e.target.value);
    updateTransform();
});

function resetTransforms() {
    state.scale = 1; state.rotate = 0; state.x = 0; state.y = 0;
    document.getElementById('sl-scale').value = 1;
    document.getElementById('sl-rotate').value = 0;
    document.getElementById('sl-x').value = 0;
    document.getElementById('sl-y').value = 0;
    document.getElementById('val-scale').innerText = "100%";
    document.getElementById('val-rotate').innerText = "0°";
    updateTransform();
}

// --- 7. ADD TO CART ---
function finishDesign() {
    if (!state.imageLoaded) return alert("Please upload a design first!");

    const productName = state.mode === 'card' ? 'Custom Design Card' : 'Custom Design Tag';
    const price = PRICES[state.mode];
    
    const customTitle = `${productName} (${state.text || 'No Text'})`;
    
    window.addToCart(customTitle, price, imgLayer.src);
}

// --- 8. 3D TILT ---
const stage = document.getElementById('tilt-stage');
const object = document.getElementById('product-mask');

stage.addEventListener('mousemove', (e) => {
    const rect = stage.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xRot = -((y - rect.height/2) / 20);
    const yRot = (x - rect.width/2) / 20;
    object.style.transform = `perspective(1000px) rotateX(${xRot}deg) rotateY(${yRot}deg)`;
});
stage.addEventListener('mouseleave', () => {
    object.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
});
