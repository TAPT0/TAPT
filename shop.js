/* --- shop.js | TAPD. Final Fix (No Conflicts) --- */

// 1. Initialize Empty List
let products = [];

// 2. FETCH FROM FIREBASE
// FIX: We do NOT use 'const db' here to avoid the crash.
// We use firebase.firestore() directly.
firebase.firestore().collection('products').get().then((querySnapshot) => {
    products = []; // Clear list
    
    querySnapshot.forEach((doc) => {
        let data = doc.data();
        
        // Smart Image Handling: Checks for 'image', 'img', or uses a placeholder if broken
        // This fixes the "Image not found" text in your screenshot
        let imgUrl = data.image || data.img || data.productImage;
        if (!imgUrl || imgUrl === "undefined") {
            imgUrl = 'https://via.placeholder.com/300x300/111/D4AF37?text=TAPD';
        }

        products.push({
            id: doc.id, 
            name: data.name || data.productName || "Unnamed Product",
            price: Number(data.price) || 0,
            category: data.category || 'card',
            image: imgUrl,
            desc: data.desc || data.description || 'Premium Hardware'
        });
    });

    // Once data is loaded, build the grid
    renderShop();
    updateCartCount();

}).catch((error) => {
    console.error("Error getting products: ", error);
    // This will show if Firebase fails (e.g., permissions or internet)
    const grid = document.getElementById('shop-grid');
    if(grid) grid.innerHTML = '<p style="color:white; text-align:center;">Connection to Legacy Failed.<br><small>Check console for details.</small></p>';
});


// 3. RENDER PRODUCTS 
function renderShop(filter = 'all') {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (products.length === 0) {
        // While loading or if empty
        grid.innerHTML = '<p style="color:#666; text-align:center; width:100%;">Loading Collection...</p>';
        return;
    }

    products.forEach(product => {
        if (filter === 'all' || product.category === filter) {
            
            const card = document.createElement('div');
            card.className = 'product-card';
            
            card.innerHTML = `
                <div class="p-img-box">
                    <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/300x300/111/D4AF37?text=TAPD';">
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
    if(document.querySelector('.toast-msg')) return;

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
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
    const buttons = document.querySelectorAll('.filter-btn');
    if(buttons.length > 0 && btn) {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    renderShop(category);
}
