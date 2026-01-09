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
            
            // Fix: Map 'title' to 'name' if needed, just like Shop page
            currentProduct.name = data.title || data.name || "Unnamed Product"; 

            renderProductPage(currentProduct);
            checkCartState(currentProduct.id); // Check by ID, not title
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
        
        // Handle Images Array vs Single String
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

    // 2. ADD TO CART (Fixed to match Shop Page)
    window.startAddToCart = function() {
        if(!currentProduct) return;

        let cart = JSON.parse(localStorage.getItem('TAPDCart')) || []; // CHANGED KEY
        
        // Use the first image
        let img = (currentProduct.images && currentProduct.images.length > 0) 
            ? currentProduct.images[0] 
            : (currentProduct.image || 'https://via.placeholder.com/300');

        // Check if exists
        let existingItem = cart.find(item => item.id === currentProduct.id);
        
        if(existingItem) {
            existingItem.qty += 1;
        } else {
            cart.push({
                id: currentProduct.id,
                name: currentProduct.name, // Ensure consistent naming
                price: Number(currentProduct.price),
                img: img,
                qty: 1
            });
        }

        localStorage.setItem('TAPDCart', JSON.stringify(cart)); // CHANGED KEY
        
        cartQuantity = (existingItem ? existingItem.qty : 1);
        renderQuantityControl(cartQuantity);
        
        // Optional: Show Toast
        if(window.showToast) window.showToast("Added to Bag");
        else alert("Added to Bag");
    };

    // 3. CHECK STATE (Fixed Key)
    function checkCartState(id) {
        let cart = JSON.parse(localStorage.getItem('TAPDCart')) || []; // CHANGED KEY
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

    // 4. UPDATE QUANTITY (Fixed Key)
    window.updatePageQuantity = function(change) {
        let cart = JSON.parse(localStorage.getItem('TAPDCart')) || []; // CHANGED KEY
        let itemIndex = cart.findIndex(item => item.id === currentProduct.id);

        if (itemIndex > -1) {
            cart[itemIndex].qty += change;
            cartQuantity = cart[itemIndex].qty;

            if (cart[itemIndex].qty <= 0) {
                cart.splice(itemIndex, 1); // Remove item
                cartQuantity = 0;
                document.getElementById('add-btn-container').innerHTML = `<button class="btn-bag" id="btn-add-bag" onclick="startAddToCart()">Add to Bag</button>`;
            } else {
                document.querySelector('.qty-display').textContent = cartQuantity;
            }
            
            localStorage.setItem('TAPDCart', JSON.stringify(cart)); // Save
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

    // Reviews (Static for now)
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
