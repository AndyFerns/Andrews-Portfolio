/**
 * ============================================================================
 * ANIMATIONS.JS - Scroll-based Animations & Interactions
 * ============================================================================
 * 
 * This module handles:
 * - Intersection Observer for scroll reveal animations
 * - Navigation scroll effects
 * - Smooth scroll for anchor links
 * - Mobile navigation toggle
 * 
 * PERFORMANCE NOTES:
 * - Uses Intersection Observer (more efficient than scroll events)
 * - Animations use CSS transforms (GPU accelerated)
 * - Respects prefers-reduced-motion
 * 
 * ============================================================================
 */

/**
 * Initialize Intersection Observer for scroll animations
 * Elements with .animate-on-scroll class will fade in when visible
 */
function initScrollAnimations() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        // Make all elements visible immediately
        document.querySelectorAll('.animate-on-scroll, .animate-fade-left, .animate-fade-right, .animate-scale, .stagger-children')
            .forEach(el => el.classList.add('visible'));
        return;
    }

    // Create observer with options
    const observerOptions = {
        root: null, // Use viewport
        rootMargin: '0px 0px -100px 0px', // Trigger slightly before element is fully visible
        threshold: 0.1 // Trigger when 10% visible
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Stop observing once animated
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all animate-on-scroll elements
    const animatedElements = document.querySelectorAll(
        '.animate-on-scroll, .animate-fade-left, .animate-fade-right, .animate-scale, .stagger-children'
    );

    animatedElements.forEach(el => observer.observe(el));

    console.log('[Animations] Initialized scroll animations for', animatedElements.length, 'elements');
}

/**
 * Initialize navigation scroll effects
 * Adds 'scrolled' class when page is scrolled
 */
function initNavScrollEffect() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateNav() {
        const scrollY = window.scrollY;

        // Add/remove scrolled class
        if (scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        lastScrollY = scrollY;
        ticking = false;
    }

    // Use requestAnimationFrame for performance
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateNav);
            ticking = true;
        }
    }, { passive: true });

    // Initial check
    updateNav();
}

/**
 * Initialize smooth scroll for anchor links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');

            // Skip if it's just "#"
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                e.preventDefault();

                // Close mobile nav if open
                const navLinks = document.querySelector('.nav-links');
                if (navLinks) navLinks.classList.remove('open');

                // Calculate offset for fixed nav
                const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Update URL without jumping
                history.pushState(null, null, targetId);
            }
        });
    });
}

/**
 * Initialize mobile navigation toggle
 */
function initMobileNav() {
    const toggle = document.querySelector('.nav-mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');

        // Update aria-expanded
        const isOpen = navLinks.classList.contains('open');
        toggle.setAttribute('aria-expanded', isOpen);

        // Prevent body scroll when nav is open
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close nav when clicking outside
    document.addEventListener('click', (e) => {
        if (navLinks.classList.contains('open') &&
            !navLinks.contains(e.target) &&
            !toggle.contains(e.target)) {
            navLinks.classList.remove('open');
            toggle.setAttribute('aria-expanded', false);
            document.body.style.overflow = '';
        }
    });
}

/**
 * Initialize active nav link highlighting based on scroll position
 */
function initActiveNavHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

    if (sections.length === 0 || navLinks.length === 0) return;

    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px', // Middle of viewport
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');

                // Remove active from all links
                navLinks.forEach(link => link.classList.remove('active'));

                // Add active to matching link
                const activeLink = document.querySelector(`.nav-link[href="#${id}"]`);
                if (activeLink) activeLink.classList.add('active');
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
}

/**
 * Initialize all animation and interaction features
 */
function initAnimations() {
    initScrollAnimations();
    initNavScrollEffect();
    initSmoothScroll();
    initMobileNav();
    initActiveNavHighlight();

    console.log('[Animations] All animations initialized');
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initAnimations };
}
