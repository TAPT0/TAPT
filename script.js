// --- 3D TILT EFFECT (Universal) ---
const cards = document.querySelectorAll('.tapt-card');
const stages = document.querySelectorAll('.card-stage');

if(stages.length > 0) {
    stages.forEach(stage => {
        stage.addEventListener('mousemove', (e) => {
            const card = stage.querySelector('.tapt-card');
            const ax = -(window.innerWidth / 2 - e.pageX) / 25;
            const ay = (window.innerHeight / 2 - e.pageY) / 25;
            card.style.transform = `rotateY(${ax}deg) rotateX(${ay}deg)`;
        });

        stage.addEventListener('mouseleave', () => {
            const card = stage.querySelector('.tapt-card');
            card.style.transform = `rotateY(0) rotateX(0)`;
        });
    });
}

// --- CUSTOMIZER LOGIC (Only runs on customize.html) ---
const nameInput = document.getElementById('c-name');
const roleInput = document.getElementById('c-role');
const themeSelect = document.getElementById('c-theme');

const previewName = document.getElementById('p-name');
const previewRole = document.getElementById('p-role');
const previewCard = document.getElementById('p-card');

if (nameInput) {
    // Update Name
    nameInput.addEventListener('input', (e) => {
        previewName.innerText = e.target.value || "YOUR NAME";
    });

    // Update Role
    roleInput.addEventListener('input', (e) => {
        previewRole.innerText = e.target.value || "DESIGNATION";
    });

    // Update Theme (Material)
    themeSelect.addEventListener('change', (e) => {
        // Remove old classes
        previewCard.classList.remove('skin-black', 'skin-gold', 'skin-white');
        // Add new class
        previewCard.classList.add(`skin-${e.target.value}`);
        
        // Handle text color changes for light backgrounds
        const textColor = (e.target.value === 'black') ? 'white' : 'black';
        previewName.style.color = textColor;
        
        // Wifi icon adjustment
        const wifiIcon = document.querySelector('.wifi-icon');
        wifiIcon.style.color = (e.target.value === 'black') ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    });
}

/* =========================================
   CART SYSTEM LOGIC (ADDED)
   ========================================= */

/* --- Cart State --- */
// Try to load from local storage or start empty
let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
let activeCoupon = null;

// Dummy Coupon Data (Add your own codes here)
const COUPONS = {
    'TAPT10': 0.10, // 10% off
    'GENZ': 0.20,   // 20% off
    'FREE': 1.00    // 100% off
};

/* --- Core Functions --- */

// Open/Close Drawer
function toggleCart() {
    document.body.classList.toggle('cart-open');
}

// Add Item (Call this from your product buttons)
function addToCart(id, title, price, image) {
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ id, title, price, image, qty: 1 });
    }
    
    updateCartUI();
    if(!document.body.classList.contains('cart-open')) {
        toggleCart(); // Auto open cart on add
    }
}

// Increase or Decrease Quantity
function updateQty(id, change) {
    const item = cart.find(item => item.id === id);
    if (!item) return;

    item.qty += change;

    // Remove if quantity hits 0
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    updateCartUI();
}

// Apply Coupon Code
function applyCoupon() {
    const input = document.getElementById('coupon-input');
    if(!input) return; // Guard clause in case element doesn't exist
    
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

// Main Render Function
function updateCartUI() {
    // 1. Save to Storage
    localStorage.setItem('taptCart', JSON.stringify(cart));
    
    // 2. Update Badge
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    const badge = document.getElementById('cart-count');
    if(badge) {
        badge.innerText = totalCount;
        badge.style.display = totalCount > 0 ? 'flex' : 'none';
    }

    // 3. Render Items
    const container = document.getElementById('cart-items-container');
    if(!container) return; // Exit if cart drawer isn't on this page

    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-msg">Your cart is empty.</div>';
    } else {
        container.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.title}">
                <div class="item-details">
                    <h4>${item.title}</h4>
                    <p>$${item.price.toFixed(2)}</p>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
                        <span>${item.qty}</span>
                        <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 4. Calculate Totals
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    let discount = 0;

    const discountRow = document.getElementById('discount-row');
    const discountAmount = document.getElementById('discount-amount');

    if (activeCoupon) {
        discount = subtotal * activeCoupon.discount;
        if(discountRow) discountRow.style.display = 'flex';
        if(discountAmount) discountAmount.innerText = `-$${discount.toFixed(2)}`;
    } else {
        if(discountRow) discountRow.style.display = 'none';
    }

    const subtotalEl = document.getElementById('subtotal-price');
    const totalEl = document.getElementById('total-price');

    if(subtotalEl) subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
    if(totalEl) totalEl.innerText = `$${(subtotal - discount).toFixed(2)}`;
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', updateCartUI);
