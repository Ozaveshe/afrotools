/**
 * AFROTOOLS — Share State Library
 * ═══════════════════════════════════════════════════════════
 * Encode/decode calculation state to/from URL query params.
 * Enables shareable calculation links.
 *
 * Usage:
 *   // Encode state to URL
 *   const url = AfroTools.shareState.encode({ g: 3600000, p: 1, n: 1, r: 'nta' });
 *   // → 'https://afrotools.com/nigeria/ng-salary-tax?g=3600000&p=1&n=1&r=nta'
 *
 *   // Decode state from current URL
 *   const state = AfroTools.shareState.decode();
 *   // → { g: 3600000, p: 1, n: 1, r: 'nta' }
 *
 *   // Copy shareable link
 *   AfroTools.shareState.copyLink({ g: 3600000, p: 1 });
 *
 *   // Share via Web Share API or clipboard fallback
 *   AfroTools.shareState.share({ title, text, state });
 * ═══════════════════════════════════════════════════════════
 */

(function (window) {
  'use strict';

  const shareState = {
    /**
     * Encode state object into a full URL with query params
     * @param {Object} state - Key-value pairs to encode
     * @param {string} baseUrl - Optional base URL (defaults to current page)
     * @returns {string} Full URL with encoded params
     */
    encode(state, baseUrl = null) {
      const url = new URL(baseUrl || window.location.href.split('?')[0]);
      for (const [key, val] of Object.entries(state)) {
        if (val !== null && val !== undefined && val !== '') {
          url.searchParams.set(key, val);
        }
      }
      return url.toString();
    },

    /**
     * Decode query params from URL into an object
     * @param {string} url - Optional URL string (defaults to current page)
     * @returns {Object} Decoded state
     */
    decode(url = null) {
      const params = url
        ? new URL(url).searchParams
        : new URLSearchParams(window.location.search);
      const state = {};
      for (const [key, val] of params.entries()) {
        // Auto-parse numbers and booleans
        if (val === 'true') state[key] = true;
        else if (val === 'false') state[key] = false;
        else if (/^\d+(\.\d+)?$/.test(val)) state[key] = parseFloat(val);
        else state[key] = val;
      }
      return state;
    },

    /**
     * Check if URL has calculation state params
     * @returns {boolean}
     */
    hasState() {
      return window.location.search.length > 1;
    },

    /**
     * Copy a shareable link to clipboard with toast feedback
     * @param {Object} state - State to encode
     * @param {string} baseUrl - Optional base URL
     */
    async copyLink(state, baseUrl = null) {
      const url = this.encode(state, baseUrl);
      try {
        await navigator.clipboard.writeText(url);
        if (window.AfroTools && window.AfroTools.toast) {
          window.AfroTools.toast.success('Link copied to clipboard');
        }
        return true;
      } catch {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        if (window.AfroTools && window.AfroTools.toast) {
          window.AfroTools.toast.success('Link copied to clipboard');
        }
        return true;
      }
    },

    /**
     * Share via Web Share API (mobile) or clipboard fallback (desktop)
     * @param {Object} opts - { title, text, state, baseUrl }
     */
    async share(opts = {}) {
      const url = opts.state ? this.encode(opts.state, opts.baseUrl) : window.location.href;

      // Try native Web Share API (mobile)
      if (navigator.share) {
        try {
          await navigator.share({
            title: opts.title || document.title,
            text: opts.text || '',
            url: url,
          });
          // Track share
          if (window.gtag) {
            window.gtag('event', 'share_click', {
              tool_name: opts.toolId || 'unknown',
              method: 'native',
            });
          }
          return 'shared';
        } catch (e) {
          if (e.name === 'AbortError') return 'cancelled';
        }
      }

      // Fallback: copy to clipboard
      await this.copyLink(opts.state || {}, opts.baseUrl);
      if (window.gtag) {
        window.gtag('event', 'share_click', {
          tool_name: opts.toolId || 'unknown',
          method: 'copy_link',
        });
      }
      return 'copied';
    },

    /**
     * Share directly to WhatsApp with optimized text
     * @param {Object} opts - { headline, mainValue, subValues, state, toolId }
     */
    whatsappShare(opts = {}) {
      const url = opts.state ? this.encode(opts.state, opts.baseUrl) : window.location.href;
      const emoji = getToolEmoji(opts.toolId || '');
      let text = emoji + ' ' + (opts.headline || 'My Result') + ': ' + (opts.mainValue || '') + '\n\n';

      const subs = (opts.subValues || []).slice(0, 3);
      if (subs.length) {
        text += subs.map(s => s.label + ': ' + s.value).join(' | ') + '\n\n';
      }
      text += 'Calculate yours FREE \uD83D\uDC47\n' + url;

      window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');

      if (window.gtag) {
        window.gtag('event', 'share_click', {
          tool_name: opts.toolId || 'unknown',
          method: 'whatsapp',
        });
      }
    },

    /**
     * Clear state from URL without page reload
     */
    clearUrl() {
      const url = window.location.href.split('?')[0];
      window.history.replaceState({}, '', url);
    },
  };

  function getToolEmoji(toolId) {
    if (!toolId) return '\uD83D\uDCCA';
    const t = toolId.toLowerCase();
    if (t.includes('paye') || t.includes('salary') || t.includes('tax')) return '\uD83D\uDCB0';
    if (t.includes('vat')) return '\uD83E\uDDFE';
    if (t.includes('currency') || t.includes('fx') || t.includes('rate')) return '\uD83D\uDCB1';
    if (t.includes('pension') || t.includes('retirement')) return '\uD83C\uDFE6';
    if (t.includes('loan') || t.includes('mortgage')) return '\uD83C\uDFE0';
    if (t.includes('crypto') || t.includes('bitcoin')) return '\u20BF';
    if (t.includes('budget') || t.includes('saving')) return '\uD83D\uDCB0';
    if (t.includes('mobile-money') || t.includes('mpesa')) return '\uD83D\uDCF1';
    return '\uD83D\uDCCA';
  }

  /* ═══════════════════════════════════════════
     Deep Link / Compare Mode Handler
     ═══════════════════════════════════════════ */
  function checkDeepLink() {
    var params = new URLSearchParams(window.location.search);
    if (!params.has('compare')) return;

    var gross = params.get('gross');
    if (!gross) return;

    /* Try common input IDs across tool pages */
    var inputIds = ['grossSalary', 'salaryInput', 'grossInput', 'amount'];
    var filled = false;
    for (var i = 0; i < inputIds.length; i++) {
      var el = document.getElementById(inputIds[i]);
      if (el) {
        el.value = Number(gross).toLocaleString('en');
        filled = true;
        break;
      }
    }
    if (!filled) return;

    /* Show compare banner — create if it doesn't exist */
    var banner = document.getElementById('compareBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'compareBanner';
      banner.className = 'compare-banner';
      /* Insert before the results card or form */
      var anchor = document.querySelector('.results-card, .result-card, .res-card, .res-hero, .tool-form, .calc-form, .card');
      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(banner, anchor);
      }
    }
    if (banner) {
      banner.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px">' +
          '<span>A friend shared their result. <strong>Calculate yours to compare!</strong></span>' +
          '<button onclick="this.closest(\'.compare-banner\').classList.remove(\'show\')" ' +
            'style="background:none;border:none;font-size:1.1rem;cursor:pointer;padding:4px;color:inherit" ' +
            'aria-label="Dismiss">\u2715</button>' +
        '</div>';
      banner.classList.add('show');
    }

    /* Auto-trigger calculation after a short delay */
    setTimeout(function () {
      var calcBtn = document.querySelector('.calc-btn') ||
                    document.querySelector('[type="submit"]') ||
                    document.querySelector('button[onclick*="calculate"]');
      if (calcBtn) calcBtn.click();
    }, 300);

    /* Track compare visit */
    if (window.gtag) {
      gtag('event', 'compare_visit', {
        tool_name: document.querySelector('meta[name="tool-id"]')?.content || 'unknown',
        gross_prefilled: gross
      });
    }
  }

  /* Run deep link check when DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkDeepLink);
  } else {
    checkDeepLink();
  }

  // Expose globally
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.shareState = shareState;
  window.AfroTools.checkDeepLink = checkDeepLink;

})(window);
