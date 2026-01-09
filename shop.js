/* --- shop.js | TAPD. Logic Fixed --- */

// 1. PRODUCT CATALOG
const products = [
    {
        id: 1,
        name: "The 'Album Art' Minimalist",
        price: 249,
        category: "card",
        image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop", 
        desc: "Photo Quality Focus"
    },
    {
        id: 2,
        name: "TAPD. Matte Black",
        price: 499,
        category: "card",
        image: "https://images.unsplash.com/photo-1635443210352-09252c7b5009?q=80&w=1000&auto=format&fit=crop",
        desc: "Premium Finish"
    },
    {
        id: 3,
        name: "TAPD. Gold Edition",
        price: 999,
        category: "card",
        image: "https://images.unsplash.com/photo-1621504450168-b8c6816c3e83?q=80&w=1000&auto=format&fit=crop",
        desc: "Real Metal Core"
    },
    {
        id: 4,
        name: "NFC Coin Tag",
        price: 199,
        category: "tag",
        image: "https://images.unsplash.com/photo-1622630998477-20aa696fab05?q=80&w=1000&auto=format&fit=crop",
        desc: "Stick anywhere"
    }
];

// 2. RENDER PRODUCTS (Using your exact CSS classes)
function renderShop(filter = 'all') {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;

    grid.innerHTML = '';

    products.forEach(product => {
        if (filter === 'all' || product.category === filter) {
            
            const card = document.createElement('div');
            card.className = 'product-card';
            // We attach the click event to the button specifically later
            card.innerHTML = `
                <div class="p-img-box">
                    <img src="${product.image}" alt="${product.name}">
                    <button class="add-btn" onclick="addToCart(${product.id})">
                        ADD TO BAG
                    </button>
                </div>
                <div class="p-details">
                    <div class="p-info">
                        <h3>${product.name}</h3>
                        <p class="p-cat">${product.desc}</p>
                    </div>
                    <div class="p-price">₹${product.price}</div>
                </div>
            `;
            grid.appendChild(card);
        }
    });
}

// 3. ADD TO CART LOGIC
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Get Cart (TAPDCart is the key the checkout page looks for)
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];

    // Check if item exists
    let existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            img: product.image,
            qty: 1
        });
    }

    // Save
    localStorage.setItem('TAPDCart', JSON.stringify(cart));

    // Update UI
    updateCartCount();
    showToast(`${product.name} added to bag`);
}

// 4. UPDATE ICON
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    let totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    
    const countBadge = document.getElementById('cart-count');
    if (countBadge) {
        countBadge.innerText = totalQty;
        countBadge.style.display = totalQty > 0 ? 'flex' : 'none';
    }
}

// 5. TOAST NOTIFICATION
function showToast(message) {
    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.cssText = `
        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
        background: #D4AF37; color: #000; padding: 12px 25px; 
        font-family: sans-serif; font-weight: 700; border-radius: 50px;
        z-index: 1000; box-shadow: 0 5px 20px rgba(0,0,0,0.5);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderShop();
    updateCartCount();
});

// Filter Function
function filterProducts(category, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderShop(category);
}
