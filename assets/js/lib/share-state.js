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
     * Clear state from URL without page reload
     */
    clearUrl() {
      const url = window.location.href.split('?')[0];
      window.history.replaceState({}, '', url);
    },
  };

  // Expose globally
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.shareState = shareState;

})(window);
