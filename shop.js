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
   3. PRODUCT FETCHING & RENDERING (FIXED IMAGE LOGIC)
   ========================================= */
function fetchProducts() {
    const grid = document.getElementById('shop-grid');
    if(grid) grid.innerHTML = '<div class="loading-text">DECRYPTING INVENTORY...</div>';

    store.collection('products').get().then((snap) => {
        products = []; 
        if(grid) grid.innerHTML = ''; 

        snap.forEach((doc) => {
            let data = doc.data();
            
            // --- SMART IMAGE DETECTOR ---
            // 1. Front Image: Try the new array first, then legacy field
            let pImage = ''; 
            if (data.images && data.images.length > 0) pImage = data.images[0];
            else if (data.image) pImage = data.image;

            // 2. Back Image: Check for 2nd image in array, then legacy backImage field
            let bImage = null;
            if (data.images && data.images.length > 1) bImage = data.images[1];
            else if (data.backImage) bImage = data.backImage;

            products.push({
                id: doc.id,
                name: data.title || data.name || "Unnamed Unit",
                price: Number(data.price) || 0,
                category: data.category || 'custom',
                image: pImage,
                backImage: bImage, 
                desc: data.description || "Next-gen networking hardware."
            });
        });

        renderShop();
    }).catch(err => {
        console.error(err);
        if(grid) grid.innerHTML = "<p style='text-align:center; color:red; font-family:var(--font-tech);'>CONNECTION FAILED. RETRYING...</p>";
    });
}

function renderShop(filter = 'all') {
    const container = document.getElementById('shop-grid');
    if (!container) return;

    container.innerHTML = '';
    let visibleCount = 0;

    products.forEach(product => {
        let pType = 'card'; 
        if (product.name.toLowerCase().includes('tag') || product.category.toLowerCase().includes('tag')) {
            pType = 'tag';
        }
        
        if (filter !== 'all' && pType !== filter) return;

        const reverseClass = visibleCount % 2 !== 0 ? 'reverse' : '';
        const row = document.createElement('div');
        row.className = `shop-row reveal-row ${reverseClass}`;
        
        const shapeClass = pType === 'tag' ? 'shape-tag' : 'shape-card';
        
        // Front Image Style
        const hasCustomImage = product.image && !product.image.includes('placeholder') && product.image !== '';
        const bgStyle = hasCustomImage ? `background-image: url('${product.image}');` : `background: #111;`;

        // Back Image Style
        const backBgStyle = product.backImage 
            ? `background-image: url('${product.backImage}'); background-size: 100% 100%;` 
            : ``; // If empty, CSS defaults to the dark texture

        let brandingHTML = '';
        if (!hasCustomImage) {
             brandingHTML = `
                <div style="position:absolute; bottom:25px; right:25px;">
                    <div class="gold-foil" style="font-family:'Syncopate'; font-size:1.2rem; letter-spacing:2px;">TAPD.</div>
                </div>
             `;
        }

        // --- RENDER HTML ---
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
                                <div style="
                                    position: absolute; 
                                    top: 15%; 
                                    width: 100%; 
                                    text-align: center; 
                                    color: #ececec;
                                    font-family: 'Syncopate', sans-serif; 
                                    font-size: 0.75rem; 
                                    font-weight: 700; 
                                    letter-spacing: 2px;
                                    text-shadow: 0 2px 5px rgba(0,0,0,0.9);
                                    pointer-events: none;
                                ">
                                    ${product.name.toUpperCase()}
                                </div>

                                <div style="
                                    position: absolute; 
                                    bottom: 12%; 
                                    width: 100%; 
                                    text-align: center; 
                                    color: #888; 
                                    font-family: 'Syncopate', sans-serif; 
                                    font-size: 0.6rem; 
                                    font-weight: 600; 
                                    letter-spacing: 3px;
                                    text-shadow: 0 1px 3px rgba(0,0,0,0.9);
                                    pointer-events: none;
                                ">
                                    TAPD. BOOST CARD
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
                <div class="row-cat">${pType.toUpperCase()} SERIES</div>
                <h2 class="row-title">${product.name}</h2>
                <p class="row-desc">${product.desc}</p>
                <div class="row-price">₹${product.price}</div>
                
                <div class="row-actions">
                    <button class="btn-buy" onclick="viewProduct('${product.id}')">CONFIGURE UNIT</button>
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
    
    // Heavier feeling tilt
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
   5. CART & UTILS
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
        // --- FIXED EMPTY STATE ---
        container.innerHTML = `
            <div style="text-align:center; margin-top:100px; opacity:0.5;">
                <i class="fa-solid fa-box-open" style="font-size:3rem; margin-bottom:20px; color:#333;"></i>
                <p style="color:#666; font-family:var(--font-tech);">NO HARDWARE DETECTED</p>
                <button onclick="toggleCart()" style="margin-top:20px; background:none; border:1px solid #333; color:#888; padding:5px 15px; cursor:pointer;">BROWSE</button>
            </div>
        `;
        totalEl.innerText = "₹0";
        return;
    }

    cart.forEach((item, idx) => {
        container.innerHTML += `
            <div class="cart-item" style="background:#111; padding:10px; border-radius:8px; border:1px solid #222;">
                <img src="${item.img}" style="width:60px; height:60px; object-fit:cover; border-radius:4px; border:1px solid #333;">
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="margin:0; font-size:0.8rem; color:white; font-family:var(--font-head);">${item.name}</h4>
                        <span onclick="removeItem(${idx})" style="cursor:pointer; color:#555; font-size:1.2rem;">&times;</span>
                    </div>
                    <p style="color:var(--gold); font-size:0.8rem; margin-top:5px; font-family:var(--font-tech);">₹${item.price} x ${item.qty}</p>
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

/* =========================================
   6. AUTHENTICATION & USER (FIXED UI)
   ========================================= */
function initAuthListener() {
    auth.onAuthStateChanged(user => {
        const drawerContent = document.getElementById('account-content');
        const icon = document.getElementById('user-icon-trigger');
        
        if (user) {
            icon.classList.add('active');
            drawerContent.innerHTML = `
                <div style="text-align:center; padding:30px;">
                    <div style="width:80px; height:80px; border-radius:50%; background:var(--gold); color:black; font-size:2rem; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-weight:bold;">
                        ${user.email[0].toUpperCase()}
                    </div>
                    <h3 style="color:white; font-family:var(--font-head); margin-bottom:5px;">${user.displayName || 'VISIONARY'}</h3>
                    <p style="color:#666; font-size:0.8rem; font-family:var(--font-tech); margin-bottom:30px;">${user.email}</p>
                    
                    <button onclick="logout()" style="border:1px solid #333; background:transparent; color:#888; padding:10px 30px; cursor:pointer; font-family:var(--font-tech);">TERMINATE SESSION</button>
                </div>
            `;
        } else {
            icon.classList.remove('active');
            drawerContent.innerHTML = `
                <div style="text-align:center; padding:50px 20px;">
                    <i class="fa-solid fa-fingerprint" style="font-size:3rem; color:#222; margin-bottom:20px;"></i>
                    <p style="color:#888; margin-bottom:30px;">Identify yourself to access order history.</p>
                    <button class="btn-buy" style="width:100%;" onclick="toggleAuthModal(true)">LOGIN / REGISTER</button>
                </div>
            `;
        }
    });
}

function loginWithGoogle() { auth.signInWithPopup(provider).catch(e => alert(e.message)); }
function handleEmailAuth(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-pass').value;
    auth.signInWithEmailAndPassword(email, pass).catch(err => {
        if(err.code === 'auth/user-not-found') {
            if(confirm("New user detected. Initialize account?")) auth.createUserWithEmailAndPassword(email, pass);
        } else {
            alert(err.message);
        }
    });
}
function logout() { auth.signOut(); toggleAccount(); }

function toggleAuthModal(forceState) {
    const modal = document.getElementById('auth-modal');
    const overlay = document.querySelector('.cart-overlay');
    const display = (typeof forceState !== 'undefined' ? forceState : modal.style.display === 'none') ? 'flex' : 'none';
    
    modal.style.display = display;
    overlay.style.display = display;
}

/* =========================================
   7. UTILITIES
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
        drawer.classList.remove('open'); overlay.style.display = 'none';
    } else {
        drawer.classList.add('open'); overlay.style.display = 'block';
        document.getElementById('cart-drawer').classList.remove('open');
    }
}
function toggleAccount() { handleUserClick(); }
function viewProduct(id) { window.location.href = `product.html?id=${id}`; }
function searchProducts() {
    const term = document.getElementById('shop-search').value.toLowerCase();
    document.querySelectorAll('.shop-row').forEach(row => {
        row.style.display = row.querySelector('.row-title').innerText.toLowerCase().includes(term) ? 'flex' : 'none';
    });
}
function toggleFaq(el) { el.classList.toggle('active'); }
