/**
 * =============================================================================
 * PARTICLE BACKGROUND EFFECT
 * =============================================================================
 * Creates a subtle, mouse-responsive particle effect on the page background.
 * Particles gently float and react to mouse movement for an interactive feel.
 * =============================================================================
 */

(function () {
    'use strict';

    // ==========================================================================
    // Configuration
    // ==========================================================================
    const CONFIG = {
        particleCount: 50,           // Number of particles
        particleColor: 'var(--accent-primary)',
        particleMinSize: 2,
        particleMaxSize: 5,
        particleMinOpacity: 0.1,
        particleMaxOpacity: 0.4,
        mouseInfluenceRadius: 150,   // How far mouse affects particles
        mouseInfluenceStrength: 0.3, // How strongly mouse pushes particles
        baseSpeed: 0.3,              // Base floating speed
        connectionDistance: 100,     // Distance to draw lines between particles
        connectionOpacity: 0.1       // Opacity of connection lines
    };

    // ==========================================================================
    // State
    // ==========================================================================
    let canvas, ctx;
    let particles = [];
    let mouseX = -1000;
    let mouseY = -1000;
    let animationId;
    let isReducedMotion = false;
    let frameTime = 0;

    // ==========================================================================
    // Particle Class
    // ==========================================================================
    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = CONFIG.particleMinSize + Math.random() * (CONFIG.particleMaxSize - CONFIG.particleMinSize);
            this.opacity = CONFIG.particleMinOpacity + Math.random() * (CONFIG.particleMaxOpacity - CONFIG.particleMinOpacity);
            this.speedX = (Math.random() - 0.5) * CONFIG.baseSpeed;
            this.speedY = (Math.random() - 0.5) * CONFIG.baseSpeed;
            this.originalX = this.x;
            this.originalY = this.y;
        }

        update() {
            // Base floating motion
            this.x += this.speedX;
            this.y += this.speedY;

            // Mouse influence
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < CONFIG.mouseInfluenceRadius) {
                const force = (CONFIG.mouseInfluenceRadius - distance) / CONFIG.mouseInfluenceRadius;
                const angle = Math.atan2(dy, dx);
                // Push particles away from mouse
                this.x -= Math.cos(angle) * force * CONFIG.mouseInfluenceStrength * 2;
                this.y -= Math.sin(angle) * force * CONFIG.mouseInfluenceStrength * 2;
            }

            // Wrap around edges
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;

            // Gentle oscillation for organic feel. `frameTime` is sampled once
            // per frame rather than twice per particle.
            this.x += Math.sin(frameTime + this.originalX) * 0.1;
            this.y += Math.cos(frameTime + this.originalY) * 0.1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.globalAlpha = this.opacity;
            ctx.fill();
        }
    }

    // ==========================================================================
    // Helper Functions
    // ==========================================================================
    /**
     * Theme colours are read once and cached.
     *
     * These used to be resolved with getComputedStyle inside the draw calls,
     * which meant a forced style recalculation per particle and per connection
     * line, every frame. Reading them here instead costs two lookups per theme
     * change rather than a few thousand per second.
     */
    let particleColor = '#ff5566';
    let connectionColor = '#9aa2bd';

    function readThemeColors() {
        const style = getComputedStyle(document.documentElement);
        particleColor = style.getPropertyValue('--accent-primary').trim() || '#ff5566';
        connectionColor = style.getPropertyValue('--text-muted').trim() || '#8890ad';
    }

    // ==========================================================================
    // Canvas Setup
    // ==========================================================================
    function createCanvas() {
        canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
        `;
        document.body.prepend(canvas);
        ctx = canvas.getContext('2d');
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // ==========================================================================
    // Particle Management
    // ==========================================================================
    function createParticles() {
        particles = [];
        for (let i = 0; i < CONFIG.particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function drawConnections() {
        // Colour and line width are set once for the whole pass; only
        // globalAlpha varies per line.
        ctx.strokeStyle = connectionColor;
        ctx.lineWidth = 0.5;

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < CONFIG.connectionDistance) {
                    ctx.globalAlpha = (1 - distance / CONFIG.connectionDistance) * CONFIG.connectionOpacity;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    // ==========================================================================
    // Animation Loop
    // ==========================================================================
    function animate() {
        if (isReducedMotion) return;

        frameTime = Date.now() * 0.001;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw connections between nearby particles
        drawConnections();

        // Update and draw particles. fillStyle is set once for the whole pass;
        // only globalAlpha varies per particle.
        ctx.fillStyle = particleColor;
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        ctx.globalAlpha = 1;
        animationId = requestAnimationFrame(animate);
    }

    // ==========================================================================
    // Event Handlers
    // ==========================================================================
    function handleMouseMove(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }

    function handleMouseLeave() {
        mouseX = -1000;
        mouseY = -1000;
    }

    function handleResize() {
        resizeCanvas();
        // Recreate particles for new canvas size
        createParticles();
    }

    function handleVisibilityChange() {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else if (!isReducedMotion) {
            animate();
        }
    }

    // ==========================================================================
    // Initialization
    // ==========================================================================
    function init() {
        // Check for reduced motion preference
        isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (isReducedMotion) {
            console.log('Particles disabled: prefers-reduced-motion');
            return;
        }

        createCanvas();
        resizeCanvas();
        createParticles();
        readThemeColors();

        // Re-read the cached colours whenever the theme attribute flips
        new MutationObserver(readThemeColors).observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        // Event listeners
        window.addEventListener('resize', handleResize);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Listen for reduced motion changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            isReducedMotion = e.matches;
            if (isReducedMotion) {
                cancelAnimationFrame(animationId);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            } else {
                animate();
            }
        });

        // Start animation
        animate();
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging
    window.particleSystem = {
        config: CONFIG,
        restart: () => {
            cancelAnimationFrame(animationId);
            createParticles();
            animate();
        }
    };
})();
