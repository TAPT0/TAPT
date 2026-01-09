/* --- shop.js | DEBUG MODE --- */

const store = firebase.firestore();
let products = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log("Shop Script Loaded");
    fetchProducts();
    updateCartCount();
});

function fetchProducts() {
    const grid = document.getElementById('shop-grid');
    if(grid) grid.innerHTML = '<p style="color:#666; text-align:center; width:100%;">Loading Legacy...</p>';

    store.collection('products').get().then((querySnapshot) => {
        products = []; 
        
        querySnapshot.forEach((doc) => {
            let data = doc.data();
            let pName = data.title || data.name || "Unnamed Product";
            
            // Image Logic
            let pImage = 'https://via.placeholder.com/300x300?text=No+Image';
            if (data.images && Array.isArray(data.images) && data.images.length > 0) {
                pImage = data.images[0]; 
            } else if (data.image) {
                pImage = data.image; 
            } else if (data.productImage) {
                pImage = data.productImage;
            }

            products.push({
                id: doc.id, 
                name: pName,
                price: Number(data.price) || 0,
                category: data.category || 'custom',
                image: pImage,
                desc: data.description || 'Premium Hardware'
            });
        });

        renderShop();

    }).catch((error) => {
        console.error("Error getting products: ", error);
        alert("Database Error: " + error.message);
    });
}

function renderShop(filter = 'all') {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;

    grid.innerHTML = '';

    products.forEach(product => {
        if (filter === 'all' || product.category === filter) {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            // Note: We are using event.stopPropagation() on the button
            card.innerHTML = `
                <div class="p-img-box" onclick="viewProduct('${product.id}')" style="cursor:pointer;">
                    <img src="${product.image}" alt="${product.name}">
                    <button class="add-btn" onclick="event.stopPropagation(); addToCart('${product.id}')">
                        ADD TO BAG
                    </button>
                </div>
                <div class="p-details" onclick="viewProduct('${product.id}')" style="cursor:pointer;">
                    <div class="p-info">
                        <h3>${product.name}</h3>
                    </div>
                    <div class="p-price">₹${product.price}</div>
                </div>
            `;
            grid.appendChild(card);
        }
    });
}

// --- REDIRECT ---
function viewProduct(id) {
    // alert("Redirecting to product: " + id); // Uncomment to test click
    window.location.href = `product.html?id=${id}`;
}

// --- ADD TO CART (WITH DEBUG ALERTS) ---
function addToCart(productId) {
    // 1. Debug: Confirm function call
    console.log("Add to Cart clicked for ID:", productId);

    // 2. Find Product
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        alert("ERROR: Product not found in list. ID: " + productId);
        return;
    }

    // 3. Get Current Cart
    let cart = [];
    try {
        cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    } catch (e) {
        cart = [];
    }

    // 4. Add Item
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

    // 5. Save and Confirm
    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    
    updateCartCount();
    
    // VISUAL CONFIRMATION
    // Remove the alert below once it starts working
    alert(`SUCCESS: ${product.name} saved to cart! Total items: ${cart.length}`);
    
    showToast(`${product.name} added to bag`);
}

function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    let totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    
    const countBadge = document.getElementById('cart-count');
    if (countBadge) {
        countBadge.innerText = totalQty;
        countBadge.style.display = totalQty > 0 ? 'flex' : 'none';
    }
}

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

function filterProducts(category, btn) {
    const buttons = document.querySelectorAll('.filter-btn');
    if(buttons.length > 0 && btn) {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    renderShop(category);
}
