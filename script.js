/* =========================================
   1. GLOBAL HELPERS & PRELOADER
   ========================================= */

// Wait for the page to fully load
window.addEventListener("load", () => {
    const preloader = document.querySelector(".preloader");
    if (preloader) {
        // Force scroll to top
        window.scrollTo(0, 0);
        
        // Fade out animation
        preloader.style.opacity = "0";
        preloader.style.visibility = "hidden";
        preloader.style.transition = "opacity 0.5s ease, visibility 0.5s";
        
        setTimeout(() => {
            preloader.style.display = "none";
        }, 500);
    }
});

/* =========================================
   2. CUSTOM CURSOR (Runs on every page)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const cursorDot = document.querySelector("[data-cursor-dot]");
    const cursorOutline = document.querySelector("[data-cursor-outline]");

    // Only run if cursor elements exist in HTML
    if (cursorDot && cursorOutline) {
        window.addEventListener("mousemove", (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            // Move dot instantly
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            // Move outline with smooth animation
            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        });

        // Add hover effect to clickable items
        const clickables = document.querySelectorAll('a, button, input, select, .cart-trigger, .product-card');
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
   3. CART SYSTEM (With Firebase Coupons)
   ========================================= */

// Define global variable for coupon
let activeCoupon = JSON.parse(localStorage.getItem('taptCoupon')) || null;

window.toggleCart = function() {
    const cartDrawer = document.querySelector('.cart-drawer');
    const cartOverlay = document.querySelector('.cart-overlay');
    
    if (cartDrawer && cartOverlay) {
        cartDrawer.classList.toggle('open');
        cartOverlay.classList.toggle('open');
    }
};

// --- Apply Coupon Function ---
window.applyCoupon = function() {
    const input = document.getElementById('coupon-input');
    const msg = document.getElementById('coupon-msg');
    
    if(!input || !msg) return;

    const code = input.value.toUpperCase().trim();
    if(!code) {
        msg.textContent = "Please enter a code";
        msg.className = 'msg-error';
        return;
    }

    msg.textContent = "Checking...";
    msg.className = '';

    // Check if Firebase is loaded
    if (typeof firebase === 'undefined') {
        msg.textContent = "Error: Database not connected";
        msg.className = 'msg-error';
        console.error("Firebase missing on this page");
        return;
    }

    // Lookup Code in Database
    firebase.database().ref('coupons/' + code).get().then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            activeCoupon = {
                code: code,
                type: data.type, // 'percentage' or 'flat'
                value: data.value
            };
            
            // Save to storage so it persists
            localStorage.setItem('taptCoupon', JSON.stringify(activeCoupon));
            
            msg.textContent = `Success! ${code} applied.`;
            msg.className = 'msg-success';
            
            // Refresh Cart UI with new prices
            updateCartUI(); 

        } else {
            msg.textContent = "Invalid Code";
            msg.className = 'msg-error';
            activeCoupon = null;
            localStorage.removeItem('taptCoupon');
            updateCartUI();
        }
    }).catch((error) => {
        console.error(error);
        msg.textContent = "Error checking code";
        msg.className = 'msg-error';
    });
};

// --- Update UI ---
function updateCartUI() {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartCountBadge = document.getElementById('cart-count');
    const subtotalEl = document.getElementById('subtotal-price');
    const discountRow = document.getElementById('discount-row');
    const discountAmountEl = document.getElementById('discount-amount');
    const totalEl = document.getElementById('total-price');

    // 1. Update Badge
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    if (cartCountBadge) {
        cartCountBadge.textContent = totalCount;
        cartCountBadge.style.display = totalCount > 0 ? 'flex' : 'none';
    }

    // 2. Render Items
    if (cartItemsContainer) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-msg" style="color:black; padding:20px; text-align:center;">Your cart is empty.</div>';
        } else {
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item" style="display:flex; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <div style="width:60px; height:60px; background:#333; border-radius:8px; margin-right:15px; display:flex; align-items:center; justify-content:center;">
                        <i class="fa-solid fa-credit-card" style="color:white;"></i>
                    </div>
                    <div style="flex:1;">
                        <h4 style="font-size:0.9rem; margin-bottom:5px; color:black;">${item.title}</h4>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:bold; color:black;">₹${item.price}</span>
                            <div style="display:flex; gap:10px; align-items:center; background:#eee; padding:2px 8px; border-radius:5px;">
                                <button onclick="updateQty(${item.id}, -1)" style="border:none; background:none; cursor:pointer;">-</button>
                                <span style="font-size:0.9rem; color:black;">${item.qty}</span>
                                <button onclick="updateQty(${item.id}, 1)" style="border:none; background:none; cursor:pointer;">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    // 3. Calculate Totals
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    let discount = 0;

    // Calculate Discount if Coupon Exists
    if (activeCoupon && subtotal > 0) {
        if(activeCoupon.type === 'percentage') {
            discount = subtotal * (activeCoupon.value / 100);
        } else {
            discount = activeCoupon.value; // Flat amount
        }
        // Prevent negative total
        if(discount > subtotal) discount = subtotal;
    }

    const finalTotal = subtotal - discount;

    // 4. Update Price Text
    if(subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString()}`;
    
    if(discountRow && discountAmountEl) {
        if(discount > 0) {
            discountRow.style.display = 'flex';
            discountAmountEl.textContent = `-₹${discount.toLocaleString()}`;
            // Optional: Show code name in input
            const input = document.getElementById('coupon-input');
            if(input && !input.value) input.value = activeCoupon.code;
        } else {
            discountRow.style.display = 'none';
        }
    }

    if(totalEl) totalEl.textContent = `₹${finalTotal.toLocaleString()}`;
}

// --- Global Cart Functions ---
window.addToCart = function(title, price) {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    const id = Date.now(); 
    const existingItem = cart.find(i => i.title === title);
    
    if(existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ id, title, price, qty: 1 });
    }
    
    localStorage.setItem('taptCart', JSON.stringify(cart));
    updateCartUI();
    window.toggleCart();
};

window.updateQty = function(id, change) {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty += change;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        localStorage.setItem('taptCart', JSON.stringify(cart));
        updateCartUI();
    }
};

// Initial Load
document.addEventListener('DOMContentLoaded', updateCartUI);
/* =========================================
   4. CUSTOMIZER PAGE LOGIC
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const themeSelect = document.getElementById('c-theme');
    const previewCard = document.getElementById('p-card');
    const nameInput = document.getElementById('c-name');
    const previewName = document.getElementById('p-name');
    const roleInput = document.getElementById('c-role');
    const previewRole = document.getElementById('p-role');
    const logoInput = document.getElementById('c-logo-upload');
    const previewLogo = document.getElementById('p-logo-preview');
    const addBtn = document.querySelector('.builder-controls .filter-btn');

    // Only run if we are on the Customize Page
    if (themeSelect && previewCard) {
        
        // Theme Change
        themeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'black') {
                previewCard.classList.remove('skin-white');
                previewCard.classList.add('skin-black');
            } else {
                previewCard.classList.remove('skin-black');
                previewCard.classList.add('skin-white');
            }
        });

        // Live Typing
        if(nameInput) {
            nameInput.addEventListener('input', (e) => {
                previewName.textContent = e.target.value || 'YOUR NAME';
            });
        }
        if(roleInput) {
            roleInput.addEventListener('input', (e) => {
                previewRole.textContent = e.target.value || 'DESIGNATION';
            });
        }

        // Logo Upload
        if(logoInput) {
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
        }

        // Add Custom Card to Cart
        if(addBtn) {
            addBtn.addEventListener('click', () => {
                const material = themeSelect.value === 'white' ? 'Polar White' : 'Premium Black';
                window.addToCart(`Custom Card (${material})`, 1999);
            });
        }
    }
});

/* =========================================
   5. 3D TILT EFFECT (Shop & Builder)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const tiltElements = document.querySelectorAll('.card-stage, .product-card');

    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            // Determine which inner element to rotate
            const inner = el.querySelector('.tapt-card') || el.querySelector('.card-content');
            if(!inner) return;

            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const xRotation = -((y - rect.height / 2) / 20);
            const yRotation = (x - rect.width / 2) / 20;

            inner.style.transform = `perspective(1000px) rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale(1.02)`;
        });

        el.addEventListener('mouseleave', () => {
            const inner = el.querySelector('.tapt-card') || el.querySelector('.card-content');
            if(inner) {
                inner.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
            }
        });
    });
});
/* =========================================
   6. CHECKOUT PAGE LOGIC
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    
    // Check if we are on the checkout page
    const checkoutList = document.getElementById('checkout-items-list');
    const successScreen = document.getElementById('success-overlay');
    
    if (checkoutList) {
        // 1. Load Cart Data
        let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
        
        // If empty, redirect to shop
        if (cart.length === 0) {
            window.location.href = 'shop.html';
        }

        // 2. Render Items
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

        // 3. Update Totals
        const subtotalEl = document.getElementById('c-subtotal');
        const totalEl = document.getElementById('c-total');
        
        if(subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString()}`;
        if(totalEl) totalEl.textContent = `₹${subtotal.toLocaleString()}`;

  /* --- ADD THIS TO YOUR script.js inside the handlePayment function --- */
/* make sure you include firebase scripts in checkout.html too! */

window.handlePayment = function(e) {
    e.preventDefault();
    
    // 1. Get Cart & Form Data
    const cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    const email = document.querySelector('input[type="email"]').value;
    const fName = document.querySelectorAll('.input-grid input')[0].value;
    const lName = document.querySelectorAll('.input-grid input')[1].value;
    const address = document.querySelectorAll('.input-row input')[1].value; // Adjust index based on your HTML
    
    // Calculate final total (assuming you stored it in a variable or re-calc)
    let total = 0;
    cart.forEach(item => total += (item.price * item.qty));

    // 2. Prepare Order Object
    const orderData = {
        contactEmail: email,
        shipping: {
            firstName: fName,
            lastName: lName,
            address: address
        },
        items: cart,
        total: total,
        date: new Date().toISOString(),
        status: 'paid'
    };

    // 3. Send to Firebase (Realtime Database)
    // IMPORTANT: You need to initialize Firebase in checkout.html similar to admin.html
    // const db = firebase.database();
    
    const newOrderRef = firebase.database().ref('orders').push();
    newOrderRef.set(orderData, (error) => {
        if (error) {
            alert("Order failed. Please try again.");
        } else {
            // Success!
            localStorage.removeItem('taptCart');
            document.getElementById('success-overlay').classList.add('active');
        }
    });
};
/* =========================================
       7. CONNECT CHECKOUT BUTTON
       ========================================= */
    const checkoutButton = document.querySelector('.checkout-btn');
    
    if(checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            // Check if cart is empty before going
            const currentCart = JSON.parse(localStorage.getItem('taptCart')) || [];
            
            if(currentCart.length > 0) {
                window.location.href = 'checkout.html';
            } else {
                // Optional: Shake the button or show message
                alert("Your cart is empty.");
            }
        });
    }
