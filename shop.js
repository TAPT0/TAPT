/* =========================================
   1. FIREBASE CONFIGURATION & SETUP
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

// Initialize Firebase only once
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const store = firebase.firestore();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// State Variables
let products = [];
let appliedDiscount = 0;

/* =========================================
   2. INITIALIZATION
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartCount();
    initAuthListener();
    
    // Scroll Reveal Animation Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { 
            if(e.isIntersecting) e.target.classList.add('active'); 
        });
    }, { threshold: 0.1 });
    
    // Attach observer to elements
    setInterval(() => { 
        document.querySelectorAll('.reveal, .reveal-row').forEach(el => observer.observe(el)); 
    }, 500);
});

/* =========================================
   3. PRODUCT FETCHING & RENDERING
   ========================================= */
function fetchProducts() {
    const grid = document.getElementById('shop-grid');
    if(grid) grid.innerHTML = '<div class="loading-text" style="width:100%; text-align:center; color:#666; margin-top:50px;">Loading Legacy...</div>';

    store.collection('products').get().then((snap) => {
        products = []; 
        if(grid) grid.innerHTML = ''; 

        snap.forEach((doc) => {
            let data = doc.data();
            let pImage = '';
            
            // Handle different image formats from database
            if (data.images && data.images.length > 0) pImage = data.images[0];
            else if (data.image) pImage = data.image;

            products.push({
                id: doc.id,
                name: data.title || data.name || "Unnamed",
                price: Number(data.price) || 0,
                category: data.category || 'custom',
                image: pImage,
                desc: data.description || "Transform your networking with premium NFC technology."
            });
        });

        renderShop();
    }).catch(err => {
        console.error(err);
        if(grid) grid.innerHTML = "<p style='text-align:center; color:red; margin-top:50px;'>Failed to load products. Please refresh.</p>";
    });
}

function renderShop(filter = 'all') {
    const container = document.getElementById('shop-grid');
    if (!container) return;

    container.innerHTML = '';
    let visibleCount = 0;

    products.forEach(product => {
        // Smart Detection: Check if it's a "Tag" or "Card" based on name or category
        let pType = 'card'; 
        const lowerName = product.name.toLowerCase();
        const lowerCat = product.category.toLowerCase();
        
        if (lowerName.includes('tag') || lowerCat.includes('tag') || lowerName.includes('coin')) {
            pType = 'tag';
        }
        
        // Filter Logic
        if (filter !== 'all') {
            if (filter === 'tag' && pType !== 'tag') return;
            if (filter === 'card' && pType !== 'card') return;
        }

        const reverseClass = visibleCount % 2 !== 0 ? 'reverse' : '';
        const row = document.createElement('div');
        row.className = `shop-row reveal-row ${reverseClass}`;
        
        // --- 3D TWIN CONSTRUCTION ---
        
        // 1. Determine Shape CSS Class
        const shapeClass = pType === 'tag' ? 'shape-tag' : 'shape-card';
        
        // 2. Determine Background (Custom Image vs Standard Black)
        // If image exists and isn't a placeholder, use it. Otherwise, use matte black.
        const hasCustomImage = product.image && !product.image.includes('placeholder') && product.image !== '';
        const bgStyle = hasCustomImage ? `background-image: url('${product.image}');` : `background-color: #111;`;

        // 3. Determine Branding (Only show Gold Chip/Logo if no custom image is used)
        let brandingHTML = '';
        if (!hasCustomImage) {
             brandingHTML = `
                <div class="twin-layer twin-branding">
                    ${pType === 'card' ? '<div class="chip"></div>' : '<div></div>'} 
                    <div class="twin-logo">TAPD.</div>
                </div>
             `;
        }

        // 4. Build HTML
        row.innerHTML = `
            <div class="row-image-box" onmousemove="tiltTwin(event, this)" onmouseleave="resetTwin(this)" onclick="viewProduct('${product.id}')">
                <div class="spotlight"></div>
                <div class="digital-twin ${shapeClass}">
                    <div class="twin-layer twin-base" style="${bgStyle}"></div>
                    <div class="twin-layer twin-texture"></div>
                    ${brandingHTML}
                    <div class="twin-layer twin-glare"></div>
                </div>
            </div>
            
            <div class="row-content">
                <div class="row-cat">${pType.toUpperCase()} SERIES</div>
                <h2 class="row-title">${product.name}</h2>
                <p class="row-desc">${product.desc}</p>
                <div class="row-price">₹${product.price}</div>
                
                <div class="row-actions">
                    <button class="btn-buy" onclick="viewProduct('${product.id}')">CONFIGURE</button>
                    <button class="btn-add-round" onclick="addToCart('${product.id}')"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
        `;
        
        container.appendChild(row);
        visibleCount++;
    });
}

/* =========================================
   4. 3D TILT ENGINE (The Premium Feel)
   ========================================= */
function tiltTwin(e, container) {
    const card = container.querySelector('.digital-twin');
    const glare = container.querySelector('.twin-glare');
    
    // Get dimensions of the container
    const box = container.getBoundingClientRect();
    
    // Calculate mouse position relative to center of the box
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    
    // Physics: Divide by 20 for a "heavy", premium feel.
    // Negative Y for RotateX gives natural tilt.
    const rotateX = -y / 20; 
    const rotateY = x / 20;
    
    // Apply Transform
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    
    // Move Glare (Opposite direction for realistic reflection)
    glare.style.transform = `translate(${x}px, ${y}px)`;
    glare.style.opacity = '0.8';
}

function resetTwin(container) {
    const card = container.querySelector('.digital-twin');
    const glare = container.querySelector('.twin-glare');
    
    // Reset to flat state
    card.style.transform = `rotateX(0) rotateY(0) scale(1)`;
    glare.style.opacity = '0';
}

/* =========================================
   5. CART MANAGEMENT
   ========================================= */
function addToCart(id) {
    const product = products.find(p => p.id === id);
    if(!product) return;
    
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    let item = cart.find(i => i.id === id);
    
    if(item) {
        item.qty++;
    } else {
        // Fallback image if custom image is missing
        const cartImg = (product.image && product.image !== '') ? product.image : 'https://via.placeholder.com/80?text=TAPD';
        cart.push({ 
            id: product.id, 
            name: product.name, 
            price: product.price, 
            img: cartImg, 
            qty: 1 
        });
    }
    
    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    updateCartCount();
    
    // Open cart to show user
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
        // Close other drawers
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
        container.innerHTML = "<p style='color:#666; text-align:center; margin-top:50px;'>Bag is empty.</p>";
        totalEl.innerText = "₹0";
        return;
    }

    cart.forEach((item, idx) => {
        container.innerHTML += `
            <div class="cart-item">
                <img src="${item.img}" style="width:70px; height:70px; object-fit:cover; border-radius:8px;">
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="margin:0; font-size:0.9rem; color:white;">${item.name}</h4>
                        <span onclick="removeItem(${idx})" style="cursor:pointer; color:#ff4444; font-size:1.2rem;">&times;</span>
                    </div>
                    <p style="color:var(--gold); font-size:0.8rem; margin-top:5px;">₹${item.price} x ${item.qty}</p>
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
    
    if(cart.length === 0) appliedDiscount = 0; // Reset coupon if empty
    
    renderCartItems();
    updateCartCount();
}

/* =========================================
   6. COUPONS
   ========================================= */
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
            
            // Calculate Discount
            appliedDiscount = data.type === 'percentage' 
                ? (subtotal * data.value) / 100 
                : data.value;
            
            renderCartItems();
            
            // Show Celebration
            document.getElementById('celebration-overlay').classList.add('active');
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            
            codeInput.value = ""; // Clear input
        } else {
            alert("Invalid Coupon Code");
        }
    } catch (err) { 
        console.error(err); 
    }
}

function closeCelebration() { 
    document.getElementById('celebration-overlay').classList.remove('active'); 
}

/* =========================================
   7. AUTHENTICATION & USER
   ========================================= */
function initAuthListener() {
    auth.onAuthStateChanged(user => {
        const drawerContent = document.getElementById('account-content');
        const icon = document.getElementById('user-icon-trigger');
        
        if (user) {
            // User Logged In
            icon.classList.add('active');
            drawerContent.innerHTML = `
                <div class="user-profile">
                    <div class="user-avatar">
                        ${user.photoURL 
                            ? `<img src="${user.photoURL}" style="width:100%;height:100%;border-radius:50%">` 
                            : user.email[0].toUpperCase()}
                    </div>
                    <div class="user-name">${user.displayName || 'Member'}</div>
                    <div class="user-email">${user.email}</div>
                    <button class="logout-btn" onclick="logout()">LOGOUT</button>
                </div>
            `;
        } else {
            // User Logged Out
            icon.classList.remove('active');
            drawerContent.innerHTML = `
                <div style="padding:40px; text-align:center;">
                    <p style="color:#888; margin-bottom:20px;">Access your legacy.</p>
                    <button class="btn-buy" style="width:100%;" onclick="toggleAuthModal(true)">LOGIN / JOIN</button>
                </div>
            `;
        }
    });
}

function loginWithGoogle() { 
    auth.signInWithPopup(provider)
        .catch(e => alert(e.message)); 
}

function handleEmailAuth(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-pass').value;
    
    auth.signInWithEmailAndPassword(email, pass).catch(err => {
        if(err.code === 'auth/user-not-found') {
            if(confirm("User not found. Create a new account with this email?")) {
                auth.createUserWithEmailAndPassword(email, pass);
            }
        } else {
            document.getElementById('auth-error').innerText = err.message;
            document.getElementById('auth-error').style.display = 'block';
        }
    });
}

function logout() { 
    auth.signOut(); 
    toggleAccount(); // Close drawer
}

function toggleAuthModal(forceState) {
    const modal = document.getElementById('auth-modal');
    const overlay = document.querySelector('.cart-overlay');
    
    // Logic to toggle or force set state
    if (typeof forceState !== 'undefined') {
        modal.style.display = forceState ? 'block' : 'none';
        overlay.style.display = forceState ? 'block' : 'none';
    } else {
        const isClosed = modal.style.display === 'none' || modal.style.display === '';
        modal.style.display = isClosed ? 'block' : 'none';
        overlay.style.display = isClosed ? 'block' : 'none';
    }
}

/* =========================================
   8. UTILITIES (Navigation, Search, Drawers)
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
    // Navigate to product details page
    window.location.href = `product.html?id=${id}`; 
}

function filterProducts(cat, btn) {
    // Update active button state
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Re-render items
    renderShop(cat);
}

function searchProducts() {
    const term = document.getElementById('shop-search').value.toLowerCase();
    
    document.querySelectorAll('.shop-row').forEach(row => {
        const title = row.querySelector('.row-title').innerText.toLowerCase();
        // Simple visibility toggle
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
