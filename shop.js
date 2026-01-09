/* --- shop.js | TAPD. Live Database Connection --- */

// 1. Initialize Empty List
let products = [];

// 2. FETCH FROM FIREBASE (The Missing Link)
const db = firebase.firestore();

// "products" is the collection name your Admin Panel likely uses.
// If your admin panel uses a different name, change 'products' below.
db.collection('products').get().then((querySnapshot) => {
    products = []; // Clear list
    
    querySnapshot.forEach((doc) => {
        let data = doc.data();
        products.push({
            id: doc.id, // Use the database ID
            name: data.name || data.productName, // Tries both common names
            price: Number(data.price) || 0,
            category: data.category || 'card',
            image: data.image || data.img || 'https://via.placeholder.com/300x300?text=No+Image',
            desc: data.desc || data.description || 'Premium Hardware'
        });
    });

    // Once data is loaded, build the grid
    renderShop();
    updateCartCount();

}).catch((error) => {
    console.error("Error getting products: ", error);
    document.getElementById('shop-grid').innerHTML = '<p style="color:white; text-align:center;">Loading Legacy...</p>';
});


// 3. RENDER PRODUCTS (Using the FIXED Layout)
function renderShop(filter = 'all') {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<p style="color:#666; text-align:center; width:100%;">No products found in database.</p>';
        return;
    }

    products.forEach(product => {
        if (filter === 'all' || product.category === filter) {
            
            const card = document.createElement('div');
            card.className = 'product-card';
            
            // We use the ID as a string now because it comes from Firebase
            card.innerHTML = `
                <div class="p-img-box">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x300?text=TAPD'">
                    <button class="add-btn" onclick="addToCart('${product.id}')">
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

// 4. ADD TO CART LOGIC
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Get Cart
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

// 5. UPDATE BAG COUNT
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    let totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    
    const countBadge = document.getElementById('cart-count');
    if (countBadge) {
        countBadge.innerText = totalQty;
        countBadge.style.display = totalQty > 0 ? 'flex' : 'none';
    }
}

// 6. TOAST NOTIFICATION
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

// Filter Function
function filterProducts(category, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderShop(category);
}
