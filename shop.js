/* --- shop.js | TAPD. Smart Database Connection --- */

const app = firebase.app(); 
const store = app.firestore();
let products = [];

store.collection('products').get().then((querySnapshot) => {
    products = []; 
    
    querySnapshot.forEach((doc) => {
        let data = doc.data();
        
        // --- DETECTIVE MODE: Print actual data to Console ---
        console.log("🛒 Loaded Product:", data); 

        // 1. SMART NAME FINDER (Checks every common variation)
        let finalName = data.name || data.productName || data.title || data.pName || data.itemName || "Unnamed Product";

        // 2. SMART IMAGE FINDER
        let finalImage = data.image || data.img || data.imageUrl || data.url || data.productImage || data.src || 'https://via.placeholder.com/300x300?text=TAPD';

        products.push({
            id: doc.id, 
            name: finalName,
            price: Number(data.price) || Number(data.productPrice) || 0,
            category: data.category || 'card',
            image: finalImage,
            desc: data.desc || data.description || 'Premium Hardware'
        });
    });

    renderShop();
    updateCartCount();

}).catch((error) => {
    console.error("Error:", error);
});


// --- RENDER FUNCTION ---
function renderShop(filter = 'all') {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<p style="color:#666; text-align:center;">No products found.</p>';
        return;
    }

    products.forEach(product => {
        if (filter === 'all' || product.category === filter) {
            
            const card = document.createElement('div');
            card.className = 'product-card';
            
            card.innerHTML = `
                <div class="p-img-box">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Img'">
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

// --- ADD TO CART ---
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
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

    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    updateCartCount();
    showToast(`${product.name} added to bag`);
}

// --- UTILS ---
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    let totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    const badge = document.getElementById('cart-count');
    if(badge) {
        badge.innerText = totalQty;
        badge.style.display = totalQty > 0 ? 'flex' : 'none';
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
        z-index: 1000; box-shadow: 0 5px 20px rgba(0,0,0,0.5);
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
