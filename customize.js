document.addEventListener('DOMContentLoaded', () => {
    let currentMode = 'card';
    const prices = { card: 1999, keychain: 899 };

    // 1. Initialize Mode (Auto-detect from Session)
    const defaultMode = sessionStorage.getItem('defaultMode');
    if(defaultMode && (defaultMode === 'card' || defaultMode === 'keychain')) {
        setProductMode(defaultMode);
        sessionStorage.removeItem('defaultMode');
    } else {
        setProductMode('card');
    }

    // 2. Mode Switcher Function
    window.setProductMode = function(mode) {
        currentMode = mode;
        const preview = document.getElementById('preview-obj');
        const btnCard = document.getElementById('btn-card');
        const btnTag = document.getElementById('btn-tag');
        const addBtn = document.getElementById('add-btn');
        
        // Buttons
        if(mode === 'card') {
            btnCard.classList.add('active');
            btnTag.classList.remove('active');
            addBtn.textContent = `Add Card — ₹${prices.card}`;
            
            // Preview Styles
            preview.classList.remove('tapt-keychain');
            preview.classList.add('tapt-card');
            
            // Visibility
            document.getElementById('card-chip').style.display = 'block';
            document.getElementById('wifi-icon').style.display = 'block';
        } else {
            btnTag.classList.add('active');
            btnCard.classList.remove('active');
            addBtn.textContent = `Add Tag — ₹${prices.keychain}`;
            
            // Preview Styles
            preview.classList.remove('tapt-card');
            preview.classList.add('tapt-keychain');
            
            // Visibility
            document.getElementById('card-chip').style.display = 'none';
            document.getElementById('wifi-icon').style.display = 'none';
        }
    };

    // 3. Theme Switcher
    const themeSelect = document.getElementById('c-theme');
    if(themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            const preview = document.getElementById('preview-obj');
            const roleText = document.getElementById('p-role');

            preview.classList.remove('skin-black', 'skin-white', 'skin-gold');
            preview.classList.add('skin-' + val);

            if(val === 'white' || val === 'gold') {
                preview.style.color = 'black';
                roleText.style.color = '#333';
            } else {
                preview.style.color = 'white';
                roleText.style.color = 'var(--tapt-gold)';
            }
        });
    }

    // 4. Live Text Preview
    document.getElementById('c-name').addEventListener('input', (e) => {
        document.getElementById('p-name').textContent = e.target.value || 'YOUR NAME';
    });
    document.getElementById('c-role').addEventListener('input', (e) => {
        document.getElementById('p-role').textContent = e.target.value || 'ROLE';
    });

    // 5. Logo Upload Preview
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

    // 6. Add Custom Item to Cart
    document.getElementById('add-btn').addEventListener('click', () => {
        const name = document.getElementById('c-name').value || 'Custom';
        const type = currentMode === 'card' ? 'Custom Card' : 'Custom Tag';
        const price = prices[currentMode];
        const theme = document.getElementById('c-theme').value;
        const logoSrc = document.getElementById('p-logo-preview').src;
        const hasLogo = document.getElementById('p-logo-preview').style.display === 'block';

        const fullTitle = `${type} (${theme}) - ${name}`;
        
        // Use placeholder or actual logo as cart image
        const displayImage = hasLogo ? logoSrc : (currentMode === 'card' ? 'https://via.placeholder.com/150/000000/FFFFFF/?text=CARD' : 'https://via.placeholder.com/150/000000/FFFFFF/?text=TAG');

        // Add to global cart
        window.addToCart(fullTitle, price, displayImage);
    });
});
