let pageQty = 1;
let currentRotation = 0;
let isFloating = false;
let floatInterval;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    init3DViewer();
    updatePageQtyUI();
});

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
    // Product Details
    const product = {
        id: 'black-card-premium',
        title: 'Black Card Premium',
        price: 1999,
        image: 'https://via.placeholder.com/150/000000/FFFFFF?text=BLACK+CARD', // Replace with real image
        qty: pageQty
    };
    
    // Add to Global Cart (handled in script.js)
    // We need to loop because addToCart adds 1 or increments. 
    // Ideally script.js should support adding multiple.
    // We'll modify script.js or just loop here.
    
    // Better: Update addToCart in script.js to accept qty, but for now let's just push.
    // Actually, looking at script.js:
    // existingItem.qty++;
    // So we can manually update localStorage to be safe and efficient.
    
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    let existingItem = cart.find(i => i.id === product.id);
    
    if (existingItem) {
        existingItem.qty += pageQty;
    } else {
        cart.push(product);
    }
    
    localStorage.setItem('taptCart', JSON.stringify(cart));
    
    // Trigger UI Update
    if (window.updateCartUI) window.updateCartUI();
    
    // Open Cart
    if (window.toggleCart) window.toggleCart();
    
    // Reset Page Qty
    pageQty = 1;
    updatePageQtyUI();
};
