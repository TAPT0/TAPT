/* --- customize.js | TAPD. Advanced Design Studio (With Color & Size Fix) --- */

// 1. CONFIGURATION & SETUP
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
    // We start with standard Credit Card dimensions (approx ratio)
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
    // Check URL for Template ID
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');

    if (templateId) {
        loadTemplate(templateId);
    } else {
        setMode('card'); // Default
    }
    
    updateCartCount();
    setupEventListeners();
});

// 3. LOAD TEMPLATE
function loadTemplate(id) {
    console.log("Loading Template:", id);
    
    db.collection("products").doc(id).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            currentProduct = { id: doc.id, ...data };
            currentPrice = data.price || 499;
            
            document.getElementById('display-price').innerText = "₹" + currentPrice;

            if (data.designTemplate) {
                canvas.loadFromJSON(data.designTemplate, function() {
                    canvas.renderAll();
                    // Update the color picker to match loaded design
                    const bgColor = canvas.backgroundColor;
                    if(bgColor) document.getElementById('bg-color-picker').value = bgColor;
                });
            }
            
            // Set mode based on product type
            if(data.type === 'tag') setMode('tag');
            else setMode('card');

        } else {
            console.error("Product not found");
        }
    });
}

// 4. CANVAS TOOLS

function addTextLayer() {
    const text = new fabric.IText('TAP TO EDIT', {
        left: canvas.width / 2 - 50,
        top: canvas.height / 2,
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
                // Scale image to fit reasonably
                const scale = Math.min(
                    (canvas.width * 0.5) / img.width, 
                    (canvas.height * 0.5) / img.height
                );
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

// 5. EVENT LISTENERS
function setupEventListeners() {
    
    // --- BACKGROUND COLOR PICKER (NEW) ---
    const colorPicker = document.getElementById('bg-color-picker');
    colorPicker.addEventListener('input', function(e) {
        canvas.setBackgroundColor(e.target.value, canvas.renderAll.bind(canvas));
    });

    // --- CANVAS EVENTS ---
    canvas.on('selection:created', updateControls);
    canvas.on('selection:updated', updateControls);
    canvas.on('selection:cleared', () => {
        document.getElementById('layer-controls').style.display = 'none';
    });

    // --- TEXT CONTROLS ---
    document.getElementById('txt-content').addEventListener('input', function() {
        const active = canvas.getActiveObject();
        if (active && active.type === 'i-text') {
            active.set('text', this.value);
            canvas.renderAll();
        }
    });

    document.getElementById('txt-font').addEventListener('change', function() {
        const active = canvas.getActiveObject();
        if (active && active.type === 'i-text') {
            active.set('fontFamily', this.value);
            canvas.renderAll();
        }
    });

    document.getElementById('txt-color').addEventListener('input', function() {
        const active = canvas.getActiveObject();
        if (active && active.type === 'i-text') {
            active.set('fill', this.value);
            canvas.renderAll();
        }
    });

    document.getElementById('common-scale').addEventListener('input', function() {
        const active = canvas.getActiveObject();
        if (active) {
            active.scale(parseFloat(this.value));
            canvas.renderAll();
        }
    });
}

function updateControls() {
    const active = canvas.getActiveObject();
    if (!active) return;

    const controls = document.getElementById('layer-controls');
    const textTools = document.getElementById('text-tools');
    
    controls.style.display = 'block';

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

// 6. MODE SWITCHING (Correct Size Logic)
function setMode(mode) {
    const wrapper = document.getElementById('canvas-wrapper');
    const hole = document.getElementById('hw-hole');
    const ring = document.getElementById('hw-ring');
    const btnCard = document.getElementById('btn-card');
    const btnTag = document.getElementById('btn-tag');

    // UI Buttons
    btnCard.classList.remove('active');
    btnTag.classList.remove('active');

    // Scale Factor: 1 inch = approx 100px for screen view
    // Card: 3.375" x 2.125"  -> Approx 340px x 215px
    // Tag:  2" Round         -> Approx 200px x 200px

    if (mode === 'card') {
        canvas.setDimensions({ width: 350, height: 220 });
        wrapper.style.borderRadius = "15px"; 
        wrapper.style.width = "350px";
        wrapper.style.height = "220px";
        hole.style.display = 'none';
        ring.style.display = 'none';
        btnCard.classList.add('active');
    } else {
        // 2 INCH ROUND SETUP
        // We set canvas to 210px (approx 2 inches) square
        const tagSize = 210; 
        
        canvas.setDimensions({ width: tagSize, height: tagSize });
        wrapper.style.borderRadius = "50%"; // Makes it round visually
        wrapper.style.width = tagSize + "px";
        wrapper.style.height = tagSize + "px";
        
        hole.style.display = 'block';
        ring.style.display = 'block';
        btnTag.classList.add('active');
    }
    
    // Recenter background if it exists
    if(canvas.backgroundImage) {
        canvas.backgroundImage.scaleToWidth(canvas.width);
        canvas.backgroundImage.scaleToHeight(canvas.height);
    }
    
    canvas.renderAll();
}

// 7. FINISH DESIGN & ADD TO CART
function finishDesign() {
    canvas.discardActiveObject();
    canvas.renderAll();

    // Export High Quality PNG
    const designImage = canvas.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 2 // Export at 2x resolution for better print quality
    });

    const productID = currentProduct ? currentProduct.id : 'custom-' + Date.now();
    const productName = currentProduct ? currentProduct.name + " (Custom)" : "Custom Design";
    
    addToCart(productID, productName, currentPrice, designImage);
}

function addToCart(id, name, price, img) {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    cart.push({
        id: id,
        name: name,
        price: price,
        img: img,
        qty: 1
    });

    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    updateCartCount();
    toggleCart(); 
}

// 8. ADMIN TOOL
function exportDesignJSON() {
    const json = JSON.stringify(canvas.toJSON());
    navigator.clipboard.writeText(json).then(() => {
        alert("Design JSON Copied! Paste into Admin Panel.");
    });
}

// 9. UTILS
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
            <img src="${item.img}" style="width:60px; height:60px; object-fit:contain; background:#111; border-radius:5px;">
            <div style="flex:1; margin-left:10px;">
                <div style="color:white; font-size:0.9rem;">${item.name}</div>
                <div style="color:#888;">₹${item.price}</div>
            </div>
            <div style="color:white; display:flex; align-items:center; gap:5px;">
                <span onclick="removeItem(${index})" style="cursor:pointer; color:#ff4444;">×</span>
            </div>
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
