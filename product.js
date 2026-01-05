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

    // Fetch Doc
    db.collection("products").doc(productId).get().then((doc) => {
        if (doc.exists) {
            currentProduct = doc.data();
            currentProduct.id = doc.id;
            renderProductPage(currentProduct);
            checkCartState(currentProduct.title);
        } else {
            document.getElementById('p-title').textContent = "Product Not Found";
        }
    });

    function renderProductPage(p) {
        document.title = `${p.title} | TAPT.`;
        document.getElementById('p-title').textContent = p.title;
        document.getElementById('p-price').textContent = `₹${p.price}`;
        
        const descContainer = document.getElementById('p-desc');
        if (p.description) {
            descContainer.innerHTML = p.description.replace(/\n/g, '<br>');
        }

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

    window.startAddToCart = function() {
        if(!currentProduct) return;
        window.addToCart(currentProduct.title, currentProduct.price, currentProduct.images ? currentProduct.images[0] : null, currentProduct.id);
        cartQuantity = 1;
        renderQuantityControl(1);
    };

    function checkCartState(title) {
        let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
        const existingItem = cart.find(item => item.title === title);
        if (existingItem) {
            cartQuantity = existingItem.qty || 1;
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

    window.updatePageQuantity = function(change) {
        cartQuantity += change;
        if (cartQuantity <= 0) {
            window.removeFromCart(currentProduct.id);
            document.getElementById('add-btn-container').innerHTML = `<button class="btn-bag" id="btn-add-bag" onclick="startAddToCart()">Add to Bag</button>`;
        } else {
            document.querySelector('.qty-display').textContent = cartQuantity;
            window.updateQty(currentProduct.id, change);
        }
    }

    window.buyNow = function() {
        if(!currentProduct) return;
        if(cartQuantity === 0) window.addToCart(currentProduct.title, currentProduct.price, currentProduct.images ? currentProduct.images[0] : null, currentProduct.id);
        window.location.href = 'checkout.html';
    };

    window.goToCustomize = function() {
        if(!currentProduct) return;
        const type = (currentProduct.type === 'tag') ? 'keychain' : 'card';
        sessionStorage.setItem('defaultMode', type);
        window.location.href = 'customize.html';
    };

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
