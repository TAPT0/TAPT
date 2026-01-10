/* =========================================
   1. FIREBASE CONFIGURATION
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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const store = firebase.firestore();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
let products = [];
let appliedDiscount = 0;

/* =========================================
   2. INITIALIZATION
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartCount();
    initAuthListener();
    
    // Intersection Observer for Reveal Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { 
            if(e.isIntersecting) e.target.classList.add('active'); 
        });
    }, { threshold: 0.1 });
    
    setInterval(() => { 
        document.querySelectorAll('.reveal, .reveal-row, .fade-in, .fade-in-delay').forEach(el => observer.observe(el)); 
    }, 500);
});

/* =========================================
   3. PRODUCT FETCHING (STRICT ADMIN LOGIC)
   ========================================= */
function fetchProducts() {
    const grid = document.getElementById('shop-grid');
    if(grid) grid.innerHTML = '<div class="loading-text" style="text-align:center; padding:100px; color:#666; font-family:monospace;">DECRYPTING INVENTORY...</div>';

    store.collection('products').get().then((snap) => {
        products = []; 
        if(grid) grid.innerHTML = ''; 

        snap.forEach((doc) => {
            let data = doc.data();
            
            // --- 1. IMAGE DETECTION (Prioritize Array from Admin) ---
            let pImage = ''; 
            if (data.images && Array.isArray(data.images) && data.images.length > 0) {
                pImage = data.images[0];
            } else if (data.image) {
                pImage = data.image;
            }

            let bImage = null;
            if (data.images && Array.isArray(data.images) && data.images.length > 1) {
                bImage = data.images[1];
            } else if (data.backImage) {
                bImage = data.backImage;
            }

            // --- 2. TYPE LOGIC (Strictly from Admin) ---
            // If Admin says 'tag', it is a tag. If 'card', it is a card.
            let pType = data.type ? data.type.toLowerCase() : 'card';

            products.push({
                id: doc.id,
                name: data.title || data.name || "Unnamed Unit",
                price: Number(data.price) || 0,
                category: data.category || 'custom',
                type: pType, // Store the exact type
                image: pImage,
                backImage: bImage, 
                desc: data.description || "Next-gen networking hardware."
            });
        });

        renderShop();
    }).catch(err => {
        console.error(err);
        if(grid) grid.innerHTML = "<p style='text-align:center; color:red;'>CONNECTION FAILED.</p>";
    });
}

function renderShop(filter = 'all') {
    const container = document.getElementById('shop-grid');
    if (!container) return;

    container.innerHTML = '';
    let visibleCount = 0;

    products.forEach(product => {
        // Filter by Type (Card vs Tag)
        if (filter !== 'all' && product.type !== filter) return;

        const reverseClass = visibleCount % 2 !== 0 ? 'reverse' : '';
        const row = document.createElement('div');
        row.className = `shop-row reveal-row ${reverseClass}`;
        
        // Apply Shape Class based on Admin Type
        const shapeClass = product.type === 'tag' ? 'shape-tag' : 'shape-card';
        
        // Background Styles
        const bgStyle = product.image ? `background-image: url('${product.image}');` : `background: #111;`;
        const backBgStyle = product.backImage ? `background-image: url('${product.backImage}'); background-size: 100% 100%;` : ``;

        // Branding (Only if no image)
        let brandingHTML = '';
        if (!product.image) {
             brandingHTML = `<div style="position:absolute; bottom:25px; right:25px;"><div class="gold-foil" style="font-family:'Syncopate'; font-size:1.2rem; letter-spacing:2px;">TAPD.</div></div>`;
        }

        row.innerHTML = `
            <div class="row-image-box" onmousemove="tiltTwin(event, this)" onmouseleave="resetTwin(this)" onclick="flipCard(this)">
                <div class="spotlight"></div>
                <div class="flip-hint"><i class="fa-solid fa-arrows-rotate"></i></div>

                <div class="digital-twin ${shapeClass}">
                    <div class="twin-inner">
                        
                        <div class="twin-face twin-front">
                            <div class="twin-layer twin-base" style="${bgStyle}"></div>
                            <div class="twin-layer" style="background:url('https://grainy-gradients.vercel.app/noise.svg'); opacity:0.15; mix-blend-mode:overlay;"></div>
                            ${brandingHTML}
                            <div class="twin-layer twin-glare"></div>
                        </div>

                        <div class="twin-face twin-back" style="${backBgStyle}">
                            <div class="twin-layer twin-glare"></div>
                            
                            ${product.backImage ? `
                                <div style="position:absolute; top:15%; width:100%; text-align:center; color:#ececec; font-family:'Syncopate'; font-size:0.75rem; font-weight:700; pointer-events:none; text-shadow:0 2px 5px rgba(0,0,0,0.9);">
                                    ${product.name.toUpperCase()}
                                </div>
                                <div style="position:absolute; bottom:12%; width:100%; text-align:center; color:#888; font-family:'Syncopate'; font-size:0.6rem; letter-spacing:3px; pointer-events:none; text-shadow:0 1px 3px rgba(0,0,0,0.9);">
                                    TAPD. BOOST
                                </div>
                            ` : `
                                <div class="twin-layer" style="background:url('https://grainy-gradients.vercel.app/noise.svg'); opacity:0.05;"></div>
                                <div style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%) rotate(-90deg); font-family: 'Syncopate'; font-size: 2.5rem; color: rgba(255,255,255,0.03); font-weight: 800;">TAPD.</div>
                                <div style="position: absolute; bottom: 25px; right: 25px; text-align: right;">
                                    <div style="font-size: 0.6rem; color: #666; font-family: 'Inter';">SERIAL NO.</div>
                                    <div style="font-family: 'monospace'; color: var(--gold);">${product.id.substring(0,6).toUpperCase()}</div>
                                </div>
                            `}
                        </div>

                    </div>
                </div>
            </div>
            
            <div class="row-content">
                <div class="row-cat">${product.type.toUpperCase()} SERIES</div>
                <h2 class="row-title">${product.name}</h2>
                <p class="row-desc">${product.desc}</p>
                <div class="row-price">₹${product.price}</div>
                
                <div class="row-actions">
                    <button class="btn-buy" onclick="addToCart('${product.id}')">ADD TO CART</button>
                    <button class="btn-buy" style="background:transparent; color:white; border:1px solid #333; margin-left:10px;" onclick="viewProduct('${product.id}')">DETAILS</button>
                </div>
            </div>
        `;
        
        container.appendChild(row);
        visibleCount++;
    });
}

/* =========================================
   4. INTERACTION (TILT & FLIP)
   ========================================= */
function tiltTwin(e, container) {
    const card = container.querySelector('.digital-twin');
    const glare = container.querySelector('.twin-glare');
    const box = container.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    
    const rotateX = -y / 25; 
    const rotateY = x / 25;
    
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    if(glare) {
        glare.style.transform = `translate(${x}px, ${y}px)`;
        glare.style.opacity = '0.6';
    }
}

function resetTwin(container) {
    const card = container.querySelector('.digital-twin');
    const glare = container.querySelector('.twin-glare');
    card.style.transform = `rotateX(0) rotateY(0) scale(1)`;
    if(glare) glare.style.opacity = '0';
}

function flipCard(container) {
    const inner = container.querySelector('.twin-inner');
    if (inner) inner.classList.toggle('flipped');
}

/* =========================================
   5. CART & COUPONS (Restored)
   ========================================= */
function addToCart(id) {
    const product = products.find(p => p.id === id);
    if(!product) return;
    
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    let item = cart.find(i => i.id === id);
    
    if(item) item.qty++;
    else {
        const cartImg = (product.image && product.image !== '') ? product.image : 'https://via.placeholder.com/80?text=TAPD';
        cart.push({ 
            id: product.id, name: product.name, price: product.price, img: cartImg, qty: 1 
        });
    }
    
    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    updateCartCount();
    
    const drawer = document.getElementById('cart-drawer');
    if(!drawer.classList.contains('open')) toggleCart(); 
    else renderCartItems();
}

function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    const badge = document.getElementById('cart-count');
    if(badge) { 
        const count = cart.reduce((a, c) => a + c.qty, 0);
        badge.innerText = count; 
        badge.style.display = count > 0 ? 'flex' : 'none'; 
    }
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
        document.getElementById('account-drawer').classList.remove('open');
    }
}

function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    let subtotal = cart.reduce((a, c) => a + (c.price * c.qty), 0);
    
    container.innerHTML = '';
    
    if(cart.length === 0) {
        // --- PREMIUM EMPTY STATE ---
        container.innerHTML = `
            <div style="text-align:center; margin-top:120px; opacity:0.6;">
                <i class="fa-solid fa-microchip" style="font-size:3rem; margin-bottom:20px; color:#333; animation:pulse 3s infinite;"></i>
                <h3 style="font-family:'Syncopate', sans-serif; font-size:1rem; margin-bottom:5px; color:white;">NO HARDWARE</h3>
                <p style="font-family:'Inter', sans-serif; color:#666; font-size:0.8rem;">Inventory scan required.</p>
                <button onclick="toggleCart()" style="margin-top:20px; background:transparent; border:1px solid #D4AF37; color:#D4AF37; padding:10px 20px; cursor:pointer; font-family:'JetBrains Mono', monospace; font-size:0.7rem;">INITIATE BROWSE</button>
            </div>
        `;
        totalEl.innerText = "₹0";
        return;
    }

    cart.forEach((item, idx) => {
        container.innerHTML += `
            <div class="cart-item" style="display:flex; gap:15px; margin-bottom:15px; padding:15px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:10px;">
                <img src="${item.img}" style="width:60px; height:60px; object-fit:cover; border-radius:6px; border:1px solid #333;">
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="margin:0; font-size:0.8rem; color:white; font-family:'Syncopate', sans-serif;">${item.name}</h4>
                        <span onclick="removeItem(${idx})" style="cursor:pointer; color:#666; font-size:1.2rem;">&times;</span>
                    </div>
                    <p style="color:#D4AF37; font-size:0.8rem; margin-top:5px; font-family:'JetBrains Mono', monospace;">₹${item.price} <span style="color:#666;">x ${item.qty}</span></p>
                </div>
            </div>
        `;
    });
    
    let final = subtotal - appliedDiscount;
    totalEl.innerText = "₹" + (final > 0 ? Math.floor(final) : 0);
}

function removeItem(idx) {
    let cart = JSON.parse(localStorage.getItem('TAPDCart'));
    cart.splice(idx, 1);
    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    if(cart.length === 0) appliedDiscount = 0; 
    renderCartItems();
    updateCartCount();
}

/* --- COUPON SYSTEM (Restored) --- */
async function applyCoupon() {
    const codeInput = document.getElementById('coupon-code');
    const code = codeInput.value.toUpperCase().trim();
    if (!code) return;
    
    try {
        const doc = await store.collection('coupons').doc(code).get();
        if (doc.exists) {
            const data = doc.data();
            let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
            if(cart.length === 0) return alert("Cart is empty");

            let subtotal = cart.reduce((a, c) => a + (c.price * c.qty), 0);
            
            appliedDiscount = data.type === 'percentage' 
                ? (subtotal * data.value) / 100 
                : data.value;
            
            renderCartItems();
            
            document.getElementById('celebration-overlay').classList.add('active');
            if(typeof confetti === 'function') {
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            }
            
            codeInput.value = ""; 
        } else {
            alert("Invalid Access Code");
        }
    } catch (err) { 
        console.error(err); 
    }
}

function closeCelebration() { 
    document.getElementById('celebration-overlay').classList.remove('active'); 
}

/* =========================================
   6. AUTHENTICATION & USER
   ========================================= */
function initAuthListener() {
    auth.onAuthStateChanged(user => {
        const drawerContent = document.getElementById('account-content');
        const icon = document.getElementById('user-icon-trigger');
        
        if (user) {
            if(icon) icon.style.color = '#D4AF37';
            drawerContent.innerHTML = `
                <div style="text-align:center; padding:40px 20px;">
                    <div style="width:70px; height:70px; border-radius:50%; background:#D4AF37; color:black; font-size:2rem; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-weight:bold;">
                        ${user.email[0].toUpperCase()}
                    </div>
                    <h3 style="color:white; font-family:'Syncopate', sans-serif; margin-bottom:5px;">${user.displayName || 'MEMBER'}</h3>
                    <p style="color:#666; font-size:0.8rem; font-family:'JetBrains Mono', monospace; margin-bottom:30px;">${user.email}</p>
                    
                    <button onclick="logout()" style="border:1px solid #333; background:transparent; color:#888; padding:10px 30px; cursor:pointer; font-family:'JetBrains Mono', monospace;">DISCONNECT</button>
                </div>
            `;
        } else {
            if(icon) icon.style.color = 'white';
            drawerContent.innerHTML = `
                <div style="text-align:center; padding:50px 20px;">
                    <i class="fa-solid fa-fingerprint" style="font-size:3rem; color:#222; margin-bottom:20px;"></i>
                    <p style="color:#888; margin-bottom:30px; font-family:'Inter', sans-serif;">Identify yourself to access secured data.</p>
                    <button class="checkout-btn" onclick="toggleAuthModal(true)">LOGIN / ACCESS</button>
                </div>
            `;
        }
    });
}

function loginWithGoogle() { 
    auth.signInWithPopup(provider).catch(e => alert(e.message)); 
}

function handleEmailAuth(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-pass').value;
    
    auth.signInWithEmailAndPassword(email, pass).catch(err => {
        if(err.code === 'auth/user-not-found') {
            if(confirm("New identity detected. Create record?")) {
                auth.createUserWithEmailAndPassword(email, pass);
            }
        } else {
            alert(err.message);
        }
    });
}

function logout() { 
    auth.signOut(); 
    toggleAccount(); 
}

function toggleAuthModal(forceState) {
    const modal = document.getElementById('auth-modal');
    const overlay = document.querySelector('.cart-overlay');
    
    const display = (typeof forceState !== 'undefined' ? forceState : modal.style.display === 'none') ? 'flex' : 'none';
    
    modal.style.display = display;
    overlay.style.display = display;
}

/* =========================================
   7. UTILITIES & NAVIGATION
   ========================================= */
function closeAllDrawers() {
    document.getElementById('cart-drawer').classList.remove('open');
    document.getElementById('account-drawer').classList.remove('open');
    document.querySelector('.cart-overlay').style.display = 'none';
    document.getElementById('auth-modal').style.display = 'none';
}

function handleUserClick() { 
    const drawer = document.getElementById('account-drawer');
    const overlay = document.querySelector('.cart-overlay');
    
    if(drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        overlay.style.display = 'none';
    } else {
        drawer.classList.add('open');
        overlay.style.display = 'block';
        document.getElementById('cart-drawer').classList.remove('open');
    }
}

function toggleAccount() { handleUserClick(); }

function viewProduct(id) { 
    window.location.href = `product.html?id=${id}`; 
}

function searchProducts() {
    const term = document.getElementById('shop-search').value.toLowerCase();
    
    document.querySelectorAll('.shop-row').forEach(row => {
        const title = row.querySelector('.row-title').innerText.toLowerCase();
        if (title.includes(term)) {
            row.style.display = 'flex';
        } else {
            row.style.display = 'none';
        }
    });
}

function toggleFaq(el) { 
    el.classList.toggle('active'); 
}
