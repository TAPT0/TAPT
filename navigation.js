// --- DYNAMIC NAVIGATION SYSTEM ---
class NavigationManager {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page.replace('.html', '');
    }

    init() {
        this.updateNavigation();
        this.addSmoothScroll();
        this.addMobileMenu();
    }

    updateNavigation() {
        const navLinks = document.querySelectorAll('.nav-links a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const linkPage = href.replace('.html', '').replace('./', '').replace('/', '');
            
            // Remove all classes
            link.classList.remove('active', 'btn-primary', 'btn-secondary');
            
            // Add appropriate classes based on page
            if (linkPage === this.currentPage) {
                link.classList.add('active');
            }
            
            // Special button styles
            if (linkPage === 'customize' || linkPage === 'create') {
                link.classList.add('btn-primary');
            } else if (linkPage === 'contact') {
                link.classList.add('btn-secondary');
            }
        });
    }

    addSmoothScroll() {
        // Add smooth scrolling to anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    addMobileMenu() {
        // Add mobile menu toggle if needed
        if (window.innerWidth <= 768) {
            this.createMobileMenu();
        }
    }

    createMobileMenu() {
        const nav = document.querySelector('nav');
        if (!nav) return;

        // Check if mobile menu already exists
        if (document.querySelector('.mobile-menu-toggle')) return;

        const toggle = document.createElement('div');
        toggle.className = 'mobile-menu-toggle';
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
        toggle.style.cssText = `
            display: none;
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--gold);
            font-size: 1.2rem;
            cursor: pointer;
            z-index: 1001;
        `;

        nav.appendChild(toggle);

        const navLinks = document.querySelector('.nav-links');
        navLinks.style.cssText = `
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(5, 5, 5, 0.95);
            backdrop-filter: blur(15px);
            padding: 20px;
            flex-direction: column;
            gap: 10px;
            border-top: 1px solid var(--border);
        `;

        toggle.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        });

        // Show toggle on mobile
        if (window.innerWidth <= 768) {
            toggle.style.display = 'block';
        }
    }

    // Public method to update navigation when page changes
    updatePage(newPage) {
        this.currentPage = newPage;
        this.updateNavigation();
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
});

// Update navigation on page navigation (for SPA-like behavior)
window.addEventListener('popstate', () => {
    if (window.navigationManager) {
        window.navigationManager.updatePage(window.navigationManager.getCurrentPage());
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.navigationManager) {
        window.navigationManager.addMobileMenu();
    }
});
