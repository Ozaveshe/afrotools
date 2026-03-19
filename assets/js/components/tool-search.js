/**
 * AFROTOOLS — Smart Search Enhancement
 * Adds Ctrl+K / "/" keyboard shortcut, recent searches, and country-aware popular tools.
 *
 * Usage: Include after navbar.js (which already has search modal).
 *   <script src="/assets/js/components/tool-search.js" defer></script>
 *
 * This enhances the existing navbar search with:
 *   - "/" key to open search (in addition to Ctrl+K)
 *   - Recent searches stored in localStorage
 *   - Popular tools for user's country (from AfroAuth profile)
 *   - Fuzzy matching on tool names
 */
(function () {
  'use strict';

  var RECENT_KEY = 'afro_recent_searches';
  var MAX_RECENT = 5;

  // --- Recent searches ---
  function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; }
    catch (e) { return []; }
  }

  function addRecent(term) {
    if (!term || term.length < 2) return;
    var list = getRecent().filter(function (s) { return s !== term; });
    list.unshift(term);
    if (list.length > MAX_RECENT) list.length = MAX_RECENT;
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); }
    catch (e) { /* quota */ }
  }

  // --- Fuzzy match ---
  function fuzzyMatch(needle, haystack) {
    needle = needle.toLowerCase();
    haystack = haystack.toLowerCase();
    if (haystack.indexOf(needle) !== -1) return true;
    // Simple character-by-character fuzzy
    var ni = 0;
    for (var hi = 0; hi < haystack.length && ni < needle.length; hi++) {
      if (haystack[hi] === needle[ni]) ni++;
    }
    return ni === needle.length;
  }

  // --- Country-aware popular tools ---
  function getPopularForCountry() {
    var country = 'NG'; // default
    try {
      if (window.AfroAuth && window.AfroAuth.profile && window.AfroAuth.profile.country) {
        country = window.AfroAuth.profile.country;
      }
    } catch (e) { /* ignore */ }

    if (!window.AFRO_TOOLS) return [];
    var pageLang = document.documentElement.lang || 'en';
    return window.AFRO_TOOLS
      .filter(function (t) {
        return t.status === 'live' && (t.lang || 'en') === pageLang && t.countries && t.countries.indexOf(country) !== -1;
      })
      .sort(function (a, b) { return (b.priority || 0) - (a.priority || 0); })
      .slice(0, 6);
  }

  // --- Enhance existing search ---
  function enhance() {
    // "/" key to open search (don't trigger when typing in inputs)
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        var tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
        e.preventDefault();
        // Trigger the navbar's Ctrl+K handler
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
      }
    });

    // Track searches — listen for search input changes in navbar overlay
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          var input = node.querySelector ? node.querySelector('.search-overlay input, .afro-search-input') : null;
          if (input && !input._afroTracked) {
            input._afroTracked = true;
            // Show recent searches when empty
            input.addEventListener('focus', function () {
              if (!input.value) showRecentHint(input);
            });
            // Track on result click
            input.closest('.search-overlay, [class*="search"]')
              ?.addEventListener('click', function (e) {
                var link = e.target.closest('a');
                if (link && input.value) addRecent(input.value.trim());
              });
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function showRecentHint(input) {
    var recent = getRecent();
    if (!recent.length) return;
    // Set placeholder with most recent search
    input.placeholder = 'Try: ' + recent[0] + ' (/ or Ctrl+K)';
  }

  // Init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhance);
  } else {
    enhance();
  }

  // Expose for navbar integration
  window.AfroSearch = {
    getRecent: getRecent,
    addRecent: addRecent,
    fuzzyMatch: fuzzyMatch,
    getPopularForCountry: getPopularForCountry
  };
})();
