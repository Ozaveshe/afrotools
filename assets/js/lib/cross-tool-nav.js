/**
 * AfroTools Cross-Tool Navigation
 * =====================================================================
 * Renders a "Also useful for [country]" strip at the bottom of any
 * tool page, surfacing related tools so users flow between apps
 * instead of leaving the site.
 *
 * Usage (add to any tool page):
 *   <script src="/assets/js/lib/cross-tool-nav.js" defer></script>
 *   <!-- OR set data attributes on the body: -->
 *   <body data-ctn-country="ng" data-ctn-category="financial">
 *
 * The strip mounts just before <afro-footer> automatically.
 * It reads:
 *   - data-ctn-country  → 2-letter ISO code (e.g. "ng", "ke", "za")
 *   - data-ctn-category → tool category ("financial", "agriculture", etc.)
 *   - data-ctn-current  → href of current page (auto-detected if omitted)
 * =====================================================================
 */

(function () {
  'use strict';

  /* ── RELATED TOOL DEFINITIONS ───────────────────────────────────── */
  /* Each entry: { icon, name, meta, href(country) } where {cc} is
     replaced with the detected country code.                          */
  var RELATED = {
    /* ── Financial cross-links ── */
    financial: [
      { icon: '🧾', name: 'VAT Calculator', meta: 'Sales tax for {COUNTRY}', href: '/{cc}/{cc}-vat' },
      { icon: '💱', name: 'Currency Converter', meta: 'Live FX rates', href: '/tools/currency-converter/' },
      { icon: '📄', name: 'Invoice Generator', meta: 'Send professional invoices', href: '/tools/invoice-generator/' },
      { icon: '📊', name: 'Budget Planner', meta: 'Monthly budget tracker', href: '/tools/budget-planner/' },
      { icon: '✈️', name: 'Remittance Comparator', meta: 'Best money transfer rates', href: '/tools/remittance-compare/' },
      { icon: '📁', name: 'PDF Workspace', meta: 'Export your payslip', href: '/tools/pdf-workspace/' },
      { icon: '🤖', name: 'AI Financial Advisor', meta: 'Ask questions about your tax', href: '/tools/ai-advisor/' },
    ],

    /* ── VAT tool cross-links ── */
    vat: [
      { icon: '💰', name: 'PAYE Calculator', meta: 'Income tax for {COUNTRY}', href: '/{cc}/{cc}-paye' },
      { icon: '🧾', name: 'Invoice Generator', meta: 'VAT-aware invoicing', href: '/tools/invoice-generator/' },
      { icon: '📦', name: 'Import Duty Calculator', meta: 'Customs + VAT on imports', href: '/tools/import-duty/' },
      { icon: '📊', name: 'Business Plan Builder', meta: 'Include tax in projections', href: '/tools/business-plan/' },
      { icon: '📁', name: 'PDF Workspace', meta: 'Export invoices & receipts', href: '/tools/pdf-workspace/' },
    ],

    /* ── Agriculture cross-links ── */
    agriculture: [
      { icon: '🌾', name: 'Crop Yield Calculator', meta: 'Estimate your harvest', href: '/agriculture/crop-yield/' },
      { icon: '💧', name: 'Irrigation Calculator', meta: 'Water requirements', href: '/agriculture/irrigation/' },
      { icon: '🌱', name: 'Fertilizer Calculator', meta: 'NPK dosage planner', href: '/agriculture/fertilizer-calc/' },
      { icon: '💰', name: 'Farm Profit Calculator', meta: 'Revenue vs cost analysis', href: '/agriculture/farm-profit/' },
      { icon: '🐔', name: 'Poultry ROI', meta: 'Chicken farm returns', href: '/agriculture/poultry-roi/' },
      { icon: '📦', name: 'Commodity Prices', meta: 'Live crop market prices', href: '/agriculture/commodity-prices/' },
      { icon: '🌍', name: 'Agric Export Docs', meta: 'Phytosanitary requirements', href: '/agriculture/export-docs/' },
    ],

    /* ── PDF / document cross-links ── */
    'document-pdf': [
      { icon: '📄', name: 'CV / Résumé Builder', meta: 'Professional templates', href: '/tools/cv-builder/' },
      { icon: '🧾', name: 'Invoice Generator', meta: 'PDF invoices with VAT', href: '/tools/invoice-generator/' },
      { icon: '📋', name: 'Contract Generator', meta: 'Legal-grade contracts', href: '/tools/contract-generator/' },
      { icon: '💰', name: 'PAYE Calculator', meta: 'Get your payslip numbers', href: '/{cc}/{cc}-paye' },
      { icon: '📝', name: 'Meeting Minutes', meta: 'Formal minutes to PDF', href: '/tools/meeting-minutes/' },
    ],

    /* ── Education cross-links ── */
    education: [
      { icon: '🎓', name: 'GPA Calculator', meta: 'Convert grade scales', href: '/tools/gpa-calculator/' },
      { icon: '📝', name: 'WAEC/NECO Calculator', meta: 'Admission aggregate', href: '/tools/waec-calculator/' },
      { icon: '📊', name: 'JAMB Aggregate', meta: 'Post-UTME screening', href: '/tools/jamb-aggregate/' },
      { icon: '🌐', name: 'IELTS Calculator', meta: 'Check band requirements', href: '/tools/ielts-calculator/' },
      { icon: '🏆', name: 'Scholarship Finder', meta: 'Funding for African students', href: '/tools/scholarship-finder/' },
    ],

    /* ── Language cross-links ── */
    language: [
      { icon: '🇳🇬', name: 'Pidgin Translator', meta: 'Nigerian Pidgin English', href: '/tools/pidgin-translator/' },
      { icon: '🗣️', name: 'Yoruba Translator', meta: 'Yoruba ↔ English', href: '/tools/yoruba-translator/' },
      { icon: '🗣️', name: 'Igbo Translator', meta: 'Igbo ↔ English', href: '/tools/igbo-translator/' },
      { icon: '🗣️', name: 'Hausa Translator', meta: 'Hausa ↔ English', href: '/tools/hausa-translator/' },
      { icon: '🗣️', name: 'Swahili Translator', meta: 'Swahili ↔ English', href: '/tools/swahili-translator/' },
    ],

    /* ── Engineering cross-links ── */
    engineering: [
      { icon: '📐', name: 'AfroDraft CAD', meta: '2D browser-based CAD', href: '/engineering/afrodraft/' },
      { icon: '🏗️', name: 'Structural Calculator', meta: 'Beam, slab, column design', href: '/tools/structural-calc/' },
      { icon: '📋', name: 'BOQ Builder', meta: 'Bill of quantities', href: '/tools/boq-builder/' },
      { icon: '⚡', name: 'Electrical Load Planner', meta: 'Panel sizing tool', href: '/tools/electrical-load/' },
    ],

    /* ── Default fallback ── */
    _default: [
      { icon: '💰', name: 'PAYE Calculator', meta: 'Income tax calculator', href: '/salary-tax/' },
      { icon: '🧾', name: 'VAT Calculator', meta: 'Sales tax across Africa', href: '/tools/vat-calculator/' },
      { icon: '📁', name: 'PDF Workspace', meta: 'All-in-one PDF tools', href: '/tools/pdf-workspace/' },
      { icon: '💱', name: 'Currency Converter', meta: 'Live FX rates', href: '/tools/currency-converter/' },
      { icon: '🤖', name: 'AI Financial Advisor', meta: 'AI-powered guidance', href: '/tools/ai-advisor/' },
    ]
  };

  /* ── COUNTRY NAME MAP ────────────────────────────────────────────── */
  var COUNTRY_NAMES = {
    ng:'Nigeria', ke:'Kenya', gh:'Ghana', za:'South Africa',
    eg:'Egypt', tz:'Tanzania', et:'Ethiopia', rw:'Rwanda',
    ug:'Uganda', sn:'Senegal', ci:'Côte d\'Ivoire', cm:'Cameroon',
    ma:'Morocco', dz:'Algeria', tn:'Tunisia', ao:'Angola',
    mz:'Mozambique', mg:'Madagascar', zm:'Zambia', zw:'Zimbabwe',
    mw:'Malawi', ml:'Mali', bf:'Burkina Faso', gn:'Guinea',
    ne:'Niger', tg:'Togo', bj:'Benin', sl:'Sierra Leone',
    lr:'Liberia', gm:'Gambia', gw:'Guinea-Bissau', cv:'Cabo Verde',
    mr:'Mauritania', ly:'Libya', sd:'Sudan', so:'Somalia',
    bi:'Burundi', dj:'Djibouti', er:'Eritrea', km:'Comoros',
    sc:'Seychelles', mu:'Mauritius', ss:'South Sudan',
    cd:'DR Congo', cg:'Congo', td:'Chad', cf:'Central African Rep.',
    ga:'Gabon', gq:'Equatorial Guinea', st:'São Tomé & Príncipe',
    na:'Namibia', bw:'Botswana', ls:'Lesotho', sz:'Eswatini',
    rw:'Rwanda'
  };

  /* ── HELPERS ─────────────────────────────────────────────────────── */
  function getCountry() {
    // 1. body data attribute (set by page author)
    var cc = document.body.getAttribute('data-ctn-country');
    if (cc) return cc.toLowerCase();
    // 2. Infer from canonical URL path (e.g. /nigeria/ng-salary-tax)
    var path = window.location.pathname.toLowerCase();
    var m = path.match(/\/(ng|ke|gh|za|eg|tz|et|rw|ug|sn|ci|cm|ma|dz|tn|ao|mz|mg|zm|zw|mw|ml|bf|gn|ne|tg|bj|sl|lr|gm|gw|cv|mr|ly|sd|so|bi|dj|er|km|sc|mu|ss|cd|cg|td|cf|ga|gq|st|na|bw|ls|sz)\//);
    if (m) return m[1];
    // 3. Infer from URL prefix like /nigeria/ /kenya/
    var countryPaths = {
      'nigeria':'ng','kenya':'ke','ghana':'gh','south-africa':'za','egypt':'eg',
      'tanzania':'tz','ethiopia':'et','rwanda':'rw','uganda':'ug','senegal':'sn',
      'cote-divoire':'ci','cameroon':'cm','morocco':'ma','algeria':'dz','tunisia':'tn',
      'angola':'ao','mozambique':'mz','madagascar':'mg','zambia':'zm','zimbabwe':'zw',
      'malawi':'mw','mali':'ml','burkina-faso':'bf','guinea':'gn','niger':'ne',
      'togo':'tg','benin':'bj','sierra-leone':'sl','liberia':'lr','gambia':'gm',
      'guinea-bissau':'gw','cape-verde':'cv','mauritania':'mr','libya':'ly',
      'sudan':'sd','somalia':'so','burundi':'bi','djibouti':'dj','eritrea':'er',
      'comoros':'km','seychelles':'sc','mauritius':'mu','south-sudan':'ss',
      'dr-congo':'cd','congo':'cg','chad':'td','car':'cf','gabon':'ga',
      'eq-guinea':'gq','sao-tome':'st','namibia':'na','botswana':'bw',
      'lesotho':'ls','eswatini':'sz'
    };
    for (var k in countryPaths) {
      if (path.indexOf('/' + k + '/') === 0 || path.indexOf('/' + k + '-') !== -1) {
        return countryPaths[k];
      }
    }
    return null;
  }

  function getCategory() {
    var cat = document.body.getAttribute('data-ctn-category');
    if (cat) return cat.toLowerCase();
    var path = window.location.pathname.toLowerCase();
    if (path.indexOf('/agriculture/') === 0)         return 'agriculture';
    if (path.indexOf('/tools/pdf')     !== -1)        return 'document-pdf';
    if (path.indexOf('/tools/cv')      !== -1)        return 'document-pdf';
    if (path.indexOf('/tools/invoice') !== -1)        return 'document-pdf';
    if (path.indexOf('/tools/waec')    !== -1)        return 'education';
    if (path.indexOf('/tools/gpa')     !== -1)        return 'education';
    if (path.indexOf('/tools/jamb')    !== -1)        return 'education';
    if (path.indexOf('/tools/ielts')   !== -1)        return 'education';
    if (path.match(/-paye|salary-tax|-income/))       return 'financial';
    if (path.match(/-vat|vat-calc/))                  return 'vat';
    if (path.indexOf('/engineering/')  === 0)         return 'engineering';
    if (path.match(/translator|pidgin|yoruba|hausa|igbo|swahili/)) return 'language';
    return '_default';
  }

  function resolveHref(href, cc) {
    if (!cc) return href.replace(/{cc}/g, '').replace(/\/\//g, '/');
    return href.replace(/{cc}/g, cc);
  }

  function buildStrip(cc, category, currentHref) {
    var tools = RELATED[category] || RELATED['_default'];
    if (!tools || !tools.length) return null;

    var countryName = cc ? (COUNTRY_NAMES[cc] || cc.toUpperCase()) : null;

    // Filter out current page & limit to 6
    var items = tools.filter(function (t) {
      var href = resolveHref(t.href, cc);
      return href && href !== currentHref;
    }).slice(0, 6);

    if (!items.length) return null;

    var label = countryName
      ? 'Also useful for ' + countryName
      : 'Related Tools';

    var cardsHtml = items.map(function (t) {
      var href = resolveHref(t.href, cc);
      var meta = t.meta.replace('{COUNTRY}', countryName || '');
      return '<a href="' + href + '" class="cts-card">'
        + '<span class="cts-card-icon">' + t.icon + '</span>'
        + '<span class="cts-card-body">'
        + '<span class="cts-card-name">' + t.name + '</span>'
        + '<span class="cts-card-meta">' + meta + '</span>'
        + '</span>'
        + '</a>';
    }).join('');

    var strip = document.createElement('div');
    strip.className = 'cross-tool-strip';
    strip.setAttribute('aria-label', 'Related tools');
    strip.innerHTML = '<div class="cts-inner">'
      + '<div class="cts-label">' + label + '</div>'
      + '<div class="cts-grid">' + cardsHtml + '</div>'
      + '</div>';
    return strip;
  }

  /* ── INIT ────────────────────────────────────────────────────────── */
  function init() {
    // Skip on homepage, search, and dashboard
    var path = window.location.pathname;
    if (path === '/' || path.indexOf('/search') === 0 || path.indexOf('/dashboard') === 0) return;

    var cc       = getCountry();
    var category = getCategory();

    var strip = buildStrip(cc, category, path);
    if (!strip) return;

    // Mount before <afro-footer> if present, otherwise before </body>
    var footer = document.querySelector('afro-footer');
    if (footer) {
      footer.parentNode.insertBefore(strip, footer);
    } else {
      document.body.appendChild(strip);
    }
  }

  /* Run after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
