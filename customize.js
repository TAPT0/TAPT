document.addEventListener('DOMContentLoaded', () => {
    let currentMode = 'card';
    const prices = { card: 1999, keychain: 899 };

    // 1. Initialize
    const defaultMode = sessionStorage.getItem('defaultMode');
    if(defaultMode && (defaultMode === 'card' || defaultMode === 'keychain')) {
        setProductMode(defaultMode);
        sessionStorage.removeItem('defaultMode');
    } else {
        setProductMode('card');
    }

    // 2. Mode Switcher
    window.setProductMode = function(mode) {
        currentMode = mode;
        const preview = document.getElementById('preview-obj');
        const btnCard = document.getElementById('btn-card');
        const btnTag = document.getElementById('btn-tag');
        const addBtn = document.getElementById('add-btn');
        
        if(mode === 'card') {
            btnCard.classList.add('active');
            btnTag.classList.remove('active');
            addBtn.textContent = `Add Card — ₹${prices.card}`;
            
            preview.className = `tapt-obj mode-card skin-${document.getElementById('c-theme').value}`;
        } else {
            btnTag.classList.add('active');
            btnCard.classList.remove('active');
            addBtn.textContent = `Add Tag — ₹${prices.keychain}`;
            
            preview.className = `tapt-obj mode-keychain skin-${document.getElementById('c-theme').value}`;
        }
    };

    // 3. Theme Switcher
    document.getElementById('c-theme').addEventListener('change', (e) => {
        const val = e.target.value;
        const preview = document.getElementById('preview-obj');
        
        // Preserve mode class, update skin class
        preview.className = `tapt-obj mode-${currentMode} skin-${val}`;
    });

    // 4. Live Text
    const nameInput = document.getElementById('c-name');
    const roleInput = document.getElementById('c-role');
    const pName = document.getElementById('p-name');
    const pRole = document.getElementById('p-role');

    nameInput.addEventListener('input', (e) => pName.textContent = e.target.value || 'YOUR NAME');
    roleInput.addEventListener('input', (e) => pRole.textContent = e.target.value || 'ROLE');

    // 5. Logo Upload
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

    // 6. Add to Cart
    document.getElementById('add-btn').addEventListener('click', () => {
        const name = nameInput.value || 'Custom';
        const type = currentMode === 'card' ? 'Custom Card' : 'Custom Tag';
        const price = prices[currentMode];
        const theme = document.getElementById('c-theme').value;
        const logoSrc = document.getElementById('p-logo-preview').src;
        const hasLogo = document.getElementById('p-logo-preview').style.display === 'block';

        const fullTitle = `${type} (${theme}) - ${name}`;
        const displayImage = hasLogo ? logoSrc : (currentMode === 'card' ? 'https://via.placeholder.com/150/000000/FFFFFF/?text=CARD' : 'https://via.placeholder.com/150/000000/FFFFFF/?text=TAG');

        window.addToCart(fullTitle, price, displayImage);
    });

    // 7. 3D TILT ANIMATION (Premium Feel)
    const stage = document.getElementById('card-stage');
    const obj = document.getElementById('preview-obj');
    const glare = document.getElementById('glare');

    stage.addEventListener('mousemove', (e) => {
        const rect = stage.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate rotation (-15 to 15 degrees)
        const xPct = x / rect.width;
        const yPct = y / rect.height;
        const xRot = (0.5 - yPct) * 30; 
        const yRot = (xPct - 0.5) * 30;

        obj.style.transform = `rotateX(${xRot}deg) rotateY(${yRot}deg)`;
        
        // Glare movement
        glare.style.opacity = 1;
        glare.style.background = `linear-gradient(${105 + xRot}deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%)`;
    });

    stage.addEventListener('mouseleave', () => {
        obj.style.transform = `rotateX(0deg) rotateY(0deg)`;
        glare.style.opacity = 0;
    });
});
