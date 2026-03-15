/**
 * AFROTOOLS — SEO Meta & Structured Data Helper
 * ===================================================================
 * Auto-injects missing SEO meta tags and structured data.
 * Include this script in <head> to ensure consistent SEO across all pages.
 *
 * What it does:
 *   - Fills in missing og:* and twitter:* meta tags from existing page data
 *   - Ensures canonical URL is set
 *   - Adds hreflang for future i18n
 *   - Validates and warns about SEO issues (dev mode only)
 *
 * Usage:
 *   <script src="/assets/js/lib/seo.js" defer></script>
 *
 * It reads from existing <title>, <meta name="description">, and
 * <link rel="canonical"> to fill gaps — never overwrites existing tags.
 * ===================================================================
 */

(function () {
  'use strict';

  var SITE_NAME = 'AfroTools';
  var SITE_URL  = 'https://afrotools.com';
  var DEFAULT_OG_IMAGE = SITE_URL + '/assets/img/og/og-default.png';

  // ── HELPERS ──────────────────────────────────────────────

  function getMeta(name) {
    var el = document.querySelector('meta[name="' + name + '"]') ||
             document.querySelector('meta[property="' + name + '"]');
    return el ? el.getAttribute('content') : null;
  }

  function setMeta(attr, name, content) {
    if (!content) return;
    // Don't overwrite existing
    var existing = document.querySelector('meta[' + attr + '="' + name + '"]');
    if (existing) return;
    var meta = document.createElement('meta');
    meta.setAttribute(attr, name);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }

  function getCanonical() {
    var link = document.querySelector('link[rel="canonical"]');
    return link ? link.getAttribute('href') : null;
  }

  function setCanonical(url) {
    if (document.querySelector('link[rel="canonical"]')) return;
    var link = document.createElement('link');
    link.rel = 'canonical';
    link.href = url;
    document.head.appendChild(link);
  }

  // ── MAIN ────────────────────────────────────────────────

  function ensureSEO() {
    var title = document.title || '';
    var description = getMeta('description') || '';
    var canonical = getCanonical() || (SITE_URL + window.location.pathname);
    var ogImage = getMeta('og:image') || DEFAULT_OG_IMAGE;

    // Ensure canonical
    setCanonical(canonical);

    // Open Graph
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', SITE_NAME);

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', getMeta('og:title') || title);
    setMeta('name', 'twitter:description', getMeta('og:description') || description);
    setMeta('name', 'twitter:image', ogImage);
    setMeta('name', 'twitter:site', '@AfroToolsHQ');

    // hreflang (English default, prepare for future i18n)
    if (!document.querySelector('link[rel="alternate"][hreflang]')) {
      var hreflang = document.createElement('link');
      hreflang.rel = 'alternate';
      hreflang.hreflang = 'en';
      hreflang.href = canonical;
      document.head.appendChild(hreflang);

      var xDefault = document.createElement('link');
      xDefault.rel = 'alternate';
      xDefault.hreflang = 'x-default';
      xDefault.href = canonical;
      document.head.appendChild(xDefault);
    }
  }

  // ── DEV MODE VALIDATION ─────────────────────────────────

  function validateSEO() {
    // Only run on localhost / dev
    if (window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1' &&
        !window.location.hostname.includes('netlify')) return;

    var warnings = [];
    var title = document.title || '';

    if (!title) warnings.push('Missing <title> tag');
    else if (title.length > 70) warnings.push('Title too long (' + title.length + ' chars, max 60-70)');
    else if (!title.includes('AfroTools')) warnings.push('Title missing "AfroTools" brand');

    if (!getMeta('description')) warnings.push('Missing meta description');
    else {
      var desc = getMeta('description');
      if (desc.length < 120) warnings.push('Meta description too short (' + desc.length + ' chars, aim for 150-160)');
      if (desc.length > 170) warnings.push('Meta description too long (' + desc.length + ' chars, max 160)');
    }

    if (!getCanonical()) warnings.push('Missing canonical URL');

    // Check for bad structured data patterns
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(function(s) {
      try {
        var data = JSON.parse(s.textContent);
        if (data.aggregateRating) warnings.push('Remove aggregateRating from structured data (no real reviews)');
        if (data.review) warnings.push('Remove review from structured data (no real reviews)');
      } catch (e) {
        warnings.push('Invalid JSON-LD: ' + e.message);
      }
    });

    if (warnings.length > 0) {
      console.groupCollapsed('%c[AfroTools SEO] ' + warnings.length + ' warning(s)', 'color: #f59e0b; font-weight: bold');
      warnings.forEach(function(w) { console.warn('  → ' + w); });
      console.groupEnd();
    }
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      ensureSEO();
      validateSEO();
    });
  } else {
    ensureSEO();
    validateSEO();
  }

  // Expose for manual use
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.seo = { ensureSEO: ensureSEO, validateSEO: validateSEO };

})();
