/* =========================================
   1. FIREBASE CONFIG & GLOBAL SETUP
   ========================================= */
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

// Initialize Firebase if not already done
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

/* =========================================
   2. GLOBAL HELPERS (Preloader & Cursor)
   ========================================= */
window.addEventListener("load", () => {
    const preloader = document.querySelector(".preloader");
    if (preloader) {
        window.scrollTo(0, 0);
        preloader.style.opacity = "0";
        preloader.style.visibility = "hidden";
        setTimeout(() => { preloader.style.display = "none"; }, 500);
    }
});

// Custom Cursor Logic
document.addEventListener('DOMContentLoaded', () => {
    const cursorDot = document.querySelector("[data-cursor-dot]");
    const cursorOutline = document.querySelector("[data-cursor-outline]");

    if (cursorDot && cursorOutline) {
        window.addEventListener("mousemove", (e) => {
            const posX = e.clientX;
            const posY = e.clientY;
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;
            cursorOutline.animate({ left: `${posX}px`, top: `${posY}px` }, { duration: 500, fill: "forwards" });
        });

        const clickables = document.querySelectorAll('a, button, input, select, .cart-trigger, .product-card, .nav-icon, .thumb');
        clickables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorOutline.style.transform = "translate(-50%, -50%) scale(1.5)";
                cursorOutline.style.backgroundColor = "rgba(212, 175, 55, 0.1)";
            });
            el.addEventListener('mouseleave', () => {
                cursorOutline.style.transform = "translate(-50%, -50%) scale(1)";
                cursorOutline.style.backgroundColor = "transparent";
            });
        });
    }
});

/* =========================================
   3. DRAWER SYSTEM (Cart & Account)
   ========================================= */
window.toggleCart = function() {
    const cartDrawer = document.getElementById('cart-drawer');
    const overlay = document.querySelector('.cart-overlay'); // Changed ID selection to Class for safety
    const accountDrawer = document.getElementById('account-drawer');
    
    if (cartDrawer) {
        cartDrawer.classList.toggle('open');
        if(overlay) overlay.classList.toggle('active', cartDrawer.classList.contains('open'));
        if(accountDrawer) accountDrawer.classList.remove('open');
        
        // Refresh UI when opening
        if(cartDrawer.classList.contains('open')) updateCartUI();
    }
};

window.toggleAccount = function() {
    const accountDrawer = document.getElementById('account-drawer');
    const overlay = document.querySelector('.cart-overlay');
    const cartDrawer = document.getElementById('cart-drawer');

    if(accountDrawer) {
        accountDrawer.classList.toggle('open');
        if(overlay) overlay.classList.toggle('active', accountDrawer.classList.contains('open'));
        if(cartDrawer) cartDrawer.classList.remove('open');
        populateAccountData();
    }
};

window.closeAllDrawers = function() {
    const cartDrawer = document.getElementById('cart-drawer');
    const accountDrawer = document.getElementById('account-drawer');
    const overlay = document.querySelector('.cart-overlay');
    
    if(cartDrawer) cartDrawer.classList.remove('open');
    if(accountDrawer) accountDrawer.classList.remove('open');
    if(overlay) overlay.classList.remove('active');
};

/* =========================================
   4. CART LOGIC (Add, Update, Remove)
   ========================================= */
window.addToCart = function(title, price, image = '', id = null) {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    const itemId = id || title.replace(/\s+/g, '-').toLowerCase(); // Fallback ID generation
    
    const existingItem = cart.find(i => (id && i.id === id) || i.title === title);
    
    if(existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ id: itemId, title, price, image, qty: 1 });
    }
    
    localStorage.setItem('taptCart', JSON.stringify(cart));
    updateCartUI();
    
    // Open cart to show success
    const cartDrawer = document.getElementById('cart-drawer');
    if(cartDrawer && !cartDrawer.classList.contains('open')) {
        window.toggleCart();
    }
};

window.updateQty = function(id, change) {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    const item = cart.find(i => i.id == id); 
    
    if (item) {
        item.qty += change;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id != id);
        }
        localStorage.setItem('taptCart', JSON.stringify(cart));
        updateCartUI();
    }
};

window.removeFromCart = function(id) {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    cart = cart.filter(i => i.id != id);
    localStorage.setItem('taptCart', JSON.stringify(cart));
    updateCartUI();
};

function updateCartUI() {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartCountBadge = document.getElementById('cart-count');
    const cartTotalEl = document.getElementById('cart-total'); // For customize page drawer
    const totalElGlobal = document.getElementById('total-price'); // For global drawer

    // 1. Badge
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    if (cartCountBadge) {
        cartCountBadge.textContent = totalCount;
        cartCountBadge.style.display = totalCount > 0 ? 'flex' : 'none';
    }

    // 2. Drawer Items
    if (cartItemsContainer) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-msg">Your bag is empty.</p>';
        } else {
            cartItemsContainer.innerHTML = cart.map(item => {
                const img = item.image || 'https://via.placeholder.com/80';
                return `
                <div class="cart-item">
                    <img src="${img}" alt="${item.title}">
                    <div class="item-details" style="flex:1;">
                        <h4>${item.title}</h4>
                        <p>₹${item.price}</p>
                        <div class="qty-controls" style="margin-top:5px;">
                            <button onclick="updateQty('${item.id}', -1)" style="padding:2px 8px;">-</button>
                            <span style="font-size:0.9rem; margin:0 10px;">${item.qty}</span>
                            <button onclick="updateQty('${item.id}', 1)" style="padding:2px 8px;">+</button>
                        </div>
                    </div>
                    <button onclick="removeFromCart('${item.id}')" class="remove-btn">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `}).join('');
        }
    }

    // 3. Totals
    let subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const formattedTotal = `₹${subtotal.toLocaleString()}`;
    if(cartTotalEl) cartTotalEl.textContent = formattedTotal;
    if(totalElGlobal) totalElGlobal.textContent = formattedTotal;
}

// Initial Load
document.addEventListener('DOMContentLoaded', updateCartUI);

/* =========================================
   5. ACCOUNT DATA
   ========================================= */
function populateAccountData() {
    const orderList = document.getElementById('order-list'); // Ensure this ID exists in HTML
    if(!orderList) return;

    // Dummy Data
    orderList.innerHTML = `
        <div class="order-item">
            <div class="order-left">
                <h4>#TAPT-9921</h4>
                <p>Matte Black Card • 2 Items</p>
            </div>
            <div class="status-badge">Delivered</div>
        </div>
    `;
}

/* =========================================
   6. 3D TILT EFFECT (Global Utility)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const tiltElements = document.querySelectorAll('.card-stage, .product-card, .home-card, .home-keychain');

    function applyTilt(el, x, y) {
        const inner = el.querySelector('.tapt-card') || el.querySelector('.card-content') || el.querySelector('.card-image-wrapper') || el;
        if (!inner) return;

        const rect = el.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Calculate rotation based on mouse position
        const xRotation = -((y - centerY) / 20); 
        const yRotation = (x - centerX) / 20;

        inner.style.transform = `perspective(1000px) rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale(1.02)`;
    }

    function resetTilt(el) {
        const inner = el.querySelector('.tapt-card') || el.querySelector('.card-content') || el.querySelector('.card-image-wrapper') || el;
        if (inner) {
            inner.style.transition = 'transform 0.5s ease';
            inner.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
            setTimeout(() => { inner.style.transition = ''; }, 500);
        }
    }

    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            applyTilt(el, e.clientX - rect.left, e.clientY - rect.top);
        });
        el.addEventListener('mouseleave', () => resetTilt(el));
    });
});
