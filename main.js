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

    // 6. Reservation Form Logic
    setupReservationForm();
}

/**
 * Guided Reservation Form Logic
 */
function setupReservationForm() {
    const modal = document.getElementById('reservation-modal');
    const openBtn = document.getElementById('open-reservation');
    const closeBtn = document.getElementById('close-reservation');
    const finishBtn = document.getElementById('finish-reservation');
    const form = document.getElementById('reservation-form');

    if (!modal || !openBtn) return;

    // Open Modal
    openBtn.addEventListener('click', () => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        resetForm();
    });

    // Close Modal
    [closeBtn, finishBtn].forEach(btn => {
        if (!btn) return;
        btn.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });

    // Step Navigation
    const nextBtns = document.querySelectorAll('.next-step');
    const prevBtns = document.querySelectorAll('.prev-step');
    const steps = document.querySelectorAll('.form-step');
    const indicators = document.querySelectorAll('.step-indicator .step');

    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentStep = btn.closest('.form-step');
            const stepNum = parseInt(currentStep.id.split('-')[1]);

            // Basic Validation
            const inputs = currentStep.querySelectorAll('input, select');
            let valid = true;
            inputs.forEach(input => {
                if (!input.checkValidity()) {
                    input.reportValidity();
                    valid = false;
                }
            });

            if (valid) {
                goToStep(stepNum + 1);
            }
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentStep = btn.closest('.form-step');
            const stepNum = parseInt(currentStep.id.split('-')[1]);
            goToStep(stepNum - 1);
        });
    });

    function goToStep(stepNum) {
        steps.forEach(step => step.classList.remove('active'));
        indicators.forEach(ind => {
            const indStep = parseInt(ind.getAttribute('data-step'));
            ind.classList.remove('active', 'completed');
            if (indStep === stepNum) ind.classList.add('active');
            if (indStep < stepNum) ind.classList.add('completed');
        });

        const targetStep = document.getElementById(`step-${stepNum}`);
        if (targetStep) targetStep.classList.add('active');
    }

    function resetForm() {
        form.reset();
        goToStep(1);
    }
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

// --- AI CHATBOT LOADER (3-Layer Architecture) ---
function loadAIChat() {
    // Replace with your actual Vercel deployment URL
    const VERCEL_URL = 'https://agent-realty-ai.vercel.app';

    // Inject CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${VERCEL_URL}/static/chat-widget.css`;
    document.head.appendChild(link);

    // Inject JS Loader
    const script = document.createElement('script');
    script.src = `${VERCEL_URL}/static/chat-widget.js`;
    script.onload = () => {
        new AgentChat({
            siteId: 'countryside',
            siteName: 'Isinya Chuna Estate'
        });
    };
    document.body.appendChild(script);
}
loadAIChat();
