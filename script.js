/* =========================================
   1. 3D TILT EFFECT & UI LOGIC
   ========================================= */

// --- 3D TILT EFFECT ---
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

// --- CUSTOMIZER LOGIC ---
const nameInput = document.getElementById('c-name');
const roleInput = document.getElementById('c-role');
const themeSelect = document.getElementById('c-theme');

const previewName = document.getElementById('p-name');
const previewRole = document.getElementById('p-role');
const previewCard = document.getElementById('p-card');

if (nameInput) {
    nameInput.addEventListener('input', (e) => { previewName.innerText = e.target.value || "YOUR NAME"; });
    roleInput.addEventListener('input', (e) => { previewRole.innerText = e.target.value || "DESIGNATION"; });
    themeSelect.addEventListener('change', (e) => {
        previewCard.classList.remove('skin-black', 'skin-gold', 'skin-white');
        previewCard.classList.add(`skin-${e.target.value}`);
        const textColor = (e.target.value === 'black') ? 'white' : 'black';
        previewName.style.color = textColor;
        const wifiIcon = document.querySelector('.wifi-icon');
        if(wifiIcon) wifiIcon.style.color = (e.target.value === 'black') ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    });
}

/* =========================================
   2. CART SYSTEM LOGIC
   ========================================= */

// --- Cart State ---
let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
let activeCoupon = null;

const COUPONS = {
    'TAPT10': 0.10,
    'GENZ': 0.20,
    'FREE': 1.00
};

// --- Functions ---

function toggleCart() {
    console.log("Toggling Cart..."); // Debug message
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
    
    // Force open cart if closed
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
    localStorage.setItem('taptCart', JSON.stringify(cart));
    
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    const badge = document.getElementById('cart-count');
    if(badge) {
        badge.innerText = totalCount;
        badge.style.display = totalCount > 0 ? 'flex' : 'none';
    }

    const container = document.getElementById('cart-items-container');
    if(!container) return;

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

// --- INITIALIZATION (This fixes the click issue) ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load the UI
    updateCartUI();

    // 2. Force Attach Click Listeners
    // This finds the buttons in HTML and manually connects them to the function
    
    // Cart Trigger Button (The icon)
    const cartTrigger = document.querySelector('.cart-trigger');
    if(cartTrigger) {
        cartTrigger.addEventListener('click', toggleCart);
    }

    // Close Button (The X inside the drawer)
    const closeBtn = document.querySelector('.close-cart');
    if(closeBtn) {
        closeBtn.addEventListener('click', toggleCart);
    }

    // Overlay (Clicking background to close)
    const overlay = document.querySelector('.cart-overlay');
    if(overlay) {
        overlay.addEventListener('click', toggleCart);
    }
});
