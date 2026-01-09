/* --- shop.js | PREMIUM SHOWCASE LOGIC --- */

// 1. SERVICES
const store = firebase.firestore();
const auth = firebase.auth();
let products = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartCount();
});

// 2. FETCH
function fetchProducts() {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '<div style="text-align:center; color:#666; font-size:1.2rem;">Loading Legacy...</div>';

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

// 3. RENDER (ZIG-ZAG LAYOUT)
function renderShop(filter = 'all') {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';
    
    let visibleCount = 0;

    products.forEach(product => {
        if (filter !== 'all' && product.category !== filter) return;

        // Create Container
        const row = document.createElement('div');
        // Alternating Class
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

    // Attach Observers for Animation
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
    toggleCart(); // Open Drawer
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

// DRAWER LOGIC
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
        totalEl.innerText = "₹0";
        return;
    }

    cart.forEach((item, idx) => {
        total += item.price * item.qty;
        container.innerHTML += `
            <div style="display:flex; gap:15px; margin-bottom:15px; align-items:center; background:#111; padding:10px; border-radius:8px;">
                <img src="${item.img}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">
                <div style="flex:1;">
                    <div style="color:white; font-size:0.9rem;">${item.name}</div>
                    <div style="color:#gold; font-size:0.8rem;">₹${item.price} x ${item.qty}</div>
                </div>
                <div style="color:#ff4444; cursor:pointer;" onclick="removeItem(${idx})">&times;</div>
            </div>
        `;
    });
    totalEl.innerText = "₹" + total;
}

function removeItem(idx) {
    let cart = JSON.parse(localStorage.getItem('TAPDCart'));
    cart.splice(idx, 1);
    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    renderCartItems();
    updateCartCount();
}
