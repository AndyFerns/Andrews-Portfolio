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
 * Drive the status bar clock module.
 * Ticks once a second and only ever writes textContent, so it cannot cause
 * layout (the module uses tabular figures and a fixed height).
 */
function initStatusBarClock() {
    const clock = document.getElementById('bar-clock');
    if (!clock) return;

    function tick() {
        const now = new Date();
        const time = now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        // Composed from parts rather than one toLocaleDateString call, because
        // locales disagree about whether the weekday or the day number leads.
        const weekday = now.toLocaleDateString([], { weekday: 'short' });
        clock.textContent = weekday + ' ' + now.getDate() + '  ' + time;
        clock.setAttribute('datetime', now.toISOString());
    }

    tick();
    setInterval(tick, 1000);
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

                // Clear the fixed status bar
                const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
                const targetPosition = targetElement.getBoundingClientRect().top
                    + window.pageYOffset - navHeight;

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
 * Highlight the current section in the status bar as the focused workspace.
 */
function initActiveNavHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

    if (sections.length === 0 || navLinks.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const id = entry.target.getAttribute('id');

            navLinks.forEach(link => {
                const isCurrent = link.getAttribute('href') === '#' + id;
                link.classList.toggle('active', isCurrent);
                // Announce the focused workspace to assistive tech too
                if (isCurrent) {
                    link.setAttribute('aria-current', 'true');
                } else {
                    link.removeAttribute('aria-current');
                }
            });
        });
    }, {
        root: null,
        rootMargin: '-50% 0px -50% 0px', // Middle of viewport
        threshold: 0
    });

    sections.forEach(section => observer.observe(section));
}

/**
 * Publish scroll progress (0..1) as --scroll-progress on the status bar,
 * which renders it as the hairline along its bottom edge.
 *
 * The only thing that consumes it is a scaleX, so a scroll never reads layout
 * back out or writes a geometric property. The document height is measured
 * once per frame at most.
 */
function initScrollProgress() {
    const bar = document.querySelector('.statusbar');
    if (!bar) return;

    let ticking = false;

    function update() {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0
            ? Math.min(1, Math.max(0, window.scrollY / scrollable))
            : 0;
        bar.style.setProperty('--scroll-progress', progress.toFixed(4));
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });

    // Recompute on resize: the document height changes with the layout
    window.addEventListener('resize', () => {
        if (!ticking) {
            window.requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });

    update();
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
    initStatusBarClock();
    initScrollProgress();
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initAnimations };
}
