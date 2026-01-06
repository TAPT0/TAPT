document.addEventListener('DOMContentLoaded', () => {
    let currentMode = 'card';
    const prices = { card: 1999, keychain: 899 };

    // --- 1. DEFINE FUNCTIONS FIRST (Fixes "Not Defined" Error) ---
    
    window.setProductMode = function(mode) {
        currentMode = mode;
        const preview = document.getElementById('preview-obj');
        const btnCard = document.getElementById('btn-card');
        const btnTag = document.getElementById('btn-tag');
        const addBtn = document.getElementById('add-btn');
        const wifiIcon = document.querySelector('.wifi-icon');
        const hole = document.querySelector('.keychain-hole');
        
        if (mode === 'card') {
            btnCard.classList.add('active');
            btnTag.classList.remove('active');
            addBtn.textContent = `Add Card — ₹${prices.card}`;
            
            // Switch styles
            preview.classList.remove('mode-keychain');
            preview.classList.add('mode-card');
            if(wifiIcon) wifiIcon.style.display = 'block';
            if(hole) hole.style.display = 'none';
        } else {
            btnTag.classList.add('active');
            btnCard.classList.remove('active');
            addBtn.textContent = `Add Tag — ₹${prices.keychain}`;
            
            // Switch styles
            preview.classList.remove('mode-card');
            preview.classList.add('mode-keychain');
            if(wifiIcon) wifiIcon.style.display = 'none';
            if(hole) hole.style.display = 'block';
        }
        
        // Re-apply theme to ensure class consistency
        const currentTheme = document.getElementById('c-theme').value;
        updateSkin(currentTheme);
    };

    function updateSkin(theme) {
        const preview = document.getElementById('preview-obj');
        // Remove old skin classes
        preview.classList.remove('skin-black', 'skin-white', 'skin-gold');
        // Add new skin
        preview.classList.add(`skin-${theme}`);
    }

    // --- 2. INITIALIZATION ---
    
    const defaultMode = sessionStorage.getItem('defaultMode');
    if (defaultMode && (defaultMode === 'card' || defaultMode === 'keychain')) {
        setProductMode(defaultMode);
        sessionStorage.removeItem('defaultMode');
    } else {
        setProductMode('card');
    }

    // --- 3. EVENT LISTENERS ---

    // Theme Switcher
    document.getElementById('c-theme').addEventListener('change', (e) => {
        updateSkin(e.target.value);
    });

    // Live Text Editing
    const nameInput = document.getElementById('c-name');
    const roleInput = document.getElementById('c-role');
    const pName = document.getElementById('p-name');
    const pRole = document.getElementById('p-role');

    nameInput.addEventListener('input', (e) => {
        pName.textContent = e.target.value.trim() || 'YOUR NAME';
    });
    
    roleInput.addEventListener('input', (e) => {
        pRole.textContent = e.target.value.trim() || 'ROLE / TITLE';
    });

    // Logo Upload
    document.getElementById('c-logo-upload').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.getElementById('p-logo-preview');
                img.src = e.target.result;
                img.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });

    // Add to Cart Logic
    document.getElementById('add-btn').addEventListener('click', () => {
        const name = nameInput.value || 'Custom';
        const type = currentMode === 'card' ? 'Custom Card' : 'Custom Tag';
        const price = prices[currentMode];
        const theme = document.getElementById('c-theme').value;
        const logoSrc = document.getElementById('p-logo-preview').src;
        const hasLogo = document.getElementById('p-logo-preview').style.display === 'block';

        const fullTitle = `${type} (${theme}) - ${name}`;
        
        // Use a generic image for cart unless user uploaded a logo
        const displayImage = hasLogo ? logoSrc : (currentMode === 'card' ? 'https://via.placeholder.com/150/000000/FFFFFF/?text=CARD' : 'https://via.placeholder.com/150/000000/FFFFFF/?text=TAG');

        // Call global addToCart from script.js
        if(window.addToCart) {
            window.addToCart(fullTitle, price, displayImage);
        } else {
            alert("Cart system loading... please try again.");
        }
    });

    // --- 4. 3D TILT ANIMATION ---
    const stage = document.getElementById('card-stage');
    const obj = document.getElementById('preview-obj');
    const glare = document.getElementById('glare');

    if(stage && obj) {
        stage.addEventListener('mousemove', (e) => {
            const rect = stage.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xPct = x / rect.width;
            const yPct = y / rect.height;
            
            // Limit rotation to 20 degrees
            const xRot = (0.5 - yPct) * 20; 
            const yRot = (xPct - 0.5) * 20;

            obj.style.transform = `rotateX(${xRot}deg) rotateY(${yRot}deg)`;
            
            // Glare position
            if(glare) {
                glare.style.opacity = 1;
                glare.style.background = `linear-gradient(${105 + xRot * 2}deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 60%)`;
            }
        });

        stage.addEventListener('mouseleave', () => {
            obj.style.transform = `rotateX(0deg) rotateY(0deg)`;
            if(glare) glare.style.opacity = 0;
        });
    }
});
