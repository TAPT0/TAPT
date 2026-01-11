/* --- track.js --- */

let threeJsScene = null; // For 3D preview

// 1. CONFIGURATION
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

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. MAIN FUNCTION
function trackOrder() {
    const inputVal = document.getElementById('order-input').value.trim();
    const resultDiv = document.getElementById('track-result');
    const errorMsg = document.getElementById('error-msg');
    
    if(!inputVal) return;

    // Reset UI
    resultDiv.style.display = 'none';
    errorMsg.style.display = 'none';

    db.collection("orders").doc(inputVal).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            renderOrder(doc.id, data);
        } else {
            errorMsg.innerText = "Order ID not found. Please check and try again.";
            errorMsg.style.display = 'block';
        }
    }).catch((error) => {
        console.error("Error:", error);
        errorMsg.innerText = "System Error. Try again later.";
        errorMsg.style.display = 'block';
    });
}

// 3. RENDER UI
function renderOrder(id, data) {
    const resultDiv = document.getElementById('track-result');
    
    // Fill Basic Info
    document.getElementById('res-id').innerText = "#" + id.substring(0,8).toUpperCase();
    document.getElementById('res-date').innerText = new Date(data.date).toLocaleDateString();
    document.getElementById('res-method').innerText = data.method === 'cod' ? 'Cash on Delivery' : 'Prepaid';
    document.getElementById('res-total').innerText = "₹" + data.total;

    // Tracking Number
    const trackId = data.trackingId || "Processing...";
    document.getElementById('res-tracking').innerText = trackId;

    // Render Items
    const itemsContainer = document.getElementById('res-items');
    itemsContainer.innerHTML = '';
    let previewShown = false;
    data.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-mini';
        
        let displayImage = item.img || 'img/placeholder.png';
        if(item.designJson) {
            try {
                const design = JSON.parse(item.designJson);
                if(design.preview) displayImage = design.preview;
                
                if (!previewShown) {
                    show3DPreview(item.designJson);
                    previewShown = true;
                }
            } catch(e) { console.error("Error parsing designJson", e); }
        } else if (!previewShown) {
            // Fallback to showing 3D of the first item even if no designJson
            show3DPreview(JSON.stringify({ preview: displayImage, productType: 'card' }));
            previewShown = true;
        }

        div.innerHTML = `
            <img src="${displayImage}" alt="Product">
            <div style="flex:1;">
                <div style="color:white; font-size:0.9rem;">${item.name}</div>
                <div style="color:#666; font-size:0.8rem;">Qty: ${item.qty}</div>
            </div>
            <div style="color:var(--tapd-gold);">₹${item.price}</div>
        `;
        itemsContainer.appendChild(div);
    });

    // Update Progress Bar
    updateProgressBar(data.status || (data.method === 'cod' ? 'Pending' : 'Processing'));

    // Show Result
    resultDiv.style.display = 'block';
}

function show3DPreview(designJson) {
    const container = document.getElementById('track-3d-preview');
    if (!container || !window.THREE) return;

    container.style.display = 'block';
    
    if(threeJsScene) {
        while(threeJsScene.scene.children.length > 0){ 
            threeJsScene.scene.remove(threeJsScene.scene.children[0]); 
        }
    } else {
        threeJsScene = init3DTrack(container);
    }

    const { scene, camera, renderer } = threeJsScene;

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.7);
    directional.position.set(3, 8, 5);
    scene.add(directional);

    let designData;
    try { designData = JSON.parse(designJson); } catch(e) { return; }

    if (!designData.preview) return;

    const loader = new THREE.TextureLoader();
    loader.load(designData.preview, function(texture) {
        texture.encoding = THREE.sRGBEncoding;
        const material = new THREE.MeshStandardMaterial({ 
            map: texture,
            metalness: 0.2,
            roughness: 0.6
        });
        
        const isCard = designData.productType === 'card';
        const geometry = isCard 
            ? new THREE.BoxGeometry(3, 1.8, 0.05) 
            : new THREE.CylinderGeometry(1.2, 1.2, 0.1, 64);

        const model = new THREE.Mesh(geometry, material);
        scene.add(model);

        let rotationY = model.rotation.y;
        function animate() {
            const animationId = requestAnimationFrame(animate);
            if (!threeJsScene.isAnimating) {
                cancelAnimationFrame(animationId);
                return;
            }
            rotationY += 0.005;
            model.rotation.y = rotationY;
            renderer.render(scene, camera);
        }
        threeJsScene.isAnimating = true;
        animate();
    }, undefined, function(err) {
        console.error('An error occurred loading the texture: ', err);
    });
}

function init3DTrack(container) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    
    camera.position.z = 3;

    window.addEventListener('resize', () => {
        if (!container.clientWidth || !container.clientHeight) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    return { scene, camera, renderer, isAnimating: false };
}

function updateProgressBar(status) {
    const steps = ['pending', 'processing', 'shipped', 'delivered'];
    const trackEl = document.getElementById('progress-track');
    const cancelledMsg = document.getElementById('cancelled-msg');

    // Reset Classes
    steps.forEach(s => document.getElementById('step-'+s).classList.remove('active'));
    
    if(status === 'Cancelled') {
        trackEl.style.display = 'none';
        cancelledMsg.style.display = 'block';
        return;
    } else {
        trackEl.style.display = 'block';
        cancelledMsg.style.display = 'none';
    }

    // Determine Index (Default to 0/Pending)
    let statusIndex = 0;
    if(status === 'Processing') statusIndex = 1;
    if(status === 'Shipped') statusIndex = 2;
    if(status === 'Delivered') statusIndex = 3;

    // Light up steps up to current index
    for(let i=0; i<=statusIndex; i++) {
        document.getElementById('step-' + steps[i]).classList.add('active');
    }
}

// Allow "Enter" key to search
document.getElementById('order-input').addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        trackOrder();
    }
});
