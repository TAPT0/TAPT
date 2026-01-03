/* =========================================
   1. 3D TILT EFFECT & UI LOGIC
   ========================================= */

// --- 3D TILT EFFECT ---
// This works on both the shop grid cards and the builder preview
const tiltStages = document.querySelectorAll('.card-stage');

if(tiltStages.length > 0) {
    tiltStages.forEach(stage => {
        stage.addEventListener('mousemove', (e) => {
            const card = stage.querySelector('.tapt-card');
            if(!card) return;
            
            // Calculate rotation based on mouse position
            const ax = -(window.innerWidth / 2 - e.pageX) / 25;
            const ay = (window.innerHeight / 2 - e.pageY) / 25;
            
            // Apply the transform
            card.style.transform = `rotateY(${ax}deg) rotateX(${ay}deg)`;
        });

        stage.addEventListener('mouseleave', () => {
            const card = stage.querySelector('.tapt-card');
            if(!card) return;
            
            // Reset position smoothly
            card.style.transform = `rotateY(0) rotateX(0)`;
        });
    });
}

// --- CUSTOMIZER LOGIC ---
const nameInput = document.getElementById('c-name');
const roleInput = document.getElementById('c-role');
const themeSelect = document.getElementById('c-theme');
const logoInput = document.getElementById('c-logo-upload');

const previewName = document.getElementById('p-name');
const previewRole = document.getElementById('p-role');
const previewCard = document.getElementById('p-card');
const previewLogo = document.getElementById('p-logo-preview');

if (nameInput) {
    // Update Name
    nameInput.addEventListener('input', (e) => { 
        previewName.innerText = e.target.value || "YOUR NAME"; 
    });
    
    // Update Role
    roleInput.addEventListener('input', (e) => { 
        previewRole.innerText = e.target.value || "DESIGNATION"; 
    });
    
    // Update Theme/Material
    themeSelect.addEventListener('change', (e) => {
        // Remove old skin classes
        previewCard.classList.remove('skin-black', 'skin-gold', 'skin-white');
        // Add new skin class
        previewCard.classList.add(`skin-${e.target.value}`);
        
        // Adjust text color based on background
        const textColor = (e.target.value === 'black') ? 'white' : 'black';
        previewName.style.color = textColor;
        
        // Adjust Wifi Icon color
        const wifiIcon = document.querySelector('.wifi-icon');
        if(wifiIcon) {
            wifiIcon.style.color = (e.target.value === 'black') ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
        }
    });

    // Handle Logo Upload
    if(logoInput) {
        logoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
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
}

/* =========================================
   2. CART SYSTEM LOGIC
   ========================================= */

// --- Cart State ---
let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
let activeCoupon = null;

const COUPONS = {
    'TAPT10': 0.10, // 10% off
    'GENZ': 0.20,   // 20% off
    'FREE': 1.00    // 100% off
};

// --- Functions ---

function toggleCart() {
    document.body.classList.toggle('cart-open');
}

function addToCart(id, title, price, image) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ id, title, price, image, qty: 1 });
    }
    updateCartUI();
    
    // Force open cart to show the user what they added
    if(!document.body.classList.contains('cart-open')) {
        toggleCart(); 
    }
}

function updateQty(id, change) {
    const item = cart.find(item => item.id === id);
    if (!item) return;
    
    item.qty += change;
    
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    updateCartUI();
}

function applyCoupon() {
    const input = document.getElementById('coupon-input');
    if(!input) return;
    
    const code = input.value.toUpperCase().trim();
    const msg = document.getElementById('coupon-msg');
    
    if (COUPONS[code]) {
        activeCoupon = { code: code, discount: COUPONS[code] };
        msg.textContent = `Code ${code} applied!`;
        msg.className = 'msg-success';
        updateCartUI();
    } else {
        activeCoupon = null;
        msg.textContent = 'Invalid code';
        msg.className = 'msg-error';
        updateCartUI();
    }
}

function updateCartUI() {
    // Save to Local Storage
    localStorage.setItem('taptCart', JSON.stringify(cart));
    
    // Update Badge Count
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    const badge = document.getElementById('cart-count');
    if(badge) {
        badge.innerText = totalCount;
        badge.style.display = totalCount > 0 ? 'flex' : 'none';
    }

    // Render Items
    const container = document.getElementById('cart-items-container');
    if(!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-msg">Your cart is empty.</div>';
    } else {
        container.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="item-img-placeholder" style="width:80px; height:80px; background:#222; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                    <i class="fa-solid fa-credit-card" style="color:white;"></i>
                </div>
                <div class="item-details">
                    <h4>${item.title}</h4>
                    <p>₹${item.price.toLocaleString('en-IN')}</p>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
                        <span>${item.qty}</span>
                        <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Calculate Totals
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    let discount = 0;
    
    const discountRow = document.getElementById('discount-row');
    const discountAmount = document.getElementById('discount-amount');

    if (activeCoupon) {
        discount = subtotal * activeCoupon.discount;
        if(discountRow) discountRow.style.display = 'flex';
        if(discountAmount) discountAmount.innerText = `-₹${discount.toLocaleString('en-IN')}`;
    } else {
        if(discountRow) discountRow.style.display = 'none';
    }

    const subtotalEl = document.getElementById('subtotal-price');
    const totalEl = document.getElementById('total-price');
    
    if(subtotalEl) subtotalEl.innerText = `₹${subtotal.toLocaleString('en-IN')}`;
    if(totalEl) totalEl.innerText = `₹${(subtotal - discount).toLocaleString('en-IN')}`;
}

// --- SMART INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load the UI immediately
    updateCartUI();

    // 2. Attach Click Listeners
    
    // Cart Trigger Icon
    const cartTrigger = document.querySelector('.cart-trigger');
    if(cartTrigger) {
        cartTrigger.addEventListener('click', toggleCart);
    }

    // Close 'X' Button inside cart
    const closeBtn = document.querySelector('.close-cart');
    if(closeBtn) {
        closeBtn.addEventListener('click', toggleCart);
    }

    // Overlay (Click background to close)
    const overlay = document.querySelector('.cart-overlay');
    if(overlay) {
        overlay.addEventListener('click', toggleCart);
    }
    
    // 3. Connect "Add to Cart" button in Customizer
    const addToCartBtn = document.querySelector('.builder-controls .filter-btn');
    if(addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
             // Generate a pseudo-random ID for the custom item
            const customId = Date.now(); 
            addToCart(customId, "Custom Card", 1999, "custom-card.png");
        });
    }
});
