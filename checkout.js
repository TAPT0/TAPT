/* =========================================
   CHECKOUT LOGIC
   ========================================= */

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

// MOCK COUPONS (In a real app, check Firebase DB)
const VALID_COUPONS = {
    'TAPT10': 0.10, // 10% off
    'WELCOME': 500  // Flat 500 off
};

document.addEventListener('DOMContentLoaded', () => {
    
    let cart = JSON.parse(localStorage.getItem('taptCart')) || [];
    let activeDiscount = 0;
    
    // Redirect if empty
    if (cart.length === 0) {
        window.location.href = 'shop.html';
        return;
    }

    // --- RENDER FUNCTION ---
    function renderSummary() {
        const list = document.getElementById('checkout-items-list');
        list.innerHTML = '';
        let subtotal = 0;

        cart.forEach((item, index) => {
            const lineTotal = item.price * item.qty;
            subtotal += lineTotal;
            const img = item.image || 'https://via.placeholder.com/60';

            const itemHTML = `
                <div class="c-item">
                    <img src="${img}" alt="${item.title}">
                    <div class="c-info">
                        <h4>${item.title}</h4>
                        <div class="qty-checkout-controls">
                            <button class="qty-mini-btn" onclick="changeCheckoutQty(${index}, -1)">-</button>
                            <span class="qty-val">${item.qty}</span>
                            <button class="qty-mini-btn" onclick="changeCheckoutQty(${index}, 1)">+</button>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <p style="color:white; font-size:0.9rem;">₹${lineTotal.toLocaleString()}</p>
                    </div>
                </div>
            `;
            list.insertAdjacentHTML('beforeend', itemHTML);
        });

        // CALCULATE TOTALS
        let finalTotal = subtotal - activeDiscount;
        if(finalTotal < 0) finalTotal = 0;

        document.getElementById('c-subtotal').textContent = "₹" + subtotal.toLocaleString();
        document.getElementById('c-total').textContent = "₹" + finalTotal.toLocaleString();
        
        if(activeDiscount > 0) {
            document.getElementById('discount-row').style.display = 'flex';
            document.getElementById('c-discount').textContent = "-₹" + activeDiscount.toLocaleString();
        } else {
            document.getElementById('discount-row').style.display = 'none';
        }
    }

    // --- QUANTITY LOGIC ---
    window.changeCheckoutQty = function(index, change) {
        cart[index].qty += change;
        if(cart[index].qty <= 0) {
            cart.splice(index, 1); // Remove item
        }
        
        localStorage.setItem('taptCart', JSON.stringify(cart));
        
        if(cart.length === 0) {
            window.location.href = 'shop.html';
        } else {
            renderSummary();
        }
    };

    // --- COUPON LOGIC ---
    document.getElementById('apply-coupon-btn').addEventListener('click', () => {
        const input = document.getElementById('coupon-code');
        const msg = document.getElementById('coupon-message');
        const code = input.value.toUpperCase().trim();
        
        // Calculate Subtotal for % calculation
        let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

        if(VALID_COUPONS.hasOwnProperty(code)) {
            const val = VALID_COUPONS[code];
            
            if(val < 1) { 
                // Percentage (e.g. 0.10)
                activeDiscount = Math.round(subtotal * val);
            } else {
                // Flat Amount
                activeDiscount = val;
            }

            msg.textContent = "Coupon Applied!";
            msg.className = "msg-success";
            renderSummary();
        } else {
            msg.textContent = "Invalid Code";
            msg.className = "msg-error";
            activeDiscount = 0;
            renderSummary();
        }
    });

    // --- PAYMENT HANDLING ---
    const paymentRadios = document.getElementsByName('payment');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const btn = document.getElementById('pay-btn');
            if(e.target.value === 'cod') {
                btn.textContent = "Place Order (COD)";
            } else {
                btn.textContent = "Pay Now";
            }
        });
    });

    // --- SUBMIT ORDER ---
    document.getElementById('checkout-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('pay-btn');
        const originalText = btn.innerText;
        btn.innerText = "Processing...";
        btn.disabled = true;

        // Get Selected Payment
        let paymentMethod = 'card';
        document.getElementsByName('payment').forEach(r => { if(r.checked) paymentMethod = r.value; });

        const orderData = {
            id: 'ORD-' + Date.now(),
            date: new Date().toISOString(),
            email: document.getElementById('email').value,
            paymentMethod: paymentMethod,
            shipping: {
                first: document.getElementById('f-name').value,
                last: document.getElementById('l-name').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                phone: document.getElementById('phone').value
            },
            items: cart,
            total: document.getElementById('c-total').innerText,
            status: paymentMethod === 'cod' ? 'pending_cod' : 'paid'
        };

        const db = firebase.database();
        db.ref('orders').push(orderData).then(() => {
            localStorage.removeItem('taptCart');
            document.getElementById('success-overlay').style.display = 'flex';
        }).catch(err => {
            alert("Error: " + err.message);
            btn.innerText = originalText;
            btn.disabled = false;
        });
    });

    // Initial Render
    renderSummary();
});
