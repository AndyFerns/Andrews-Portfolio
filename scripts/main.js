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

    // Fill in the live values in the fastfetch hero card
    initFetchCard();
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
 * The date to count "Uptime" from in the fastfetch card.
 * EDIT THIS to change what the hero reports. The markup carries a static
 * fallback for the JS-disabled case, so update both if you change it.
 */
const CODING_SINCE = new Date('2022-01-01T00:00:00');

/**
 * Render the live "Uptime" row of the fastfetch card, in the style of a real
 * uptime readout ("4 years, 62 days").
 */
function initFetchCard() {
    const uptimeEl = document.getElementById('fetch-uptime');
    if (!uptimeEl) return;

    const now = new Date();
    let years = now.getFullYear() - CODING_SINCE.getFullYear();

    // Roll back a year if we have not reached the anniversary yet
    const anniversary = new Date(CODING_SINCE);
    anniversary.setFullYear(CODING_SINCE.getFullYear() + years);
    if (anniversary > now) {
        years -= 1;
        anniversary.setFullYear(anniversary.getFullYear() - 1);
    }

    const days = Math.floor((now - anniversary) / 86400000);

    const parts = [];
    if (years > 0) parts.push(years + (years === 1 ? ' year' : ' years'));
    parts.push(days + (days === 1 ? ' day' : ' days'));
    uptimeEl.textContent = parts.join(', ');
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
