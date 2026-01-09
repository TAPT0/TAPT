/* --- product.js | TAPD. Product Page (With Premium Popup) --- */

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = 'shop.html';
        return;
    }

    const db = firebase.firestore();
    let currentProduct = null;
    let cartQuantity = 0;

    // 1. Fetch Doc
    db.collection("products").doc(productId).get().then((doc) => {
        if (doc.exists) {
            let data = doc.data();
            currentProduct = data;
            currentProduct.id = doc.id;
            currentProduct.name = data.title || data.name || "Unnamed Product"; 

            renderProductPage(currentProduct);
            checkCartState(currentProduct.id);
        } else {
            document.getElementById('p-title').textContent = "Product Not Found";
        }
    });

    function renderProductPage(p) {
        document.title = `${p.name} | TAPT.`;
        document.getElementById('p-title').textContent = p.name;
        document.getElementById('p-price').textContent = `₹${p.price}`;
        
        const descContainer = document.getElementById('p-desc');
        if (p.description) {
            descContainer.innerHTML = p.description.replace(/\n/g, '<br>');
        }

        const mainImg = document.getElementById('main-image');
        const thumbStrip = document.getElementById('thumb-strip');
        
        let images = [];
        if(p.images && Array.isArray(p.images)) images = p.images;
        else if(p.image) images = [p.image];
        else if(p.productImage) images = [p.productImage];

        if(images.length > 0) {
            mainImg.src = images[0];
            thumbStrip.innerHTML = "";
            images.forEach((imgSrc, index) => {
                const thumb = document.createElement('img');
                thumb.src = imgSrc;
                thumb.className = index === 0 ? 'thumb active' : 'thumb';
                thumb.onclick = () => {
                    mainImg.style.opacity = 0;
                    setTimeout(() => { mainImg.src = imgSrc; mainImg.style.opacity = 1; }, 200);
                    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                };
                thumbStrip.appendChild(thumb);
            });
        }
        const spinner = document.querySelector('.loading-spinner');
        if(spinner) spinner.style.display = 'none';
    }

    // 2. ADD TO CART
    window.startAddToCart = function() {
        if(!currentProduct) return;

        let cart = JSON.parse(localStorage.getItem('TAPDCart')) || []; 
        
        let img = (currentProduct.images && currentProduct.images.length > 0) 
            ? currentProduct.images[0] 
            : (currentProduct.image || 'https://via.placeholder.com/300');

        let existingItem = cart.find(item => item.id === currentProduct.id);
        
        if(existingItem) {
            existingItem.qty += 1;
        } else {
            cart.push({
                id: currentProduct.id,
                name: currentProduct.name,
                price: Number(currentProduct.price),
                img: img,
                qty: 1
            });
        }

        localStorage.setItem('TAPDCart', JSON.stringify(cart)); 
        
        cartQuantity = (existingItem ? existingItem.qty : 1);
        renderQuantityControl(cartQuantity);
        
        // TRIGGER PREMIUM TOAST
        showPremiumToast(currentProduct.name, "Added to your legacy.");
    };

    // 3. PREMIUM POPUP FUNCTION
    function showPremiumToast(title, subtitle) {
        // Remove existing if any
        const existing = document.getElementById('premium-toast');
        if(existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'premium-toast';
        
        // Glassmorphism Style injected directly
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: rgba(15, 15, 15, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(212, 175, 55, 0.3);
            box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 20px rgba(212, 175, 55, 0.1);
            padding: 15px 25px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 9999;
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease;
            opacity: 0;
            min-width: 300px;
        `;

        toast.innerHTML = `
            <div style="
                width: 35px; height: 35px; 
                background: #D4AF37; 
                border-radius: 50%; 
                display: flex; justify-content: center; align-items: center;
                color: black; font-size: 1.2rem;
            ">
                <i class="fa-solid fa-check"></i>
            </div>
            <div>
                <div style="color: #D4AF37; font-family: 'Syncopate', sans-serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; margin-bottom: 2px;">
                    ADDED TO BAG
                </div>
                <div style="color: #ccc; font-family: 'Inter', sans-serif; font-size: 0.85rem;">
                    ${title}
                </div>
            </div>
        `;

        document.body.appendChild(toast);

        // Animate In
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);

        // Animate Out
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(50px)';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // 4. CHECK STATE
    function checkCartState(id) {
        let cart = JSON.parse(localStorage.getItem('TAPDCart')) || []; 
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            cartQuantity = existingItem.qty;
            renderQuantityControl(cartQuantity);
        }
    }

    function renderQuantityControl(qty) {
        const container = document.getElementById('add-btn-container');
        container.innerHTML = `
            <div class="qty-control">
                <button class="qty-btn" onclick="updatePageQuantity(-1)">−</button>
                <span class="qty-display">${qty}</span>
                <button class="qty-btn" onclick="updatePageQuantity(1)">+</button>
            </div>
        `;
    }

    // 5. UPDATE QTY
    window.updatePageQuantity = function(change) {
        let cart = JSON.parse(localStorage.getItem('TAPDCart')) || []; 
        let itemIndex = cart.findIndex(item => item.id === currentProduct.id);

        if (itemIndex > -1) {
            cart[itemIndex].qty += change;
            cartQuantity = cart[itemIndex].qty;

            if (cart[itemIndex].qty <= 0) {
                cart.splice(itemIndex, 1);
                cartQuantity = 0;
                document.getElementById('add-btn-container').innerHTML = `<button class="btn-bag" id="btn-add-bag" onclick="startAddToCart()">Add to Bag</button>`;
            } else {
                document.querySelector('.qty-display').textContent = cartQuantity;
            }
            localStorage.setItem('TAPDCart', JSON.stringify(cart)); 
        }
    }

    window.buyNow = function() {
        if(!currentProduct) return;
        if(cartQuantity === 0) window.startAddToCart();
        window.location.href = 'checkout.html';
    };

    window.goToCustomize = function() {
        if(!currentProduct) return;
        const type = (currentProduct.type === 'tag') ? 'keychain' : 'card';
        sessionStorage.setItem('defaultMode', type);
        window.location.href = 'customize.html';
    };

    // Reviews
    const reviewsData = [
        { name: "Rahul M.", text: "Absolutely insane quality.", rating: 5 },
        { name: "Sarah J.", text: "Works perfectly with my iPhone.", rating: 5 },
        { name: "Armaan K.", text: "The keychain is so convenient.", rating: 5 }
    ];
    const reviewContainer = document.getElementById('reviews-container');
    if(reviewContainer) {
        reviewsData.forEach(r => {
            const card = document.createElement('div');
            card.className = 'review-card';
            card.innerHTML = `<div class="r-stars">${'<i class="fa-solid fa-star"></i>'.repeat(r.rating)}</div><div class="r-text">"${r.text}"</div><div class="r-author">- ${r.name}</div>`;
            reviewContainer.appendChild(card);
        });
    }
});
