/* --- shop.js | TAPD. Live Database Connection (Synced with Admin) --- */

// 1. FIREBASE CONFIG (Matches your Admin Panel)
const firebaseConfig = {
    apiKey: "AIzaSyBmCVQan3wclKDTG2yYbCf_oMO6t0j17wI",
    authDomain: "tapt-337b8.firebaseapp.com",
    databaseURL: "https://tapt-337b8-default-rtdb.firebaseio.com",
    projectId: "tapt-337b8",
    storageBucket: "tapt-337b8.firebasestorage.app",
    messagingSenderId: "887956121124",
    appId: "1:887956121124:web:6856680bf75aa3bacddab1",
    measurementId: "G-2CB8QXYNJY"
};

// Initialize Firebase safely (prevents "default app already exists" error)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
let products = [];

// 2. FETCH FROM FIREBASE
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartCount();
});

function fetchProducts() {
    const grid = document.getElementById('shop-grid');
    if(grid) grid.innerHTML = '<p style="color:#666; text-align:center; width:100%;">Loading Legacy...</p>';

    // We use "title" because that is what your Admin Panel saves
    db.collection('products').get().then((querySnapshot) => {
        products = []; // Clear list
        
        querySnapshot.forEach((doc) => {
            let data = doc.data();
            
            // --- DATA MAPPING (The Fix) ---
            // Admin saves name as 'title'
            let pName = data.title || data.name || "Unnamed Product";
            
            // Admin saves images as an array 'images[]'. We take the first one.
            let pImage = 'https://via.placeholder.com/300x300?text=No+Image';
            if (data.images && Array.isArray(data.images) && data.images.length > 0) {
                pImage = data.images[0];
            } else if (data.image) {
                pImage = data.image; // Fallback for old data
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
        if(grid) grid.innerHTML = '<p style="color:white; text-align:center;">Error loading products. Check Console.</p>';
    });
}


// 3. RENDER PRODUCTS 
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
        // Note: Admin saves categories like 'review', 'social', 'custom'
        // You might want to map 'card' and 'tag' buttons to these, or just show all for now.
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

// 4. ADD TO CART LOGIC
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Get Cart (Using the specific key 'TAPDCart' that checkout looks for)
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
        z-index: 9999; box-shadow: 0 5px 20px rgba(0,0,0,0.5);
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
