/* =========================================
   CHECKOUT PAGE LOGIC
   ========================================= */

// 1. Firebase Config (Must match your other files)
const firebaseConfig = {
    apiKey: "AIzaSyBmCVQan3wclKDTG2yYbCf_oMO6t0j17wI",
    authDomain: "tapt-337b8.firebaseapp.com",
    databaseURL: "https://tapt-337b8-default-rtdb.firebaseio.com",
    projectId: "tapt-337b8",
    storageBucket: "tapt-337b8.firebasestorage.app",
    messagingSenderId: "887956121124",
    appId: "1:887956121124:web:6856680bf75aa3bacddab1",
    measurementId: "G-2CB8QXYNJY"
};
firebase.initializeApp(firebaseConfig);

document.addEventListener('DOMContentLoaded', () => {
    
    const checkoutForm = document.getElementById('checkout-form');
    const checkoutList = document.getElementById('checkout-items-list');
    
    // 2. Load Cart
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    
    // Redirect if empty
    if (cart.length === 0) {
        window.location.href = 'shop.html';
        return;
    }

    // 3. Render Items & Calculate Total
    let subtotal = 0;
    checkoutList.innerHTML = cart.map(item => {
        const lineTotal = item.price * item.qty;
        subtotal += lineTotal;
        const img = item.image || 'https://via.placeholder.com/60';
        
        return `
            <div class="c-item">
                <img src="${img}" alt="${item.title}">
                <div class="c-info">
                    <h4>${item.title} <span style="color:#666; font-size:0.8em;">x${item.qty}</span></h4>
                    <p>₹${lineTotal.toLocaleString()}</p>
                </div>
            </div>
        `;
    }).join('');

    // Update Total Display
    const totalEl = document.getElementById('c-total');
    if(totalEl) totalEl.textContent = `₹${subtotal.toLocaleString()}`;

    // 4. Handle Payment
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const btn = document.querySelector('.pay-btn');
        const originalText = btn.innerText;
        btn.innerText = "Processing...";
        btn.style.opacity = "0.7";

        // Gather Data
        const orderData = {
            id: 'ORD-' + Date.now(),
            date: new Date().toISOString(),
            email: document.getElementById('email').value,
            shipping: {
                first: document.getElementById('f-name').value,
                last: document.getElementById('l-name').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                phone: document.getElementById('phone').value
            },
            items: cart,
            total: subtotal,
            status: 'paid'
        };

        // Save to Firebase
        const db = firebase.database();
        db.ref('orders').push(orderData)
            .then(() => {
                // Success
                localStorage.removeItem('taptCart'); // Clear cart
                document.getElementById('success-overlay').classList.add('active');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 4000);
            })
            .catch((err) => {
                console.error(err);
                alert("Payment Error. Try again.");
                btn.innerText = originalText;
                btn.style.opacity = "1";
            });
    });
});
