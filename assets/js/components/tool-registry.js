// /assets/js/tool-registry.js
// ═══════════════════════════════════════════════════════════
// AFROTOOLS — Single source of truth for all tools
// Add a tool here ONCE → it appears on every relevant page
// ═══════════════════════════════════════════════════════════

var AFRO_TOOLS = [
  // ═══ LIVE TOOLS ═══
  // img: path to card thumbnail (400x240 SVG in /assets/img/tools/)
  // To add a new tool: copy any entry, change the fields, done.
  {
    id: 'pdf-workspace',
    name: 'PDF Workspace',
    desc: 'Split, merge, rearrange, rotate, compress, add page numbers. Files never leave your browser.',
    icon: '📄',
    img: '/assets/img/tools/pdf-workspace.svg',
    href: '/tools/pdf-workspace',
    category: 'pdf',
    color: '#eaf5ef',
    accent: '#008751',
    status: 'live',        // live | new | coming
    countries: ['ALL'],    // ALL = appears on every country page
  },
  {
    id: 'japa-calculator',
    name: 'Japa Cost Calculator',
    desc: 'Calculate the REAL total cost to relocate from Africa. 12 origins, 7 destinations, 17 visa pathways.',
    icon: '✈️',
    img: '/assets/img/tools/japa-calculator.svg',
    href: '/tools/japa-calculator',
    category: 'african',
    color: '#fef2f2',
    accent: '#dc2626',
    status: 'new',
    countries: ['ALL'],
  },
  {
    id: 'ng-paye',
    name: 'Nigeria PAYE Calculator',
    desc: 'FIRS tax bands, CRA relief, NHF, pension. PITA 2025 vs NTA 2026 compared. AI tax advisor included.',
    icon: '🇳🇬',
    img: '/assets/img/tools/ng-paye.svg',
    href: '/nigeria/ng-salary-tax',
    category: 'tax',
    color: '#eaf5ef',
    accent: '#008751',
    status: 'live',
    countries: ['NG'],
  },
  {
    id: 'ke-paye',
    name: 'Kenya PAYE Calculator',
    desc: 'KRA 5-band PAYE, NSSF Tier I/II, SHIF 2.75%, AHL. Tax Laws Amendment Act 2024 included.',
    icon: '🇰🇪',
    img: '/assets/img/tools/ke-paye.svg',
    href: '/kenya/ke-paye',
    category: 'tax',
    color: '#eaf5ef',
    accent: '#008751',
    status: 'live',
    countries: ['KE'],
  },

  // ═══ COMING SOON — Add new tools here as you build them ═══
  {
    id: 'gh-paye',
    name: 'Ghana PAYE + SSNIT',
    desc: 'GRA 2025 bands, SSNIT Tier I/II/III, all personal reliefs.',
    icon: '🇬🇭',
    img: '/assets/img/tools/gh-paye.svg',
    href: '/ghana/gh-paye',
    category: 'tax',
    color: '#eaf5ef',
    accent: '#008751',
    status: 'coming',
    countries: ['GH'],
  },
  {
    id: 'za-paye',
    name: 'South Africa SARS Tax',
    desc: '2025/26 SARS tables, UIF, medical credits, age rebates.',
    icon: '🇿🇦',
    img: '/assets/img/tools/za-paye.svg',
    href: '/south-africa/za-paye',
    category: 'tax',
    color: '#eaf5ef',
    accent: '#008751',
    status: 'coming',
    countries: ['ZA'],
  },
  {
    id: 'eg-paye',
    name: 'Egypt PAYE Calculator',
    desc: 'ETA progressive rates, social insurance, stamp tax.',
    icon: '🇪🇬',
    img: '/assets/img/tools/eg-paye.svg',
    href: '/egypt/eg-paye',
    category: 'tax',
    color: '#eaf5ef',
    accent: '#008751',
    status: 'coming',
    countries: ['EG'],
  },
  {
    id: 'vat-calculator',
    name: 'VAT Calculator',
    desc: 'All 54 African countries. Multiple rates, exempt items, reverse VAT.',
    icon: '💱',
    img: '/assets/img/tools/vat-calculator.svg',
    href: '/tools/vat-calculator',
    category: 'tax',
    color: '#eff6ff',
    accent: '#3b82f6',
    status: 'coming',
    countries: ['ALL'],
  },
  {
    id: 'currency-converter',
    name: 'Currency Converter',
    desc: '42 African currencies plus USDT. Real-time rates, historical charts.',
    icon: '💰',
    img: '/assets/img/tools/currency-converter.svg',
    href: '/tools/currency-converter',
    category: 'finance',
    color: '#fef3c7',
    accent: '#f59e0b',
    status: 'coming',
    countries: ['ALL'],
  },
  {
    id: 'cv-builder',
    name: 'CV / Resume Builder',
    desc: 'Africa-ready templates. NYSC, National Service, WASSCE-aware. PDF export.',
    icon: '📝',
    img: '/assets/img/tools/cv-builder.svg',
    href: '/tools/cv-builder',
    category: 'pdf',
    color: '#eff6ff',
    accent: '#3b82f6',
    status: 'coming',
    countries: ['ALL'],
  },
  {
    id: 'invoice-generator',
    name: 'Invoice Generator',
    desc: 'VAT/WHT lines, multi-currency, mobile money refs, company logos.',
    icon: '🧾',
    img: '/assets/img/tools/invoice-generator.svg',
    href: '/tools/invoice-generator',
    category: 'pdf',
    color: '#fef3c7',
    accent: '#f59e0b',
    status: 'coming',
    countries: ['ALL'],
  },
  {
    id: 'mobile-money-fees',
    name: 'Mobile Money Fee Checker',
    desc: 'Compare M-Pesa, MTN MoMo, Airtel Money, OPay fees instantly.',
    icon: '📱',
    img: '/assets/img/tools/mobile-money-fees.svg',
    href: '/tools/mobile-money-fees',
    category: 'african',
    color: '#fef3c7',
    accent: '#f59e0b',
    status: 'coming',
    countries: ['ALL'],
  },
  {
    id: 'remittance-compare',
    name: 'Remittance Comparator',
    desc: 'Compare costs across 50+ corridors. Find the cheapest way to send money home.',
    icon: '🌐',
    img: '/assets/img/tools/remittance-compare.svg',
    href: '/tools/remittance-compare',
    category: 'african',
    color: '#ede9fe',
    accent: '#8b5cf6',
    status: 'coming',
    countries: ['ALL'],
  },
  {
    id: 'generator-fuel',
    name: 'Generator Fuel Calculator',
    desc: 'Running costs per hour. Generator vs solar comparison over time.',
    icon: '⚡',
    img: '/assets/img/tools/generator-fuel.svg',
    href: '/tools/generator-fuel',
    category: 'african',
    color: '#fef2f2',
    accent: '#dc2626',
    status: 'coming',
    countries: ['NG', 'GH', 'ZA', 'KE', 'TZ', 'UG'],
  },
  {
    id: 'ajo-chama',
    name: 'Ajo / Chama / Tontine Calculator',
    desc: 'Rotating savings groups. Contributions, payouts, fair ordering.',
    icon: '💸',
    img: '/assets/img/tools/ajo-chama.svg',
    href: '/tools/savings-group',
    category: 'african',
    color: '#eaf5ef',
    accent: '#008751',
    status: 'coming',
    countries: ['ALL'],
  },
];

// ═══════════════════════════════════════════════════════════
// RENDER FUNCTIONS — Call these from any page
// ═══════════════════════════════════════════════════════════

/**
 * Get tools for a specific country (or 'ALL' for the main hub)
 * @param {string} countryCode - 'NG', 'KE', 'GH', 'ALL', etc.
 * @param {string} [filter] - 'live', 'coming', or null for all
 * @returns {Array} matching tools
 */
function getToolsFor(countryCode, filter) {
  return AFRO_TOOLS.filter(function(t) {
    var countryMatch = t.countries.indexOf('ALL') !== -1 || t.countries.indexOf(countryCode) !== -1;
    var statusMatch = !filter || t.status === filter;
    return countryMatch && statusMatch;
  });
}

/**
 * Render a tool grid into a container element
 * @param {string} containerId - ID of the div to render into
 * @param {string} countryCode - 'NG', 'KE', 'ALL', etc.
 * @param {object} [opts] - { showComing: true, maxLive: 10, maxComing: 8 }
 */
function renderToolGrid(containerId, countryCode, opts) {
  opts = opts || {};
  var showComing = opts.showComing !== false;
  var maxLive = opts.maxLive || 50;
  var maxComing = opts.maxComing || 12;

  var container = document.getElementById(containerId);
  if (!container) return;

  var liveTools = getToolsFor(countryCode, 'live');
  var newTools = getToolsFor(countryCode, 'new');
  var comingTools = getToolsFor(countryCode, 'coming');

  var allLive = liveTools.concat(newTools).slice(0, maxLive);
  var html = '';

  if (allLive.length) {
    html += '<h2 style="font-size:20px;font-weight:800;color:#111;margin:0 0 16px;display:flex;align-items:center;gap:10px;font-family:\'DM Sans\',sans-serif"><span style="width:8px;height:8px;border-radius:50%;background:#008751;flex-shrink:0"></span> Available Now</h2>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-bottom:32px">';
    allLive.forEach(function(t) {
      var badge = t.status === 'new'
        ? '<span style="position:absolute;top:14px;right:14px;padding:3px 10px;background:#fef3cd;border:1px solid #fde68a;border-radius:100px;font-size:10px;font-weight:700;color:#92400e;text-transform:uppercase">✨ New</span>'
        : '<span style="position:absolute;top:14px;right:14px;padding:3px 10px;background:#eaf5ef;border:1px solid rgba(0,135,81,.2);border-radius:100px;font-size:10px;font-weight:700;color:#008751;text-transform:uppercase;display:flex;align-items:center;gap:4px"><span style="width:6px;height:6px;background:#008751;border-radius:50%;animation:pulse 2s infinite"></span>Live</span>';
      var imgHtml = t.img
        ? '<img src="'+t.img+'" alt="'+t.name+'" style="width:100%;height:140px;object-fit:cover;border-radius:12px 12px 0 0;display:block">'
        : '';
      var padTop = t.img ? 'padding-top:0;' : '';
      html += '<a href="'+t.href+'" style="background:#fff;border:1.5px solid #e5e7eb;border-radius:14px;'+padTop+'text-decoration:none;color:inherit;transition:.25s;display:block;position:relative;overflow:hidden">'
        + imgHtml
        + '<div style="padding:'+(t.img?'16px 22px 22px':'24px 22px')+'">'
        + badge
        + (t.img ? '' : '<div style="width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:14px;background:'+t.color+'">'+t.icon+'</div>')
        + '<h3 style="font-size:16px;font-weight:700;margin-bottom:6px;color:#111;text-transform:none;letter-spacing:normal;font-family:\'DM Sans\',sans-serif">'+t.name+'</h3>'
        + '<p style="font-size:14px;color:#374151;line-height:1.6">'+t.desc+'</p>'
        + '</div></a>';
    });
    html += '</div>';
  }

  if (showComing && comingTools.length) {
    var shown = comingTools.slice(0, maxComing);
    html += '<h2 style="font-size:20px;font-weight:800;color:#111;margin:0 0 16px;display:flex;align-items:center;gap:10px;font-family:\'DM Sans\',sans-serif"><span style="width:8px;height:8px;border-radius:50%;background:#d1d5db;flex-shrink:0"></span> Coming Soon</h2>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px">';
    shown.forEach(function(t) {
      var imgHtml = t.img
        ? '<img src="'+t.img+'" alt="'+t.name+'" style="width:100%;height:120px;object-fit:cover;border-radius:12px 12px 0 0;display:block;filter:grayscale(.5)">'
        : '';
      html += '<div style="background:#fff;border:1.5px solid #e5e7eb;border-radius:14px;position:relative;opacity:.6;overflow:hidden">'
        + imgHtml
        + '<div style="padding:'+(t.img?'14px 22px 20px':'24px 22px')+'">'
        + '<span style="position:absolute;top:14px;right:14px;padding:3px 10px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:100px;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase">Coming Soon</span>'
        + (t.img ? '' : '<div style="width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:14px;background:'+t.color+'">'+t.icon+'</div>')
        + '<h3 style="font-size:16px;font-weight:700;margin-bottom:6px;color:#374151;text-transform:none;letter-spacing:normal;font-family:\'DM Sans\',sans-serif">'+t.name+'</h3>'
        + '<p style="font-size:14px;color:#6b7280;line-height:1.6">'+t.desc+'</p>'
        + '</div></div>';
    });
    html += '</div>';
  }

  container.innerHTML = html;
}

// Pulse animation (injected once)
if (!document.getElementById('afro-tool-styles')) {
  var style = document.createElement('style');
  style.id = 'afro-tool-styles';
  style.textContent = '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} [style*="border:1.5px solid #e5e7eb"]:hover{border-color:#008751!important;box-shadow:0 8px 24px rgba(0,0,0,.06);transform:translateY(-2px)}';
  document.head.appendChild(style);
}
