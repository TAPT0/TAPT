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

// Global Firebase References
const auth = firebase.auth();
const db = firebase.database();
const provider = new firebase.auth.GoogleAuthProvider();

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
    const overlay = document.querySelector('.cart-overlay'); 
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
        
        // Load Real Data when opening
        populateAccountData();
    }
};

window.closeAllDrawers = function() {
    const cartDrawer = document.getElementById('cart-drawer');
    const accountDrawer = document.getElementById('account-drawer');
    const overlay = document.querySelector('.cart-overlay');
    const authModal = document.getElementById('auth-modal');
    
    if(cartDrawer) cartDrawer.classList.remove('open');
    if(accountDrawer) accountDrawer.classList.remove('open');
    if(overlay) overlay.classList.remove('active');
    if(authModal) authModal.style.display = 'none';
};

/* =========================================
   4. AUTHENTICATION (Google & Email)
   ========================================= */

// Toggle Login Modal
window.toggleLoginModal = function() {
    const modal = document.getElementById('auth-modal');
    const overlay = document.querySelector('.cart-overlay');
    
    if(modal.style.display === 'block') {
        modal.style.display = 'none';
        overlay.classList.remove('active');
    } else {
        window.closeAllDrawers(); // Close sidebars first
        modal.style.display = 'block';
        overlay.classList.add('active'); // Reuse cart overlay background
    }
}

// Login with Google
window.loginWithGoogle = function() {
    auth.signInWithPopup(provider).then((result) => {
        const user = result.user;
        // Save user to DB if new
        db.ref('users/' + user.uid).update({
            email: user.email,
            name: user.displayName,
            lastLogin: new Date().toISOString()
        });
        window.toggleLoginModal(); // Close modal
        window.toggleAccount(); // Open drawer to show profile
    }).catch((error) => {
        alert(error.message);
    });
}

// Sign Up with Email/Pass
window.signupEmail = function() {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-pass').value;
    const phone = document.getElementById('auth-phone').value;

    if(!email || !pass) return alert("Please enter email and password.");

    auth.createUserWithEmailAndPassword(email, pass).then((userCredential) => {
        const user = userCredential.user;
        // Save extra data
        db.ref('users/' + user.uid).set({
            email: email,
            phone: phone,
            name: email.split('@')[0], // Default name from email
            createdAt: new Date().toISOString()
        });
        window.toggleLoginModal();
        window.toggleAccount();
    }).catch((error) => {
        alert(error.message);
    });
}

// Logout
window.logout = function() {
    auth.signOut().then(() => {
        window.toggleAccount(); // Close drawer to refresh view
        alert("Logged out.");
    });
}

/* =========================================
   5. ACCOUNT DATA (REAL TIME)
   ========================================= */
window.populateAccountData = function() {
    const container = document.getElementById('account-content');
    if(!container) return;

    auth.onAuthStateChanged((user) => {
        if (user) {
            // --- LOGGED IN STATE ---
            container.innerHTML = `
                <div class="user-profile-header">
                    <img src="${user.photoURL || 'https://via.placeholder.com/60/111/333?text=USER'}" class="user-avatar" style="width:60px; height:60px; border-radius:50%; border:2px solid #D4AF37;">
                    <div class="user-info" style="margin-left:15px;">
                        <h3 style="color:white; margin:0;">${user.displayName || 'User'}</h3>
                        <p style="color:#888; margin:0; font-size:0.8rem;">${user.email}</p>
                        <button onclick="logout()" style="color:#ff5555; background:none; border:none; padding:0; cursor:pointer; font-size:0.8rem; margin-top:5px; text-decoration:underline;">Logout</button>
                    </div>
                </div>

                <div class="account-section">
                    <div style="color:#D4AF37; font-size:0.8rem; text-transform:uppercase; margin-bottom:15px; letter-spacing:1px;">My Orders</div>
                    <div id="real-orders-list"><p style="color:#666; font-size:0.8rem;">Loading...</p></div>
                </div>
            `;

            // Fetch Orders from Firebase
            db.ref('orders').orderByChild('userId').equalTo(user.uid).once('value', snapshot => {
                const list = document.getElementById('real-orders-list');
                if(!snapshot.exists()) {
                    list.innerHTML = "<p style='color:#666; font-size:0.8rem;'>No active orders.</p>";
                    return;
                }
                list.innerHTML = "";
                snapshot.forEach(child => {
                    const o = child.val();
                    list.innerHTML += `
                        <div style="background:#222; padding:15px; border-radius:8px; margin-bottom:10px; border:1px solid #333;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                                <span style="color:white; font-size:0.9rem;">#${child.key.substring(0,6)}</span>
                                <span style="color:#D4AF37;">₹${o.total}</span>
                            </div>
                            <div style="font-size:0.7rem; color:#888;">${o.items ? o.items.length : 0} Items • ${o.status || 'Processing'}</div>
                        </div>
                    `;
                });
            });

        } else {
            // --- GUEST STATE ---
            container.innerHTML = `
                <div style="text-align:center; padding:40px 0;">
                    <h3 style="color:white; margin-bottom:10px; font-family:'Syncopate';">My Legacy</h3>
                    <p style="color:#888; font-size:0.9rem; margin-bottom:30px;">Log in to view your orders and saved designs.</p>
                    <button onclick="window.toggleLoginModal()" class="checkout-btn">Log In / Sign Up</button>
                </div>
            `;
        }
    });
}

/* =========================================
   6. CART LOGIC (Add, Update, Remove)
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
   7. 3D TILT EFFECT (Global Utility)
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
