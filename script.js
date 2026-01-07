/* =========================================
   1. FIREBASE CONFIG & GLOBAL SETUP
   ========================================= */
const firebaseConfig = {
    apiKey: "AIzaSyBmCVQan3wclKDTG2yYbCf_oMO6t0j17wI",
    authDomain: "tapt-337b8.firebaseapp.com",
    projectId: "tapt-337b8",
    storageBucket: "tapt-337b8.firebasestorage.app",
    messagingSenderId: "887956121124",
    appId: "1:887956121124:web:6856680bf75aa3bacddab1",
    measurementId: "G-2CB8QXYNJY"
};

// Initialize
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Global Firebase References
const auth = firebase.auth();
const db = firebase.firestore();
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
        window.closeAllDrawers(); 
        modal.style.display = 'block';
        overlay.classList.add('active'); 
    }
}

// Login with Google
window.loginWithGoogle = function() {
    auth.signInWithPopup(provider).then((result) => {
        const user = result.user;
        // Save user to DB if new
        db.collection('users').doc(user.uid).set({
            email: user.email,
            name: user.displayName,
            lastLogin: new Date().toISOString()
        }, { merge: true });
        
        window.toggleLoginModal(); 
        window.toggleAccount(); 
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
        db.collection('users').doc(user.uid).set({
            email: email,
            phone: phone,
            name: email.split('@')[0], 
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
        window.toggleAccount(); 
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

            // Fetch Orders from Firestore
            db.collection('orders').where('userId', '==', user.uid).get().then(snapshot => {
                const list = document.getElementById('real-orders-list');
                if(snapshot.empty) {
                    list.innerHTML = "<p style='color:#666; font-size:0.8rem;'>No active orders.</p>";
                    return;
                }
                list.innerHTML = "";
                snapshot.forEach(doc => {
                    const o = doc.data();
                    list.innerHTML += `
                        <div style="background:#222; padding:15px; border-radius:8px; margin-bottom:10px; border:1px solid #333;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                                <span style="color:white; font-size:0.9rem;">#${doc.id.substring(0,6)}</span>
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
   6. CART & COUPON LOGIC
   ========================================= */
let activeCoupon = null;

window.addToCart = function(title, price, image = '', id = null) {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    const itemId = id || title.replace(/\s+/g, '-').toLowerCase(); 
    
    const existingItem = cart.find(i => (id && i.id === id) || i.title === title);
    
    if(existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ id: itemId, title, price, image, qty: 1 });
    }
    
    localStorage.setItem('taptCart', JSON.stringify(cart));
    updateCartUI();
    
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

/* --- CELEBRATION ANIMATION LOGIC (NEW) --- */
function showCelebration(amountOff) {
    const overlay = document.getElementById('celebration-overlay');
    const discountText = document.getElementById('celeb-discount-amount');
    
    discountText.innerText = `SAVED ₹${amountOff.toLocaleString()}`;
    overlay.classList.add('active');
    createConfetti();
}

window.closeCelebration = function() {
    const overlay = document.getElementById('celebration-overlay');
    overlay.classList.remove('active');
    document.getElementById('confetti-container').innerHTML = '';
}

function createConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#D4AF37', '#ffffff', '#F7E7CE', '#AA771C'];
    
    for (let i = 0; i < 60; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti-piece');
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 8 + 5 + 'px';
        confetti.style.height = Math.random() * 8 + 5 + 'px';
        const duration = Math.random() * 2 + 2;
        const delay = Math.random() * 2;
        confetti.style.animation = `fall ${duration}s linear forwards ${delay}s`;
        container.appendChild(confetti);
    }
}

// --- UPDATED COUPON FUNCTION ---
window.applyCoupon = function() {
    const codeInput = document.getElementById('coupon-code');
    const code = codeInput.value.toUpperCase().trim();
    const btn = document.querySelector('.coupon-btn');

    if(!code) return;

    const originalText = btn.textContent;
    btn.textContent = "...";

    // Firestore Check
    db.collection("coupons").doc(code).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            
            // Calculate potential discount to show in celebration
            let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
            let subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
            let discountAmount = 0;

            if(data.type === 'percentage') {
                discountAmount = Math.round(subtotal * (data.value / 100));
            } else {
                discountAmount = data.value;
            }
            if (discountAmount > subtotal) discountAmount = subtotal;

            activeCoupon = { code: code, type: data.type, value: data.value };
            
            // Update button styles
            btn.textContent = "APPLIED";
            btn.style.background = "#4ade80"; 
            btn.style.color = "#000";

            // Update UI totals immediately
            updateCartUI(); 

            // Trigger Animation
            showCelebration(discountAmount);
            
        } else {
            // Invalid State
            btn.textContent = "INVALID";
            btn.style.background = "#ff5555";
            btn.style.color = "#fff";
            
            setTimeout(() => { 
                btn.textContent = "APPLY"; 
                btn.style.background = ""; 
                btn.style.color = ""; 
            }, 2000);
            
            activeCoupon = null;
            updateCartUI();
        }
    }).catch((error) => {
        console.error("Coupon error:", error);
        btn.textContent = "Error";
        btn.style.background = "#ff5555";
    });
};

function updateCartUI() {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    const container = document.getElementById('cart-items-container');
    const badge = document.getElementById('cart-count');
    
    // New Elements
    const subtotalEl = document.getElementById('cart-subtotal');
    const discountRow = document.getElementById('discount-row');
    const discountEl = document.getElementById('cart-discount');
    const totalEl = document.getElementById('cart-total');

    // 1. Badge
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    if (badge) badge.textContent = totalCount;

    // 2. Render Items
    if (container) {
        if (cart.length === 0) {
            container.innerHTML = '<p class="empty-msg">Your bag is empty.</p>';
        } else {
            container.innerHTML = cart.map(item => {
                const img = item.image || 'https://via.placeholder.com/80';
                return `
                <div class="cart-item">
                    <img src="${img}" alt="${item.title}">
                    <div class="item-details" style="flex:1;">
                        <h4>${item.title}</h4>
                        <p>₹${item.price}</p>
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                            <span style="font-size:0.9rem;">${item.qty}</span>
                            <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                        </div>
                    </div>
                    <button onclick="removeFromCart('${item.id}')" class="remove-btn">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `}).join('');
        }
    }

    // 3. Totals Logic with Coupon
    let subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    let discountAmount = 0;

    if (activeCoupon) {
        if (activeCoupon.type === 'percentage') {
            discountAmount = Math.round((subtotal * activeCoupon.value) / 100);
        } else {
            discountAmount = activeCoupon.value;
        }
        // Ensure discount doesn't exceed total
        if (discountAmount > subtotal) discountAmount = subtotal;
    }

    let finalTotal = subtotal - discountAmount;

    // 4. Update UI Texts
    if(subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString()}`;
    
    if(discountRow && discountEl) {
        if(discountAmount > 0) {
            discountRow.style.display = "flex";
            discountEl.textContent = `-₹${discountAmount.toLocaleString()}`;
        } else {
            discountRow.style.display = "none";
        }
    }

    if(totalEl) totalEl.textContent = `₹${finalTotal.toLocaleString()}`;
}

// Initial Load
document.addEventListener('DOMContentLoaded', updateCartUI);

/* =========================================
   7. 3D TILT EFFECT
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const tiltElements = document.querySelectorAll('.card-stage, .product-card, .home-card, .home-keychain');

    function applyTilt(el, x, y) {
        const inner = el.querySelector('.tapt-card') || el.querySelector('.card-content') || el.querySelector('.card-image-wrapper') || el;
        if (!inner) return;

        const rect = el.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
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
