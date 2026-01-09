/* --- shop.js | FIXED & PREMIUM LAYOUT --- */

// 1. FIREBASE INIT (Must be first)
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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 2. DEFINE SERVICES
const store = firebase.firestore();
const auth = firebase.auth();
let products = [];

// 3. MAIN LOGIC
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartCount();
});

// --- FETCH ---
function fetchProducts() {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '<div style="text-align:center; color:#666; font-size:1.2rem; width:100%;">Loading The Legacy...</div>';

    store.collection('products').get().then((snap) => {
        products = []; 
        grid.innerHTML = ''; 

        snap.forEach((doc) => {
            let data = doc.data();
            let pImage = 'https://via.placeholder.com/600x400?text=Product';
            if (data.images && data.images.length > 0) pImage = data.images[0];
            else if (data.image) pImage = data.image;

            products.push({
                id: doc.id,
                name: data.title || data.name || "Unnamed",
                price: Number(data.price) || 0,
                category: data.category || 'custom',
                image: pImage,
                desc: data.description || "Turn your digital identity into a physical reality. Tap to share music, socials, and payments instantly."
            });
        });

        renderShop();
    });
}

// --- RENDER (ZIG-ZAG) ---
function renderShop(filter = 'all') {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';
    let visibleCount = 0;

    products.forEach(product => {
        if (filter !== 'all' && product.category !== filter) return;

        const row = document.createElement('div');
        // Alternating Class for Zig-Zag
        const reverseClass = visibleCount % 2 !== 0 ? 'reverse' : '';
        row.className = `shop-row reveal ${reverseClass}`;
        
        row.innerHTML = `
            <div class="row-image-container" onclick="viewProduct('${product.id}')">
                <img src="${product.image}" alt="${product.name}">
            </div>
            
            <div class="row-content">
                <div class="row-cat">${product.category} SERIES</div>
                <h2 class="row-title">${product.name}</h2>
                <p class="row-desc">${product.desc}</p>
                <div class="row-price">₹${product.price}</div>
                
                <div style="display:flex; align-items:center;">
                    <button class="btn-buy" onclick="viewProduct('${product.id}')">
                        VIEW DETAILS
                    </button>
                    <button class="btn-add-icon" onclick="addToCart('${product.id}')">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
        
        grid.appendChild(row);
        visibleCount++;
    });

    // Re-attach scroll observers
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function filterProducts(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderShop(cat);
}

function viewProduct(id) {
    window.location.href = `product.html?id=${id}`;
}

// --- CART ---
function addToCart(id) {
    const product = products.find(p => p.id === id);
    if(!product) return;

    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    let item = cart.find(i => i.id === id);
    
    if(item) item.qty++;
    else cart.push({ id: product.id, name: product.name, price: product.price, img: product.image, qty: 1 });

    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    updateCartCount();
    toggleCart(); 
}

function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    let total = cart.reduce((a, c) => a + c.qty, 0);
    const badge = document.getElementById('cart-count');
    if(badge) {
        badge.innerText = total;
        badge.style.display = total > 0 ? 'flex' : 'none';
    }
}

// DRAWER & AUTH LOGIC (Standard)
function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.querySelector('.cart-overlay');
    if(drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        overlay.style.display = 'none';
    } else {
        renderCartItems();
        drawer.classList.add('open');
        overlay.style.display = 'block';
    }
}

function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    let total = 0;
    
    container.innerHTML = '';
    
    if(cart.length === 0) {
        container.innerHTML = "<p style='color:#666; text-align:center;'>Bag is empty.</p>";
        if(totalEl) totalEl.innerText = "₹0";
        return;
    }

    cart.forEach((item, idx) => {
        total += item.price * item.qty;
        container.innerHTML += `
            <div class="cart-item">
                <img src="${item.img}">
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between;">
                        <h4 style="margin:0; font-size:0.9rem;">${item.name}</h4>
                        <span onclick="removeItem(${idx})" style="cursor:pointer; color:#ff4444;">&times;</span>
                    </div>
                    <p style="color:var(--gold); font-size:0.8rem;">₹${item.price} x ${item.qty}</p>
                </div>
            </div>
        `;
    });
    if(totalEl) totalEl.innerText = "₹" + total;
}

function removeItem(idx) {
    let cart = JSON.parse(localStorage.getItem('TAPDCart'));
    cart.splice(idx, 1);
    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    renderCartItems();
    updateCartCount();
}

function toggleAccount() {
    const drawer = document.getElementById('account-drawer');
    const overlay = document.querySelector('.cart-overlay');
    if (drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        if(overlay) overlay.style.display = 'none';
    } else {
        drawer.classList.add('open');
        if(overlay) overlay.style.display = 'block';
    }
}

function closeAllDrawers() {
    document.getElementById('cart-drawer').classList.remove('open');
    document.getElementById('account-drawer').classList.remove('open');
    document.querySelector('.cart-overlay').style.display = 'none';
}
