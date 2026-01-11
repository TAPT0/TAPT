/* =========================================
   CENTRALIZED PERFORMANCE SCRIPT
   ========================================= */

// Performance optimizations
const PerformanceOptimizer = {
    // Debounce function for scroll events
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function for resize events
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Check if device is mobile
    isMobile: function() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    // Disable heavy animations on mobile
    optimizeForMobile: function() {
        if (this.isMobile()) {
            document.body.classList.add('mobile-optimized');
            // Disable parallax
            document.querySelectorAll('.parallax-element').forEach(el => {
                el.style.transform = 'none';
            });
            // Reduce floating elements
            const floatingAssets = document.querySelector('.floating-assets');
            if (floatingAssets) floatingAssets.style.display = 'none';
        }
    },

    // Lazy load images
    lazyLoadImages: function() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    },

    // Initialize performance optimizations
    init: function() {
        this.optimizeForMobile();
        this.lazyLoadImages();
        
        // Optimize scroll performance
        const optimizedScroll = this.debounce(() => {
            // Your scroll handlers here
        }, 16); // ~60fps

        window.addEventListener('scroll', optimizedScroll, { passive: true });
        
        // Optimize resize performance
        const optimizedResize = this.throttle(() => {
            this.optimizeForMobile();
        }, 250);

        window.addEventListener('resize', optimizedResize);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    PerformanceOptimizer.init();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}
