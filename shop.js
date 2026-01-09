/* --- shop.js | FIXED INITIALIZATION & PREMIUM LAYOUT --- */

// 1. FIREBASE CONFIGURATION (Must be at the very top)
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

// 2. INITIALIZE FIREBASE (Only if not already active)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 3. DEFINE SERVICES
const store = firebase.firestore();
const auth = firebase.auth();
let products = [];

// 4. APP LOGIC
document.addEventListener('DOMContentLoaded', () => {
    console.log("TAPD Shop Initialized");
    fetchProducts();
    updateCartCount();
});

// --- FETCH PRODUCTS ---
function fetchProducts() {
    const grid = document.getElementById('shop-grid');
    if(grid) grid.innerHTML = '<div class="loading-text" style="width:100%; text-align:center; color:#666;">Loading Legacy...</div>';

    store.collection('products').get().then((querySnapshot) => {
        products = []; 
        grid.innerHTML = ''; 

        querySnapshot.forEach((doc) => {
            let data = doc.data();
            
            // Image Fallback
            let pImage = 'https://via.placeholder.com/600x400?text=No+Image';
            if (data.images && Array.isArray(data.images) && data.images.length > 0) {
                pImage = data.images[0]; 
            } else if (data.image) {
                pImage = data.image; 
            }

            products.push({
                id: doc.id, 
                name: data.title || data.name || "Unnamed",
                price: Number(data.price) || 0,
                category: data.category || 'custom',
                image: pImage,
                desc: data.description || "Transform your digital identity into a physical reality. Tap to share music, socials, and payments instantly."
            });
        });

        renderShop();
        
    }).catch((error) => {
        console.error("Error:", error);
        grid.innerHTML = `<p style="color:red; text-align:center;">Error loading items.</p>`;
    });
}

// --- RENDER SHOP (ZIG-ZAG) ---
function renderShop(filter = 'all') {
    const container = document.getElementById('shop-grid');
    if (!container) return;

    container.innerHTML = '';
    let visibleCount = 0;

    products.forEach(product => {
        // Filter Logic
        if (filter !== 'all' && product.category !== filter) return;

        // Determine Direction (Even = Normal, Odd = Reverse)
        const reverseClass = visibleCount % 2 !== 0 ? 'reverse' : '';
        
        const row = document.createElement('div');
        row.className = `shop-row reveal-row ${reverseClass}`;
        
        row.innerHTML = `
            <div class="row-image-container">
                <img src="${product.image}" alt="${product.name}" class="row-image" onclick="viewProduct('${product.id}')">
            </div>
            
            <div class="row-content">
                <div class="row-cat">${product.category} SERIES</div>
                <h2 class="row-title">${product.name}</h2>
                <p class="row-desc">${product.desc}</p>
                <div class="row-price">₹${product.price}</div>
                
                <div class="row-actions">
                    <button class="btn-view-details" onclick="viewProduct('${product.id}')">
                        VIEW DETAILS
                    </button>
                    <button class="btn-quick-add" onclick="addToCart('${product.id}')" title="Add to Bag">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(row);
        visibleCount++;
    });

    // Re-trigger animations for new elements
    setTimeout(() => {
        document.querySelectorAll('.reveal-row').forEach(el => el.classList.add('active'));
    }, 100);
}

function filterProducts(category, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderShop(category);
}

function searchProducts() {
    const term = document.getElementById('shop-search').value.toLowerCase();
    const rows = document.querySelectorAll('.shop-row');
    rows.forEach(row => {
        const title = row.querySelector('.row-title').innerText.toLowerCase();
        row.style.display = title.includes(term) ? 'flex' : 'none';
    });
}

function viewProduct(id) {
    window.location.href = `product.html?id=${id}`;
}

// --- CART LOGIC ---
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    let existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            img: product.image,
            qty: 1
        });
    }

    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    updateCartCount();
    showToast(`${product.name} Added`);
    
    // Auto-open drawer
    const drawer = document.getElementById('cart-drawer');
    if(!drawer.classList.contains('open')) toggleCart();
    else renderCartContents();
}

function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    let total = cart.reduce((acc, item) => acc + item.qty, 0);
    const badge = document.getElementById('cart-count');
    if(badge) {
        badge.innerText = total;
        badge.style.display = total > 0 ? 'flex' : 'none';
    }
}

// --- DRAWER UI ---
function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.querySelector('.cart-overlay');
    
    if (drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        if(overlay) overlay.style.display = 'none';
    } else {
        renderCartContents();
        drawer.classList.add('open');
        if(overlay) overlay.style.display = 'block';
    }
}

function renderCartContents() {
    const container = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    let total = 0;

    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<p style="color:#666; text-align:center; margin-top:50px;">Your bag is empty.</p>';
        if(subtotalEl) subtotalEl.innerText = "₹0";
        if(totalEl) totalEl.innerText = "₹0";
        return;
    }

    cart.forEach((item, index) => {
        let price = Number(item.price);
        let qty = Number(item.qty);
        total += price * qty;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.img}" alt="${item.name}">
            <div style="flex:1;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <h4 style="margin:0; font-size:0.9rem; color:white;">${item.name}</h4>
                    <span onclick="removeCartItem(${index})" style="color:#666; cursor:pointer; font-size:1.2rem;">&times;</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <p style="color:var(--gold); font-size:0.85rem; margin:0;">₹${price}</p>
                    <div style="display:flex; align-items:center; gap:10px; background:#222; border-radius:4px; padding:2px 8px;">
                        <span onclick="updateDrawerQty(${index}, -1)" style="cursor:pointer; color:white;">-</span>
                        <span style="font-size:0.8rem; color:white;">${qty}</span>
                        <span onclick="updateDrawerQty(${index}, 1)" style="cursor:pointer; color:white;">+</span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(div);
    });

    if(subtotalEl) subtotalEl.innerText = "₹" + total;
    if(totalEl) totalEl.innerText = "₹" + total;
}

function updateDrawerQty(index, change) {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    cart[index].qty += change;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    renderCartContents();
    updateCartCount();
}

function removeCartItem(index) {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    renderCartContents();
    updateCartCount();
}

function closeAllDrawers() {
    document.getElementById('cart-drawer').classList.remove('open');
    document.getElementById('account-drawer').classList.remove('open');
    document.querySelector('.cart-overlay').style.display = 'none';
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.innerText = msg;
    toast.style.cssText = `
        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
        background: #D4AF37; color: #000; padding: 12px 25px; 
        font-family: sans-serif; font-weight: 700; border-radius: 50px;
        z-index: 9999; box-shadow: 0 5px 20px rgba(0,0,0,0.5);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
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
function toggleLoginModal() {
    const modal = document.getElementById('auth-modal');
    // Toggle logic with forced styling to fix Image 7 issue
    if (modal.style.display === 'block') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'block';
    }
}
