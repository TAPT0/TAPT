/* --- product.js | FINAL COMPLETE VERSION --- */

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    // Update the bag icon number immediately on load
    updateCartCount();

    if (!productId) {
        window.location.href = 'shop.html';
        return;
    }

    const db = firebase.firestore();
    let currentProduct = null;
    let cartQuantity = 0;

    // 1. Fetch Product Data
    db.collection("products").doc(productId).get().then((doc) => {
        if (doc.exists) {
            let data = doc.data();
            currentProduct = data;
            currentProduct.id = doc.id;
            
            // Handle naming differences
            currentProduct.name = data.title || data.name || "Unnamed Product"; 

            renderProductPage(currentProduct);
            checkCartState(currentProduct.id);
        } else {
            document.getElementById('p-title').textContent = "Product Not Found";
        }
    });

    function renderProductPage(p) {
        document.title = `${p.name} | TAPD.`;
        document.getElementById('p-title').textContent = p.name;
        document.getElementById('p-price').textContent = `₹${p.price}`;
        
        const descContainer = document.getElementById('p-desc');
        if (p.description && descContainer) {
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

    // 2. ADD TO CART LOGIC
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
        updateCartCount(); // Update the icon
        
        // Premium Popup
        showPremiumToast(currentProduct.name, "Added to your legacy.");
    };

    // 3. PREMIUM POPUP
    function showPremiumToast(title, subtitle) {
        const existing = document.getElementById('premium-toast');
        if(existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'premium-toast';
        toast.style.cssText = `
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(100px);
            background: rgba(15, 15, 15, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(212, 175, 55, 0.3); box-shadow: 0 10px 40px rgba(0,0,0,0.6);
            padding: 15px 25px; border-radius: 12px; display: flex; align-items: center; gap: 15px;
            z-index: 9999; transition: all 0.4s ease; opacity: 0; min-width: 300px;
        `;

        toast.innerHTML = `
            <div style="width: 35px; height: 35px; background: #D4AF37; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: black;">
                <i class="fa-solid fa-check"></i>
            </div>
            <div>
                <div style="color: #D4AF37; font-family: 'Syncopate', sans-serif; font-size: 0.75rem; font-weight: 700; margin-bottom: 2px;">ADDED TO BAG</div>
                <div style="color: #ccc; font-family: 'Inter', sans-serif; font-size: 0.85rem;">${title}</div>
            </div>
        `;

        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%) translateY(0)'; }, 10);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(50px)'; setTimeout(() => toast.remove(), 500); }, 3000);
    }

    // 4. CHECK CART STATE (On Load)
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
        if(container) {
            container.innerHTML = `
                <div class="qty-control">
                    <button class="qty-btn" onclick="updatePageQuantity(-1)">−</button>
                    <span class="qty-display">${qty}</span>
                    <button class="qty-btn" onclick="updatePageQuantity(1)">+</button>
                </div>
            `;
        }
    }

    // 5. UPDATE PAGE QUANTITY
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
            updateCartCount();
        }
    }

    // 6. REVIEWS & NAV
    window.buyNow = function() {
        if(!currentProduct) return;
        if(cartQuantity === 0) window.startAddToCart();
        window.location.href = 'checkout.html';
    };

    /* --- REPLACE IN product.js --- */

window.goToCustomize = function() {
    if(!currentProduct) return;
    
    // Save the type (card/tag) for the shape
    const type = (currentProduct.type === 'tag') ? 'keychain' : 'card';
    sessionStorage.setItem('defaultMode', type);

    // THE MAGIC: Pass the Product ID in the URL
    window.location.href = `customize.html?template=${currentProduct.id}`;
};
    const reviewContainer = document.getElementById('reviews-container');
    if(reviewContainer) {
        const reviewsData = [
            { name: "Rahul M.", text: "Absolutely insane quality.", rating: 5 },
            { name: "Sarah J.", text: "Works perfectly with my iPhone.", rating: 5 },
            { name: "Armaan K.", text: "The keychain is so convenient.", rating: 5 }
        ];
        reviewsData.forEach(r => {
            const card = document.createElement('div');
            card.className = 'review-card';
            card.innerHTML = `<div class="r-stars">${'<i class="fa-solid fa-star"></i>'.repeat(r.rating)}</div><div class="r-text">"${r.text}"</div><div class="r-author">- ${r.name}</div>`;
            reviewContainer.appendChild(card);
        });
    }
});

/* --- DRAWER LOGIC (GLOBAL) --- */
// This makes the bag icon work on the product page

function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.querySelector('.cart-overlay');
    
    if (drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        if(overlay) overlay.style.display = 'none';
    } else {
        renderCartContents(); 
        drawer.classList.add('open');
        if(overlay) overlay.style.display = 'block';
    }
}

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

function updateDrawerQty(index, change) {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    cart[index].qty += change;
    
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    
    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    renderCartContents(); 
    updateCartCount();    
    // Also update the main page button if we are looking at that product
    if(window.updatePageQuantity && document.getElementById('add-btn-container')) {
        location.reload(); // Simplest way to sync page state
    }
}

function removeCartItem(index) {
    let cart = JSON.parse(localStorage.getItem('TAPDCart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('TAPDCart', JSON.stringify(cart));
    renderCartContents();
    updateCartCount();
    if(window.updatePageQuantity && document.getElementById('add-btn-container')) {
        location.reload(); 
    }
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

function closeAllDrawers() {
    const drawer = document.getElementById('cart-drawer');
    if(drawer) drawer.classList.remove('open');
    const overlay = document.querySelector('.cart-overlay');
    if(overlay) overlay.style.display = 'none';
}
