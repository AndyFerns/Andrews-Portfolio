/**
 * ============================================================================
 * MAIN.JS - Application Entry Point
 * ============================================================================
 * 
 * This is the main entry point that initializes all modules:
 * - Theme toggle
 * - Scroll animations
 * - GitHub API integration
 * - Navigation interactions
 * 
 * ============================================================================
 */

/**
 * Initialize all application modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Main] Portfolio initializing...');

    // Initialize theme first (to prevent flash)
    if (typeof initTheme === 'function') {
        initTheme();
    }

    // Initialize animations and interactions
    if (typeof initAnimations === 'function') {
        initAnimations();
    }

    // Initialize GitHub repos
    if (typeof initGitHubRepos === 'function') {
        initGitHubRepos();
    }

    // Initialize dynamic year in footer
    initFooterYear();

    console.log('[Main] Portfolio initialized successfully');
});

/**
 * Set the current year in the footer
 */
function initFooterYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

/**
 * Utility: Debounce function for performance
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
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

/**
 * Utility: Throttle function for scroll events
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in ms
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
