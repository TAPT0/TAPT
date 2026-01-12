// --- SHOP PERFORMANCE OPTIMIZATIONS ---

// Debounce function to reduce function calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Performance monitoring
const performanceMonitor = {
    init: function() {
        // Disable heavy animations on mobile
        if (window.innerWidth <= 768) {
            document.body.classList.add('mobile-performance');
            this.disableHeavyAnimations();
        }
        
        // Reduce particle count on slower devices
        if (this.isSlowDevice()) {
            this.reduceParticles();
        }
    },
    
    isSlowDevice: function() {
        // Simple device performance check
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            return connection.effectiveType === 'slow-2g' || 
                   connection.effectiveType === '2g' || 
                   connection.effectiveType === '3g';
        }
        return false;
    },
    
    disableHeavyAnimations: function() {
        // Disable floating elements on mobile
        const floatingAssets = document.querySelector('.floating-assets');
        if (floatingAssets) {
            floatingAssets.style.display = 'none';
        }
        
        // Disable 3D backgrounds
        const hero3DBg = document.querySelector('.hero-3d-bg');
        if (hero3DBg) {
            hero3DBg.style.display = 'none';
        }
    },
    
    reduceParticles: function() {
        // Remove excess floating elements
        const floaters = document.querySelectorAll('.floater');
        floaters.forEach((floater, index) => {
            if (index > 3) {
                floater.remove();
            }
        });
        
        const floaters3D = document.querySelectorAll('.floater-3d');
        floaters3D.forEach((floater, index) => {
            if (index > 2) {
                floater.remove();
            }
        });
    }
};

// Optimized search function
const optimizedSearch = debounce(function() {
    const searchTerm = document.getElementById('shop-search').value.toLowerCase();
    const products = document.querySelectorAll('.shop-row');
    
    products.forEach(product => {
        const title = product.querySelector('.row-title')?.textContent.toLowerCase() || '';
        const desc = product.querySelector('.row-desc')?.textContent.toLowerCase() || '';
        
        if (title.includes(searchTerm) || desc.includes(searchTerm)) {
            product.style.display = 'block';
            product.classList.add('lazy-load', 'loaded');
        } else {
            product.style.display = 'none';
        }
    });
}, 300);

// Optimized filter function
const optimizedFilter = debounce(function(type, button) {
    // Remove active class from all buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    button.classList.add('active');
    
    // Filter products
    const products = document.querySelectorAll('.shop-row');
    products.forEach(product => {
        const productType = product.dataset.type || 'all';
        
        if (type === 'all' || productType === type) {
            product.style.display = 'block';
            product.classList.add('lazy-load', 'loaded');
        } else {
            product.style.display = 'none';
        }
    });
}, 200);

// Lazy loading for images
const lazyLoadImages = function() {
    const images = document.querySelectorAll('img[data-src]');
    
    images.forEach(img => {
        const rect = img.getBoundingClientRect();
        
        if (rect.top < window.innerHeight + 200 && rect.bottom > -200) {
            img.src = img.dataset.src;
            img.classList.add('loaded');
            img.removeAttribute('data-src');
        }
    });
};

// Optimized scroll handler
const optimizedScroll = throttle(function() {
    // Lazy load images
    lazyLoadImages();
    
    // Parallax effect only on desktop
    if (window.innerWidth > 768) {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.cyber-grid');
        if (parallax) {
            parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    }
}, 16); // ~60fps

// Initialize performance optimizations
document.addEventListener('DOMContentLoaded', () => {
    performanceMonitor.init();
    
    // Replace heavy event listeners with optimized versions
    const searchInput = document.getElementById('shop-search');
    if (searchInput) {
        searchInput.removeEventListener('keyup', window.searchProducts);
        searchInput.addEventListener('keyup', optimizedSearch);
    }
    
    // Replace filter functions
    window.filterProducts = optimizedFilter;
    
    // Optimized scroll handler
    window.addEventListener('scroll', optimizedScroll, { passive: true });
    
    // Intersection Observer for reveal animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('loaded');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for lazy loading
    document.querySelectorAll('.reveal, .shop-row').forEach(el => {
        observer.observe(el);
    });
});

// Clean up event listeners on page unload
window.addEventListener('beforeunload', () => {
    window.removeEventListener('scroll', optimizedScroll);
});

// Export optimized functions
window.searchProducts = optimizedSearch;
window.filterProducts = optimizedFilter;
