/* --- GLOBAL VARIABLES --- */
let allProductsCache = [];
let currentFilterType = 'all';
let currentSearchTerm = '';
const db = firebase.firestore();

/* --- 1. INITIALIZATION --- */
document.addEventListener('DOMContentLoaded', () => {
    // Load products immediately
    loadShopProducts();

    // Setup Search Listener
    const searchInput = document.getElementById('shop-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value.toLowerCase().trim();
            applyFilters(); // Re-run filters whenever user types
        });
    }
});

/* --- 2. LOAD PRODUCTS --- */
function loadShopProducts() {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;

    // Show loading state
    grid.innerHTML = '<div style="color:#666; text-align:center; width:100%; margin-top:50px; font-family:\'Inter\'">Loading Collection...</div>';

    db.collection("products").orderBy("createdAt", "desc").get().then((querySnapshot) => {
        allProductsCache = []; // Reset cache
        
        querySnapshot.forEach((doc) => {
            let p = doc.data();
            p.id = doc.id; // Save ID for linking
            allProductsCache.push(p);
        });

        // Initial Render (Show All)
        applyFilters(); 
    }).catch((error) => {
        console.error("Error loading products:", error);
        grid.innerHTML = '<div style="color:red; text-align:center; width:100%;">Error loading products.</div>';
    });
}

/* --- 3. FILTER LOGIC (Called by Buttons) --- */
function filterProducts(type, btnElement) {
    // 1. Update Button Visuals
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (btnElement) {
        btnElement.classList.add('active');
    }

    // 2. Set Filter State
    currentFilterType = type;

    // 3. Apply changes
    applyFilters();
}

/* --- 4. MASTER FILTER (Combines Type + Search) --- */
function applyFilters() {
    let filtered = allProductsCache;

    // A. Filter by Type (Card vs Tag)
    if (currentFilterType !== 'all') {
        filtered = filtered.filter(p => {
            // Check 'type' field safely
            const pType = p.type ? p.type.toLowerCase() : '';
            return pType === currentFilterType;
        });
    }

    // B. Filter by Search Term
    if (currentSearchTerm !== '') {
        filtered = filtered.filter(p => {
            const title = p.title ? p.title.toLowerCase() : '';
            const category = p.category ? p.category.toLowerCase() : '';
            return title.includes(currentSearchTerm) || category.includes(currentSearchTerm);
        });
    }

    // C. Render Result
    renderGrid(filtered);
}

/* --- 5. RENDER GRID --- */
function renderGrid(productList) {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = "";

    if (productList.length === 0) {
        grid.innerHTML = '<div style="color:#666; text-align:center; width:100%; margin-top:50px;">No items match your search.</div>';
        return;
    }

    productList.forEach(p => {
        // Use first image or placeholder
        let img = (p.images && p.images.length > 0) ? p.images[0] : 'assets/placeholder.jpg';
        let categoryLabel = p.category ? p.category : (p.type ? p.type.toUpperCase() : 'NFC');

        let html = `
            <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
                <div class="p-img-box">
                    <img src="${img}" alt="${p.title}" loading="lazy">
                </div>
                <div class="p-details">
                    <div class="p-info">
                        <h3>${p.title}</h3>
                        <p class="p-cat">${categoryLabel}</p>
                    </div>
                    <div class="p-price">₹${p.price}</div>
                </div>
            </div>
        `;
        grid.innerHTML += html;
    });
}
