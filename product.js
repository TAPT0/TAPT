let pageQty = 1;
let currentRotation = 0;
let isFloating = false;
let floatInterval;
let currentProductData = null; // Store fetched product data

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    init3DViewer();
    updatePageQtyUI();
    loadProductDetails(); // New function call
});

/* =========================================
   0. PRODUCT DATA FETCHING (NEW)
   ========================================= */
async function loadProductDetails() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    // Default to a known ID or fetch the most recent one if no ID provided
    let query = db.collection('products');
    
    if (productId) {
        query = query.doc(productId);
    } else {
        // Fallback: Get the most recent product
        query = query.orderBy('createdAt', 'desc').limit(1);
    }

    try {
        let doc;
        if (productId) {
            doc = await query.get();
        } else {
            const snapshot = await query.get();
            if (!snapshot.empty) {
                doc = snapshot.docs[0];
            }
        }

        if (doc && doc.exists) {
            const data = doc.data();
            data.id = doc.id; // Ensure ID is part of data
            currentProductData = data;
            renderProductPage(data);
        } else if (doc && !productId) {
             // Handled inside renderProductPage if data is passed, 
             // but here doc is a QueryDocumentSnapshot if from query
             const data = doc.data();
             data.id = doc.id;
             currentProductData = data;
             renderProductPage(data);
        } else {
            console.error("Product not found");
            document.getElementById('dynamic-title').innerText = "PRODUCT NOT FOUND";
        }
    } catch (error) {
        console.error("Error loading product:", error);
        // If error (e.g., offline), maybe show fallback content or hardcoded default
        renderProductPage({
            id: 'black-card-premium',
            title: 'Black Card Premium',
            price: 1999,
            description: 'Forged from premium matte PVC with a soft-touch finish. Embedded with a high-frequency NFC chip for instant data transfer. No app required for the receiver.',
            features: ['NFC Enabled', 'iOS & Android', 'Waterproof'],
            image: 'https://via.placeholder.com/150/000000/FFFFFF?text=BLACK+CARD'
        });
    }
}

function renderProductPage(data) {
    // 0. Detect Product Type & Apply Shape
    const cardWrapper = document.getElementById('card-wrapper');
    let productType = data.type || 'card'; // Default to card
    
    // Fallback detection if type is not explicitly set
    if (!data.type) {
        if (data.title && (data.title.toLowerCase().includes('tag') || data.title.toLowerCase().includes('button'))) {
            productType = 'tag';
        } else if (data.id && data.id.toLowerCase().includes('tag')) {
            productType = 'tag';
        }
    }

    if (cardWrapper) {
        if (productType === 'tag') {
            cardWrapper.classList.add('shape-tag');
        } else {
            cardWrapper.classList.remove('shape-tag');
        }
    }

    // 1. Title & Subtitle
    const titleEl = document.getElementById('dynamic-title');
    const subEl = document.getElementById('dynamic-subtitle');
    
    if(titleEl) {
        titleEl.innerText = data.title;
        titleEl.setAttribute('data-text', data.title);
    }
    
    // Generate a subtitle if missing
    if(subEl) {
        subEl.innerText = productType === 'tag' ? "The Premium Smart Tag." : "The Last Business Card You'll Ever Need.";
    }

    // 2. Price
    const priceEl = document.getElementById('dynamic-price');
    if(priceEl) priceEl.innerText = data.price.toLocaleString();

    // 3. Description
    const descEl = document.getElementById('dynamic-description');
    if(descEl) descEl.innerText = data.description || "No description available.";

    // 4. Features (Dynamic or Static Defaults)
    const featContainer = document.getElementById('dynamic-features');
    if(featContainer) {
        featContainer.innerHTML = ''; // Clear loading
        const feats = [
            { icon: 'fa-solid fa-wifi', text: 'NFC Enabled' },
            { icon: 'fa-brands fa-apple', text: 'iOS & Android' },
            { icon: 'fa-solid fa-droplet', text: 'Waterproof' }
        ];
        
        feats.forEach(f => {
            featContainer.innerHTML += `
                <div class="feat-item"><i class="${f.icon}"></i> ${f.text}</div>
            `;
        });
    }

    // 5. Update 3D Card Images (Dynamic)
    const frontImg = document.getElementById('card-front-img');
    const backImg = document.getElementById('card-back-img');

    // Resolve Front Image
    let fSrc = data.frontImage;
    if (!fSrc && data.images && data.images.length > 0) fSrc = data.images[0];
    if (!fSrc && data.image) fSrc = data.image;

    if (fSrc && frontImg) {
        frontImg.src = fSrc;
        frontImg.style.display = 'block';
    }

    // Resolve Back Image
    let bSrc = data.backImage;
    if (!bSrc && data.images && data.images.length > 1) bSrc = data.images[1];
    
    if (bSrc && backImg) {
        backImg.src = bSrc;
        backImg.style.display = 'block';
    }

    // 7. Load Reviews
    if (data.id) {
        loadReviews(data.id);
    }
}

/* =========================================
   1. 3D INTERACTION LOGIC
   ========================================= */
function init3DViewer() {
    const cardWrapper = document.getElementById('card-wrapper');
    const container = document.querySelector('.product-visual');
    
    // Mouse Move Parallax
    container.addEventListener('mousemove', (e) => {
        if (isFloating) return; // Disable mouse move if floating animation is active
        
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = -((y - centerY) / 20);
        const rotateY = ((x - centerX) / 20) + currentRotation;
        
        cardWrapper.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    container.addEventListener('mouseleave', () => {
        if (isFloating) return;
        cardWrapper.style.transform = `rotateX(0deg) rotateY(${currentRotation}deg)`;
    });
}

window.rotateCard = function(view) {
    const cardWrapper = document.getElementById('card-wrapper');
    const btns = document.querySelectorAll('.v-btn');
    
    btns.forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    if (view === 'float') {
        isFloating = true;
        cardWrapper.style.animation = 'floatCard 6s ease-in-out infinite';
        return;
    }

    isFloating = false;
    cardWrapper.style.animation = '';
    
    if (view === 'front') {
        currentRotation = 0;
    } else if (view === 'back') {
        currentRotation = 180;
    }
    
    cardWrapper.style.transform = `rotateX(0deg) rotateY(${currentRotation}deg)`;
};

// Add Float Keyframes dynamically
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes floatCard {
        0% { transform: translateY(0px) rotateY(${currentRotation}deg); }
        50% { transform: translateY(-20px) rotateY(${currentRotation + 5}deg); }
        100% { transform: translateY(0px) rotateY(${currentRotation}deg); }
    }
`;
document.head.appendChild(styleSheet);


/* =========================================
   2. CART & QUANTITY LOGIC
   ========================================= */
window.adjustPageQty = function(change) {
    pageQty += change;
    if (pageQty < 1) pageQty = 1;
    updatePageQtyUI();
};

function updatePageQtyUI() {
    document.getElementById('page-qty').innerText = pageQty;
}

window.addToBag = function() {
    if (!currentProductData) {
        alert("Product data is loading. Please wait...");
        return;
    }
    
    // Use the global cart function if available, or simpler implementation
    if (typeof window.addToCart === 'function') {
        window.addToCart(currentProductData.id, pageQty);
    } else {
        // Fallback: Add to local storage manually
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item.id === currentProductData.id);
        
        if (existingItem) {
            existingItem.quantity += pageQty;
        } else {
            cart.push({
                id: currentProductData.id,
                title: currentProductData.title,
                price: currentProductData.price,
                image: currentProductData.image || currentProductData.frontImage, // Use frontImage if image is missing
                quantity: pageQty
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount(); // Assuming this is in script.js
        toggleCart(); // Open cart drawer
    }
};

/* =========================================
   3. REVIEWS LOGIC
   ========================================= */
async function loadReviews(productId) {
    const listEl = document.getElementById('reviews-list');
    if(!listEl) return;
    
    listEl.innerHTML = '<div style="text-align:center; color:#888; padding: 20px;">Loading reviews...</div>';

    try {
        const snapshot = await db.collection('reviews')
            .where('productId', '==', productId)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        if (snapshot.empty) {
            listEl.innerHTML = '<div style="text-align:center; color:#888; padding: 20px;">No reviews yet. Be the first!</div>';
            return;
        }

        listEl.innerHTML = '';
        snapshot.forEach(doc => {
            const r = doc.data();
            const date = r.createdAt ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : 'Just now';
            const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
            
            const item = document.createElement('div');
            item.className = 'review-card';
            item.innerHTML = `
                <div class="review-header">
                    <span class="reviewer-name">${r.userName || 'Anonymous'}</span>
                    <span class="review-date">${date}</span>
                </div>
                <div class="star-rating">${stars}</div>
                <div class="review-text">${r.text}</div>
            `;
            listEl.appendChild(item);
        });

    } catch (error) {
        console.error("Error loading reviews:", error);
        // Sometimes indexes are required for compound queries (where + orderBy)
        // If that fails, try simple load without order by first
        try {
            const snapshotFallback = await db.collection('reviews')
                .where('productId', '==', productId)
                .get();
            
            if (snapshotFallback.empty) {
                listEl.innerHTML = '<div style="text-align:center; color:#888; padding: 20px;">No reviews yet. Be the first!</div>';
                return;
            }

            listEl.innerHTML = '';
            snapshotFallback.forEach(doc => {
                 const r = doc.data();
                 // ... same render ...
                 const date = r.createdAt ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : 'Just now';
                 const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
                
                 const item = document.createElement('div');
                 item.className = 'review-card';
                 item.innerHTML = `
                    <div class="review-header">
                        <span class="reviewer-name">${r.userName || 'Anonymous'}</span>
                        <span class="review-date">${date}</span>
                    </div>
                    <div class="star-rating">${stars}</div>
                    <div class="review-text">${r.text}</div>
                `;
                listEl.appendChild(item);
            });
            
        } catch (e2) {
             console.error("Fallback error:", e2);
             listEl.innerHTML = '<div style="text-align:center; color:#red; padding: 20px;">Failed to load reviews.</div>';
        }
    }
}

window.handleReviewSubmit = async function(e) {
    e.preventDefault();
    if (!currentProductData || !currentProductData.id) {
        alert("Product not loaded properly.");
        return;
    }

    const name = document.getElementById('review-name').value;
    const rating = parseInt(document.getElementById('review-rating').value);
    const text = document.getElementById('review-text').value;
    const btn = document.querySelector('.submit-review-btn');

    btn.disabled = true;
    btn.innerText = "Submitting...";

    try {
        await db.collection('reviews').add({
            productId: currentProductData.id,
            userName: name,
            rating: rating,
            text: text,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Reset form
        document.getElementById('review-form').reset();
        btn.innerText = "SUBMIT REVIEW";
        btn.disabled = false;
        
        // Reload reviews
        loadReviews(currentProductData.id);
        alert("Review submitted successfully!");

    } catch (error) {
        console.error("Error submitting review:", error);
        alert("Failed to submit review. Please try again.");
        btn.disabled = false;
        btn.innerText = "SUBMIT REVIEW";
    }
};
