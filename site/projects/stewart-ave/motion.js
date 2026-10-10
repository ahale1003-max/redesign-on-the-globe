/* motion.js — Stewart Ave Auto Group premium motion system
   Skills: epic-design + motion-designer + premium
   Profile: E-commerce/Service — snappy, trust-building, non-blocking
   Easing: cubic-bezier(0.23, 1, 0.32, 1) "spring out" throughout
*/
(function () {
  'use strict';

  const SPRING = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const EASE_STD = 'cubic-bezier(0.4, 0, 0.2, 1)';

  // Hard exit — always respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ── Hero content staggered entrance (depth-4 text layer) ─────────
  function initHeroEntrance() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    // Covers autocare (.hero-copy), collision (.hero-left), storage (.hero-content)
    const container = hero.querySelector('.hero-copy, .hero-left, .hero-content');
    if (!container) return;

    const children = Array.from(container.children);

    // Set initial hidden state via inline styles (avoids CSS specificity fights)
    children.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
    });

    // Stagger reveal — 105ms between each child, starting at 140ms
    requestAnimationFrame(() => {
      children.forEach((el, i) => {
        setTimeout(() => {
          el.style.transition = `opacity 0.7s ${SPRING}, transform 0.7s ${SPRING}`;
          requestAnimationFrame(() => {
            el.style.opacity = '';    // clears inline → CSS cascade takes over
            el.style.transform = 'translateY(0)';
          });
          // Clean up inline styles after animation so CSS hover states work normally
          setTimeout(() => {
            el.style.transition = '';
            el.style.transform = '';
          }, 780);
        }, 140 + i * 105);
      });
    });
  }

  // ── Hero background parallax on scroll (depth-0 layer) ────────────
  function initHeroParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    // Prefer video, fall back to hero-bg img/div
    const bgEl = hero.querySelector('.hero-bg-video') ||
                 hero.querySelector('video') ||
                 hero.querySelector('.hero-bg');
    if (!bgEl) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        if (scrolled < hero.offsetHeight * 1.2) {
          bgEl.style.transform = `translateY(${(scrolled * 0.28).toFixed(1)}px)`;
        }
        ticking = false;
      });
    }, { passive: true });
  }

  // ── Nav scroll state ──────────────────────────────────────────────
  function initNavScroll() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      nav.classList.toggle('nav-scrolled', scrolled > 50);
      lastScroll = scrolled;
    }, { passive: true });
  }

  // ── Scroll reveal — IntersectionObserver (depth-4 content layers) ─
  function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

    // Single-block targets
    document.querySelectorAll(
      '.section-title, .section-desc, .notice-box, ' +
      '.schedule-info, .schedule-form, .hero-trust, ' +
      '.owner-statement, .owner-stats, .about-facility, ' +
      '.info-stack, .facility-img-wrap'
    ).forEach(el => {
      el.classList.add('reveal-block');
      observer.observe(el);
    });

    // Grid children — staggered
    document.querySelectorAll(
      '.services-grid, .reviews-grid, .units-grid, ' +
      '.amenities-grid, .trust-grid, .info-grid'
    ).forEach(grid => {
      Array.from(grid.children).forEach((card, i) => {
        card.classList.add('reveal-block');
        card.style.transitionDelay = `${(i * 0.09).toFixed(2)}s`;
        observer.observe(card);
      });
    });
  }

  // ── Init ───────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initHeroEntrance();
    initHeroParallax();
    initNavScroll();
    setTimeout(initScrollReveal, 80);
  });
})();
