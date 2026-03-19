/**
 * AfroTools Embeddable Widget Loader v1.0
 * Usage: <div data-afrotools="nigeria-paye"></div>
 *        <script src="https://afrotools.com/widgets/embed.js" async></script>
 *
 * Attributes:
 *   data-afrotools="widget-id"
 *   data-afrotools-theme="light|dark"  (default: light)
 *   data-afrotools-width="400"         (max-width in px)
 *   data-afrotools-accent="#007AFF"    (custom accent color)
 */
(function() {
  'use strict';

  var BASE = (function() {
    var scripts = document.querySelectorAll('script[src]');
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i].src;
      if (s.indexOf('/widgets/embed.js') !== -1) {
        return s.replace(/embed\.js.*$/, '');
      }
    }
    return 'https://afrotools.com/widgets/';
  })();

  var loaded = {};  // track loaded scripts
  var CSS_CACHE = null;

  // Widget ID → file path mapping
  // Format: 'widget-id': 'category/filename' (without .js)
  var WIDGET_MAP = {
    // PAYE Calculators — all 54 countries
    'nigeria-paye':'financial/ng-paye','kenya-paye':'financial/ke-paye',
    'ghana-paye':'financial/gh-paye','south-africa-paye':'financial/za-paye',
    'egypt-paye':'financial/eg-paye','tanzania-paye':'financial/tz-paye',
    'uganda-paye':'financial/ug-paye','rwanda-paye':'financial/rw-paye',
    'ethiopia-paye':'financial/et-paye','senegal-paye':'financial/sn-paye',
    'cote-divoire-paye':'financial/ci-paye','cameroon-paye':'financial/cm-paye',
    'morocco-paye':'financial/ma-paye','algeria-paye':'financial/dz-paye',
    'tunisia-paye':'financial/tn-paye','libya-paye':'financial/ly-paye',
    'sudan-paye':'financial/sd-paye','angola-paye':'financial/ao-paye',
    'mozambique-paye':'financial/mz-paye','zambia-paye':'financial/zm-paye',
    'zimbabwe-paye':'financial/zw-paye','botswana-paye':'financial/bw-paye',
    'namibia-paye':'financial/na-paye','eswatini-paye':'financial/sz-paye',
    'lesotho-paye':'financial/ls-paye','malawi-paye':'financial/mw-paye',
    'madagascar-paye':'financial/mg-paye','mauritius-paye':'financial/mu-paye',
    'seychelles-paye':'financial/sc-paye','burundi-paye':'financial/bi-paye',
    'dr-congo-paye':'financial/cd-paye','congo-paye':'financial/cg-paye',
    'gabon-paye':'financial/ga-paye','eq-guinea-paye':'financial/gq-paye',
    'car-paye':'financial/cf-paye','chad-paye':'financial/td-paye',
    'niger-paye':'financial/ne-paye','mali-paye':'financial/ml-paye',
    'burkina-faso-paye':'financial/bf-paye','guinea-paye':'financial/gn-paye',
    'guinea-bissau-paye':'financial/gw-paye','sierra-leone-paye':'financial/sl-paye',
    'liberia-paye':'financial/lr-paye','mauritania-paye':'financial/mr-paye',
    'gambia-paye':'financial/gm-paye','cape-verde-paye':'financial/cv-paye',
    'sao-tome-paye':'financial/st-paye','togo-paye':'financial/tg-paye',
    'benin-paye':'financial/bj-paye','somalia-paye':'financial/so-paye',
    'djibouti-paye':'financial/dj-paye','eritrea-paye':'financial/er-paye',
    'south-sudan-paye':'financial/ss-paye','comoros-paye':'financial/km-paye',

    // VAT Calculators
    'vat-calculator':'financial/vat-calc',
    'nigeria-vat':'financial/ng-vat','kenya-vat':'financial/ke-vat',
    'ghana-vat':'financial/gh-vat','south-africa-vat':'financial/za-vat',
    'egypt-vat':'financial/eg-vat','tanzania-vat':'financial/tz-vat',
    'ethiopia-vat':'financial/et-vat','rwanda-vat':'financial/rw-vat',
    'uganda-vat':'financial/ug-vat',

    // Financial tools
    'mortgage-calculator':'financial/mortgage','savings-goal':'financial/savings-goal',
    'investment-return':'financial/investment-return','loan-compare':'financial/loan-compare',
    'break-even':'financial/break-even','profit-margin':'financial/profit-margin',
    'markup-calculator':'financial/markup-calc','discount-calculator':'financial/discount-calc',
    'tip-calculator':'financial/tip-calc','budget-planner':'financial/budget-planner',
    'inflation-calculator':'financial/inflation-calc','car-loan':'financial/car-loan',
    'currency-converter':'financial/currency-converter',
    'percentage-calculator':'financial/percentage-calc',
    'compound-interest':'financial/compound-interest',

    // Crypto
    'crypto-converter':'crypto/crypto-converter','crypto-profit-loss':'crypto/profit-loss',
    'dca-calculator':'crypto/dca-calc','staking-rewards':'crypto/staking-rewards',
    'crypto-tax':'crypto/crypto-tax',

    // Health
    'bmi-calculator':'health/bmi','calorie-calculator':'health/calorie',
    'water-intake':'health/water-intake','due-date':'health/due-date',
    'waist-hip-ratio':'health/waist-hip','blood-pressure':'health/blood-pressure',
    'ovulation-calculator':'health/ovulation',

    // Education
    'gpa-calculator':'education/gpa','student-loan':'education/student-loan',
    'jamb-aggregate':'education/jamb-aggregate','waec-calculator':'education/waec',
    'ielts-calculator':'education/ielts',

    // Developer
    'json-formatter':'developer/json-formatter','base64':'developer/base64',
    'url-encoder':'developer/url-encoder','hash-generator':'developer/hash-generator',
    'jwt-decoder':'developer/jwt-decoder','uuid-generator':'developer/uuid-generator',
    'password-generator':'developer/password-generator','regex-tester':'developer/regex-tester',
    'color-picker':'developer/color-picker','html-entities':'developer/html-entities',
    'css-gradient':'developer/css-gradient','cron-builder':'developer/cron-builder',
    'markdown-editor':'developer/markdown-editor',

    // Document & PDF
    'word-counter':'document-pdf/word-counter','diff-checker':'document-pdf/diff-checker',

    // Image & Design
    'qr-generator':'image-design/qr-generator','color-contrast':'image-design/color-contrast',

    // Data & Productivity
    'unit-converter':'data-productivity/unit-converter',
    'time-zone':'data-productivity/time-zone',
    'age-calculator':'data-productivity/age-calculator',
    'scientific-calculator':'data-productivity/scientific-calc',
    'random-picker':'data-productivity/random-picker',
    'working-days':'data-productivity/working-days',

    // African-specific
    'japa-calculator':'african/japa-calculator',
    'mobile-money-fees':'african/mobile-money-fees',
    'remittance-compare':'african/remittance-compare',
    'public-holidays':'african/public-holidays',

    // Engineering
    'solar-calculator':'engineering/solar-calculator',
    'generator-fuel':'engineering/generator-fuel',

    // Legal
    'stamp-duty':'legal/stamp-duty',

    // Ecommerce
    'import-duty':'ecommerce/import-duty','shipping-calc':'ecommerce/shipping-calc'
  };

  function loadCSS() {
    if (CSS_CACHE) return Promise.resolve(CSS_CACHE);
    return fetch(BASE + 'css/widget-base.css')
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' loading widget CSS');
        return r.text();
      })
      .then(function(css) { CSS_CACHE = css; return css; });
  }

  function loadScript(url) {
    if (loaded[url]) return loaded[url];
    loaded[url] = fetch(url).then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' loading ' + url);
      return r.text();
    }).then(function(code) {
      try {
        var fn = new Function(code);
        fn();
      } catch (e) {
        console.error('[AfroWidgets] Script eval error:', url, e);
        throw e;
      }
    });
    return loaded[url];
  }

  function getFooterHTML(toolLink) {
    var link = toolLink || 'https://afrotools.com';
    return '<div class="aw-footer"><a href="' + link + '" target="_blank" rel="noopener">' +
      '<svg viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#007AFF"/></svg>' +
      ' Powered by AfroTools.com</a></div>';
  }

  function initWidget(el) {
    var widgetId = el.getAttribute('data-afrotools');
    if (!widgetId || el._awInit) return;
    el._awInit = true;

    var theme = el.getAttribute('data-afrotools-theme') || 'light';
    var maxW = el.getAttribute('data-afrotools-width');
    var accent = el.getAttribute('data-afrotools-accent');
    var path = WIDGET_MAP[widgetId];

    if (!path) {
      el.innerHTML = '<div style="padding:16px;text-align:center;color:#888;font-size:13px;">Widget "' + widgetId + '" not found. <a href="https://afrotools.com/widgets/demo/" target="_blank">Browse all widgets</a></div>';
      return;
    }

    // Create Shadow DOM
    var shadow = el.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<div class="aw aw--' + theme + '" style="' + (maxW ? 'max-width:' + maxW + 'px;' : '') + '"><div style="text-align:center;padding:24px;opacity:.5">Loading...</div></div>';

    // Load CSS + widget JS + engine dependencies
    var deps = [loadCSS()];

    // Determine which engines to load based on category
    var cat = path.split('/')[0];
    if (cat === 'financial' || cat === 'legal' || cat === 'ecommerce') {
      deps.push(loadScript(BASE + 'engines/tax-utils.js'));
    }
    if (path.indexOf('currency') !== -1 || path.indexOf('crypto') !== -1 || path.indexOf('remittance') !== -1) {
      deps.push(loadScript(BASE + 'engines/currency-utils.js'));
    }

    Promise.all(deps).then(function(results) {
      var css = results[0];
      // Apply accent override
      var extraCSS = '';
      if (accent) {
        extraCSS = '.aw-btn--primary{background:' + accent + '} .aw-btn--primary:hover{background:' + accent + ';opacity:.85} .aw-footer a{color:' + accent + '}';
      }

      // Load the widget module
      return loadScript(BASE + path + '.js').then(function() {
        // Widget registers itself on AfroWidgets
        // Try multiple key formats: underscore, camelCase, PascalCase, and raw
        function toCamel(s) { return s.replace(/-([a-z])/g, function(m, c) { return c.toUpperCase(); }); }
        function toPascal(s) { var c = toCamel(s); return c.charAt(0).toUpperCase() + c.slice(1); }
        var AW = window.AfroWidgets || {};
        var fn = path.split('/').pop();
        var widgetFn = AW[widgetId.replace(/-/g, '_')] || AW[toCamel(widgetId)] || AW[toPascal(widgetId)]
          || AW[fn.replace(/-/g, '_')] || AW[toCamel(fn)] || AW[toPascal(fn)]
          || AW[fn.toUpperCase().replace(/-/g, '')];

        if (widgetFn) {
          shadow.innerHTML = '';
          var style = document.createElement('style');
          style.textContent = css + extraCSS;
          shadow.appendChild(style);
          var container = document.createElement('div');
          container.className = 'aw aw--' + theme;
          if (maxW) container.style.maxWidth = maxW + 'px';
          shadow.appendChild(container);
          widgetFn(container, { theme: theme, accent: accent, widgetId: widgetId, footerHTML: getFooterHTML('https://afrotools.com') });
        } else {
          shadow.innerHTML = '<div style="padding:16px;text-align:center;color:#888;font-size:13px;">Widget loading error. <a href="https://afrotools.com" target="_blank">Visit AfroTools</a></div>';
        }
      });
    }).catch(function(err) {
      console.error('[AfroWidgets] Failed to load widget "' + widgetId + '":', err);
      shadow.innerHTML = '<div style="padding:16px;text-align:center;color:#888;font-size:13px;">Widget unavailable. <a href="https://afrotools.com" target="_blank">Visit AfroTools</a></div>';
    });

    // Tracking pixel
    try {
      new Image().src = 'https://afrotools.com/widgets/track.gif?w=' + widgetId + '&r=' + encodeURIComponent(document.referrer) + '&t=' + Date.now();
    } catch(e) {}
  }

  function scanAndInit() {
    var els = document.querySelectorAll('[data-afrotools]');
    if (!els.length) return;

    // Use IntersectionObserver for lazy loading
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            initWidget(entry.target);
          }
        });
      }, { rootMargin: '200px' });

      els.forEach(function(el) { observer.observe(el); });
    } else {
      // Fallback: init all immediately
      els.forEach(initWidget);
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanAndInit);
  } else {
    scanAndInit();
  }

  // Watch for dynamically added widgets
  if ('MutationObserver' in window) {
    new MutationObserver(function(mutations) {
      var found = false;
      mutations.forEach(function(m) {
        m.addedNodes.forEach(function(n) {
          if (n.nodeType === 1 && (n.hasAttribute('data-afrotools') || n.querySelector('[data-afrotools]'))) {
            found = true;
          }
        });
      });
      if (found) scanAndInit();
    }).observe(document.body || document.documentElement, { childList: true, subtree: true });
  }

  // Global namespace
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets._BASE = BASE;
  window.AfroWidgets._MAP = WIDGET_MAP;
  window.AfroWidgets._getFooter = getFooterHTML;
  window.AfroWidgets.scan = scanAndInit;
  window.AfroWidgets.init = function() {
    var els = document.querySelectorAll('[data-afrotools]');
    els.forEach(initWidget);
  };
})();
