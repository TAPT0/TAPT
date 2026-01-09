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
/* --- APPEND THIS TO SHOP.JS TO MAKE THE DRAWER WORK --- */

// 1. Toggle the Drawer (Open/Close)
function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.querySelector('.cart-overlay');
    
    if (drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        if(overlay) overlay.style.display = 'none';
    } else {
        renderCartContents(); // <--- This loads the items!
        drawer.classList.add('open');
        if(overlay) overlay.style.display = 'block';
    }
}

// 2. Render Items inside the Drawer
function renderCartContents() {
    const container = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    let total = 0;

    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<p style="color:#666; text-align:center; margin-top:50px;">Your legacy is empty.</p>';
        if(subtotalEl) subtotalEl.innerText = "₹0";
        if(totalEl) totalEl.innerText = "₹0";
        return;
    }

    cart.forEach((item, index) => {
        let price = Number(item.price);
        let qty = Number(item.qty);
        total += price * qty;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.img}" alt="${item.name}">
            <div style="flex:1;">
                <div style="display:flex; justify-content:space-between;">
                    <h4 style="margin:0; font-size:0.9rem;">${item.name}</h4>
                    <span onclick="removeCartItem(${index})" style="color:#ff4444; cursor:pointer;">×</span>
                </div>
                <p style="color:#888; font-size:0.8rem; margin:5px 0;">₹${price}</p>
                <div style="display:flex; align-items:center; gap:10px; margin-top:5px;">
                    <button onclick="updateDrawerQty(${index}, -1)" style="background:#222; border:none; color:white; width:20px;">-</button>
                    <span style="font-size:0.8rem;">${qty}</span>
                    <button onclick="updateDrawerQty(${index}, 1)" style="background:#222; border:none; color:white; width:20px;">+</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });

    if(subtotalEl) subtotalEl.innerText = "₹" + total;
    if(totalEl) totalEl.innerText = "₹" + total;
}

// 3. Helper: Update Qty from Drawer
function updateDrawerQty(index, change) {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    cart[index].qty += change;
    
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    
    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    renderCartContents(); // Refresh drawer
    updateCartCount();    // Refresh icon badge
}

// 4. Helper: Remove Item
function removeCartItem(index) {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    renderCartContents();
    updateCartCount();
}

// 5. Close Drawer Helper
function closeAllDrawers() {
    document.getElementById('cart-drawer').classList.remove('open');
    const overlay = document.querySelector('.cart-overlay');
    if(overlay) overlay.style.display = 'none';
}
