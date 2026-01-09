/* --- CLOUDINARY CONFIGURATION --- */
const cloudName = "dmsaqoa0l"; // Replace with your actual Cloud Name
const uploadPreset = "tapd_preset"; // Replace with your actual Preset Name

/* --- FIREBASE CONFIGURATION & SETUP --- */
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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

let allProductsCache = {};
let tempEditImages = [];
let unsubscribeProducts = null;
let unsubscribeOrders = null;
let unsubscribeCoupons = null;

/* --- AUTHENTICATION --- */
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("Logged in as:", user.email);
        const loginScreen = document.getElementById('login-screen');
        const dashboardUi = document.getElementById('dashboard-ui');
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboardUi) dashboardUi.style.display = 'flex';
        loadAllData();
    } else {
        console.log("No user.");
        const loginScreen = document.getElementById('login-screen');
        const dashboardUi = document.getElementById('dashboard-ui');
        if (loginScreen) loginScreen.style.display = 'flex';
        if (dashboardUi) dashboardUi.style.display = 'none';
    }
});

function checkAdmin() {
    const emailEl = document.getElementById('admin-email');
    const passEl = document.getElementById('admin-pass');
    
    if (!emailEl || !passEl) return;
    
    const email = emailEl.value;
    const pass = passEl.value;
    
    if(!email || !pass) { alert("Please enter both email and password."); return; }
    auth.signInWithEmailAndPassword(email, pass)
        .then(() => showToast("Login Successful"))
        .catch((error) => alert("Login Failed: " + error.message));
}

function logout() {
    auth.signOut().then(() => {
        if(unsubscribeProducts) unsubscribeProducts();
        if(unsubscribeOrders) unsubscribeOrders();
        if(unsubscribeCoupons) unsubscribeCoupons();
        location.reload();
    });
}

/* --- NAVIGATION & UTILS --- */
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    
    if(event && event.currentTarget) event.currentTarget.classList.add('active');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function loadAllData() {
    loadProducts();
    loadOrders();
    loadCoupons();
}

/* --- HELPERS --- */
const compressImage = (file, maxWidth, quality) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
});

function previewImages(input, divId) {
    const container = document.getElementById(divId);
    if (!container) return;
    
    container.innerHTML = "";
    if (input.files) {
        Array.from(input.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement("img");
                img.src = e.target.result;
                img.classList.add("img-thumb");
                const div = document.createElement("div");
                div.className = "img-thumb-container";
                div.appendChild(img);
                container.appendChild(div);
            }
            reader.readAsDataURL(file);
        });
    }
}

/* --- PRODUCT MANAGEMENT --- */
async function uploadProduct() {
    // Safety checks for elements
    const titleEl = document.getElementById('p-title');
    const descEl = document.getElementById('p-desc');
    const priceEl = document.getElementById('p-price');
    const categoryEl = document.getElementById('p-category');
    const typeEl = document.getElementById('p-type'); 
    const designJsonEl = document.getElementById('p-design-json');
    const imageUrlEl = document.getElementById('p-image-url');
    const statusText = document.getElementById('upload-status');

    if (!titleEl || !priceEl || !imageUrlEl) {
        console.error("Missing input elements in HTML");
        return;
    }

    const title = titleEl.value;
    const desc = descEl ? descEl.value : "";
    const price = priceEl.value;
    const category = categoryEl ? categoryEl.value : "custom";
    const type = typeEl ? typeEl.value : "card";
    const designJson = designJsonEl ? designJsonEl.value : "";
    const imageUrl = imageUrlEl.value;

    if(!title || !price || !imageUrl) {
        alert("Please fill all fields and upload an image via Cloudinary");
        return;
    }

    if (statusText) statusText.textContent = "Saving to Legacy...";
    
    db.collection("products").add({
        title: title,
        description: desc,
        price: parseFloat(price),
        category: category,
        type: type, 
        images: [imageUrl], // Saving the Cloudinary URL in an array
        designTemplate: designJson, 
        createdAt: new Date().toISOString()
    }).then(() => {
        if (statusText) statusText.textContent = "";
        showToast("Product Added!");
        // Clear form
        titleEl.value = "";
        if (descEl) descEl.value = "";
        priceEl.value = "";
        imageUrlEl.value = "";
        const preview = document.getElementById('add-preview');
        if (preview) preview.innerHTML = "";
    }).catch((error) => {
        if (statusText) statusText.textContent = "Error: " + error.message;
    });
}

function loadProducts() {
    const container = document.getElementById('products-list-container');
    if (!container) return;
    
    container.innerHTML = "<p style='color:#666;'>Loading inventory...</p>";
    
    unsubscribeProducts = db.collection("products").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        container.innerHTML = "";
        allProductsCache = {}; 

        if(snapshot.empty) {
            container.innerHTML = "<p style='color:#666;'>No products found.</p>";
            return;
        }
        
        snapshot.forEach((doc) => {
            const p = doc.data();
            const key = doc.id;
            allProductsCache[key] = p;

            const img = (p.images && p.images.length > 0) ? p.images[0] : '';
            
            const div = document.createElement('div');
            div.className = 'inventory-item';
            div.innerHTML = `
                <div class="inv-left">
                    <img src="${img}" class="inv-img">
                    <div class="inv-info">
                        <strong>${p.title}</strong>
                        <span>₹${p.price} | ${p.type ? p.type.toUpperCase() : 'CARD'}</span>
                    </div>
                </div>
                <div class="inv-actions">
                    <button class="btn-sm btn-edit" onclick="openEditModal('${key}')">MANAGE</button>
                    <button class="btn-sm btn-del" onclick="deleteProduct('${key}')">DELETE</button>
                </div>
            `;
            container.appendChild(div);
        });
    }, (error) => {
        console.error("Product Load Error:", error);
        container.innerHTML = "<p style='color:red'>Error loading products. Check permissions.</p>";
    });
}

function deleteProduct(key) {
    if(confirm("Delete this product permanently?")) {
        db.collection("products").doc(key).delete();
    }
}

/* --- EDIT PRODUCT (FIXED: Safe Checks) --- */
function openEditModal(key) {
    const product = allProductsCache[key];
    if(!product) return;

    // Helper to safely set values without crashing if ID is missing
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = val;
        } else {
            console.warn(`Admin.js Warning: Missing HTML element with ID '${id}'`);
        }
    };

    setVal('edit-key', key);
    setVal('edit-title', product.title || "");
    setVal('edit-desc', product.description || "");
    setVal('edit-price', product.price || "");
    setVal('edit-type', product.type || "card");
    setVal('edit-category', product.category || "custom");
    setVal('edit-design-json', product.designTemplate || ""); 
    
    tempEditImages = product.images ? [...product.images] : [];
    renderEditImages();
    
    // Safely clear inputs
    const newImagesInput = document.getElementById('edit-new-images');
    if (newImagesInput) newImagesInput.value = "";
    
    const newPreview = document.getElementById('edit-new-preview');
    if (newPreview) newPreview.innerHTML = "";

    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.classList.add('open');
    } else {
        console.error("Error: 'edit-modal' container not found in HTML.");
    }
}

function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) modal.classList.remove('open');
}

function renderEditImages() {
    const container = document.getElementById('edit-current-images');
    if (!container) return;
    
    container.innerHTML = "";
    
    tempEditImages.forEach((imgBase64, index) => {
        const div = document.createElement("div");
        div.className = "img-thumb-container";
        
        const img = document.createElement("img");
        img.src = imgBase64;
        img.className = "img-thumb";
        
        const btn = document.createElement("button");
        btn.className = "img-del-btn";
        btn.innerHTML = "&times;";
        btn.onclick = () => {
            tempEditImages.splice(index, 1);
            renderEditImages();
        };

        div.appendChild(img);
        div.appendChild(btn);
        container.appendChild(div);
    });
}

async function saveProductChanges() {
    const keyEl = document.getElementById('edit-key');
    const imgEl = document.getElementById('edit-image-url');
    
    if (!keyEl) return;
    
    const key = keyEl.value;
    const newImageUrl = imgEl ? imgEl.value : "";
    
    // Helper to safely get value
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : "";
    };

    const updatedData = {
        title: getVal('edit-title'),
        description: getVal('edit-desc'),
        price: parseFloat(getVal('edit-price') || 0),
        type: getVal('edit-type'),
        category: getVal('edit-category'),
        designTemplate: getVal('edit-design-json'), 
        updatedAt: new Date().toISOString()
    };

    // Only update the image if a new one was uploaded
    if (newImageUrl) {
        updatedData.images = [newImageUrl];
    }

    db.collection("products").doc(key).update(updatedData).then(() => {
        showToast("Product Updated!");
        if (imgEl) imgEl.value = ""; // Clear for next use
        closeEditModal();
    });
}

/* --- COUPONS --- */
function createCoupon() {
    const codeEl = document.getElementById('c-code');
    const typeEl = document.getElementById('c-type');
    const valueEl = document.getElementById('c-value');

    if (!codeEl || !valueEl) return;

    const code = codeEl.value.toUpperCase().trim();
    const type = typeEl ? typeEl.value : 'fixed';
    const value = valueEl.value;
    
    if(!code || !value) return alert("Enter details");
    
    db.collection("coupons").doc(code).set({ type, value: parseFloat(value) }).then(() => {
        showToast("Coupon Saved");
        codeEl.value = "";
        valueEl.value = "";
    });
}

function loadCoupons() {
    const tbody = document.getElementById('coupons-body');
    if (!tbody) return;

    unsubscribeCoupons = db.collection("coupons").onSnapshot((snap) => {
        tbody.innerHTML = "";
        snap.forEach((doc) => {
            const c = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color:var(--gold); font-weight:bold;">${doc.id}</td>
                <td>${c.type === 'percentage' ? c.value + '%' : '₹' + c.value} OFF</td>
                <td><button onclick="deleteCoupon('${doc.id}')" style="color:#f55;background:none;border:none;cursor:pointer;font-weight:bold;">DELETE</button></td>
            `;
            tbody.appendChild(tr);
        });
    });
}

function deleteCoupon(id) {
    if(confirm("Delete coupon?")) db.collection("coupons").doc(id).delete();
}

/* --- ORDERS (WITH TRACKING, STATUS & DELETE) --- */
function loadOrders() {
    const container = document.getElementById('orders-list-container');
    if (!container) return;

    container.innerHTML = '<p style="color:var(--gold);">Loading orders...</p>';

    unsubscribeOrders = db.collection("orders").orderBy("date", "desc").limit(30).onSnapshot((snapshot) => {
        container.innerHTML = "";
        
        if (snapshot.empty) {
            container.innerHTML = "<p>No orders found.</p>";
            return;
        }

        snapshot.forEach((doc) => {
            const order = doc.data();
            const orderId = doc.id;
            
            // Generate Items HTML
            let itemsHtml = "";
            if (order.items) {
                order.items.forEach(item => {
                    let downloadBtn = '';
                    
                    // 1. Download IMAGE
                    if (item.img && item.img.startsWith('data:image')) {
                        downloadBtn += `
                            <a href="${item.img}" download="Design_${orderId}_${item.name.replace(/\s+/g, '_')}.png" 
                               style="background:var(--gold); color:black; padding:5px 10px; text-decoration:none; font-weight:bold; font-size:0.7rem; border-radius:4px; margin-left:10px; display:inline-flex; align-items:center; gap:5px;">
                               <i class="fa-solid fa-image"></i> PNG
                            </a>
                        `;
                    }

                    // 2. Download JSON
                    if (item.designJson) {
                        const blob = new Blob([item.designJson], {type: "application/json"});
                        const url = URL.createObjectURL(blob);
                        downloadBtn += `
                            <a href="${url}" download="CODE_${orderId}.json" 
                               style="background:#333; color:white; padding:5px 10px; text-decoration:none; font-weight:bold; font-size:0.7rem; border-radius:4px; margin-left:5px; border:1px solid #555; display:inline-flex; align-items:center; gap:5px;">
                               <i class="fa-solid fa-code"></i> JSON
                            </a>
                        `;
                    }

                    itemsHtml += `
                        <div style="display:flex; gap:15px; margin-top:10px; background:#111; padding:10px; border-radius:6px; align-items:center; border:1px solid #333;">
                            <img src="${item.img}" style="width:50px; height:50px; object-fit:contain; background:#222; border-radius:4px; border:1px solid #444;">
                            <div style="flex:1;">
                                <div style="color:white; font-weight:bold; font-size:0.9rem;">${item.name}</div>
                                <div style="color:#888; font-size:0.8rem;">Qty: ${item.qty} | ₹${item.price}</div>
                            </div>
                            <div style="display:flex;">${downloadBtn}</div>
                        </div>
                    `;
                });
            }

            // Determine Status and Tracking for Inputs
            const currentStatus = order.status || 'Pending';
            const trackingVal = order.trackingId || '';

            // Build Order Card with Management Controls
            const orderCard = `
                <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333;">
                    <div style="display:flex; justify-content:space-between; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:15px;">
                        <div>
                            <span style="color:var(--gold); font-weight:bold; font-family:monospace; font-size:1.1rem;">#${orderId.substring(0,8).toUpperCase()}</span>
                            <span style="display:block; font-size:0.75rem; color:#666;">${new Date(order.date).toLocaleString()}</span>
                        </div>
                        <div style="text-align:right;">
                            <span style="background:${order.method==='cod'?'rgba(255,165,0,0.1)':'rgba(0,255,0,0.1)'}; color:${order.method==='cod'?'orange':'#00ff88'}; padding:4px 8px; border-radius:4px; font-size:0.75rem; border:1px solid ${order.method==='cod'?'rgba(255,165,0,0.3)':'rgba(0,255,0,0.3)'}; font-weight:bold;">
                                ${order.status || (order.method==='cod'?'PENDING (COD)':'PAID')}
                            </span>
                        </div>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; font-size:0.85rem; color:#ccc; margin-bottom:15px;">
                        <div>
                            <strong style="color:white; text-transform:uppercase; font-size:0.75rem;">Customer</strong><br>
                            ${order.customer['f-name']} ${order.customer['l-name']}<br>
                            ${order.customer.phone}<br>
                            ${order.customer.email}
                        </div>
                        <div>
                            <strong style="color:white; text-transform:uppercase; font-size:0.75rem;">Shipping Address</strong><br>
                            ${order.customer.address}<br>
                            ${order.customer.city}, ${order.customer.state} - ${order.customer.zip}
                        </div>
                    </div>

                    <div style="background:#050505; padding:10px; border-radius:6px; border:1px solid #222; margin-bottom:15px;">
                        ${itemsHtml}
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; padding-top:15px; border-top:1px solid #333;">
                        <div style="font-size:1.1rem; color:white;">
                            Total: <span style="color:var(--gold); font-weight:bold;">₹${order.total}</span> 
                        </div>
                    </div>

                    <div style="margin-top: 15px; background: #111; padding: 10px; border-radius: 6px; border: 1px solid #444; display: flex; align-items: center; gap: 10px; flex-wrap:wrap;">
                        <input type="text" id="track-${orderId}" placeholder="Tracking ID (e.g. DTDC123)" value="${trackingVal}" 
                               style="flex: 1; background: #000; border: 1px solid #444; color: white; padding: 10px; border-radius: 4px; font-size: 0.85rem;">
                        
                        <select id="status-${orderId}" style="background: #000; border: 1px solid #444; color: white; padding: 10px; border-radius: 4px; font-size: 0.85rem;">
                            <option value="Pending" ${currentStatus==='Pending'?'selected':''}>Pending</option>
                            <option value="Processing" ${currentStatus==='Processing'?'selected':''}>Processing</option>
                            <option value="Shipped" ${currentStatus==='Shipped'?'selected':''}>Shipped</option>
                            <option value="Delivered" ${currentStatus==='Delivered'?'selected':''}>Delivered</option>
                            <option value="Cancelled" ${currentStatus==='Cancelled'?'selected':''}>Cancelled</option>
                        </select>

                        <button onclick="updateOrder('${orderId}')" style="background: #00aa55; color: white; border: none; padding: 10px 15px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size:0.8rem;">
                            <i class="fa-solid fa-floppy-disk"></i> UPDATE
                        </button>
                        
                        <button onclick="deleteOrder('${orderId}')" style="background: #aa2222; color: white; border: none; padding: 10px 15px; border-radius: 4px; font-weight: bold; cursor: pointer;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            container.innerHTML += orderCard;
        });
    });
}

// Function to Update Order Status & Tracking
function updateOrder(orderId) {
    const trackEl = document.getElementById(`track-${orderId}`);
    const statusEl = document.getElementById(`status-${orderId}`);

    if(!trackEl || !statusEl) return;

    db.collection("orders").doc(orderId).update({
        trackingId: trackEl.value,
        status: statusEl.value
    }).then(() => {
        showToast("Order Updated Successfully");
    }).catch(err => {
        console.error(err);
        alert("Error updating order: " + err.message);
    });
}

// Function to Delete Order
function deleteOrder(orderId) {
    if(confirm("⚠️ ARE YOU SURE? \n\nThis will permanently delete this order record from the database. This action cannot be undone.")) {
        db.collection("orders").doc(orderId).delete().then(() => {
            showToast("Order Deleted");
        }).catch(err => {
            alert("Error deleting: " + err.message);
        });
    }
}

/* --- CLOUDINARY WIDGET SETUP --- */

// Widget for ADDING new products
var myWidget = cloudinary.createUploadWidget({
    cloudName: cloudName, 
    uploadPreset: uploadPreset,
    theme: "minimal",
    colors: { action: "#D4AF37", complete: "#20B832" }
}, (error, result) => { 
    if (!error && result && result.event === "success") { 
        const imageUrl = result.info.secure_url;
        const urlInput = document.getElementById('p-image-url');
        const preview = document.getElementById('add-preview');
        
        if (urlInput) urlInput.value = imageUrl; 
        if (preview) preview.innerHTML = `<img src="${imageUrl}" class="img-thumb">`;
        showToast("High-Res Image Ready");
    }
});

// Widget for EDITING existing products
var editWidget = cloudinary.createUploadWidget({
    cloudName: cloudName, 
    uploadPreset: uploadPreset,
    theme: "minimal",
    colors: { action: "#D4AF37", complete: "#20B832" }
}, (error, result) => { 
    if (!error && result && result.event === "success") { 
        const imageUrl = result.info.secure_url;
        const urlInput = document.getElementById('edit-image-url');
        const container = document.getElementById('edit-current-images');
        
        if (urlInput) urlInput.value = imageUrl;
        if (container) container.innerHTML = `<img src="${imageUrl}" class="img-thumb">`;
        showToast("Update Image Ready");
    }
});

// Attach listeners to buttons (FIXED: Safe Checks)
const uploadBtn = document.getElementById("upload_widget");
if (uploadBtn) {
    uploadBtn.addEventListener("click", () => myWidget.open(), false);
} else {
    // console.warn("Upload widget button not found");
}

const editUploadBtn = document.getElementById("edit_upload_widget");
if (editUploadBtn) {
    editUploadBtn.addEventListener("click", () => editWidget.open(), false);
} else {
    // console.warn("Edit upload widget button not found");
}
