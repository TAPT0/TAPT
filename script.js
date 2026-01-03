// --- 3D TILT EFFECT (Universal) ---
const cards = document.querySelectorAll('.tapt-card');
const stages = document.querySelectorAll('.card-stage');

if(stages.length > 0) {
    stages.forEach(stage => {
        stage.addEventListener('mousemove', (e) => {
            const card = stage.querySelector('.tapt-card');
            const ax = -(window.innerWidth / 2 - e.pageX) / 25;
            const ay = (window.innerHeight / 2 - e.pageY) / 25;
            card.style.transform = `rotateY(${ax}deg) rotateX(${ay}deg)`;
        });

        stage.addEventListener('mouseleave', () => {
            const card = stage.querySelector('.tapt-card');
            card.style.transform = `rotateY(0) rotateX(0)`;
        });
    });
}

// --- CUSTOMIZER LOGIC (Only runs on customize.html) ---
const nameInput = document.getElementById('c-name');
const roleInput = document.getElementById('c-role');
const themeSelect = document.getElementById('c-theme');

const previewName = document.getElementById('p-name');
const previewRole = document.getElementById('p-role');
const previewCard = document.getElementById('p-card');

if (nameInput) {
    // Update Name
    nameInput.addEventListener('input', (e) => {
        previewName.innerText = e.target.value || "YOUR NAME";
    });

    // Update Role
    roleInput.addEventListener('input', (e) => {
        previewRole.innerText = e.target.value || "DESIGNATION";
    });

    // Update Theme (Material)
    themeSelect.addEventListener('change', (e) => {
        // Remove old classes
        previewCard.classList.remove('skin-black', 'skin-gold', 'skin-white');
        // Add new class
        previewCard.classList.add(`skin-${e.target.value}`);
        
        // Handle text color changes for light backgrounds
        const textColor = (e.target.value === 'black') ? 'white' : 'black';
        previewName.style.color = textColor;
        
        // Wifi icon adjustment
        const wifiIcon = document.querySelector('.wifi-icon');
        wifiIcon.style.color = (e.target.value === 'black') ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    });
}
