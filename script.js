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

// Initialize Firebase only if not already initialized
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

/* =========================================
   2. GLOBAL HELPERS & PRELOADER
   ========================================= */
window.addEventListener("load", () => {
    const preloader = document.querySelector(".preloader");
    if (preloader) {
        window.scrollTo(0, 0);
        preloader.style.opacity = "0";
        preloader.style.visibility = "hidden";
        preloader.style.transition = "opacity 0.5s ease, visibility 0.5s";
        setTimeout(() => { preloader.style.display = "none"; }, 500);
    }
});

/* =========================================
   3. CUSTOM CURSOR
   ========================================= */
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

        const clickables = document.querySelectorAll('a, button, input, select, .cart-trigger, .product-card, .nav-icon');
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
   4. SHOP PAGE LOGIC (FETCH & FILTER)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('shop-grid');
    const searchInput = document.getElementById('shop-search');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // Only run on Shop Page
    if (grid) {
        let allProducts = [];

        // 1. Fetch Products
        if (typeof firebase !== 'undefined') {
            const db = firebase.database();
            db.ref('products').on('value', (snapshot) => {
                grid.innerHTML = "";
                allProducts = [];
                
                if (!snapshot.exists()) {
                    grid.innerHTML = "<p style='text-align:center; width:100%; color:#666;'>No products found.</p>";
                    return;
                }

                snapshot.forEach((child) => {
                    const p = child.val();
                    allProducts.push({ ...p, id: child.key });
                });

                renderShopProducts(allProducts);
            });
        }

        // 2. Render Function
        function renderShopProducts(products) {
            grid.innerHTML = "";
            if (products.length === 0) {
                grid.innerHTML = "<p style='text-align:center; width:100%; color:#666;'>No matches found.</p>";
                return;
            }

            products.forEach(p => {
                const img = (p.images && p.images[0]) ? p.images[0] : 'https://via.placeholder.com/300x300/111/333?text=TAPT';
                const typeLabel = p.type ? p.type.toUpperCase() : 'ITEM';

                const card = document.createElement('div');
                card.className = "product-card";
                card.onclick = (e) => {
                    if(e.target.closest('.add-icon')) return;
                    window.location.href = `product.html?id=${p.id}`;
                };

                card.innerHTML = `
                    <div class="card-image-wrapper">
                        <img src="${img}" alt="${p.title}">
                    </div>
                    <div class="card-info">
                        <div class="p-category">${typeLabel}</div>
                        <div class="p-title">${p.title}</div>
                        <div class="p-footer">
                            <div class="p-price">₹${p.price}</div>
                            <div class="add-icon" onclick="addToCart('${p.title}', ${p.price}, '${img}', '${p.id}')">
                                <i class="fa-solid fa-plus"></i>
                            </div>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        // 3. Filter Logic
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filterGrid(btn.getAttribute('data-filter'), searchInput.value);
            });
        });

        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                const activeBtn = document.querySelector('.filter-btn.active');
                const filterType = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
                filterGrid(filterType, e.target.value);
            });
        }

        function filterGrid(type, searchTerm) {
            const term = searchTerm.toLowerCase();
            const filtered = allProducts.filter(p => {
                const pType = p.type ? p.type.toLowerCase() : 'other';
                const matchesType = (type === 'all') || (pType.includes(type));
                const matchesSearch = p.title.toLowerCase().includes(term);
                return matchesType && matchesSearch;
            });
            renderShopProducts(filtered);
        }
    }
});

/* =========================================
   5. CART SYSTEM (MERGED & UPDATED)
   ========================================= */
let activeCoupon = JSON.parse(localStorage.getItem('taptCoupon')) || null;

window.toggleCart = function() {
    const cartDrawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('overlay');
    const accountDrawer = document.getElementById('account-drawer');
    
    if (cartDrawer) {
        cartDrawer.classList.toggle('open');
        if(overlay) overlay.classList.toggle('active', cartDrawer.classList.contains('open'));
        if(accountDrawer) accountDrawer.classList.remove('open');
    }
};

window.toggleAccount = function() {
    const accountDrawer = document.getElementById('account-drawer');
    const overlay = document.getElementById('overlay');
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
    const overlay = document.getElementById('overlay');
    
    if(cartDrawer) cartDrawer.classList.remove('open');
    if(accountDrawer) accountDrawer.classList.remove('open');
    if(overlay) overlay.classList.remove('active');
};

// --- Add to Cart (Unified) ---
window.addToCart = function(title, price, image = '', id = null) {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    const itemId = id || Date.now(); // Use ID if provided, else timestamp
    
    // Check duplication by ID or Title
    const existingItem = cart.find(i => (id && i.id === id) || i.title === title);
    
    if(existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ id: itemId, title, price, image, qty: 1 });
    }
    
    localStorage.setItem('taptCart', JSON.stringify(cart));
    updateCartUI();
    // Force open cart
    const cartDrawer = document.getElementById('cart-drawer');
    if(cartDrawer && !cartDrawer.classList.contains('open')) {
        window.toggleCart();
    }
};

window.updateQty = function(id, change) {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    // Convert id to string for comparison safety if needed, but loose equality works
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

// --- Update UI (Handles Drawer & Badge) ---
function updateCartUI() {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartCountBadge = document.getElementById('cart-count');
    const cartTotalEl = document.getElementById('cart-total');

    // 1. Update Badge
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    if (cartCountBadge) {
        cartCountBadge.textContent = totalCount;
        cartCountBadge.style.display = totalCount > 0 ? 'flex' : 'none';
    }

    // 2. Render Items (Drawer)
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
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                            <span style="font-size:0.9rem; margin:0 10px;">${item.qty}</span>
                            <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                        </div>
                    </div>
                    <button onclick="removeFromCart('${item.id}')" style="background:none; border:none; color:#555; cursor:pointer;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `}).join('');
        }
    }

    // 3. Update Total
    let subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    if(cartTotalEl) cartTotalEl.textContent = `₹${subtotal.toLocaleString()}`;
}

// Initial Load
document.addEventListener('DOMContentLoaded', updateCartUI);

/* =========================================
   6. ACCOUNT DATA (DUMMY)
   ========================================= */
function populateAccountData() {
    const orderList = document.getElementById('order-list');
    const designGrid = document.getElementById('design-grid');
    if(!orderList || !designGrid) return;

    orderList.innerHTML = `
        <div class="order-item">
            <div class="order-left">
                <h4>#TAPT-9921</h4>
                <p>Matte Black Card • 2 Items</p>
            </div>
            <div class="status-badge">Delivered</div>
        </div>
    `;
    designGrid.innerHTML = `
        <div class="design-thumb"><img src="https://via.placeholder.com/150/000/333?text=Design1"></div>
        <div class="design-thumb" style="border:1px dashed #444; display:flex; align-items:center; justify-content:center; color:#444;"><i class="fa-solid fa-plus"></i></div>
    `;
}

/* =========================================
   7. CHECKOUT PAGE LOGIC
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const checkoutList = document.getElementById('checkout-items-list');
    
    if (checkoutList) {
        let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
        if (cart.length === 0) window.location.href = 'shop.html';

        let subtotal = 0;
        checkoutList.innerHTML = cart.map(item => {
            subtotal += (item.price * item.qty);
            return `
                <div class="c-item">
                     <div style="width: 60px; height: 60px; background: #222; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1);">
                        <i class="fa-solid fa-credit-card" style="color: white;"></i>
                    </div>
                    <div class="c-info">
                        <h4>${item.title} <span style="color:#666; font-size:0.8em;">x${item.qty}</span></h4>
                        <p>₹${(item.price * item.qty).toLocaleString()}</p>
                    </div>
                </div>
            `;
        }).join('');

        const subtotalEl = document.getElementById('c-subtotal');
        const totalEl = document.getElementById('c-total');
        if(subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString()}`;
        if(totalEl) totalEl.textContent = `₹${subtotal.toLocaleString()}`;
    }

    // Checkout Button Link
    const checkoutButton = document.querySelector('.checkout-btn');
    if(checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            const currentCart = JSON.parse(localStorage.getItem('taptCart')) || [];
            if(currentCart.length > 0) {
                window.location.href = 'checkout.html';
            } else {
                alert("Your cart is empty.");
            }
        });
    }
});

/* =========================================
   8. 3D TILT EFFECT (Mouse + Touch + Gyro)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const tiltElements = document.querySelectorAll('.card-stage, .product-card');

    function applyTilt(el, x, y, isGyro = false) {
        const inner = el.querySelector('.tapt-card') || el.querySelector('.card-content') || el.querySelector('.card-image-wrapper');
        if (!inner) return;

        let xRotation, yRotation;
        if (isGyro) {
            xRotation = x; 
            yRotation = y; 
        } else {
            const rect = el.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const mouseX = x - centerX;
            const mouseY = y - centerY;
            xRotation = -((mouseY) / 15);
            yRotation = (mouseX) / 15;
        }
        inner.style.transform = `perspective(1000px) rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale(1.02)`;
    }

    function resetTilt(el) {
        const inner = el.querySelector('.tapt-card') || el.querySelector('.card-content') || el.querySelector('.card-image-wrapper');
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
        
        // Touch events
        el.addEventListener('touchmove', (e) => {
            if(e.cancelable) e.preventDefault(); 
            const touch = e.touches[0];
            const rect = el.getBoundingClientRect();
            applyTilt(el, touch.clientX - rect.left, touch.clientY - rect.top);
        }, { passive: false });
        el.addEventListener('touchend', () => resetTilt(el));
    });
});
