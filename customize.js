/* --- customize.js | TAPD. Advanced Design Studio --- */

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

// Initialize Fabric Canvas
const canvas = new fabric.Canvas('editor-canvas', {
    width: 350,  // Standard Card Width (px)
    height: 220, // Standard Card Height (px)
    backgroundColor: '#0a0a0a',
    preserveObjectStacking: true
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
        // Default Blank State
        setMode('card');
    }
    
    updateCartCount();
    setupEventListeners();
});

// 3. LOAD TEMPLATE FROM FIREBASE (The "Hidden Design" Feature)
function loadTemplate(id) {
    console.log("Loading Template:", id);
    
    db.collection("products").doc(id).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            currentProduct = { id: doc.id, ...data };
            currentPrice = data.price || 499;
            
            document.getElementById('display-price').innerText = "₹" + currentPrice;

            // Check if Admin saved a JSON template
            if (data.designTemplate) {
                canvas.loadFromJSON(data.designTemplate, function() {
                    canvas.renderAll();
                    console.log("Template Loaded Successfully");
                });
            } else {
                console.log("No JSON template found, using default blank.");
            }
            
            // Set mode based on product type
            if(data.type === 'tag') setMode('tag');
            else setMode('card');

        } else {
            console.error("Product not found");
        }
    });
}

// 4. CANVAS TOOLS & LAYERS

// Add Text
function addTextLayer() {
    const text = new fabric.IText('TAP TO EDIT', {
        left: 50,
        top: 50,
        fontFamily: 'Syncopate',
        fill: '#ffffff',
        fontSize: 20
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
}

// Add Image (User Upload)
function handleAddImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            fabric.Image.fromURL(e.target.result, function(img) {
                img.scaleToWidth(150);
                canvas.add(img);
                canvas.centerObject(img);
                canvas.setActiveObject(img);
                canvas.renderAll();
            });
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Delete Selected
function deleteSelected() {
    const active = canvas.getActiveObject();
    if (active) {
        canvas.remove(active);
        canvas.renderAll();
        document.getElementById('layer-controls').style.display = 'none';
    }
}

// 5. EVENT LISTENERS (Connecting UI to Canvas)
function setupEventListeners() {
    
    // When user selects an object on canvas
    canvas.on('selection:created', updateControls);
    canvas.on('selection:updated', updateControls);
    canvas.on('selection:cleared', () => {
        document.getElementById('layer-controls').style.display = 'none';
    });

    // Inputs changing Canvas
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

// Update UI inputs to match selected object
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

// 6. MODE SWITCHING (Card vs Tag)
function setMode(mode) {
    const wrapper = document.getElementById('canvas-wrapper');
    const hole = document.getElementById('hw-hole');
    const ring = document.getElementById('hw-ring');
    const btnCard = document.getElementById('btn-card');
    const btnTag = document.getElementById('btn-tag');

    // Reset Buttons
    btnCard.classList.remove('active');
    btnTag.classList.remove('active');

    if (mode === 'card') {
        // Rectangle
        canvas.setWidth(350);
        canvas.setHeight(220);
        wrapper.style.borderRadius = "15px"; 
        wrapper.style.width = "350px";
        hole.style.display = 'none';
        ring.style.display = 'none';
        btnCard.classList.add('active');
    } else {
        // Circle (Tag)
        canvas.setWidth(300);
        canvas.setHeight(300);
        wrapper.style.borderRadius = "50%"; 
        wrapper.style.width = "300px";
        hole.style.display = 'block';
        ring.style.display = 'block';
        btnTag.classList.add('active');
    }
    canvas.renderAll();
}

// 7. FINISH DESIGN & ADD TO CART
function finishDesign() {
    // Deselect everything to capture clean image
    canvas.discardActiveObject();
    canvas.renderAll();

    // 1. Generate Image of Design
    const designImage = canvas.toDataURL({
        format: 'png',
        quality: 0.8
    });

    // 2. Prepare Cart Item
    const productID = currentProduct ? currentProduct.id : 'custom-' + Date.now();
    const productName = currentProduct ? currentProduct.name + " (Custom)" : "Custom Design";
    
    addToCart(productID, productName, currentPrice, designImage);
}

function addToCart(id, name, price, img) {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    
    // For custom designs, we usually allow duplicates because they might be different edits
    // But to keep it simple, we push as new item
    cart.push({
        id: id,
        name: name,
        price: price,
        img: img, // Saves the customized image!
        qty: 1
    });

    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    updateCartCount();
    
    // Show Cart Drawer
    toggleCart(); 
}

// 8. ADMIN TOOL: EXPORT JSON
function exportDesignJSON() {
    const json = JSON.stringify(canvas.toJSON());
    navigator.clipboard.writeText(json).then(() => {
        alert("Design JSON Copied! Paste into Admin Panel.");
    });
}

// 9. SHARED UTILS (Cart Drawer, etc - Same as Shop Page)
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
            <img src="${item.img}" style="width:60px; height:60px; object-fit:contain; background:#111;">
            <div style="flex:1; margin-left:10px;">
                <div style="color:white; font-size:0.9rem;">${item.name}</div>
                <div style="color:#888;">₹${item.price}</div>
            </div>
            <div style="color:white;">x${item.qty}</div>
        `;
        container.appendChild(div);
    });
    
    if(totalEl) totalEl.innerText = "₹" + total;
}
