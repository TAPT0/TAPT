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
    initAnimatedCounters();
    initParallaxEffects();
    
    // Premium Intersection Observer for Reveal Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before element enters viewport
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => { 
            if(entry.isIntersecting) {
                // Staggered animation delay for premium effect
                const delay = entry.target.classList.contains('shop-row') 
                    ? entry.target.dataset.index * 0.15 
                    : 0;
                
                setTimeout(() => {
                    entry.target.classList.add('active');
                }, delay * 1000);
                
                // Only observe once for performance
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements with staggered initialization
    setTimeout(() => { 
        document.querySelectorAll('.reveal, .reveal-row, .fade-in, .fade-in-delay').forEach((el, index) => {
            if (el.classList.contains('shop-row')) {
                el.dataset.index = index;
            }
            observer.observe(el);
        }); 
    }, 300);
    
    // Observe shop rows specifically for premium stagger
    const shopRowsObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if(entry.isIntersecting) {
                const delay = index * 0.1;
                setTimeout(() => {
                    entry.target.classList.add('active');
                }, delay * 1000);
            }
        });
    }, { threshold: 0.05, rootMargin: '0px 0px -100px 0px' });
    
    setTimeout(() => {
        document.querySelectorAll('.shop-row').forEach((row, index) => {
            row.dataset.index = index;
            shopRowsObserver.observe(row);
        });
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

    // Premium fade-out transition before clearing
    const existingRows = container.querySelectorAll('.shop-row');
    if (existingRows.length > 0) {
        existingRows.forEach((row, index) => {
            setTimeout(() => {
                row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                row.style.opacity = '0';
                row.style.transform = 'translateY(-20px) scale(0.95)';
            }, index * 30);
        });
    }

    setTimeout(() => {
        container.innerHTML = '';
        let visibleCount = 0;

        products.forEach(product => {
            // Filter by Type (Card vs Tag)
            if (filter !== 'all' && product.type !== filter) return;

            const reverseClass = visibleCount % 2 !== 0 ? 'reverse' : '';
            const row = document.createElement('div');
            row.className = `shop-row reveal-row ${reverseClass}`;
            row.style.opacity = '0';
            row.style.transform = 'translateY(50px)';
        
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
                <div class="flip-hint"><i class="fa-solid fa-arrows-rotate"></i> FLIP</div>
                <div class="product-badge">${product.type.toUpperCase()}</div>

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
                <div class="row-price-section">
                    <div class="row-price">₹${product.price}</div>
                    <div class="row-actions">
                        <button class="btn-buy" onclick="event.stopPropagation(); addToCart('${product.id}')" title="Add to Cart">
                            <i class="fa-solid fa-bag-shopping"></i>
                        </button>
                        <button class="btn-buy" style="background:transparent; color:white; border:1px solid rgba(255,255,255,0.2);" onclick="event.stopPropagation(); viewProduct('${product.id}')" title="View Details">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
            container.appendChild(row);
            visibleCount++;
            
            // Premium staggered entry animation
            setTimeout(() => {
                row.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, visibleCount * 100);
        });
        
        // Re-observe new rows for intersection
        setTimeout(() => {
            document.querySelectorAll('.shop-row').forEach((row, index) => {
                row.dataset.index = index;
                const shopRowsObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if(entry.isIntersecting) {
                            entry.target.classList.add('active');
                            shopRowsObserver.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.1 });
                shopRowsObserver.observe(row);
            });
        }, 100);
    }, existingRows.length > 0 ? 400 : 0);
}

/* =========================================
   4. PREMIUM INTERACTION (TILT & FLIP - Mobile Optimized)
   ========================================= */
function tiltTwin(e, container) {
    const card = container.querySelector('.digital-twin');
    const glare = container.querySelector('.twin-glare');
    const spotlight = container.querySelector('.spotlight');
    if (!card) return;
    
    const box = container.getBoundingClientRect();
    const isTouch = e.touches ? true : false;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - box.left - box.width / 2;
    const y = clientY - box.top - box.height / 2;
    
    // Premium 3D tilt effect (subtle on mobile, stronger on desktop)
    const isMobile = window.innerWidth <= 900;
    const sensitivity = isMobile ? 35 : 25;
    const maxTilt = isMobile ? 8 : 12;
    
    const rotateX = Math.max(-maxTilt, Math.min(maxTilt, -y / sensitivity)); 
    const rotateY = Math.max(-maxTilt, Math.min(maxTilt, x / sensitivity));
    const scale = isMobile ? 1.01 : 1.02;
    
    // Smooth transform with will-change optimization
    card.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale}) translateZ(20px)`;
    card.style.transition = 'transform 0.1s ease-out';
    
    // Enhanced glare effect
    if(glare) {
        const glareX = (x / box.width) * 100;
        const glareY = (y / box.height) * 100;
        glare.style.transform = `translate(${glareX}%, ${glareY}%) translate(-50%, -50%)`;
        glare.style.opacity = '0.8';
        glare.style.transition = 'opacity 0.3s ease';
    }
    
    // Spotlight effect
    if(spotlight) {
        const spotlightX = (x / box.width) * 100;
        const spotlightY = (y / box.height) * 100;
        spotlight.style.transform = `translate(${spotlightX}%, ${spotlightY}%) translate(-50%, -50%)`;
        spotlight.style.opacity = '0.6';
    }
}

function resetTwin(container) {
    const card = container.querySelector('.digital-twin');
    const glare = container.querySelector('.twin-glare');
    const spotlight = container.querySelector('.spotlight');
    
    if(card) {
        card.style.transform = 'perspective(1500px) rotateX(0) rotateY(0) scale(1) translateZ(0)';
        card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
    }
    
    if(glare) {
        glare.style.opacity = '0';
        glare.style.transform = 'translate(50%, 50%) translate(-50%, -50%)';
        glare.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    }
    
    if(spotlight) {
        spotlight.style.opacity = '0';
        spotlight.style.transform = 'translate(50%, 50%) translate(-50%, -50%)';
    }
}

function flipCard(container) {
    const inner = container.querySelector('.twin-inner');
    const card = container.querySelector('.digital-twin');
    
    if (inner) {
        const isFlipped = inner.classList.contains('flipped');
        
        // Premium flip animation with sound feedback (optional)
        if (!isFlipped) {
            inner.classList.add('flipped');
            // Add haptic feedback on mobile if available
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        } else {
            inner.classList.remove('flipped');
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        }
        
        // Reset tilt after flip
        if (card) {
            setTimeout(() => {
                resetTwin(container);
            }, 800);
        }
    }
}

// Touch event handlers for mobile
document.addEventListener('DOMContentLoaded', () => {
    // Add touch event listeners to all image boxes
    document.addEventListener('touchstart', (e) => {
        const imageBox = e.target.closest('.row-image-box');
        if (imageBox) {
            tiltTwin(e, imageBox);
        }
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
        const imageBox = e.target.closest('.row-image-box');
        if (imageBox) {
            tiltTwin(e, imageBox);
        }
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        const imageBox = e.target.closest('.row-image-box');
        if (imageBox) {
            resetTwin(imageBox);
        }
    }, { passive: true });
});

/* =========================================
   5. CART & COUPONS (Restored)
   ========================================= */
function addToCart(id) {
    const product = products.find(p => p.id === id);
    if(!product) return;
    
    // Use unified cart storage
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    let item = cart.find(i => i.id === id && !i.designJson);
    
    if(item) {
        item.qty = (item.qty || 1) + 1;
    } else {
        const cartImg = (product.image && product.image !== '') ? product.image : 'https://via.placeholder.com/80?text=TAPD';
        cart.push({ 
            id: product.id, title: product.name, price: product.price, image: cartImg, qty: 1 
        });
    }
    
    localStorage.setItem('taptCart', JSON.stringify(cart));
    updateCartCount();
    
    const drawer = document.getElementById('cart-drawer');
    if(!drawer.classList.contains('open')) toggleCart(); 
    else renderCartItems();
}

function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    const badge = document.getElementById('cart-count');
    if(badge) { 
        const count = cart.reduce((a, c) => a + (c.qty || 1), 0);
        badge.textContent = count; 
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
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    let subtotal = cart.reduce((a, c) => a + (c.price * (c.qty || 1)), 0);
    
    container.innerHTML = '';
    
    if(cart.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; margin-top:120px; opacity:0.6;">
                <i class="fa-solid fa-microchip" style="font-size:3rem; margin-bottom:20px; color:#333;"></i>
                <h3 style="font-family:'Syncopate', sans-serif; font-size:1rem; margin-bottom:5px; color:white;">NO HARDWARE</h3>
                <p style="font-family:'Inter', sans-serif; color:#666; font-size:0.8rem;">Inventory scan required.</p>
                <button onclick="toggleCart()" style="margin-top:20px; background:transparent; border:1px solid #D4AF37; color:#D4AF37; padding:10px 20px; cursor:pointer; font-family:'JetBrains Mono', monospace; font-size:0.7rem;">INITIATE BROWSE</button>
            </div>
        `;
        totalEl.textContent = "₹0";
        return;
    }

    cart.forEach((item) => {
        const itemName = item.title || item.name;
        const itemImg = item.image || item.img;
        const itemQty = item.qty || 1;
        const itemId = item.id;
        const itemPrice = item.price || 0;
        
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.style.cssText = 'display:flex; gap:15px; margin-bottom:15px; padding:15px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:10px; position:relative;';
        itemEl.innerHTML = `
            <img src="${itemImg}" style="width:60px; height:60px; object-fit:cover; border-radius:6px; border:1px solid #333;" alt="${itemName}">
            <div style="flex:1;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="margin:0; font-size:0.8rem; color:white; font-family:\'Syncopate\', sans-serif;">${itemName}</h4>
                    <span onclick="removeItem('${itemId}')" style="cursor:pointer; color:#666; font-size:1.2rem; position:absolute; top:10px; right:10px;">&times;</span>
                </div>
                <p style="color:#D4AF37; font-size:0.8rem; margin-top:5px; font-family:\'JetBrains Mono\', monospace;">₹${itemPrice}</p>
                <div class="qty-controls" style="display:flex; align-items:center; gap:10px; margin-top:8px; background:rgba(0,0,0,0.3); padding:4px 8px; border-radius:20px; width:fit-content;">
                    <button class="qty-btn" onclick="updateCartQty('${itemId}', -1)" style="background:none; border:none; color:white; cursor:pointer; width:24px; height:24px; display:flex; align-items:center; justify-content:center;">-</button>
                    <span style="font-size:0.9rem; min-width:20px; text-align:center;">${itemQty}</span>
                    <button class="qty-btn" onclick="updateCartQty('${itemId}', 1)" style="background:none; border:none; color:white; cursor:pointer; width:24px; height:24px; display:flex; align-items:center; justify-content:center;">+</button>
                </div>
            </div>
        `;
        container.appendChild(itemEl);
    });
    
    let final = subtotal - appliedDiscount;
    totalEl.textContent = "₹" + (final > 0 ? Math.floor(final) : 0);
}

function updateCartQty(id, change) {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    const item = cart.find(i => i.id == id);
    if(item) {
        item.qty = (item.qty || 1) + change;
        if(item.qty <= 0) {
            cart = cart.filter(i => i.id != id);
        }
        localStorage.setItem('taptCart', JSON.stringify(cart));
        renderCartItems();
        updateCartCount();
    }
}

function removeItem(id) {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    cart = cart.filter(i => i.id != id);
    localStorage.setItem('taptCart', JSON.stringify(cart));
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
            let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
            if(cart.length === 0) return alert("Cart is empty");

            let subtotal = cart.reduce((a, c) => a + (c.price * (c.qty || 1)), 0);
            
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
            loadAccountDashboard(user);
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

/* =========================================
   COMPLETE ACCOUNT SYSTEM
   ========================================= */
let currentAccountView = 'dashboard';

function loadAccountDashboard(user) {
    const drawerContent = document.getElementById('account-content');
    currentAccountView = 'dashboard';
    
    // Fetch user orders
    fetchUserOrders(user.uid).then(orders => {
        drawerContent.innerHTML = `
            <div class="account-dashboard">
                <div class="account-header">
                    <div class="account-avatar-large">
                        ${user.photoURL ? `<img src="${user.photoURL}" alt="Avatar">` : `<div class="avatar-initial">${user.email[0].toUpperCase()}</div>`}
                    </div>
                    <div class="account-info">
                        <h2 class="account-name">${user.displayName || 'MEMBER'}</h2>
                        <p class="account-email">${user.email}</p>
                        <div class="account-badge">
                            <i class="fa-solid fa-shield-check"></i>
                            VERIFIED MEMBER
                        </div>
                    </div>
                </div>
                
                <div class="account-nav-tabs">
                    <button class="account-tab active" onclick="showAccountView('dashboard', '${user.uid}')">
                        <i class="fa-solid fa-house"></i> Dashboard
                    </button>
                    <button class="account-tab" onclick="showAccountView('orders', '${user.uid}')">
                        <i class="fa-solid fa-box"></i> Orders <span class="tab-badge">${orders.length}</span>
                    </button>
                    <button class="account-tab" onclick="showAccountView('addresses', '${user.uid}')">
                        <i class="fa-solid fa-location-dot"></i> Addresses
                    </button>
                    <button class="account-tab" onclick="showAccountView('settings', '${user.uid}')">
                        <i class="fa-solid fa-gear"></i> Settings
                    </button>
                </div>
                
                <div class="account-view-content">
                    ${renderAccountDashboard(orders)}
                </div>
                
                <div class="account-footer-actions">
                    <button class="btn-account-secondary" onclick="logout()">
                        <i class="fa-solid fa-sign-out"></i> LOGOUT
                    </button>
                </div>
            </div>
        `;
    });
}

function renderAccountDashboard(orders) {
    const recentOrders = orders.slice(0, 3);
    const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    return `
        <div class="dashboard-stats">
            <div class="stat-card-account">
                <div class="stat-icon-account"><i class="fa-solid fa-box"></i></div>
                <div class="stat-info-account">
                    <div class="stat-value-account">${orders.length}</div>
                    <div class="stat-label-account">Total Orders</div>
                </div>
            </div>
            <div class="stat-card-account">
                <div class="stat-icon-account"><i class="fa-solid fa-indian-rupee-sign"></i></div>
                <div class="stat-info-account">
                    <div class="stat-value-account">₹${totalSpent.toLocaleString()}</div>
                    <div class="stat-label-account">Total Spent</div>
                </div>
            </div>
        </div>
        
        <div class="recent-orders-section">
            <h3 class="section-title-account">RECENT ORDERS</h3>
            ${recentOrders.length > 0 ? `
                <div class="orders-list">
                    ${recentOrders.map(order => renderOrderCard(order)).join('')}
                </div>
            ` : `
                <div class="empty-state">
                    <i class="fa-solid fa-box-open" style="font-size:3rem; color:#333; margin-bottom:15px;"></i>
                    <p style="color:#666;">No orders yet</p>
                    <button class="btn-account-primary" onclick="window.location.href='shop.html'">START SHOPPING</button>
                </div>
            `}
        </div>
    `;
}

function renderOrderCard(order) {
    const statusColors = {
        'pending': '#D4AF37',
        'processing': '#2196F3',
        'shipped': '#9C27B0',
        'delivered': '#4CAF50',
        'cancelled': '#F44336'
    };
    
    const status = order.status || 'pending';
    const date = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
    
    return `
        <div class="order-card" onclick="viewOrderDetails('${order.id}')">
            <div class="order-header">
                <div class="order-id">#${order.id.substring(0,8).toUpperCase()}</div>
                <div class="order-status" style="background:${statusColors[status] || '#666'}20; color:${statusColors[status] || '#666'}; border:1px solid ${statusColors[status] || '#666'}40;">
                    ${status.toUpperCase()}
                </div>
            </div>
            <div class="order-info">
                <div class="order-date"><i class="fa-solid fa-calendar"></i> ${date}</div>
                <div class="order-total">₹${order.total || 0}</div>
            </div>
            <div class="order-items-preview">
                ${order.items && order.items.slice(0, 2).map(item => `
                    <div class="order-item-preview">
                        <span>${item.name} x${item.qty}</span>
                    </div>
                `).join('')}
                ${order.items && order.items.length > 2 ? `<div class="order-item-more">+${order.items.length - 2} more</div>` : ''}
            </div>
        </div>
    `;
}

async function fetchUserOrders(userId) {
    try {
        // First try with userId query
        let ordersSnapshot = await store.collection('orders')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
        
        // If no results, also check email (for legacy orders)
        if (ordersSnapshot.empty) {
            const user = auth.currentUser;
            if (user && user.email) {
                ordersSnapshot = await store.collection('orders')
                    .where('email', '==', user.email)
                    .orderBy('date', 'desc')
                    .limit(20)
                    .get();
            }
        }
        
        return ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching orders:', error);
        // Fallback: try without orderBy
        try {
            const ordersSnapshot = await store.collection('orders')
                .where('userId', '==', userId)
                .limit(20)
                .get();
            return ordersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (e) {
            return [];
        }
    }
}

function showAccountView(view, userId) {
    currentAccountView = view;
    
    // Update active tab
    document.querySelectorAll('.account-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    if (event && event.target.closest('.account-tab')) {
        event.target.closest('.account-tab').classList.add('active');
    }
    
    const contentArea = document.querySelector('.account-view-content');
    
    switch(view) {
        case 'dashboard':
            fetchUserOrders(userId).then(orders => {
                contentArea.innerHTML = renderAccountDashboard(orders);
            });
            break;
        case 'orders':
            loadAllOrders(userId);
            break;
        case 'addresses':
            loadAddresses(userId);
            break;
        case 'settings':
            loadSettings(userId);
            break;
    }
}

function loadAllOrders(userId) {
    const contentArea = document.querySelector('.account-view-content');
    contentArea.innerHTML = '<div style="text-align:center; padding:40px;"><div class="loading-text">LOADING ORDERS...</div></div>';
    
    fetchUserOrders(userId).then(orders => {
        if (orders.length === 0) {
            contentArea.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-box-open" style="font-size:3rem; color:#333; margin-bottom:15px;"></i>
                    <p style="color:#666;">No orders found</p>
                    <button class="btn-account-primary" onclick="window.location.href='shop.html'">START SHOPPING</button>
                </div>
            `;
        } else {
            contentArea.innerHTML = `
                <div class="orders-list-full">
                    ${orders.map(order => renderOrderCard(order)).join('')}
                </div>
            `;
        }
    });
}

function loadAddresses(userId) {
    const contentArea = document.querySelector('.account-view-content');
    
    // Fetch addresses from Firestore
    store.collection('users').doc(userId).get().then(doc => {
        const userData = doc.data();
        const addresses = userData?.addresses || [];
        
        contentArea.innerHTML = `
            <div class="addresses-section">
                <button class="btn-account-primary" onclick="openAddressModal('add')" style="margin-bottom:30px;">
                    <i class="fa-solid fa-plus"></i> ADD NEW ADDRESS
                </button>
                <div class="addresses-list">
                    ${addresses.length > 0 ? addresses.map((addr, index) => renderAddressCard(addr, index)).join('') : `
                        <div class="empty-state">
                            <i class="fa-solid fa-location-dot" style="font-size:3rem; color:#333; margin-bottom:15px;"></i>
                            <p style="color:#666;">No addresses saved</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    });
}

function renderAddressCard(address, index) {
    return `
        <div class="address-card">
            <div class="address-header">
                <h4>${address.name || 'Address ' + (index + 1)}</h4>
                ${address.isDefault ? '<span class="default-badge">DEFAULT</span>' : ''}
            </div>
            <div class="address-details">
                <p>${address.street || ''}</p>
                <p>${address.city || ''}, ${address.state || ''} ${address.pincode || ''}</p>
                <p>${address.phone || ''}</p>
            </div>
            <div class="address-actions">
                <button class="btn-address-action" onclick="editAddress(${index})">Edit</button>
                <button class="btn-address-action" onclick="deleteAddress(${index})">Delete</button>
                ${!address.isDefault ? `<button class="btn-address-action" onclick="setDefaultAddress(${index})">Set Default</button>` : ''}
            </div>
        </div>
    `;
}

function loadSettings(userId) {
    const contentArea = document.querySelector('.account-view-content');
    
    store.collection('users').doc(userId).get().then(doc => {
        const userData = doc.data() || {};
        const auth = firebase.auth();
        const user = auth.currentUser;
        
        contentArea.innerHTML = `
            <div class="settings-section">
                <div class="settings-group">
                    <h3 class="settings-title">PROFILE INFORMATION</h3>
                    <div class="setting-item">
                        <label>Display Name</label>
                        <input type="text" id="displayName" value="${user.displayName || ''}" class="setting-input">
                    </div>
                    <div class="setting-item">
                        <label>Email</label>
                        <input type="email" id="userEmail" value="${user.email || ''}" class="setting-input" disabled>
                    </div>
                    <button class="btn-account-primary" onclick="updateProfile()">SAVE CHANGES</button>
                </div>
                
                <div class="settings-group">
                    <h3 class="settings-title">NOTIFICATIONS</h3>
                    <div class="setting-toggle">
                        <label>Order Updates</label>
                        <label class="toggle-switch">
                            <input type="checkbox" ${userData.notifications?.orders !== false ? 'checked' : ''} onchange="updateNotificationSetting('orders', this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-toggle">
                        <label>Promotional Emails</label>
                        <label class="toggle-switch">
                            <input type="checkbox" ${userData.notifications?.promotions !== false ? 'checked' : ''} onchange="updateNotificationSetting('promotions', this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-group">
                    <h3 class="settings-title">DANGER ZONE</h3>
                    <button class="btn-account-danger" onclick="deleteAccount()">
                        <i class="fa-solid fa-trash"></i> DELETE ACCOUNT
                    </button>
                </div>
            </div>
        `;
    });
}

function updateProfile() {
    const auth = firebase.auth();
    const user = auth.currentUser;
    const displayName = document.getElementById('displayName').value;
    
    user.updateProfile({ displayName }).then(() => {
        alert('Profile updated successfully!');
        loadAccountDashboard(user);
    }).catch(error => {
        alert('Error updating profile: ' + error.message);
    });
}

function updateNotificationSetting(type, enabled) {
    const auth = firebase.auth();
    const user = auth.currentUser;
    
    store.collection('users').doc(user.uid).set({
        notifications: {
            [type]: enabled
        }
    }, { merge: true });
}

function viewOrderDetails(orderId) {
    store.collection('orders').doc(orderId).get().then(doc => {
        if (doc.exists) {
            const order = { id: doc.id, ...doc.data() };
            // Open order details modal or navigate to order page
            alert(`Order Details:\nStatus: ${order.status}\nTotal: ₹${order.total}\nItems: ${order.items?.length || 0}`);
        }
    });
}

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        const auth = firebase.auth();
        const user = auth.currentUser;
        user.delete().then(() => {
            logout();
        }).catch(error => {
            alert('Error deleting account: ' + error.message);
        });
    }
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

function filterProducts(type, button) {
    // Premium button animation
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.transition = 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)';
        btn.style.transform = 'scale(1)';
    });
    
    if (button) {
        button.classList.add('active');
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    }
    
    // Haptic feedback on mobile
    if (navigator.vibrate) {
        navigator.vibrate(15);
    }
    
    // Clear search input when filtering
    const searchInput = document.getElementById('shop-search');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Re-render with filter using premium animation
    renderShop(type);
}

function searchProducts() {
    const term = document.getElementById('shop-search').value.toLowerCase();
    const rows = document.querySelectorAll('.shop-row');
    let visibleCount = 0;
    
    rows.forEach((row, index) => {
        const title = row.querySelector('.row-title')?.innerText.toLowerCase() || '';
        const desc = row.querySelector('.row-desc')?.innerText.toLowerCase() || '';
        const matches = title.includes(term) || desc.includes(term);
        
        if (matches) {
            row.classList.remove('filtered-out');
            row.style.display = 'flex';
            // Staggered reveal animation
            setTimeout(() => {
                row.style.opacity = '1';
                row.style.transform = 'translateY(0) scale(1)';
                row.style.filter = 'blur(0)';
            }, visibleCount * 50);
            visibleCount++;
        } else {
            // Premium fade-out animation
            row.style.transition = 'opacity 0.4s ease, transform 0.4s ease, filter 0.4s ease';
            row.style.opacity = '0';
            row.style.transform = 'translateY(-20px) scale(0.95)';
            row.style.filter = 'blur(5px)';
            
            setTimeout(() => {
                row.classList.add('filtered-out');
            }, 400);
        }
    });
    
    // Show no results message if needed
    const container = document.getElementById('shop-grid');
    let noResultsMsg = container.querySelector('.no-results-msg');
    
    if (visibleCount === 0 && term !== '') {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-results-msg';
            noResultsMsg.style.cssText = 'text-align:center; padding:80px 20px; color:#666; font-family:var(--font-tech); opacity:0; transition:opacity 0.5s ease;';
            noResultsMsg.innerHTML = `
                <i class="fa-solid fa-magnifying-glass" style="font-size:3rem; margin-bottom:20px; color:#333;"></i>
                <h3 style="font-family:var(--font-head); color:#888; margin-bottom:10px;">NO MATCHES FOUND</h3>
                <p style="font-size:0.8rem; color:#555;">Try a different search term</p>
            `;
            container.appendChild(noResultsMsg);
        }
        setTimeout(() => {
            noResultsMsg.style.opacity = '1';
        }, 500);
    } else {
        if (noResultsMsg) {
            noResultsMsg.style.opacity = '0';
            setTimeout(() => {
                if (noResultsMsg && noResultsMsg.parentNode) {
                    noResultsMsg.parentNode.removeChild(noResultsMsg);
                }
            }, 500);
        }
    }
}

function toggleFaq(el) { 
    el.classList.toggle('active'); 
}

/* =========================================
   8. PREMIUM ANIMATED COUNTERS
   ========================================= */
function initAnimatedCounters() {
    const counters = document.querySelectorAll('.stat-number-large, .stat-number');
    
    const animateCounter = (counter, target, duration = 2000) => {
        const isDecimal = target % 1 !== 0;
        const increment = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                if (isDecimal) {
                    counter.textContent = current.toFixed(1);
                } else {
                    counter.textContent = Math.floor(current).toLocaleString();
                }
                requestAnimationFrame(updateCounter);
            } else {
                if (isDecimal) {
                    counter.textContent = target.toFixed(1);
                } else {
                    counter.textContent = target.toLocaleString();
                }
            }
        };
        
        updateCounter();
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                entry.target.dataset.animated = 'true';
                const target = parseFloat(entry.target.dataset.target || entry.target.textContent) || 0;
                animateCounter(entry.target, target, 2500);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => {
        const target = counter.dataset.target || counter.textContent;
        counter.textContent = '0';
        if (target) {
            counter.dataset.target = target;
            observer.observe(counter);
        }
    });
}

/* =========================================
   9. PREMIUM PARALLAX EFFECTS
   ========================================= */
function initParallaxEffects() {
    const parallaxElements = document.querySelectorAll('.hero-3d-bg, .featured-3d-container, .stats-3d-bg, .testimonials-3d-bg');
    
    const handleParallax = () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * 0.5;
        
        parallaxElements.forEach((element, index) => {
            const speed = 0.1 + (index * 0.05);
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    };
    
    // Throttle scroll events for performance
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleParallax();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
    
    // Parallax on featured card 3D
    const featuredCard = document.querySelector('.featured-card-3d');
    if (featuredCard) {
        const featuredContainer = featuredCard.closest('.featured-product-3d');
        if (featuredContainer) {
            featuredContainer.addEventListener('mousemove', (e) => {
                const rect = featuredContainer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;
                
                featuredCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
            });
            
            featuredContainer.addEventListener('mouseleave', () => {
                featuredCard.style.transform = '';
            });
        }
    }
}
