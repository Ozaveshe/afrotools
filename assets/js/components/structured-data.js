/**
 * AFROTOOLS — Structured Data Injector
 * Auto-generates JSON-LD schema markup for tool pages.
 *
 * Usage: Add to any tool page:
 *   <script src="/assets/js/components/structured-data.js" defer></script>
 *
 * Reads page metadata (title, description, canonical, tool-id, og:image)
 * and FAQ sections to inject WebApplication + FAQPage + BreadcrumbList schemas.
 *
 * Pages that already have manual JSON-LD will NOT be double-injected.
 */
(function () {
  'use strict';

  function getMeta(name) {
    var el = document.querySelector('meta[name="' + name + '"]') ||
             document.querySelector('meta[property="' + name + '"]');
    return el ? el.getAttribute('content') : '';
  }

  function getCanonical() {
    var el = document.querySelector('link[rel="canonical"]');
    return el ? el.getAttribute('href') : location.href;
  }

  function hasSchema(type) {
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < scripts.length; i++) {
      try {
        var d = JSON.parse(scripts[i].textContent);
        if (d['@type'] === type) return true;
      } catch (e) { /* skip malformed */ }
    }
    return false;
  }

  function inject(data) {
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  function guessCategory(url) {
    if (/paye|salary|tax|income/i.test(url)) return 'FinanceApplication';
    if (/pdf|document|merge|split/i.test(url)) return 'UtilitiesApplication';
    if (/image|design|qr|thumbnail/i.test(url)) return 'DesignApplication';
    if (/developer|json|regex|base64|hash/i.test(url)) return 'DeveloperApplication';
    if (/crypto|bitcoin/i.test(url)) return 'FinanceApplication';
    if (/gpa|waec|education/i.test(url)) return 'EducationalApplication';
    if (/bmi|health|pregnancy/i.test(url)) return 'HealthApplication';
    return 'WebApplication';
  }

  function init() {
    var title = document.title || '';
    var desc = getMeta('description');
    var url = getCanonical();
    var toolId = getMeta('tool-id');
    var ogImage = getMeta('og:image');

    // Only inject on tool pages (must have tool-id meta)
    if (!toolId) return;

    // --- WebApplication schema ---
    if (!hasSchema('WebApplication')) {
      var appSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': title.split('|')[0].trim(),
        'url': url,
        'description': desc,
        'applicationCategory': guessCategory(url),
        'operatingSystem': 'Web',
        'inLanguage': document.documentElement.lang || 'en',
        'isAccessibleForFree': true,
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        },
        'provider': {
          '@type': 'Organization',
          'name': 'AfroTools',
          'url': 'https://afrotools.com'
        }
      };
      if (ogImage) appSchema.image = ogImage;
      inject(appSchema);
    }

    // --- FAQPage schema (extract from DOM) ---
    if (!hasSchema('FAQPage')) {
      var faqItems = [];
      // Pattern 1: details/summary FAQ
      var details = document.querySelectorAll('.faq details, .landing-faq details, [class*="faq"] details');
      details.forEach(function (d) {
        var q = d.querySelector('summary');
        var a = d.querySelector('p, div, .faq-answer');
        if (q && a) {
          faqItems.push({
            '@type': 'Question',
            'name': q.textContent.trim(),
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': a.textContent.trim()
            }
          });
        }
      });
      // Pattern 2: dt/dd FAQ
      if (!faqItems.length) {
        var dts = document.querySelectorAll('.faq dt, [class*="faq"] dt');
        dts.forEach(function (dt) {
          var dd = dt.nextElementSibling;
          if (dd && dd.tagName === 'DD') {
            faqItems.push({
              '@type': 'Question',
              'name': dt.textContent.trim(),
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': dd.textContent.trim()
              }
            });
          }
        });
      }

      if (faqItems.length) {
        inject({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          'mainEntity': faqItems
        });
      }
    }

    // --- BreadcrumbList schema ---
    if (!hasSchema('BreadcrumbList')) {
      var bcLinks = document.querySelectorAll('.breadcrumb a, .landing-breadcrumb a, nav[aria-label="Breadcrumb"] a');
      if (bcLinks.length) {
        var items = [];
        bcLinks.forEach(function (a, i) {
          items.push({
            '@type': 'ListItem',
            'position': i + 1,
            'name': a.textContent.trim(),
            'item': a.href
          });
        });
        // Add current page
        var current = document.querySelector('.breadcrumb [aria-current], .landing-breadcrumb [aria-current], nav[aria-label="Breadcrumb"] [aria-current]');
        if (current) {
          items.push({
            '@type': 'ListItem',
            'position': items.length + 1,
            'name': current.textContent.trim(),
            'item': url
          });
        }
        inject({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': items
        });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
