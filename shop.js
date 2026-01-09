/* --- shop.js | TAPD. Product Logic --- */

// 1. PRODUCT CATALOG (Edit these to match your actual products)
const products = [
    {
        id: 1,
        name: "The 'Album Art' Minimalist",
        price: 249,
        category: "card",
        image: "https://i.imgur.com/8Q5X4hM.jpg", // Replace with your image URL
        desc: "Photo Quality Focus"
    },
    {
        id: 2,
        name: "TAPD. Matte Black",
        price: 499,
        category: "card",
        image: "https://via.placeholder.com/300/111/D4AF37?text=Matte+Black",
        desc: "Premium Finish"
    },
    {
        id: 3,
        name: "TAPD. Gold Edition",
        price: 999,
        category: "card",
        image: "https://via.placeholder.com/300/D4AF37/000?text=Gold+Edition",
        desc: "Real Metal Core"
    },
    {
        id: 4,
        name: "NFC Coin Tag",
        price: 199,
        category: "tag",
        image: "https://via.placeholder.com/300/333/fff?text=Coin+Tag",
        desc: "Stick anywhere"
    }
];

// 2. RENDER PRODUCTS TO GRID
function renderShop(filter = 'all') {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;

    grid.innerHTML = ''; // Clear existing

    products.forEach(product => {
        if (filter === 'all' || product.category === filter) {
            
            // Create Card HTML
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="card-image">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="overlay">
                        <button onclick="addToCart(${product.id})">ADD TO BAG</button>
                    </div>
                </div>
                <div class="card-info">
                    <h3>${product.name}</h3>
                    <p>${product.desc}</p>
                    <div class="price">₹${product.price}</div>
                </div>
            `;
            grid.appendChild(card);
        }
    });
}

// 3. THE "ADD TO CART" LOGIC (Fixed for Checkout)
function addToCart(productId) {
    // A. Find the product details
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // B. Get current cart from Storage (Using 'TAPDCart' key)
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];

    // C. Check if item is already in cart
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

    // D. SAVE TO STORAGE
    localStorage.setItem('TAPDCart', JSON.stringify(cart));

    // E. Update UI
    updateCartCount();
    showToast(`${product.name} added to bag`);
    
    // Optional: Open the cart drawer automatically
    // toggleCart(); 
}

// 4. UPDATE BAG COUNT ICON
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    let totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    
    const countBadge = document.getElementById('cart-count');
    if (countBadge) {
        countBadge.innerText = totalQty;
        countBadge.style.display = totalQty > 0 ? 'flex' : 'none';
    }
}

// 5. SIMPLE TOAST NOTIFICATION
function showToast(message) {
    // Create element
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerText = message;
    toast.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        background: #D4AF37; color: #000; padding: 12px 24px; 
        font-family: 'Syncopate', sans-serif; font-weight: 700; font-size: 0.8rem;
        border-radius: 4px; z-index: 9999; box-shadow: 0 5px 20px rgba(0,0,0,0.5);
    `;
    
    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// 6. INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
    renderShop();
    updateCartCount();
});

// Filter Helper
function filterProducts(category, btn) {
    // Visual update for buttons
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Re-render
    renderShop(category);
}
