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

/* The single shared observer for every reveal on the page, including ones
   injected later by github-api.js. Null until initScrollAnimations decides
   animation should happen at all. */
let revealObserver = null;

/* True when we have decided to show everything immediately: reduced motion,
   or a browser with no IntersectionObserver. */
let revealsDisabled = false;

/**
 * Write the stagger index onto each child of a group so CSS can turn it into
 * a transition delay via `calc(var(--i) * var(--stagger))`.
 */
function indexStaggerGroup(group) {
    Array.from(group.children).forEach((child, i) => {
        child.style.setProperty('--i', i);
    });
}

/**
 * Hand a set of elements to the observer, or reveal them outright if
 * animation is off. Content can never be stranded at opacity 0.
 */
function observeReveals(elements) {
    elements.forEach(el => {
        if (revealsDisabled || !revealObserver) {
            el.classList.add('is-revealed');
        } else {
            revealObserver.observe(el);
        }
    });
}

/**
 * Register reveal targets inside a subtree that was added to the DOM after
 * load. Called by github-api.js once the repo cards are rendered.
 * @param {Element} root - Container whose children should animate in
 */
function registerReveals(root) {
    if (!root) return;
    if (root.hasAttribute('data-stagger')) indexStaggerGroup(root);
    observeReveals(Array.from(root.querySelectorAll('[data-reveal]')));
}

/**
 * Initialize the scroll reveal choreography.
 *
 * Elements opt in with `data-reveal="<variant>"`; see the header of
 * styles/animations.css for the variant list. A parent carrying
 * `data-stagger` gets its children indexed into `--i`.
 */
function initScrollAnimations() {
    document.querySelectorAll('[data-stagger]').forEach(indexStaggerGroup);

    const revealTargets = Array.from(document.querySelectorAll('[data-reveal]'));
    revealsDisabled =
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !('IntersectionObserver' in window);

    if (!revealsDisabled) {
        revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-revealed');
                // One-shot: re-animating on every pass is noise, not choreography
                revealObserver.unobserve(entry.target);
            });
        }, {
            root: null,
            // Fire a little before the element is fully on screen so the reveal
            // has finished by the time it reaches comfortable reading position.
            rootMargin: '0px 0px -12% 0px',
            threshold: 0.12
        });
    }

    observeReveals(revealTargets);

    // Anything already on screen at load should not wait for a scroll event
    // that may never come on a tall viewport or a short page.
    if (revealObserver) {
        requestAnimationFrame(() => {
            revealTargets.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    el.classList.add('is-revealed');
                    revealObserver.unobserve(el);
                }
            });
        });
    }
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
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initAnimations };
}
