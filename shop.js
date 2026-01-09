/* --- shop.js | PREMIUM LOGIC --- */

const store = firebase.firestore();
let products = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log("TAPD Shop Initialized");
    fetchProducts();
    updateCartCount();
});

// 1. Fetch & Animation
function fetchProducts() {
    const grid = document.getElementById('shop-grid');
    if(grid) grid.innerHTML = '<div class="loading-text" style="grid-column: 1/-1; text-align:center; color:#666;">Loading Legacy...</div>';

    store.collection('products').get().then((querySnapshot) => {
        products = []; 
        grid.innerHTML = ''; // Clear loading

        querySnapshot.forEach((doc) => {
            let data = doc.data();
            
            // Image Fallback
            let pImage = 'https://via.placeholder.com/300x300?text=No+Image';
            if (data.images && data.images.length > 0) pImage = data.images[0];
            else if (data.image) pImage = data.image;

            products.push({
                id: doc.id, 
                name: data.title || data.name || "Unnamed",
                price: Number(data.price) || 0,
                category: data.category || 'custom',
                image: pImage,
                desc: data.description || ''
            });
        });

        renderShop();
        
    }).catch((error) => {
        console.error("Error:", error);
        grid.innerHTML = `<p style="color:red; text-align:center;">Error loading items.</p>`;
    });
}

// 2. Render with Animation
function renderShop(filter = 'all') {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;

    grid.innerHTML = '';
    let delayCounter = 0;

    products.forEach(product => {
        // Filter Logic
        if (filter !== 'all' && product.category !== filter) return;

        const card = document.createElement('div');
        card.className = 'product-card';
        // Add animation delay for staggering effect
        card.style.transitionDelay = `${delayCounter * 0.05}s`; 
        
        card.innerHTML = `
            <div class="p-img-box" onclick="viewProduct('${product.id}')">
                <img src="${product.image}" alt="${product.name}">
                <button class="quick-add-btn" onclick="event.stopPropagation(); addToCart('${product.id}')">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
            <div class="p-details" onclick="viewProduct('${product.id}')">
                <div class="p-info">
                    <h3>${product.name}</h3>
                    <div class="p-cat">${product.category}</div>
                </div>
                <div class="p-price">₹${product.price}</div>
            </div>
        `;
        
        grid.appendChild(card);
        
        // Trigger reflow to start animation
        setTimeout(() => card.classList.add('reveal'), 50);
        delayCounter++;
    });
}

function filterProducts(category, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderShop(category);
}

// 3. Search
function searchProducts() {
    const term = document.getElementById('shop-search').value.toLowerCase();
    const cards = document.querySelectorAll('.product-card');
    
    cards.forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
        if(title.includes(term)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function viewProduct(id) {
    window.location.href = `product.html?id=${id}`;
}

// 4. Cart Logic
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
    
    // Open drawer to show item added
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

// 5. Drawer UI
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

// Account Toggles
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
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}
