document.addEventListener('DOMContentLoaded', () => {
    
    /* =========================================
       1. GLOBAL UI (PRELOADER & CURSOR)
       ========================================= */
    
    // --- Preloader ---
    const preloader = document.querySelector('.preloader');
    if(preloader) {
        // Force scroll to top on load
        window.scrollTo(0, 0);
        
        setTimeout(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 1500); // 1.5 seconds delay
    }

    // --- Custom Cursor ---
    const cursorDot = document.querySelector('[data-cursor-dot]');
    const cursorOutline = document.querySelector('[data-cursor-outline]');

    if (cursorDot && cursorOutline) {
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            // Dot follows instantly
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            // Outline follows with slight delay
            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        });

        // Hover Effects (Grow cursor on interactive elements)
        const interactiveElements = document.querySelectorAll('a, button, input, select, .cart-trigger, .product-card');
        
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorOutline.style.transform = 'translate(-50%, -50%) scale(1.5)';
                cursorOutline.style.backgroundColor = 'rgba(212, 175, 55, 0.1)'; // Slight gold tint
            });
            el.addEventListener('mouseleave', () => {
                cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
                cursorOutline.style.backgroundColor = 'transparent';
            });
        });
    }

    /* =========================================
       2. CART SYSTEM
       ========================================= */
    
    // Cart Data
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    const cartDrawer = document.querySelector('.cart-drawer');
    const cartOverlay = document.querySelector('.cart-overlay');
    const cartCountBadge = document.getElementById('cart-count');

    // --- Toggle Cart Function ---
    window.toggleCart = function() {
        if(cartDrawer && cartOverlay) {
            cartDrawer.classList.toggle('open');
            cartOverlay.classList.toggle('open');
        }
    };

    // --- Add to Cart Function ---
    window.addToCart = function(id, title, price, image) {
        const existingItem = cart.find(item => item.id === id);
        
        if (existingItem) {
            existingItem.qty++;
        } else {
            cart.push({ id, title, price, image, qty: 1 });
        }
        
        updateCartUI();
        toggleCart(); // Open cart to show user
    };

    // --- Update Quantity ---
    window.updateQty = function(id, change) {
        const item = cart.find(item => item.id === id);
        if (!item) return;

        item.qty += change;

        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        updateCartUI();
    };

    // --- Update UI (Render HTML) ---
    function updateCartUI() {
        // Save to local storage
        localStorage.setItem('taptCart', JSON.stringify(cart));

        // Update Badge
        const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
        if(cartCountBadge) {
            cartCountBadge.textContent = totalCount;
            cartCountBadge.style.display = totalCount > 0 ? 'flex' : 'none';
        }

        // Render Items in Drawer
        const container = document.getElementById('cart-items-container');
        if(container) {
            if (cart.length === 0) {
                container.innerHTML = '<div class="empty-msg" style="color:black;">Your cart is empty.</div>';
            } else {
                container.innerHTML = cart.map(item => `
                    <div class="cart-item" style="display:flex; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                        <div style="width:60px; height:60px; background:#333; border-radius:8px; margin-right:15px; display:flex; align-items:center; justify-content:center;">
                            <i class="fa-solid fa-credit-card" style="color:white;"></i>
                        </div>
                        <div style="flex:1;">
                            <h4 style="font-size:0.9rem; margin-bottom:5px; color:black;">${item.title}</h4>
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-weight:bold; color:black;">₹${item.price}</span>
                                <div style="display:flex; gap:10px; align-items:center; background:#eee; padding:2px 8px; border-radius:5px;">
                                    <button onclick="updateQty(${item.id}, -1)" style="border:none; background:none; cursor:pointer; font-size:1.2rem;">-</button>
                                    <span style="font-size:0.9rem;">${item.qty}</span>
                                    <button onclick="updateQty(${item.id}, 1)" style="border:none; background:none; cursor:pointer; font-size:1.2rem;">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Update Totals
        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const subtotalEl = document.getElementById('subtotal-price');
        const totalEl = document.getElementById('total-price');

        if(subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString()}`;
        if(totalEl) totalEl.textContent = `₹${subtotal.toLocaleString()}`;
    }

    // Initialize Cart on Load
    updateCartUI();


    /* =========================================
       3. CUSTOMIZER LOGIC (Create Page)
       ========================================= */
    const themeSelect = document.getElementById('c-theme');
    const previewCard = document.getElementById('p-card');
    const nameInput = document.getElementById('c-name');
    const previewName = document.getElementById('p-name');
    const roleInput = document.getElementById('c-role');
    const previewRole = document.getElementById('p-role');
    const logoInput = document.getElementById('c-logo-upload');
    const previewLogo = document.getElementById('p-logo-preview');
    const addToCartBtn = document.querySelector('.builder-controls .filter-btn'); // The Add Button

    if (themeSelect && previewCard) {
        // Theme Changer
        themeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'black') {
                previewCard.classList.remove('skin-white');
                previewCard.classList.add('skin-black');
            } else {
                previewCard.classList.remove('skin-black');
                previewCard.classList.add('skin-white');
            }
        });

        // Name Live Update
        nameInput.addEventListener('input', (e) => {
            previewName.textContent = e.target.value || 'YOUR NAME';
        });

        // Role Live Update
        roleInput.addEventListener('input', (e) => {
            previewRole.textContent = e.target.value || 'DESIGNATION';
        });

        // Logo Upload
        logoInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewLogo.src = e.target.result;
                    previewLogo.style.display = 'block';
                }
                reader.readAsDataURL(file);
            }
        });

        // Add Custom Card to Cart
        if(addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                const customPrice = 1999; // Or dynamic price
                const customName = `Custom Card (${themeSelect.value})`;
                // Use current timestamp as unique ID
                addToCart(Date.now(), customName, customPrice, null);
            });
        }
    }


    /* =========================================
       4. 3D TILT EFFECT
       ========================================= */
    const stages = document.querySelectorAll('.card-stage, .card-3d-wrapper');
    
    stages.forEach(stage => {
        stage.addEventListener('mousemove', (e) => {
            // Find the actual card element (handle both customize and shop structures)
            const card = stage.querySelector('.tapt-card') || stage.querySelector('.p-image');
            if(!card) return;

            const rect = stage.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calculate rotation
            const xRotation = -((y - rect.height / 2) / 15);
            const yRotation = (x - rect.width / 2) / 15;

            // Apply transform
            card.style.transform = `rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale(1.02)`;
        });

        stage.addEventListener('mouseleave', () => {
            const card = stage.querySelector('.tapt-card') || stage.querySelector('.p-image');
            if(!card) return;
            
            // Reset
            card.style.transform = `rotateX(0) rotateY(0) scale(1)`;
        });
    });

});
