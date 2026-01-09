/* --- shop.js | FIXED & PREMIUM 3D LOGIC --- */

// 1. FIREBASE CONFIG (Required at top)
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

const store = firebase.firestore();
const auth = firebase.auth();
let products = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartCount();
});

// 2. FETCH DATA
function fetchProducts() {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '<div style="text-align:center; color:#666; width:100%; padding:50px;">Loading Legacy...</div>';

    store.collection('products').get().then((snap) => {
        products = []; 
        grid.innerHTML = ''; 

        snap.forEach((doc) => {
            let data = doc.data();
            let pImage = 'https://via.placeholder.com/600x600?text=Product';
            if (data.images && data.images.length > 0) pImage = data.images[0];
            else if (data.image) pImage = data.image;

            products.push({
                id: doc.id,
                name: data.title || data.name || "Unnamed",
                price: Number(data.price) || 0,
                category: data.category || 'custom',
                image: pImage,
                desc: data.description || "Transform your networking with premium NFC technology."
            });
        });

        renderShop();
    }).catch(err => {
        console.error(err);
        grid.innerHTML = "<p style='text-align:center; color:red;'>Failed to load products.</p>";
    });
}

// 3. RENDER (ZIG-ZAG + 3D TILT PREP)
function renderShop(filter = 'all') {
    const container = document.getElementById('shop-grid');
    if (!container) return;

    container.innerHTML = '';
    let visibleCount = 0;

    products.forEach(product => {
        if (filter !== 'all' && product.category !== filter) return;

        const reverseClass = visibleCount % 2 !== 0 ? 'reverse' : '';
        
        const row = document.createElement('div');
        row.className = `shop-row reveal-row ${reverseClass}`;
        
        row.innerHTML = `
            <div class="row-image-box" onmousemove="tiltCard(event, this)" onmouseleave="resetCard(this)" onclick="viewProduct('${product.id}')">
                <div class="tilt-card">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="glare"></div>
                </div>
            </div>
            
            <div class="row-content">
                <div class="row-cat">${product.category} SERIES</div>
                <h2 class="row-title">${product.name}</h2>
                <p class="row-desc">${product.desc}</p>
                <div class="row-price">₹${product.price}</div>
                
                <div class="row-actions">
                    <button class="btn-buy" onclick="viewProduct('${product.id}')">
                        VIEW DETAILS
                    </button>
                    <button class="btn-add-round" onclick="addToCart('${product.id}')" title="Add to Bag">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(row);
        visibleCount++;
    });

    initScrollObserver();
}

// 4. 3D TILT LOGIC (Vanilla JS)
function tiltCard(e, container) {
    const card = container.querySelector('.tilt-card');
    const glare = container.querySelector('.glare');
    const box = container.getBoundingClientRect();
    
    // Calculate mouse position relative to center of card
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    
    // Rotation intensity
    const rotateX = -y / 15; // Invert Y for correct tilt
    const rotateY = x / 15;
    
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    
    // Glare movement
    glare.style.transform = `translate(${x}px, ${y}px)`;
}

function resetCard(container) {
    const card = container.querySelector('.tilt-card');
    card.style.transform = `rotateX(0) rotateY(0)`;
}

function initScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.reveal-row').forEach(el => observer.observe(el));
}

// 5. STANDARD LOGIC (Filter, Search, Cart, Drawers)
function filterProducts(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderShop(cat);
}

function searchProducts() {
    const term = document.getElementById('shop-search').value.toLowerCase();
    const rows = document.querySelectorAll('.shop-row');
    rows.forEach(row => {
        const title = row.querySelector('.row-title').innerText.toLowerCase();
        row.style.display = title.includes(term) ? 'flex' : 'none';
    });
}

function viewProduct(id) { window.location.href = `product.html?id=${id}`; }

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
    if(badge) { badge.innerText = total; badge.style.display = total > 0 ? 'flex' : 'none'; }
}

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
            <div style="display:flex; gap:15px; margin-bottom:15px; align-items:center; background:#111; padding:10px; border-radius:8px;">
                <img src="${item.img}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">
                <div style="flex:1;">
                    <div style="color:white; font-size:0.9rem;">${item.name}</div>
                    <div style="color:var(--gold); font-size:0.8rem;">₹${item.price} x ${item.qty}</div>
                </div>
                <div style="color:#ff4444; cursor:pointer;" onclick="removeItem(${idx})">&times;</div>
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

function closeAllDrawers() {
    document.getElementById('cart-drawer').classList.remove('open');
    document.getElementById('account-drawer').classList.remove('open');
    document.querySelector('.cart-overlay').style.display = 'none';
}

function toggleAccount() {
    const drawer = document.getElementById('account-drawer');
    const overlay = document.querySelector('.cart-overlay');
    if (drawer.classList.contains('open')) { drawer.classList.remove('open'); overlay.style.display = 'none'; } else { drawer.classList.add('open'); overlay.style.display = 'block'; }
}
