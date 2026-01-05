document.addEventListener('DOMContentLoaded', () => { 
    const grid = document.getElementById('shop-grid'); // Ensure your shop.html uses id="shop-grid" for the container
    const productGridClass = document.querySelector('.product-grid'); // Fallback if you used class
    const targetGrid = grid || productGridClass;

    const searchInput = document.querySelector('.search-container input'); // Updated selector based on HTML structure
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    if (targetGrid) {
        let allProducts = [];

        // 1. Fetch Products
        if (typeof firebase !== 'undefined') {
            const db = firebase.database();
            db.ref('products').on('value', (snapshot) => {
                targetGrid.innerHTML = "";
                allProducts = [];
                
                if (!snapshot.exists()) {
                    targetGrid.innerHTML = "<p style='text-align:center; width:100%; color:#666;'>No products found.</p>";
                    return;
                }

                snapshot.forEach((child) => {
                    const p = child.val();
                    allProducts.push({ ...p, id: child.key });
                });

                renderShopProducts(allProducts);
            });
        }

        // 2. Render Function
        function renderShopProducts(products) {
            targetGrid.innerHTML = "";
            if (products.length === 0) {
                targetGrid.innerHTML = "<p style='text-align:center; width:100%; color:#666;'>No matches found.</p>";
                return;
            }

            products.forEach(p => {
                const img = (p.images && p.images[0]) ? p.images[0] : 'https://via.placeholder.com/300x300/111/333?text=TAPT';
                const typeLabel = p.type ? p.type.toUpperCase() : 'ITEM';

                const card = document.createElement('div');
                card.className = "product-card";
                
                // Clicking card goes to product page
                card.onclick = (e) => {
                    // Prevent redirect if clicking the add button
                    if(e.target.closest('.add-icon')) return;
                    window.location.href = `product.html?id=${p.id}`;
                };

                card.innerHTML = `
                    <div class="card-image-wrapper">
                        <img src="${img}" alt="${p.title}">
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
                targetGrid.appendChild(card);
            });
        }

        // 3. Filter Logic
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Assume buttons have data-filter="card", "tag", or "all"
                const filterValue = btn.textContent.toLowerCase().includes('card') ? 'card' : 
                                    btn.textContent.toLowerCase().includes('tag') ? 'tag' : 'all';
                filterGrid(filterValue, searchInput ? searchInput.value : '');
            });
        });

        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                const activeBtn = document.querySelector('.filter-btn.active');
                let filterType = 'all';
                if(activeBtn) {
                     filterType = activeBtn.textContent.toLowerCase().includes('card') ? 'card' : 
                                  activeBtn.textContent.toLowerCase().includes('tag') ? 'tag' : 'all';
                }
                filterGrid(filterType, e.target.value);
            });
        }

        function filterGrid(type, searchTerm) {
            const term = searchTerm.toLowerCase();
            const filtered = allProducts.filter(p => {
                const pType = p.type ? p.type.toLowerCase() : 'other';
                // Loose matching for types
                const matchesType = (type === 'all') || (pType.includes(type));
                const matchesSearch = p.title.toLowerCase().includes(term);
                return matchesType && matchesSearch;
            });
            renderShopProducts(filtered);
        }
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('shop-grid');
    
    // 1. Show Skeleton Loader immediately
    grid.innerHTML = `
        <div class="loading-skeleton">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        </div>
    `;

    // 2. Fetch Data
    const db = firebase.database();
    db.ref('products').once('value').then((snapshot) => {
        grid.innerHTML = ""; // Clear loader
        
        if (!snapshot.exists()) {
            grid.innerHTML = "<p style='color:#666; text-align:center;'>No products found.</p>";
            return;
        }

        snapshot.forEach((child) => {
            const p = child.val();
            // Use placeholder if image is missing to prevent broken layout
            const img = (p.images && p.images[0]) ? p.images[0] : 'https://via.placeholder.com/400x400/111/333?text=TAPT';
            const typeLabel = p.type ? p.type.toUpperCase() : 'ITEM';

            const card = document.createElement('div');
            card.className = "product-card";
            card.onclick = (e) => {
                if(e.target.closest('.add-icon')) return;
                window.location.href = `product.html?id=${child.key}`;
            };

            card.innerHTML = `
                <div class="card-image-wrapper">
                    <img src="${img}" alt="${p.title}" loading="lazy"> </div>
                <div class="card-info">
                    <div class="p-category">${typeLabel}</div>
                    <div class="p-title">${p.title}</div>
                    <div class="p-footer">
                        <div class="p-price">₹${p.price}</div>
                        <div class="add-icon" onclick="addToCart('${p.title}', ${p.price}, '${img}', '${child.key}')">
                            <i class="fa-solid fa-plus"></i>
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    });
});
