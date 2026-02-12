/**
 * COUNTRYSIDE ESTATES - PREMIUM REFINE JAVASCRIPT (v3)
 * Features: Overlay Menu, Developer View, Evocative Transitions
 */

document.addEventListener('DOMContentLoaded', function () {
    initApp();
});

function initApp() {
    // 1. Opening Animation Sequence
    setTimeout(() => {
        const opening = document.getElementById('opening-experience');
        if (opening) {
            opening.classList.add('fade-out');
            setTimeout(() => opening.remove(), 800);
        }
    }, 3500);

    // 2. Navigation & Overlays
    setupNavigationOverlay();
    setupDeveloperView();

    // 3. Header Scroll Behavior
    handleStickyHeader();

    // 4. Content Reveals
    handleScrollReveals();

    // 5. Smooth Scrolling
    setupSmoothScroll();
}

/**
 * Mobile Navigation Overlay (Hamburger)
 */
function setupNavigationOverlay() {
    const trigger = document.getElementById('mobile-menu-trigger');
    const overlay = document.getElementById('nav-overlay');
    const links = document.querySelectorAll('.overlay-link');

    trigger.addEventListener('click', () => {
        const isOpen = overlay.classList.contains('open');
        if (isOpen) {
            overlay.classList.remove('open');
            trigger.classList.remove('open');
            document.body.style.overflow = 'auto'; // Re-enable scroll
        } else {
            overlay.classList.add('open');
            trigger.classList.add('open');
            document.body.style.overflow = 'hidden'; // Disable scroll
        }
    });

    // Close overlay when clicking a link
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.id !== 'open-developer-from-menu') {
                overlay.classList.remove('open');
                trigger.classList.remove('open');
                document.body.style.overflow = 'auto';
            }
        });
    });
}

/**
 * Separate Developer View Logic
 */
function setupDeveloperView() {
    const devView = document.getElementById('developer-view');
    const openTriggers = [
        document.getElementById('open-developer-desktop'),
        document.getElementById('open-developer-from-menu')
    ];
    const closeTriggers = [
        document.getElementById('close-developer'),
        document.getElementById('back-to-countryside')
    ];

    openTriggers.forEach(trigger => {
        if (!trigger) return;
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            devView.style.display = 'block';
            setTimeout(() => devView.classList.add('active'), 10);
            document.body.style.overflow = 'hidden';

            // Close mobile menu if open
            document.getElementById('nav-overlay').classList.remove('open');
            document.getElementById('mobile-menu-trigger').classList.remove('open');
        });
    });

    closeTriggers.forEach(trigger => {
        if (!trigger) return;
        trigger.addEventListener('click', () => {
            devView.classList.remove('active');
            setTimeout(() => {
                devView.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 500);
        });
    });
}

/**
 * Desktop Header Scroll Behavior
 */
function handleStickyHeader() {
    const header = document.querySelector('.desktop-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.classList.add('active');
        } else {
            header.classList.remove('active');
        }
    });
}

/**
 * Scroll Reveal Animations
 */
function handleScrollReveals() {
    const revealElements = document.querySelectorAll('.card-premium, .section-title, .reserve-split, .quote-block');

    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 1s ease-out';
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => observer.observe(el));
}

/**
 * Smooth Scroll
 */
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.classList.contains('overlay-link') && this.id === 'open-developer-from-menu') return;

            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                const headerOffset = 100;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });
}
