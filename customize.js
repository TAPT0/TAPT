/* =========================================
   CUSTOMIZE PAGE LOGIC
   ========================================= */

// Configuration
const PRICES = { card: 1999, tag: 899 };
let state = {
    mode: 'card', // 'card' or 'tag'
    scale: 1,
    rotate: 0,
    x: 0,
    y: 0,
    imageLoaded: false
};

// DOM Elements
const mask = document.getElementById('product-mask');
const imgLayer = document.getElementById('user-upload-img');
const placeholder = document.getElementById('placeholder-msg');
const tunePanel = document.getElementById('fine-tune-panel');
const displayPrice = document.getElementById('display-price');
const fileName = document.getElementById('file-name');

// --- 1. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Reset inputs on load
    document.querySelectorAll('input[type="range"]').forEach(input => {
        input.value = input.getAttribute('value');
    });
});

// --- 2. MODE SWITCHING (Card vs Tag) ---
function setMode(mode) {
    state.mode = mode;
    
    // UI Updates
    document.getElementById('btn-card').classList.toggle('active', mode === 'card');
    document.getElementById('btn-tag').classList.toggle('active', mode === 'tag');
    
    // Shape Transformation
    if (mode === 'card') {
        mask.classList.remove('mode-tag');
        mask.classList.add('mode-card');
        displayPrice.innerText = `₹${PRICES.card.toLocaleString()}`;
    } else {
        mask.classList.remove('mode-card');
        mask.classList.add('mode-tag');
        displayPrice.innerText = `₹${PRICES.tag.toLocaleString()}`;
    }
}

// --- 3. IMAGE UPLOAD HANDLING ---
document.getElementById('file-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            // Set Image
            imgLayer.src = event.target.result;
            imgLayer.classList.add('active');
            
            // UI Updates
            placeholder.style.display = 'none';
            tunePanel.style.display = 'block';
            setTimeout(() => tunePanel.style.opacity = 1, 10); // Fade in
            fileName.innerText = file.name;
            
            state.imageLoaded = true;
            resetTransforms(); // Reset positions for new image
        }
        reader.readAsDataURL(file);
    }
});

// --- 4. LIVE TWEAKING (Sliders) ---
function updateTransform() {
    if(!state.imageLoaded) return;
    
    // Apply CSS Transform
    imgLayer.style.transform = `
        translate(-50%, -50%) 
        translate(${state.x}px, ${state.y}px) 
        rotate(${state.rotate}deg) 
        scale(${state.scale})
    `;
}

// Event Listeners for Sliders
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
    state.y = parseInt(e.target.value); // Inverted visually for intuition? No, standad is fine.
    updateTransform();
});

// --- 5. RESET ---
function resetTransforms() {
    state.scale = 1;
    state.rotate = 0;
    state.x = 0;
    state.y = 0;
    
    // Reset Slider DOM Elements
    document.getElementById('sl-scale').value = 1;
    document.getElementById('sl-rotate').value = 0;
    document.getElementById('sl-x').value = 0;
    document.getElementById('sl-y').value = 0;
    
    // Reset Labels
    document.getElementById('val-scale').innerText = "100%";
    document.getElementById('val-rotate').innerText = "0°";
    
    updateTransform();
}

// --- 6. ADD TO CART ---
function finishDesign() {
    if (!state.imageLoaded) {
        alert("Please upload a design first!");
        return;
    }

    const productName = state.mode === 'card' ? 'Custom Design Card' : 'Custom Design Tag';
    const price = PRICES[state.mode];
    
    // In a real app, we would canvas-draw the final cropped image here to save it.
    // For now, we pass the raw image source.
    window.addToCart(productName, price, imgLayer.src);
    
    // Optional: Show success feedback? 
    // The cart drawer opens automatically via script.js logic.
}

// --- 7. 3D TILT EFFECT (Re-implemented for this specific page) ---
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
