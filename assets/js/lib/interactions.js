/**
 * AFROTOOLS — UX Interactions Library
 * ===================================================================
 * Premium micro-interactions: animated numbers, debounced inputs,
 * result reveals, copy feedback, and haptics.
 *
 * Usage:
 *   AfroTools.ux.animateNumber(el, 0, 3500000, { duration: 600, format: true })
 *   AfroTools.ux.debounce(fn, 300)
 *   AfroTools.ux.formatOnBlur(input, currencyCode)
 *   AfroTools.ux.revealResults(container)
 *   AfroTools.ux.copyFeedback(button, text)
 *   AfroTools.ux.haptic()
 * ===================================================================
 */

(function () {
  'use strict';

  // ── ANIMATED NUMBER COUNTER ──────────────────────────────

  /**
   * Animate a number from start to end value
   * @param {HTMLElement} el - Target element
   * @param {number} start - Start value
   * @param {number} end - End value
   * @param {Object} opts
   * @param {number} [opts.duration=600] - Animation duration in ms
   * @param {boolean} [opts.format=true] - Format with commas
   * @param {string} [opts.prefix=''] - Currency prefix (e.g., '₦')
   * @param {number} [opts.decimals=0] - Decimal places
   */
  function animateNumber(el, start, end, opts) {
    if (!el) return;
    opts = opts || {};
    var duration = opts.duration || 600;
    var format = opts.format !== false;
    var prefix = opts.prefix || '';
    var decimals = opts.decimals || 0;
    var startTime = null;

    // Ease-out cubic
    function easeOut(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function formatNum(n) {
      if (!format) return n.toFixed(decimals);
      return n.toLocaleString('en', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }

    // Check reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = prefix + formatNum(end);
      return;
    }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var easedProgress = easeOut(progress);
      var current = start + (end - start) * easedProgress;
      el.textContent = prefix + formatNum(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = prefix + formatNum(end);
      }
    }

    requestAnimationFrame(step);
  }

  // ── DEBOUNCE ──────────────────────────────────────────────

  function debounce(fn, delay) {
    var timer;
    return function() {
      var context = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(context, args); }, delay || 300);
    };
  }

  // ── THROTTLE ──────────────────────────────────────────────

  function throttle(fn, limit) {
    var inThrottle = false;
    return function() {
      var context = this, args = arguments;
      if (!inThrottle) {
        fn.apply(context, args);
        inThrottle = true;
        setTimeout(function() { inThrottle = false; }, limit || 100);
      }
    };
  }

  // ── FORMAT ON BLUR / UNFORMAT ON FOCUS ────────────────────

  function formatOnBlur(input, currencyCode) {
    if (!input) return;

    input.addEventListener('focus', function() {
      var raw = parseFloat(this.value.replace(/[^0-9.-]/g, ''));
      if (!isNaN(raw)) this.value = raw;
      this.select();
    });

    input.addEventListener('blur', function() {
      var raw = parseFloat(this.value.replace(/[^0-9.-]/g, ''));
      if (isNaN(raw) || raw === 0) {
        this.value = '';
        return;
      }
      // Format with commas
      this.value = raw.toLocaleString('en');
    });
  }

  // ── SLIDER + INPUT SYNC ──────────────────────────────────

  function syncSliderInput(slider, input, opts) {
    if (!slider || !input) return;
    opts = opts || {};
    var onChange = opts.onChange || function() {};

    slider.addEventListener('input', function() {
      input.value = parseFloat(this.value).toLocaleString('en');
      onChange(parseFloat(this.value));
    });

    input.addEventListener('input', debounce(function() {
      var val = parseFloat(this.value.replace(/[^0-9.-]/g, ''));
      if (!isNaN(val)) {
        var min = parseFloat(slider.min) || 0;
        var max = parseFloat(slider.max) || 100000000;
        val = Math.max(min, Math.min(max, val));
        slider.value = val;
        onChange(val);
      }
    }, 300));
  }

  // ── RESULT REVEAL ANIMATION ──────────────────────────────

  /**
   * Reveal result elements with staggered slide-up + fade-in
   * @param {HTMLElement} container - Container with result items
   * @param {string} [childSelector='.result-item, .result-row, tr'] - Items to animate
   */
  function revealResults(container, childSelector) {
    if (!container) return;

    // Check reduced motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      container.style.opacity = '1';
      return;
    }

    var items = container.querySelectorAll(childSelector || '.result-item, .result-row, tr, [data-reveal]');
    container.style.opacity = '1';

    items.forEach(function(item, i) {
      item.style.opacity = '0';
      item.style.transform = 'translateY(12px)';
      item.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      item.style.transitionDelay = (i * 50) + 'ms';

      // Force reflow then animate
      setTimeout(function() {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, 10);
    });
  }

  // ── COPY WITH FEEDBACK ────────────────────────────────────

  /**
   * Copy text and show checkmark feedback on button
   * @param {HTMLElement} button - The copy button
   * @param {string} text - Text to copy
   */
  function copyFeedback(button, text) {
    if (!button) return;

    navigator.clipboard.writeText(text).then(function() {
      var originalHTML = button.innerHTML;
      button.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#5ddb9e" stroke-width="2" stroke-linecap="round"><path d="M3 8l3.5 3.5L13 5"/></svg>';
      button.style.color = 'var(--color-primary)';

      setTimeout(function() {
        button.innerHTML = originalHTML;
        button.style.color = '';
      }, 1500);

      haptic();
    }).catch(function() {
      // Fallback: textarea copy
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    });
  }

  // ── HAPTIC FEEDBACK ──────────────────────────────────────

  function haptic(style) {
    if (navigator.vibrate) {
      navigator.vibrate(style === 'heavy' ? [20, 10, 20] : 10);
    }
  }

  // ── BUTTON PRESS EFFECT ──────────────────────────────────

  function pressEffect(selector) {
    document.addEventListener('mousedown', function(e) {
      var btn = e.target.closest(selector || 'button, .btn, [role="button"]');
      if (btn) {
        btn.style.transform = 'scale(0.98)';
        btn.style.transition = 'transform 0.1s ease';
      }
    });
    document.addEventListener('mouseup', function(e) {
      var btn = e.target.closest(selector || 'button, .btn, [role="button"]');
      if (btn) {
        btn.style.transform = '';
      }
    });
  }

  // ── LIVE REGION ANNOUNCE ──────────────────────────────────

  /**
   * Announce calculation results to screen readers
   * @param {string} message - Text to announce
   */
  function announceResult(message) {
    if (typeof AfroTools !== 'undefined' && AfroTools.a11y && AfroTools.a11y.announce) {
      AfroTools.a11y.announce(message, 'polite');
    } else {
      // Fallback: create live region
      var region = document.getElementById('afro-live-region');
      if (!region) {
        region = document.createElement('div');
        region.id = 'afro-live-region';
        region.setAttribute('aria-live', 'polite');
        region.setAttribute('aria-atomic', 'true');
        region.className = 'sr-only';
        region.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)';
        document.body.appendChild(region);
      }
      region.textContent = message;
    }
  }

  // ── AUTO-INIT ─────────────────────────────────────────────

  // Initialize button press effect globally
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { pressEffect(); });
    } else {
      pressEffect();
    }
  }

  // ── EXPOSE ────────────────────────────────────────────────

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.ux = {
    animateNumber: animateNumber,
    debounce: debounce,
    throttle: throttle,
    formatOnBlur: formatOnBlur,
    syncSliderInput: syncSliderInput,
    revealResults: revealResults,
    copyFeedback: copyFeedback,
    haptic: haptic,
    pressEffect: pressEffect,
    announceResult: announceResult,
  };

})();
