/**
 * AFROTOOLS — Accessibility Utilities
 * ===================================================================
 * Keyboard navigation, focus management, screen reader support,
 * and ARIA helpers.
 *
 * Usage:
 *   AfroTools.a11y.trapFocus(modalElement)
 *   AfroTools.a11y.releaseFocus()
 *   AfroTools.a11y.announce('Calculation complete')
 *   AfroTools.a11y.onEscape(callback)
 *   AfroTools.a11y.prefersReducedMotion()
 *   AfroTools.a11y.roving(container, '[role="tab"]')
 * ===================================================================
 */

(function (window) {
  'use strict';

  const FOCUSABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])', '[contenteditable]',
  ].join(', ');

  let _trapElement = null;
  let _trapHandler = null;
  let _previousFocus = null;
  let _escapeCallbacks = [];

  // Shared live region for announcements
  let _liveRegion = null;

  function ensureLiveRegion() {
    if (_liveRegion && document.body.contains(_liveRegion)) return;
    _liveRegion = document.createElement('div');
    _liveRegion.setAttribute('role', 'status');
    _liveRegion.setAttribute('aria-live', 'polite');
    _liveRegion.setAttribute('aria-atomic', 'true');
    _liveRegion.className = 'sr-only';
    Object.assign(_liveRegion.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0,0,0,0)',
      whiteSpace: 'nowrap',
      border: '0',
    });
    document.body.appendChild(_liveRegion);
  }

  const a11y = {
    /**
     * Trap keyboard focus within an element (for modals/drawers)
     * @param {HTMLElement} element
     * @param {Object} [opts] - { autoFocusFirst: true }
     */
    trapFocus(element, opts = {}) {
      if (!element) return;

      // Save current focus to restore later
      _previousFocus = document.activeElement;
      _trapElement = element;

      // Focus the first focusable element or the container itself
      const focusables = element.querySelectorAll(FOCUSABLE);
      if (opts.autoFocusFirst !== false && focusables.length > 0) {
        focusables[0].focus();
      } else {
        element.setAttribute('tabindex', '-1');
        element.focus();
      }

      // Trap handler
      _trapHandler = (e) => {
        if (e.key !== 'Tab') return;
        const focusables = _trapElement.querySelectorAll(FOCUSABLE);
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      document.addEventListener('keydown', _trapHandler);
    },

    /**
     * Release focus trap and restore previous focus
     */
    releaseFocus() {
      if (_trapHandler) {
        document.removeEventListener('keydown', _trapHandler);
        _trapHandler = null;
      }
      _trapElement = null;
      if (_previousFocus && typeof _previousFocus.focus === 'function') {
        _previousFocus.focus();
        _previousFocus = null;
      }
    },

    /**
     * Announce a message to screen readers via live region
     * @param {string} message
     * @param {string} [priority='polite'] - 'polite' or 'assertive'
     */
    announce(message, priority = 'polite') {
      ensureLiveRegion();
      _liveRegion.setAttribute('aria-live', priority);
      // Clear then set to trigger announcement even if same message
      _liveRegion.textContent = '';
      requestAnimationFrame(() => {
        _liveRegion.textContent = message;
      });
    },

    /**
     * Register an Escape key callback (global)
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    onEscape(callback) {
      if (_escapeCallbacks.length === 0) {
        document.addEventListener('keydown', _handleEscape);
      }
      _escapeCallbacks.push(callback);
      return () => {
        _escapeCallbacks = _escapeCallbacks.filter(cb => cb !== callback);
        if (_escapeCallbacks.length === 0) {
          document.removeEventListener('keydown', _handleEscape);
        }
      };
    },

    /**
     * Check if user prefers reduced motion
     * @returns {boolean}
     */
    prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    /**
     * Check if user prefers dark mode
     * @returns {boolean}
     */
    prefersDarkMode() {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    },

    /**
     * Setup roving tabindex for keyboard navigation
     * (e.g., tab groups, menu items, radio groups)
     * @param {HTMLElement} container
     * @param {string} itemSelector - CSS selector for navigable items
     * @param {Object} [opts] - { orientation: 'horizontal'|'vertical', wrap: true }
     */
    roving(container, itemSelector, opts = {}) {
      if (!container) return;
      const orientation = opts.orientation || 'horizontal';
      const wrap = opts.wrap !== false;

      const items = () => [...container.querySelectorAll(itemSelector)];

      // Initialize: first item is tabbable, rest are not
      items().forEach((el, i) => {
        el.setAttribute('tabindex', i === 0 ? '0' : '-1');
      });

      container.addEventListener('keydown', (e) => {
        const allItems = items();
        const current = allItems.indexOf(document.activeElement);
        if (current === -1) return;

        let next = -1;
        const isNext = orientation === 'horizontal'
          ? (e.key === 'ArrowRight')
          : (e.key === 'ArrowDown');
        const isPrev = orientation === 'horizontal'
          ? (e.key === 'ArrowLeft')
          : (e.key === 'ArrowUp');

        if (isNext) {
          e.preventDefault();
          next = wrap
            ? (current + 1) % allItems.length
            : Math.min(current + 1, allItems.length - 1);
        } else if (isPrev) {
          e.preventDefault();
          next = wrap
            ? (current - 1 + allItems.length) % allItems.length
            : Math.max(current - 1, 0);
        } else if (e.key === 'Home') {
          e.preventDefault();
          next = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          next = allItems.length - 1;
        }

        if (next >= 0 && next !== current) {
          allItems[current].setAttribute('tabindex', '-1');
          allItems[next].setAttribute('tabindex', '0');
          allItems[next].focus();
        }
      });
    },

    /**
     * Make an element act as a skip link target
     * @param {string} targetId
     * @param {string} [label='Skip to main content']
     */
    skipLink(targetId, label = 'Skip to main content') {
      const existing = document.querySelector('.afro-skip-link');
      if (existing) return;

      const link = document.createElement('a');
      link.href = '#' + targetId;
      link.className = 'afro-skip-link';
      link.textContent = label;
      link.style.cssText = `
        position: fixed; top: -100%; left: 16px; z-index: 10000;
        padding: 12px 24px; background: var(--color-primary, #5ddb9e);
        color: #fff; border-radius: 0 0 8px 8px; font-weight: 700;
        font-size: 0.875rem; text-decoration: none; transition: top 0.2s;
      `;
      link.addEventListener('focus', () => { link.style.top = '0'; });
      link.addEventListener('blur', () => { link.style.top = '-100%'; });
      document.body.insertBefore(link, document.body.firstChild);
    },

    /** The CSS selector for all focusable elements */
    FOCUSABLE,
  };

  /**
   * Global Escape key handler
   */
  function _handleEscape(e) {
    if (e.key === 'Escape') {
      // Fire the most recently registered callback first (stack behavior)
      const cb = _escapeCallbacks[_escapeCallbacks.length - 1];
      if (cb) cb(e);
    }
  }

  // ── EXPOSE ─────────────────────────────────────
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.a11y = a11y;

})(window);
