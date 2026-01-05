document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('shop-grid');
    const searchInput = document.querySelector('.search-container input');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    if (grid) {
        let allProducts = [];

        // 1. Show Skeleton immediately for perceived speed
        grid.innerHTML = `
            <div class="loading-skeleton">
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
            </div>
        `;

        // 2. Fetch Products via Firestore
        const db = firebase.firestore();
        db.collection("products").orderBy("createdAt", "desc").get().then((querySnapshot) => {
            grid.innerHTML = ""; // Clear loader
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

        // 3. Render Function
        function renderShopProducts(products) {
            grid.innerHTML = "";
            if (products.length === 0) {
                grid.innerHTML = "<p style='text-align:center; width:100%; color:#666;'>No matches found.</p>";
                return;
            }

            products.forEach(p => {
                const img = (p.images && p.images[0]) ? p.images[0] : 'https://via.placeholder.com/300x300/111/333?text=TAPT';
                const typeLabel = p.type ? p.type.toUpperCase() : 'ITEM';

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

        // 4. Filter Logic
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
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
                const matchesType = (type === 'all') || (pType.includes(type));
                const matchesSearch = p.title.toLowerCase().includes(term);
                return matchesType && matchesSearch;
            });
            renderShopProducts(filtered);
        }
    }
});
