/**
 * ============================================================================
 * THEME-TOGGLE.JS - Dark/Light Theme Management
 * ============================================================================
 * 
 * This module handles:
 * - Reading user's theme preference from localStorage
 * - Falling back to system preference (prefers-color-scheme)
 * - Smooth theme transitions
 * - Persisting theme choice
 * 
 * CUSTOMIZATION:
 * - Theme values: 'dark' or 'light'
 * - Change STORAGE_KEY to use different localStorage key
 * 
 * ============================================================================
 */

// Configuration
const STORAGE_KEY = 'portfolio_theme';

/**
 * Get the user's preferred theme
 * Priority: localStorage > system preference > default (dark)
 * @returns {string} 'dark' or 'light'
 */
function getPreferredTheme() {
    // Check localStorage first
    const storedTheme = localStorage.getItem(STORAGE_KEY);
    if (storedTheme) {
        return storedTheme;
    }

    // Fall back to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    }

    // Default to dark theme
    return 'dark';
}

/**
 * Apply a theme to the document
 * @param {string} theme - 'dark' or 'light'
 * @param {boolean} animate - Whether to animate the transition
 */
function applyTheme(theme, animate = true) {
    // Temporarily disable transitions on initial load
    if (!animate) {
        document.documentElement.classList.add('no-transition');
    }

    // Set the theme attribute
    document.documentElement.setAttribute('data-theme', theme);

    // Re-enable transitions
    if (!animate) {
        // Force a reflow to ensure the transition is applied
        document.documentElement.offsetHeight;
        document.documentElement.classList.remove('no-transition');
    }

    // Update any theme toggle buttons
    updateToggleButtons(theme);

    console.log('[Theme] Applied theme:', theme);
}

/**
 * Save theme preference to localStorage
 * @param {string} theme - 'dark' or 'light'
 */
function saveTheme(theme) {
    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
        console.warn('[Theme] Could not save preference:', error);
    }
}

/**
 * Toggle between dark and light themes
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    applyTheme(newTheme, true);
    saveTheme(newTheme);
}

/**
 * Update all theme toggle buttons to reflect current theme
 * @param {string} theme - Current theme
 */
function updateToggleButtons(theme) {
    const buttons = document.querySelectorAll('.theme-toggle');
    buttons.forEach(button => {
        // Update aria-label for accessibility
        button.setAttribute(
            'aria-label',
            theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
        );
    });
}

/**
 * Initialize theme on page load
 */
function initTheme() {
    // Apply theme immediately without animation to prevent flash
    const theme = getPreferredTheme();
    applyTheme(theme, false);

    // Set up event listeners for toggle buttons
    document.querySelectorAll('.theme-toggle').forEach(button => {
        button.addEventListener('click', toggleTheme);
    });

    // Listen for system preference changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Only auto-switch if user hasn't set a preference
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? 'dark' : 'light', true);
            }
        });
    }

    console.log('[Theme] Initialized with theme:', theme);
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initTheme, toggleTheme, getPreferredTheme };
}
