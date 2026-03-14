/**
 * AFROTOOLS ANIMATIONS JS
 * ═══════════════════════════════════════════════════════════
 * Enhanced scroll-reveal with IntersectionObserver.
 * Adds .rv class support to ALL pages (not just index).
 * Also adds subtle animated floating dots to hero sections.
 * ═══════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  // Bail on reduced motion preference
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Still reveal elements, just without animation
    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('.rv, .rv-scale').forEach(function (el) {
        el.classList.add('in');
      });
    });
    return;
  }

  // ── SCROLL REVEAL OBSERVER ──────────────────────────────
  function initScrollReveal() {
    var elements = document.querySelectorAll('.rv, .rv-scale');
    if (!elements.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(function (el) {
      observer.observe(el);
    });

    // Expose for dynamically added elements (tool registry, etc.)
    window._afroAnimObs = observer;
  }

  // ── SECTION HEADERS — auto-add .rv if not already ────────
  function autoRevealSections() {
    var selectors = [
      '.sec-title', '.sec-sub', '.eyebrow',
      '.nl-box', '.hero-ticker',
      '.phase-card', '.region'
    ];
    var i = 0;
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (!el.classList.contains('rv') && !el.classList.contains('rv-scale') && !el.classList.contains('in')) {
          el.classList.add('rv');
          if (i > 0 && i < 8) el.classList.add('d' + i);
          i++;
          if (window._afroAnimObs) window._afroAnimObs.observe(el);
        }
      });
    });
  }

  // ── HERO FLOATING PARTICLES ─────────────────────────────
  function initHeroParticles() {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.35;';
    hero.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var particles = [];
    var animId;

    function resize() {
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }

    function createParticles() {
      particles = [];
      var count = Math.min(Math.floor(canvas.width / 40), 28);
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.8 + 0.5,
          dx: (Math.random() - 0.5) * 0.3,
          dy: (Math.random() - 0.5) * 0.2,
          alpha: Math.random() * 0.4 + 0.1,
          // Navy/indigo/violet palette
          color: ['rgba(99,102,241,', 'rgba(139,92,246,', 'rgba(129,140,248,', 'rgba(167,139,250,'][Math.floor(Math.random() * 4)]
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.x += p.dx;
        p.y += p.dy;
        // Wrap around
        if (p.x < -5) p.x = canvas.width + 5;
        if (p.x > canvas.width + 5) p.x = -5;
        if (p.y < -5) p.y = canvas.height + 5;
        if (p.y > canvas.height + 5) p.y = -5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    // Debounced resize
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resize();
        createParticles();
      }, 200);
    });

    // Pause when not visible (performance)
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        draw();
      }
    });
  }

  // ── COUNTER ANIMATION — animate numbers on scroll ───────
  function initCounters() {
    var nums = document.querySelectorAll('.hs-num');
    if (!nums.length) return;

    var counterObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.dataset.counted) return;
        el.dataset.counted = '1';
        counterObs.unobserve(el);

        var text = el.textContent.trim();
        var suffix = text.replace(/[\d,]/g, ''); // e.g. '+'
        var target = parseInt(text.replace(/[^\d]/g, ''), 10);
        if (isNaN(target)) return;

        var duration = 1200;
        var start = performance.now();
        var startVal = 0;

        function step(now) {
          var progress = Math.min((now - start) / duration, 1);
          // Ease out cubic
          var eased = 1 - Math.pow(1 - progress, 3);
          var current = Math.floor(startVal + (target - startVal) * eased);
          el.textContent = current + suffix;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });

    nums.forEach(function (el) { counterObs.observe(el); });
  }

  // ── SMOOTH HOVER TILT on cards (very subtle) ────────────
  function initCardTilt() {
    var cards = document.querySelectorAll('.tc, .cat-card, .tc--wide');
    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = 'translateY(-6px) rotateX(' + (-y * 2) + 'deg) rotateY(' + (x * 2) + 'deg)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  // ── INIT ────────────────────────────────────────────────
  function init() {
    initScrollReveal();
    autoRevealSections();
    initHeroParticles();
    initCounters();
    // Card tilt only on desktop (not touch)
    if (!('ontouchstart' in window)) {
      initCardTilt();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
