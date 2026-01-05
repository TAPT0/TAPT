/* product-details.js 
   Handles Product Page: Firebase Fetch, Real Reviews, Quantity Toggle
*/

// --- FIREBASE SETUP ---
const firebaseConfig = {
    apiKey: "AIzaSyBmCVQan3wclKDTG2yYbCf_oMO6t0j17wI",
    authDomain: "tapt-337b8.firebaseapp.com",
    databaseURL: "https://tapt-337b8-default-rtdb.firebaseio.com/",
    projectId: "tapt-337b8",
    storageBucket: "tapt-337b8.firebasestorage.app",
    messagingSenderId: "887956121124",
    appId: "1:887956121124:web:6856680bf75aa3bacddab1",
    measurementId: "G-2CB8QXYNJY"
};

// Initialize only if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

let currentProduct = null;
let cartQuantity = 0; // Local tracker for button state

// --- INITIAL LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Get Product ID
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = 'shop.html';
        return;
    }

    // 2. Fetch Data
    fetchProductData(productId);

    // 3. Render Reviews
    renderReviews();
});

// --- FETCH PRODUCT ---
function fetchProductData(id) {
    db.ref('products/' + id).once('value').then((snapshot) => {
        if (snapshot.exists()) {
            currentProduct = snapshot.val();
            currentProduct.id = id;
            checkCartState(currentProduct.title);
            renderProductPage(currentProduct);
        } else {
            document.getElementById('p-title').textContent = "Product Not Found";
        }
    });
}

function renderProductPage(p) {
    document.title = `${p.title} | TAPT.`;
    
    // Text Data
    document.getElementById('p-title').textContent = p.title;
    document.getElementById('p-price').textContent = `₹${p.price}`;
    
    // Badge
    const typeText = (p.type === 'tag' ? 'NFC TAG' : 'NFC CARD');
    document.getElementById('p-cat-badge').textContent = `${typeText} • ${p.category ? p.category.toUpperCase() : 'CUSTOM'}`;

    // Description (with line breaks)
    const descContainer = document.getElementById('p-desc');
    if (p.description) {
        descContainer.innerHTML = p.description.replace(/\n/g, '<br>');
    } else {
        descContainer.innerHTML = "Experience the future of networking. This premium NFC-enabled product allows you to share your digital identity with a single tap.";
    }

    // Images
    const mainImg = document.getElementById('main-image');
    const thumbStrip = document.getElementById('thumb-strip');
    const images = p.images || [];

    if(images.length > 0) {
        mainImg.src = images[0];
        thumbStrip.innerHTML = "";
        
        images.forEach((imgSrc, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgSrc;
            thumb.className = index === 0 ? 'thumb active' : 'thumb';
            thumb.onclick = () => {
                // Fade swap
                mainImg.style.opacity = 0;
                setTimeout(() => {
                    mainImg.src = imgSrc;
                    mainImg.style.opacity = 1;
                }, 200);
                document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            };
            thumbStrip.appendChild(thumb);
        });
    } else {
        mainImg.src = 'https://via.placeholder.com/500x500/111/333?text=TAPT';
    }
}

// --- CART LOGIC ---

// Check if already in cart
function checkCartState(title) {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    const existingItem = cart.find(item => item.title === title);
    if (existingItem) {
        cartQuantity = existingItem.quantity || 1;
        renderQuantityControl(cartQuantity);
    }
}

// Add to Bag Click
function startAddToCart() {
    if(!currentProduct) return;
    cartQuantity = 1;
    updateCartStorage(cartQuantity);
    renderQuantityControl(1);
    
    // Use the toggleCart from your main script.js if available
    if(typeof toggleCart === 'function') {
        toggleCart();
    }
}

// Show Quantity Buttons
function renderQuantityControl(qty) {
    const container = document.getElementById('add-btn-container');
    container.innerHTML = `
        <div class="qty-control">
            <button class="qty-btn" onclick="updateQuantity(-1)">−</button>
            <span class="qty-display">${qty}</span>
            <button class="qty-btn" onclick="updateQuantity(1)">+</button>
        </div>
    `;
}

// Update Quantity
function updateQuantity(change) {
    cartQuantity += change;
    if (cartQuantity <= 0) {
        cartQuantity = 0;
        removeFromCartStorage();
        revertToAddButton();
    } else {
        document.querySelector('.qty-display').textContent = cartQuantity;
        updateCartStorage(cartQuantity);
    }
}

// Revert to "Add to Bag"
function revertToAddButton() {
    const container = document.getElementById('add-btn-container');
    container.innerHTML = `<button class="btn-bag" id="btn-add-bag" onclick="startAddToCart()">Add to Bag</button>`;
}

// Local Storage Helpers
function updateCartStorage(qty) {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    const existingIndex = cart.findIndex(item => item.title === currentProduct.title);
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity = qty;
    } else {
        cart.push({
            title: currentProduct.title,
            price: currentProduct.price,
            image: currentProduct.images ? currentProduct.images[0] : null,
            quantity: qty
        });
    }
    localStorage.setItem('taptCart', JSON.stringify(cart));
    
    // Update global cart UI if function exists in script.js
    if(typeof updateCartCount === 'function') updateCartCount();
    if(typeof renderCartItems === 'function') renderCartItems();
}

function removeFromCartStorage() {
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    cart = cart.filter(item => item.title !== currentProduct.title);
    localStorage.setItem('taptCart', JSON.stringify(cart));
    
    if(typeof updateCartCount === 'function') updateCartCount();
    if(typeof renderCartItems === 'function') renderCartItems();
}

// --- BUTTONS ---
function buyNow() {
    if(!currentProduct) return;
    if (cartQuantity === 0) {
        updateCartStorage(1);
    }
    window.location.href = 'checkout.html';
}

function goToCustomize() {
    if(!currentProduct) return;
    const type = (currentProduct.type === 'tag') ? 'keychain' : 'card';
    sessionStorage.setItem('defaultMode', type);
    window.location.href = 'customize.html';
}

// --- REVIEWS ---
const reviewsData = [
    { name: "Rahul M.", text: "Absolutely insane quality. The black matte finish looks so professional.", rating: 5 },
    { name: "Sarah J.", text: "Works perfectly with my iPhone and Android. Setting up the link was super easy. 10/10.", rating: 5 },
    { name: "Armaan K.", text: "Got the keychain for my car keys. It's so convenient for sharing my playlist at parties.", rating: 5 },
    { name: "Priya S.", text: "Fast shipping and the packaging was premium. Felt like unboxing an Apple product.", rating: 4 },
    { name: "Vikram R.", text: "Great business tool. I don't carry paper cards anymore.", rating: 5 },
    { name: "Ananya D.", text: "Sleek, minimal, and functional. TAPT is the real deal.", rating: 5 }
];

function renderReviews() {
    const container = document.getElementById('reviews-container');
    container.innerHTML = "";
    // Randomize order for 'real' feel
    const shuffled = reviewsData.sort(() => 0.5 - Math.random());
    shuffled.slice(0, 3).forEach(r => {
        const stars = '<i class="fa-solid fa-star"></i>'.repeat(r.rating);
        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
            <div class="r-stars">${stars}</div>
            <div class="r-text">"${r.text}"</div>
            <div class="r-author">- ${r.name} <i class="fa-solid fa-circle-check" style="color:var(--tapt-gold); margin-left:5px;"></i></div>
        `;
        container.appendChild(card);
    });
}
