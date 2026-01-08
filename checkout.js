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

// Global References
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

// Custom Cursor
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
   3. DRAWER SYSTEM & AUTH
   ========================================= */
window.toggleCart = function() {
    const cartDrawer = document.getElementById('cart-drawer');
    const overlay = document.querySelector('.cart-overlay');
    const accountDrawer = document.getElementById('account-drawer');
    
    if (cartDrawer) {
        cartDrawer.classList.toggle('open');
        if(overlay) overlay.classList.toggle('active', cartDrawer.classList.contains('open'));
        if(accountDrawer) accountDrawer.classList.remove('open');
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
    const authModal = document.getElementById('auth-modal');
    
    if(cartDrawer) cartDrawer.classList.remove('open');
    if(accountDrawer) accountDrawer.classList.remove('open');
    if(overlay) overlay.classList.remove('active');
    if(authModal) authModal.style.display = 'none';
};

// Login Logic
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

window.loginWithGoogle = function() {
    auth.signInWithPopup(provider).then((result) => {
        const user = result.user;
        db.collection('users').doc(user.uid).set({
            email: user.email,
            name: user.displayName,
            lastLogin: new Date().toISOString()
        }, { merge: true });
        window.toggleLoginModal(); window.toggleAccount(); 
    }).catch((error) => alert(error.message));
}

window.logout = function() {
    auth.signOut().then(() => { window.toggleAccount(); alert("Logged out."); });
}

/* =========================================
   4. CART LOGIC (Shared)
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
    if(cartDrawer && !cartDrawer.classList.contains('open')) window.toggleCart();
};

window.updateQty = function(id, change) {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    const item = cart.find(i => i.id == id); 
    if (item) {
        item.qty += change;
        if (item.qty <= 0) cart = cart.filter(i => i.id != id);
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
    const container = document.getElementById('cart-items-container');
    const badge = document.getElementById('cart-count');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');

    // Badge
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    if (badge) badge.textContent = totalCount;

    // Items
    if (container) {
        if (cart.length === 0) {
            container.innerHTML = '<p class="empty-msg">Your bag is empty.</p>';
        } else {
            container.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image || 'https://via.placeholder.com/80'}" alt="${item.title}">
                    <div class="item-details" style="flex:1;">
                        <h4>${item.title}</h4>
                        <p>₹${item.price}</p>
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                            <span style="font-size:0.9rem;">${item.qty}</span>
                            <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                        </div>
                    </div>
                    <button onclick="removeFromCart('${item.id}')" class="remove-btn"><i class="fa-solid fa-trash"></i></button>
                </div>
            `).join('');
        }
    }

    // Totals
    if(subtotalEl && totalEl) {
        let subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
        subtotalEl.textContent = `₹${subtotal.toLocaleString()}`;
        totalEl.textContent = `₹${subtotal.toLocaleString()}`;
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', updateCartUI);

/* =========================================
   5. CUSTOMIZE PAGE LOGIC
   ========================================= */
if (document.querySelector('.studio-container')) { // Only run on Customize Page
    
    const PRICES = { card: 1999, tag: 899 };
    let state = { mode: 'card', scale: 1, rotate: 0, x: 0, y: 0, imageLoaded: false, text: '', font: "'Syncopate', sans-serif", textColor: '#ffffff' };

    const mask = document.getElementById('product-mask');
    const imgLayer = document.getElementById('user-upload-img');
    const textLayer = document.getElementById('text-layer');
    const placeholder = document.getElementById('placeholder-msg');
    const tunePanel = document.getElementById('fine-tune-panel');
    const textPanel = document.getElementById('text-controls-panel');
    const displayPrice = document.getElementById('display-price');
    const fileName = document.getElementById('file-name');

    // Init Sliders
    document.querySelectorAll('input[type="range"]').forEach(input => input.value = input.getAttribute('value'));

    // Mode Switch
    window.setMode = function(mode) {
        state.mode = mode;
        document.getElementById('btn-card').classList.toggle('active', mode === 'card');
        document.getElementById('btn-tag').classList.toggle('active', mode === 'tag');
        
        if (mode === 'card') {
            mask.classList.remove('mode-tag'); mask.classList.add('mode-card');
            displayPrice.innerText = `₹${PRICES.card.toLocaleString()}`;
        } else {
            mask.classList.remove('mode-card'); mask.classList.add('mode-tag');
            displayPrice.innerText = `₹${PRICES.tag.toLocaleString()}`;
        }
    };

    // Image Upload & Smart Color
    document.getElementById('file-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                imgLayer.src = event.target.result;
                imgLayer.classList.add('active');
                
                placeholder.style.display = 'none';
                tunePanel.style.display = 'block';
                textPanel.style.display = 'block';
                setTimeout(() => { tunePanel.style.opacity = 1; textPanel.style.opacity = 1; }, 10);
                fileName.innerText = file.name;
                
                state.imageLoaded = true;
                resetTransforms();
                setTimeout(autoDetectColor, 300); 
            }
            reader.readAsDataURL(file);
        }
    });

    // Smart Color Algorithm
    window.autoDetectColor = function() {
        if (!state.imageLoaded) return;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = document.getElementById('user-upload-img');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let colorSum = 0;
        for(let x = 0; x < data.length; x+=40) {
            colorSum += Math.floor((data[x] + data[x+1] + data[x+2]) / 3);
        }
        const brightness = Math.floor(colorSum / (data.length / 40));
        let bestColor = (brightness < 128) ? '#ffffff' : '#000000';
        if (brightness > 100 && brightness < 150) bestColor = '#D4AF37';

        updateTextColor(bestColor);
        document.getElementById('text-color-picker').value = bestColor;
    };

    // Text & Sliders
    document.getElementById('custom-text-input').addEventListener('input', (e) => {
        state.text = e.target.value;
        textLayer.innerText = state.text || "YOUR NAME";
    });
    document.getElementById('font-select').addEventListener('change', (e) => {
        state.font = e.target.value;
        textLayer.style.fontFamily = state.font;
    });
    document.getElementById('text-color-picker').addEventListener('input', (e) => updateTextColor(e.target.value));

    window.updateTextColor = function(color) {
        state.textColor = color;
        textLayer.style.color = color;
    };

    function updateTransform() {
        if(!state.imageLoaded) return;
        imgLayer.style.transform = `translate(-50%, -50%) translate(${state.x}px, ${state.y}px) rotate(${state.rotate}deg) scale(${state.scale})`;
    }

    document.getElementById('sl-scale').addEventListener('input', (e) => {
        state.scale = parseFloat(e.target.value);
        document.getElementById('val-scale').innerText = Math.round(state.scale * 100) + '%';
        updateTransform();
    });
    document.getElementById('sl-rotate').addEventListener('input', (e) => {
        state.rotate = parseInt(e.target.value);
        document.getElementById('val-rotate').innerText = state.rotate + '°';
        updateTransform();
    });
    document.getElementById('sl-x').addEventListener('input', (e) => { state.x = parseInt(e.target.value); updateTransform(); });
    document.getElementById('sl-y').addEventListener('input', (e) => { state.y = parseInt(e.target.value); updateTransform(); });

    window.resetTransforms = function() {
        state.scale = 1; state.rotate = 0; state.x = 0; state.y = 0;
        document.getElementById('sl-scale').value = 1;
        document.getElementById('sl-rotate').value = 0;
        document.getElementById('sl-x').value = 0;
        document.getElementById('sl-y').value = 0;
        updateTransform();
    };

    window.finishDesign = function() {
        if (!state.imageLoaded) return alert("Please upload a design first!");
        const productName = state.mode === 'card' ? 'Custom Design Card' : 'Custom Design Tag';
        const customTitle = `${productName} (${state.text || 'No Text'})`;
        window.addToCart(customTitle, PRICES[state.mode], imgLayer.src);
    };
}

/* =========================================
   6. CHECKOUT LOGIC (Includes Celebration)
   ========================================= */
if (document.getElementById('checkout-form')) { // Only run on Checkout Page
    
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    let activeDiscount = 0;

    if (cart.length === 0) window.location.href = 'shop.html';

    function renderCheckout() {
        const list = document.getElementById('checkout-items-list');
        list.innerHTML = '';
        let subtotal = 0;

        cart.forEach((item, index) => {
            subtotal += (item.price * item.qty);
            list.innerHTML += `
                <div class="c-item">
                    <img src="${item.image || 'https://via.placeholder.com/60'}" alt="${item.title}">
                    <div class="c-info">
                        <h4>${item.title}</h4>
                        <div class="qty-checkout-controls">
                            <button class="qty-mini-btn" type="button" onclick="changeCheckoutQty(${index}, -1)">-</button>
                            <span class="qty-val">${item.qty}</span>
                            <button class="qty-mini-btn" type="button" onclick="changeCheckoutQty(${index}, 1)">+</button>
                        </div>
                    </div>
                    <div style="text-align:right;"><p style="color:white; font-size:0.9rem;">₹${(item.price * item.qty).toLocaleString()}</p></div>
                </div>`;
        });

        let finalTotal = subtotal - activeDiscount;
        if(finalTotal < 0) finalTotal = 0;

        document.getElementById('c-subtotal').textContent = "₹" + subtotal.toLocaleString();
        document.getElementById('c-total').textContent = "₹" + finalTotal.toLocaleString();
        
        if(activeDiscount > 0) {
            document.getElementById('discount-row').style.display = 'flex';
            document.getElementById('c-discount').textContent = "-₹" + activeDiscount.toLocaleString();
        }
    }

    window.changeCheckoutQty = function(index, change) {
        cart[index].qty += change;
        if(cart[index].qty <= 0) cart.splice(index, 1);
        localStorage.setItem('taptCart', JSON.stringify(cart));
        if(cart.length === 0) window.location.href = 'shop.html';
        else renderCheckout();
    };

    // Coupon Logic
    document.getElementById('apply-coupon-btn').addEventListener('click', () => {
        const code = document.getElementById('coupon-code').value.toUpperCase().trim();
        const btn = document.getElementById('apply-coupon-btn');
        if(!code) return;

        btn.innerText = "Checking...";
        db.collection("coupons").doc(code).get().then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
                activeDiscount = (data.type === 'percentage') ? Math.round(subtotal * (data.value / 100)) : data.value;
                if(activeDiscount > subtotal) activeDiscount = subtotal;

                btn.textContent = "APPLIED";
                btn.style.background = "#4ade80"; btn.style.color = "#000";
                renderCheckout();
                showCelebration(activeDiscount);
            } else {
                btn.textContent = "INVALID";
                btn.style.background = "#ff5555"; btn.style.color = "#fff";
                setTimeout(() => { btn.textContent = "Apply"; btn.style.background = ""; btn.style.color = ""; }, 2000);
            }
        });
    });

    // Payment & Submit
    const paymentRadios = document.getElementsByName('payment');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const btn = document.getElementById('pay-btn');
            btn.textContent = e.target.value === 'cod' ? "Place Order (COD)" : "Pay Now";
        });
    });

    document.getElementById('checkout-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = document.getElementById('pay-btn');
        btn.innerText = "Processing..."; btn.disabled = true;

        let paymentMethod = 'card';
        document.getElementsByName('payment').forEach(r => { if(r.checked) paymentMethod = r.value; });

        const totalText = document.getElementById('c-total').textContent.replace('₹', '').replace(/,/g, '');
        
        db.collection("orders").add({
            date: new Date().toISOString(),
            email: document.getElementById('email').value,
            paymentMethod: paymentMethod,
            shipping: {
                first: document.getElementById('f-name').value,
                last: document.getElementById('l-name').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                phone: document.getElementById('phone').value
            },
            items: cart,
            total: parseFloat(totalText),
            status: paymentMethod === 'cod' ? 'pending_cod' : 'paid'
        }).then(() => {
            localStorage.removeItem('taptCart');
            document.getElementById('success-overlay').style.display = 'flex';
        }).catch(err => {
            alert("Error: " + err.message);
            btn.innerText = "Pay Now"; btn.disabled = false;
        });
    });

    renderCheckout();
}

/* =========================================
   7. CELEBRATION HELPER
   ========================================= */
function showCelebration(amountOff) {
    if (!document.getElementById('celebration-overlay')) {
        const overlayHTML = `
        <div id="celebration-overlay" class="celebration-overlay">
            <div class="confetti-container" id="confetti-container"></div>
            <div class="celebration-card">
                <div class="check-circle"><i class="fa-solid fa-check"></i></div>
                <h2 class="celeb-title">CODE APPLIED</h2>
                <p class="celeb-desc">Legacy secured. Discount unlocked.</p>
                <div class="discount-tag" id="celeb-discount-amount">-₹0</div>
                <button class="celeb-btn" onclick="closeCelebration()">CONTINUE</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', overlayHTML);
    }
    const overlay = document.getElementById('celebration-overlay');
    document.getElementById('celeb-discount-amount').innerText = `SAVED ₹${amountOff.toLocaleString()}`;
    overlay.classList.add('active'); overlay.style.display = 'flex';
    createConfetti();
}

window.closeCelebration = function() {
    const overlay = document.getElementById('celebration-overlay');
    if(overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.style.display = 'none', 300);
        document.getElementById('confetti-container').innerHTML = '';
    }
}

function createConfetti() {
    const container = document.getElementById('confetti-container');
    if(!container) return;
    const colors = ['#D4AF37', '#ffffff', '#F7E7CE', '#AA771C'];
    for (let i = 0; i < 60; i++) {
        const c = document.createElement('div');
        c.classList.add('confetti-piece');
        c.style.left = Math.random() * 100 + 'vw';
        c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        c.style.width = Math.random() * 8 + 5 + 'px';
        c.style.height = Math.random() * 8 + 5 + 'px';
        c.style.animation = `fall ${Math.random() * 2 + 2}s linear forwards ${Math.random() * 2}s`;
        container.appendChild(c);
    }
}

/* =========================================
   8. 3D TILT (GLOBAL)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const tiltElements = document.querySelectorAll('.card-stage, .product-card, .home-card, .home-keychain');
    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xRot = -((y - rect.height/2) / 20); 
            const yRot = (x - rect.width/2) / 20;
            const inner = el.querySelector('.tapt-card') || el.querySelector('.card-content') || el.querySelector('.card-image-wrapper') || el;
            inner.style.transform = `perspective(1000px) rotateX(${xRot}deg) rotateY(${yRot}deg) scale(1.02)`;
        });
        el.addEventListener('mouseleave', () => {
            const inner = el.querySelector('.tapt-card') || el.querySelector('.card-content') || el.querySelector('.card-image-wrapper') || el;
            inner.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
        });
    });
});
