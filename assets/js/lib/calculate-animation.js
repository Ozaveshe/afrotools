/**
 * AFROTOOLS — Calculate Animation Library
 * ═══════════════════════════════════════════════════════════
 * Animates numbers from 0 (or previous value) to new value.
 * Stagger-animates result sections for a polished reveal.
 *
 * Usage:
 *   AfroTools.anim.value(el, 0, 350000, 600, v => '₦' + v.toLocaleString());
 *   AfroTools.anim.stagger('.res-section', 50);
 *   AfroTools.anim.counter(el, 350000, v => '₦' + v.toLocaleString());
 * ═══════════════════════════════════════════════════════════
 */

(function (window) {
  'use strict';

  const anim = {
    /**
     * Animate a numeric value on an element
     * @param {HTMLElement} el - Target element
     * @param {number} startVal - Starting value
     * @param {number} endVal - Ending value
     * @param {number} duration - Animation duration in ms (default 600)
     * @param {Function} formatter - Format function: (val) => string
     * @param {string} easing - 'easeOut' | 'easeInOut' | 'linear'
     */
    value(el, startVal, endVal, duration = 600, formatter = null, easing = 'easeOut') {
      if (!el) return;
      const fmt = formatter || (v => Math.round(v).toLocaleString());
      const diff = endVal - startVal;

      // Skip animation for zero diff or if user prefers reduced motion
      if (diff === 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.textContent = fmt(endVal);
        return;
      }

      const easingFn = {
        linear: t => t,
        easeOut: t => 1 - Math.pow(1 - t, 3),
        easeInOut: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
      }[easing] || (t => 1 - Math.pow(1 - t, 3));

      let startTime = null;
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFn(progress);
        const currentVal = startVal + diff * easedProgress;

        el.textContent = fmt(currentVal);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = fmt(endVal); // Ensure exact final value
        }
      };
      requestAnimationFrame(step);
    },

    /**
     * Shorthand: animate from current displayed value to new value
     * Reads the current numeric value from the element's data-value attribute
     * @param {HTMLElement} el - Target element
     * @param {number} newVal - New value to animate to
     * @param {Function} formatter - Format function
     * @param {number} duration - Duration in ms
     */
    counter(el, newVal, formatter = null, duration = 600) {
      if (!el) return;
      const oldVal = parseFloat(el.getAttribute('data-value')) || 0;
      el.setAttribute('data-value', newVal);
      this.value(el, oldVal, newVal, duration, formatter);
    },

    /**
     * Stagger-animate child elements into view
     * @param {string|NodeList|Array} targets - Selector or elements
     * @param {number} delay - Delay between each element in ms (default 50)
     * @param {string} animation - CSS class to add for animation
     */
    stagger(targets, delay = 50, animation = 'anim-fade-up') {
      const elements = typeof targets === 'string'
        ? document.querySelectorAll(targets)
        : targets;

      if (!elements || elements.length === 0) return;

      // If user prefers reduced motion, show immediately
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        elements.forEach(el => {
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
        return;
      }

      elements.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(12px)';
        el.style.transition = `opacity 0.4s ease ${i * delay}ms, transform 0.4s ease ${i * delay}ms`;
        // Trigger reflow then animate
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          });
        });
      });
    },

    /**
     * Animate a progress/rate bar fill
     * @param {HTMLElement} fillEl - The fill bar element
     * @param {number} percentage - Target width percentage (0-100)
     * @param {number} duration - Duration in ms
     */
    bar(fillEl, percentage, duration = 600) {
      if (!fillEl) return;
      const target = Math.min(Math.max(percentage, 0), 100);
      fillEl.style.transition = `width ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
      requestAnimationFrame(() => {
        fillEl.style.width = target + '%';
      });
    },

    /**
     * Fade in an element
     * @param {HTMLElement} el
     * @param {number} duration
     */
    fadeIn(el, duration = 300) {
      if (!el) return;
      el.style.opacity = '0';
      el.style.display = '';
      el.style.transition = `opacity ${duration}ms ease`;
      requestAnimationFrame(() => {
        el.style.opacity = '1';
      });
    },

    /**
     * Fade out an element
     * @param {HTMLElement} el
     * @param {number} duration
     */
    fadeOut(el, duration = 300) {
      if (!el) return;
      el.style.transition = `opacity ${duration}ms ease`;
      el.style.opacity = '0';
      setTimeout(() => { el.style.display = 'none'; }, duration);
    },
  };

  // Inject required CSS keyframes once
  if (!document.getElementById('afro-anim-styles')) {
    const style = document.createElement('style');
    style.id = 'afro-anim-styles';
    style.textContent = `
      @keyframes afro-fade-up {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes afro-skeleton-pulse {
        0%, 100% { opacity: 0.4; }
        50%      { opacity: 0.7; }
      }
      .afro-skeleton {
        background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%) !important;
        background-size: 200% 100% !important;
        animation: afro-skeleton-pulse 1.5s ease-in-out infinite !important;
        color: transparent !important;
        border-radius: 6px;
        pointer-events: none;
        user-select: none;
      }
      .afro-skeleton * { visibility: hidden !important; }
    `;
    document.head.appendChild(style);
  }

  // Expose globally
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.anim = anim;

})(window);
