document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('shop-grid');
    const searchInput = document.querySelector('.search-container input');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    if (grid) {
        let allProducts = [];
        grid.innerHTML = `<div class="loading-skeleton"><div class="skeleton-card"></div><div class="skeleton-card"></div></div>`;

        const db = firebase.firestore();
        db.collection("products").orderBy("createdAt", "desc").get().then((querySnapshot) => {
            grid.innerHTML = "";
            allProducts = [];
            
            if (querySnapshot.empty) {
                grid.innerHTML = "<p style='text-align:center; width:100%; color:#666;'>No products found.</p>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const p = doc.data();
                allProducts.push({ ...p, id: doc.id });
            });

            renderShopProducts(allProducts);
        });

        function renderShopProducts(products) {
            grid.innerHTML = "";
            if (products.length === 0) {
                grid.innerHTML = "<p style='text-align:center; width:100%; color:#666;'>No matches found.</p>";
                return;
            }

            products.forEach(p => {
                const img = (p.images && p.images[0]) ? p.images[0] : 'https://via.placeholder.com/300x300/111/333?text=TAPT';
                const typeLabel = p.category ? p.category.toUpperCase() : (p.type ? p.type.toUpperCase() : 'ITEM');

                const card = document.createElement('div');
                card.className = "product-card";
                card.onclick = (e) => {
                    if(e.target.closest('.add-icon')) return;
                    window.location.href = `product.html?id=${p.id}`;
                };

                card.innerHTML = `
                    <div class="card-image-wrapper">
                        <img src="${img}" alt="${p.title}" loading="lazy">
                    </div>
                    <div class="card-info">
                        <div class="p-category">${typeLabel}</div>
                        <div class="p-title">${p.title}</div>
                        <div class="p-footer">
                            <div class="p-price">₹${p.price}</div>
                            <div class="add-icon" onclick="addToCart('${p.title}', ${p.price}, '${img}', '${p.id}')">
                                <i class="fa-solid fa-plus"></i>
                            </div>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filterValue = btn.getAttribute('data-filter');
                filterGrid(filterValue, searchInput ? searchInput.value : '');
            });
        });

        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                const activeBtn = document.querySelector('.filter-btn.active');
                const filterType = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
                filterGrid(filterType, e.target.value);
            });
        }

        function filterGrid(type, searchTerm) {
            const term = searchTerm.toLowerCase();
            const filtered = allProducts.filter(p => {
                const pType = p.type ? p.type.toLowerCase() : '';
                const pCat = p.category ? p.category.toLowerCase() : '';
                
                // Matches either Type (card/tag) OR Category (social/review/etc)
                const matchesType = (type === 'all') || (pType.includes(type)) || (pCat.includes(type));
                const matchesSearch = p.title.toLowerCase().includes(term);
                return matchesType && matchesSearch;
            });
            renderShopProducts(filtered);
        }
    }
});
/* --- VARIABLES --- */
let allProducts = []; // Stores all data locally so filtering is instant
const db = firebase.firestore();

/* --- 1. LOAD PRODUCTS ON START --- */
function loadShopProducts() {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = "<p style='color:#666; text-align:center; width:100%;'>Loading collection...</p>";

    db.collection("products").get().then((querySnapshot) => {
        allProducts = []; // Reset cache
        
        querySnapshot.forEach((doc) => {
            let p = doc.data();
            p.id = doc.id; // Save ID for linking
            allProducts.push(p);
        });

        // Initially show ALL products
        renderGrid(allProducts);
    });
}

/* --- 2. RENDER THE GRID --- */
function renderGrid(productList) {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = "";

    if (productList.length === 0) {
        grid.innerHTML = "<p style='color:#666; text-align:center; width:100%;'>No products found.</p>";
        return;
    }

    productList.forEach(p => {
        // Use the first image or a placeholder
        let img = (p.images && p.images.length > 0) ? p.images[0] : 'placeholder.jpg';

        // Create Product Card HTML
        let html = `
            <div class="product-card">
                <div class="p-img-box">
                    <img src="${img}" alt="${p.title}">
                </div>
                <div class="p-details">
                    <h3>${p.title}</h3>
                    <p class="p-price">₹${p.price}</p>
                    <a href="product.html?id=${p.id}" class="buy-btn">View</a>
                </div>
            </div>
        `;
        grid.innerHTML += html;
    });
}

/* --- 3. FILTER FUNCTION --- */
function filterProducts(type, btnElement) {
    // 1. Update Buttons (Visuals)
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');

    // 2. Filter Data
    if (type === 'all') {
        renderGrid(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.type === type);
        renderGrid(filtered);
    }
}

// Start loading when page opens
window.onload = loadShopProducts;
