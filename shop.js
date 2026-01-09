/* --- JAVASCRIPT LOGIC --- */

        // 1. FIREBASE CONFIGURATION
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

        document.addEventListener('DOMContentLoaded', () => {
            fetchProducts();
            updateCartCount();
            initAuthListener();
            
            // Scroll Animation Observer
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('active'); });
            }, { threshold: 0.1 });
            setInterval(() => { document.querySelectorAll('.reveal, .reveal-row').forEach(el => observer.observe(el)); }, 500);
        });

        // --- FETCH PRODUCTS ---
        function fetchProducts() {
            const grid = document.getElementById('shop-grid');
            if(grid) grid.innerHTML = '<div class="loading-text" style="width:100%; text-align:center; color:#666;">Loading Legacy...</div>';

            store.collection('products').get().then((snap) => {
                products = []; 
                grid.innerHTML = ''; 

                snap.forEach((doc) => {
                    let data = doc.data();
                    let pImage = ''; // Default to empty so Twin Engine takes over if no image
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
                grid.innerHTML = "<p style='text-align:center; color:red;'>Failed to load products.</p>";
            });
        }

        // --- RENDER (DIGITAL TWIN ENGINE) ---
        function renderShop(filter = 'all') {
            const container = document.getElementById('shop-grid');
            if (!container) return;

            container.innerHTML = '';
            let visibleCount = 0;

            products.forEach(product => {
                // Smart Filter: Detect if it's a "Tag" or "Card"
                let pType = 'card'; 
                if (product.name.toLowerCase().includes('tag') || product.category.toLowerCase().includes('tag')) {
                    pType = 'tag';
                }
                
                if (filter !== 'all' && pType !== filter) return;

                const reverseClass = visibleCount % 2 !== 0 ? 'reverse' : '';
                const row = document.createElement('div');
                row.className = `shop-row reveal-row ${reverseClass}`;
                
                // 1. Determine Shape Class
                const shapeClass = pType === 'tag' ? 'shape-tag' : 'shape-card';
                
                // 2. Determine Background
                const bgStyle = product.image && !product.image.includes('placeholder') 
                    ? `background-image: url('${product.image}');` 
                    : `background: #111;`;

                // 3. Branding (Show Chip/Logo only if no custom image)
                let brandingHTML = '';
                if (!product.image || product.image.includes('placeholder') || product.image === '') {
                     brandingHTML = `
                        <div class="twin-layer twin-branding">
                            ${pType === 'card' ? '<div class="chip"></div>' : '<div></div>'} 
                            <div class="twin-logo">TAPD.</div>
                        </div>
                     `;
                }

                // TWIN HTML
                row.innerHTML = `
                    <div class="row-image-box" onmousemove="tiltTwin(event, this)" onmouseleave="resetTwin(this)" onclick="viewProduct('${product.id}')">
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

        // --- TWIN INTERACTION (TILT) ---
        function tiltTwin(e, container) {
            const card = container.querySelector('.digital-twin');
            const glare = container.querySelector('.twin-glare');
            
            const box = container.getBoundingClientRect();
            const x = e.clientX - box.left - box.width / 2;
            const y = e.clientY - box.top - box.height / 2;
            
            // Rotate the 3D Object
            const rotateX = -y / 15;
            const rotateY = x / 15;
            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
            
            // Move Glare
            glare.style.transform = `translate(${x}px, ${y}px)`;
            glare.style.opacity = '1';
        }

        function resetTwin(container) {
            const card = container.querySelector('.digital-twin');
            const glare = container.querySelector('.twin-glare');
            
            card.style.transform = `rotateX(0) rotateY(0) scale(1)`;
            glare.style.opacity = '0';
        }

        // --- AUTH ---
        function initAuthListener() {
            auth.onAuthStateChanged(user => {
                if (user) {
                    updateUserUI(user);
                    toggleAuthModal(false); 
                } else {
                    resetUserUI();
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
                    if(confirm("Create account?")) auth.createUserWithEmailAndPassword(email, pass);
                } else {
                    document.getElementById('auth-error').innerText = err.message;
                    document.getElementById('auth-error').style.display = 'block';
                }
            });
        }
        function logout() { auth.signOut(); toggleAccount(); }
        function updateUserUI(user) {
            document.getElementById('user-icon-trigger').classList.add('active');
            document.getElementById('account-content').innerHTML = `
                <div class="user-profile">
                    <div class="user-avatar">${user.photoURL ? `<img src="${user.photoURL}" style="width:100%;height:100%;border-radius:50%">` : user.email[0].toUpperCase()}</div>
                    <div class="user-name">${user.displayName || 'Legacy Member'}</div>
                    <div class="user-email">${user.email}</div>
                    <button class="logout-btn" onclick="logout()">LOGOUT</button>
                </div>
            `;
        }
        function resetUserUI() {
            document.getElementById('user-icon-trigger').classList.remove('active');
            document.getElementById('account-content').innerHTML = `<div style="padding:40px; text-align:center;"><p style="color:#888;">Access your legacy.</p><button class="btn-buy" onclick="toggleAuthModal(true)">LOGIN</button></div>`;
        }

        // --- COUPONS ---
        async function applyCoupon() {
            const code = document.getElementById('coupon-code').value.toUpperCase().trim();
            if (!code) return;
            try {
                const doc = await store.collection('coupons').doc(code).get();
                if (doc.exists) {
                    const data = doc.data();
                    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
                    let subtotal = cart.reduce((a, c) => a + (c.price * c.qty), 0);
                    appliedDiscount = data.type === 'percentage' ? (subtotal * data.value) / 100 : data.value;
                    renderCartItems();
                    document.getElementById('celebration-overlay').classList.add('active');
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                } else {
                    alert("Invalid Coupon");
                }
            } catch (err) { console.error(err); }
        }
        function closeCelebration() { document.getElementById('celebration-overlay').classList.remove('active'); }

        // --- CART ---
        function addToCart(id) {
            const product = products.find(p => p.id === id);
            if(!product) return;
            let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
            let item = cart.find(i => i.id === id);
            if(item) item.qty++;
            else cart.push({ id: product.id, name: product.name, price: product.price, img: product.image, qty: 1 });
            localStorage.setItem('TAPDCart', JSON.stringify(cart));
            updateCartCount();
            toggleCart(); 
        }
        function renderCartItems() {
            const container = document.getElementById('cart-items-container');
            const totalEl = document.getElementById('cart-total');
            const subtotalEl = document.getElementById('cart-subtotal');
            const discountRow = document.getElementById('discount-row');
            let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
            let subtotal = cart.reduce((a, c) => a + (c.price * c.qty), 0);
            container.innerHTML = '';
            
            if(cart.length === 0) {
                container.innerHTML = "<p style='color:#666; text-align:center; margin-top:50px;'>Bag is empty.</p>";
                subtotalEl.innerText = "₹0"; totalEl.innerText = "₹0";
                return;
            }

            cart.forEach((item, idx) => {
                container.innerHTML += `
                    <div class="cart-item">
                        <img src="${item.img ? item.img : 'https://via.placeholder.com/80?text=TAPD'}">
                        <div style="flex:1;">
                            <div style="display:flex; justify-content:space-between;">
                                <h4 style="margin:0; font-size:0.9rem;">${item.name}</h4>
                                <span onclick="removeItem(${idx})" style="cursor:pointer; color:#ff4444;">&times;</span>
                            </div>
                            <p style="color:var(--gold); font-size:0.8rem;">₹${item.price} x ${item.qty}</p>
                        </div>
                    </div>
                `;
            });
            
            let final = subtotal - appliedDiscount;
            subtotalEl.innerText = "₹" + subtotal;
            totalEl.innerText = "₹" + (final > 0 ? Math.floor(final) : 0);
            
            if(appliedDiscount > 0) {
                discountRow.style.display = 'flex';
                document.getElementById('cart-discount').innerText = "-₹" + Math.floor(appliedDiscount);
            }
        }
        function removeItem(idx) {
            let cart = JSON.parse(localStorage.getItem('TAPDCart'));
            cart.splice(idx, 1);
            localStorage.setItem('TAPDCart', JSON.stringify(cart));
            if(cart.length === 0) appliedDiscount = 0;
            renderCartItems();
            updateCartCount();
        }
        function updateCartCount() {
            let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
            const badge = document.getElementById('cart-count');
            if(badge) { badge.innerText = cart.reduce((a, c) => a + c.qty, 0); badge.style.display = badge.innerText > 0 ? 'flex' : 'none'; }
        }

        // --- UTILS ---
        function toggleCart() {
            const drawer = document.getElementById('cart-drawer');
            const overlay = document.querySelector('.cart-overlay');
            if(drawer.classList.contains('open')) { drawer.classList.remove('open'); overlay.style.display = 'none'; }
            else { renderCartItems(); drawer.classList.add('open'); overlay.style.display = 'block'; }
        }
        function toggleAccount() {
            const drawer = document.getElementById('account-drawer');
            const overlay = document.querySelector('.cart-overlay');
            if(drawer.classList.contains('open')) { drawer.classList.remove('open'); overlay.style.display = 'none'; }
            else { drawer.classList.add('open'); overlay.style.display = 'block'; }
        }
        function handleUserClick() { toggleAccount(); }
        function toggleAuthModal(forceState) {
            const modal = document.getElementById('auth-modal');
            const overlay = document.querySelector('.cart-overlay');
            if (typeof forceState !== 'undefined') {
                modal.style.display = forceState ? 'block' : 'none';
                overlay.style.display = forceState ? 'block' : 'none';
            } else {
                modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
                overlay.style.display = modal.style.display;
            }
        }
        function closeAllDrawers() {
            document.getElementById('cart-drawer').classList.remove('open');
            document.getElementById('account-drawer').classList.remove('open');
            document.getElementById('auth-modal').style.display = 'none';
            document.querySelector('.cart-overlay').style.display = 'none';
        }
        function viewProduct(id) { window.location.href = `product.html?id=${id}`; }
        function filterProducts(cat, btn) {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderShop(cat);
        }
        function searchProducts() {
            const term = document.getElementById('shop-search').value.toLowerCase();
            document.querySelectorAll('.shop-row').forEach(row => {
                const title = row.querySelector('.row-title').innerText.toLowerCase();
                row.style.display = title.includes(term) ? 'flex' : 'none';
            });
        }
        function toggleFaq(el) { el.classList.toggle('active'); }
