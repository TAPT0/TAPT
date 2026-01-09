/* --- shop.js | FINAL FIX (No Config Conflicts) --- */

// 1. SETUP CONNECTION
// We use 'store' instead of 'db' to prevent "redeclaration" errors if it exists in HTML
const store = firebase.firestore();
let products = [];

// 2. STARTUP
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartCount();
});

// 3. FETCH DATA (Matches Admin Panel Structure)
function fetchProducts() {
    const grid = document.getElementById('shop-grid');
    if(grid) grid.innerHTML = '<p style="color:#666; text-align:center; width:100%;">Loading Legacy...</p>';

    store.collection('products').get().then((querySnapshot) => {
        products = []; // Clear list
        
        querySnapshot.forEach((doc) => {
            let data = doc.data();
            
            /* --- CRITICAL DATA MAPPING --- */
            
            // 1. TITLE: Admin saves as 'title'
            let pName = data.title || data.name || "Unnamed Product";
            
            // 2. IMAGE: Admin saves as an ARRAY called 'images'. We grab the first one.
            let pImage = 'https://via.placeholder.com/300x300?text=No+Image';
            
            if (data.images && Array.isArray(data.images) && data.images.length > 0) {
                pImage = data.images[0]; // Grab first image from array
            } else if (data.image) {
                pImage = data.image; // Fallback for old items
            } else if (data.productImage) {
                pImage = data.productImage;
            }

            // 3. PRICE & DESC
            let pPrice = Number(data.price) || 0;
            let pDesc = data.description || data.desc || 'Premium Hardware';
            let pCat = data.category || 'custom';

            products.push({
                id: doc.id, 
                name: pName,
                price: pPrice,
                category: pCat,
                image: pImage,
                desc: pDesc
            });
        });

        renderShop();

    }).catch((error) => {
        console.error("Error getting products: ", error);
        if(grid) grid.innerHTML = '<p style="color:white; text-align:center;">Error loading products. Check Console.</p>';
    });
}


// 4. RENDER TO GRID
function renderShop(filter = 'all') {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<p style="color:#666; text-align:center; width:100%;">No products found in database.</p>';
        return;
    }

    products.forEach(product => {
        // Filter Logic
        if (filter === 'all' || product.category === filter) {
            
            const card = document.createElement('div');
            card.className = 'product-card';
            
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

// 5. ADD TO CART
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Load Cart using 'TAPDCart' key
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];

    // Check duplicate
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

// 6. UPDATE ICON
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    let totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    
    const countBadge = document.getElementById('cart-count');
    if (countBadge) {
        countBadge.innerText = totalQty;
        countBadge.style.display = totalQty > 0 ? 'flex' : 'none';
    }
}

// 7. TOAST MSG
function showToast(message) {
    if(document.querySelector('.toast-msg')) return; 

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerText = message;
    toast.style.cssText = `
        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
        background: #D4AF37; color: #000; padding: 12px 25px; 
        font-family: sans-serif; font-weight: 700; border-radius: 50px;
        z-index: 9999; box-shadow: 0 5px 20px rgba(0,0,0,0.5);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// 8. FILTER HELPER
function filterProducts(category, btn) {
    const buttons = document.querySelectorAll('.filter-btn');
    if(buttons.length > 0 && btn) {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    renderShop(category);
}
