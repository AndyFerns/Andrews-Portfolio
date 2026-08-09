/**
 * ============================================================================
 * ACCENTS.JS - The one scripted detail
 * ============================================================================
 *
 * Hovering the sigil in the fastfetch card has a small chance of making it
 * sparkle. Everything else in styles/accents.css is pure CSS.
 *
 * TO REMOVE: drop the <script> tag for this file from index.html. Nothing
 * else references it.
 * ============================================================================
 */

/* 1 in 16. Rare enough that most visitors never see it, common enough that
   anyone who plays with the page will. */
const SHINY_ODDS = 16;
const SPARKLE_COUNT = 5;
const SHINY_DURATION_MS = 900;

/**
 * Attach the rare sparkle to the fastfetch sigil.
 */
function initShiny() {
    const sigil = document.querySelector('.fetch-sigil');
    const host = sigil && sigil.parentElement;
    if (!sigil || !host) return;

    // Nothing here is meaningful, so it simply does not run under reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let busy = false;

    sigil.addEventListener('mouseenter', () => {
        if (busy) return;
        if (Math.floor(Math.random() * SHINY_ODDS) !== 0) return;

        busy = true;
        sigil.classList.add('is-shiny');

        const sparkles = [];
        for (let i = 0; i < SPARKLE_COUNT; i++) {
            const s = document.createElement('span');
            s.className = 'sparkle';
            // Scattered around the sigil, which sits at the bottom-right corner
            s.style.right = (-14 + Math.random() * 34) + 'px';
            s.style.bottom = (-14 + Math.random() * 34) + 'px';
            s.style.animationDelay = (i * 70) + 'ms';
            host.appendChild(s);
            sparkles.push(s);
        }

        setTimeout(() => {
            sigil.classList.remove('is-shiny');
            sparkles.forEach(s => s.remove());
            busy = false;
        }, SHINY_DURATION_MS + SPARKLE_COUNT * 70);
    });
}

document.addEventListener('DOMContentLoaded', initShiny);
