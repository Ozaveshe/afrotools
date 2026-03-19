/**
 * AFROTOOLS — Dashboard App ("My Numbers" Command Center)
 * ════════════════════════════════════════════════════════
 * Transforms the dashboard into a financial command center.
 * Depends on: AfroAuth, AfroHistory, AfroData, AFRO_TOOLS
 */
(function (window, document) {
  'use strict';

  /* ── Country / Currency maps ── */
  var COUNTRY_CURRENCY_MAP = {
    'NG':'NGN','KE':'KES','ZA':'ZAR','GH':'GHS','EG':'EGP','TZ':'TZS','UG':'UGX','RW':'RWF',
    'ET':'ETB','SN':'XOF','CI':'XOF','CM':'XAF','MA':'MAD','DZ':'DZD','TN':'TND','ZM':'ZMW',
    'ZW':'ZWL','BW':'BWP','MZ':'MZN','AO':'AOA','NA':'NAD','MU':'MUR','MW':'MWK','SD':'SDG',
    'LY':'LYD','CD':'CDF','CG':'XAF','GA':'XAF','BJ':'XOF','TG':'XOF','BF':'XOF','ML':'XOF',
    'NE':'XOF','TD':'XAF','SL':'SLE','LR':'LRD','GN':'GNF','SS':'SSP','MG':'MGA','SZ':'SZL',
    'LS':'LSL','GM':'GMD','CV':'CVE','GQ':'XAF','KM':'KMF','DJ':'DJF','ER':'ERN','SO':'SOS',
    'SC':'SCR','ST':'STN','MR':'MRU','BI':'BIF','CF':'XAF'
  };
  var COUNTRY_CODE_MAP = {
    'nigeria':'NG','kenya':'KE','south africa':'ZA','ghana':'GH','egypt':'EG','tanzania':'TZ',
    'uganda':'UG','rwanda':'RW','ethiopia':'ET','senegal':'SN',"côte d'ivoire":'CI','ivory coast':'CI',
    'cameroon':'CM','morocco':'MA','algeria':'DZ','tunisia':'TN','zambia':'ZM','zimbabwe':'ZW',
    'botswana':'BW','mozambique':'MZ','angola':'AO','namibia':'NA','mauritius':'MU','malawi':'MW',
    'sudan':'SD','libya':'LY','dr congo':'CD','congo':'CG','gabon':'GA','benin':'BJ','togo':'TG',
    'burkina faso':'BF','mali':'ML','niger':'NE','chad':'TD','sierra leone':'SL','liberia':'LR',
    'guinea':'GN','south sudan':'SS','madagascar':'MG','eswatini':'SZ','lesotho':'LS','gambia':'GM',
    'cabo verde':'CV','equatorial guinea':'GQ','comoros':'KM','djibouti':'DJ','eritrea':'ER',
    'somalia':'SO','seychelles':'SC','são tomé and príncipe':'ST','mauritania':'MR','burundi':'BI',
    'central african republic':'CF'
  };
  var COUNTRY_FLAG = {
    'NG':'\uD83C\uDDF3\uD83C\uDDEC','KE':'\uD83C\uDDF0\uD83C\uDDEA','ZA':'\uD83C\uDDFF\uD83C\uDDE6',
    'GH':'\uD83C\uDDEC\uD83C\uDDED','EG':'\uD83C\uDDEA\uD83C\uDDEC','TZ':'\uD83C\uDDF9\uD83C\uDDFF',
    'UG':'\uD83C\uDDFA\uD83C\uDDEC','RW':'\uD83C\uDDF7\uD83C\uDDFC','ET':'\uD83C\uDDEA\uD83C\uDDF9',
    'SN':'\uD83C\uDDF8\uD83C\uDDF3','CM':'\uD83C\uDDE8\uD83C\uDDF2','MA':'\uD83C\uDDF2\uD83C\uDDE6',
    'DZ':'\uD83C\uDDE9\uD83C\uDDFF','TN':'\uD83C\uDDF9\uD83C\uDDF3','ZM':'\uD83C\uDDFF\uD83C\uDDF2',
    'ZW':'\uD83C\uDDFF\uD83C\uDDFC','BW':'\uD83C\uDDE7\uD83C\uDDFC','MZ':'\uD83C\uDDF2\uD83C\uDDFF',
    'AO':'\uD83C\uDDE6\uD83C\uDDF4','NA':'\uD83C\uDDF3\uD83C\uDDE6','MU':'\uD83C\uDDF2\uD83C\uDDFA'
  };
  var COUNTRY_PAYE_MAP = {
    'NG': '/nigeria/ng-salary-tax', 'KE': '/kenya/ke-paye', 'ZA': '/south-africa/za-paye',
    'GH': '/ghana/gh-paye', 'TZ': '/tanzania/tz-paye', 'UG': '/uganda/ug-paye',
    'RW': '/rwanda/rw-paye', 'ET': '/ethiopia/et-paye', 'SN': '/senegal/sn-paye',
    'CM': '/cameroon/cm-paye', 'EG': '/egypt/eg-paye'
  };

  /* ── Helpers ── */
  var _user = null;
  var _profile = {};
  var _history = [];
  var _monthlyCount = { count: 0 };
  var _fxData = null;

  function _el(id) { return document.getElementById(id); }

  function resolveCountry() {
    var c = (_user && _user.country) || (_profile && _profile.country) || '';
    if (!c) return { code: null, currency: null, name: null, flag: '' };
    if (c.length === 2 && c === c.toUpperCase()) {
      return { code: c, currency: COUNTRY_CURRENCY_MAP[c] || null, name: c, flag: COUNTRY_FLAG[c] || '' };
    }
    var code = COUNTRY_CODE_MAP[c.toLowerCase()] || null;
    return { code: code, currency: code ? (COUNTRY_CURRENCY_MAP[code] || null) : null, name: c, flag: code ? (COUNTRY_FLAG[code] || '') : '' };
  }

  function timeAgo(dateStr) {
    var now = Date.now();
    var then = new Date(dateStr).getTime();
    var diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    var days = Math.floor(diff / 86400);
    if (days === 1) return 'yesterday';
    if (days < 7) return days + ' days ago';
    if (days < 30) return Math.floor(days / 7) + ' week' + (Math.floor(days / 7) > 1 ? 's' : '') + ' ago';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function greeting() {
    var h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  function formatCurrency(val, currency) {
    if (val == null) return '--';
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(val);
    } catch (e) {
      return (currency || '') + ' ' + Number(val).toLocaleString();
    }
  }

  function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  /* ── Skeleton loader ── */
  function skeleton(w, h) {
    return '<div class="mn-skeleton" style="width:' + w + ';height:' + h + ';"></div>';
  }

  /* ── 1. Header Bar ── */
  /* The unified header is now in the HTML (profile-header).
     This function is kept for compatibility but is a no-op since
     the profile header is rendered by the inline dashboard script. */
  function renderHeader() {
    // No-op — unified header is managed by loadProfileDisplay() in the inline script
  }

  /* ── 2. "Your Numbers" Summary Cards ── */
  function renderSummaryCards() {
    var container = _el('mnSummaryCards');
    if (!container) return;
    var loc = resolveCountry();

    // Card A: Take-Home Pay
    var payeCalc = _history.find(function (h) {
      return h.tool_slug && (h.tool_slug.indexOf('paye') !== -1 || h.tool_slug.indexOf('salary-tax') !== -1);
    });
    var cardA = '';
    if (payeCalc && payeCalc.outputs) {
      var net = payeCalc.outputs.net_monthly || payeCalc.outputs.netMonthly || payeCalc.outputs.net_pay || payeCalc.outputs.takeHome || null;
      var cur = payeCalc.currency || loc.currency || 'NGN';
      cardA = '<div class="mn-summary-card">' +
        '<div class="mn-card-label">Take-Home Pay</div>' +
        '<div class="mn-card-value">' + (net ? formatCurrency(net, cur) : '--') + '<span class="mn-card-period">/mo</span></div>' +
        '<div class="mn-card-sub">Updated ' + timeAgo(payeCalc.created_at) + '</div>' +
      '</div>';
    } else {
      var payeLink = COUNTRY_PAYE_MAP[loc.code] || '/salary-tax/';
      cardA = '<div class="mn-summary-card mn-card-empty">' +
        '<div class="mn-card-label">Take-Home Pay</div>' +
        '<a href="' + payeLink + '" class="mn-card-cta">Calculate your pay &rarr;</a>' +
      '</div>';
    }

    // Card B: Tax Rate
    var cardB = '';
    if (payeCalc && payeCalc.outputs) {
      var effectiveRate = payeCalc.outputs.effective_rate || payeCalc.outputs.effectiveRate || payeCalc.outputs.tax_rate || null;
      var rateVal = effectiveRate != null ? Number(effectiveRate).toFixed(1) + '%' : '--';
      cardB = '<div class="mn-summary-card">' +
        '<div class="mn-card-label">Tax Rate</div>' +
        '<div class="mn-card-value-row">' +
          '<div class="mn-card-value">' + rateVal + '</div>' +
          '<div class="mn-donut" data-pct="' + (effectiveRate || 0) + '"></div>' +
        '</div>' +
        '<div class="mn-card-sub">Effective rate</div>' +
      '</div>';
    } else {
      cardB = '<div class="mn-summary-card mn-card-empty">' +
        '<div class="mn-card-label">Tax Rate</div>' +
        '<div class="mn-card-value" style="color:#CBD5E1;">--%</div>' +
        '<div class="mn-card-sub">Run a PAYE calculation first</div>' +
      '</div>';
    }

    // Card C: FX Watch
    var cardC = '';
    if (_fxData && loc.currency && _fxData.rates && _fxData.rates[loc.currency]) {
      var rate = Number(_fxData.rates[loc.currency]);
      var fxSub = 'Live rate';
      if (_fxData.updated_at) {
        fxSub = 'Updated ' + timeAgo(new Date(_fxData.updated_at));
      }
      cardC = '<div class="mn-summary-card">' +
        '<div class="mn-card-label">FX Watch</div>' +
        '<div class="mn-card-value">1 USD = ' + rate.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' ' + loc.currency + '</div>' +
        '<div class="mn-card-sub">' + fxSub + '</div>' +
      '</div>';
    } else {
      cardC = '<div class="mn-summary-card mn-card-empty">' +
        '<div class="mn-card-label">FX Watch</div>' +
        '<a href="/tools/currency-converter/" class="mn-card-cta">Check rates &rarr;</a>' +
      '</div>';
    }

    // Card D: Saved Documents (only if data)
    var docCount = 0;
    try {
      ['afro_invoice_draft', 'afro_cv_data', 'cv_builder_data', 'afro_markdown_draft'].forEach(function (k) {
        if (localStorage.getItem(k)) docCount++;
      });
      var cvList = JSON.parse(localStorage.getItem('afro_cv_list') || '[]');
      docCount += cvList.length;
    } catch (e) {}
    var cardD = '';
    if (docCount > 0) {
      cardD = '<div class="mn-summary-card">' +
        '<div class="mn-card-label">Saved Documents</div>' +
        '<div class="mn-card-value">' + docCount + '</div>' +
        '<div class="mn-card-sub"><a href="#myWorkspace" class="mn-link">View vault &rarr;</a></div>' +
      '</div>';
    }

    container.innerHTML = cardA + cardB + cardC + cardD;

    // Render donut charts
    container.querySelectorAll('.mn-donut').forEach(function (el) {
      var pct = parseFloat(el.dataset.pct) || 0;
      var circumference = 2 * Math.PI * 16;
      var offset = circumference - (Math.min(pct, 100) / 100) * circumference;
      el.innerHTML = '<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="none" stroke="#E5E7EB" stroke-width="4"/><circle cx="20" cy="20" r="16" fill="none" stroke="#007AFF" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '" transform="rotate(-90 20 20)"/></svg>';
    });
  }

  /* ── 3. Recent Activity ── */
  function renderRecentActivity() {
    var container = _el('mnRecentActivity');
    if (!container) return;

    if (_history.length === 0) {
      // Empty state
      var topTools = [];
      if (typeof AFRO_TOOLS !== 'undefined') {
        topTools = AFRO_TOOLS.filter(function (t) { return t.status === 'live'; })
          .sort(function (a, b) { return (b.priority || 0) - (a.priority || 0); })
          .slice(0, 3);
      }
      container.innerHTML =
        '<div class="mn-empty-state">' +
          '<div class="mn-empty-icon">&#x1F4CA;</div>' +
          '<div class="mn-empty-text">No calculations yet.</div>' +
          (topTools.length > 0 ?
            '<div class="mn-empty-suggest">Try our most popular tools:</div>' +
            '<div class="mn-suggest-row">' + topTools.map(function (t) {
              return '<a href="' + t.href + '" class="mn-suggest-chip">' + t.icon + ' ' + escHtml(t.name) + '</a>';
            }).join('') + '</div>'
          : '') +
        '</div>';
      return;
    }

    var items = _history.slice(0, 10);
    var html = items.map(function (item) {
      var toolName = item.tool_name || item.tool_slug || 'Calculation';
      var icon = '&#x1F4CA;';
      if (item.tool_slug && typeof AFRO_TOOLS !== 'undefined') {
        var found = AFRO_TOOLS.find(function (t) { return t.id === item.tool_slug; });
        if (found) icon = found.icon || icon;
      }

      // Extract a display value from outputs
      var displayVal = '';
      if (item.outputs) {
        var o = item.outputs;
        var net = o.net_monthly || o.netMonthly || o.net_pay || o.takeHome || o.result || o.total || null;
        if (net != null) {
          displayVal = formatCurrency(net, item.currency);
        }
      }

      // Build tool link
      var toolHref = '/tools/' + (item.tool_slug || '') + '/';
      if (typeof AFRO_TOOLS !== 'undefined') {
        var ft = AFRO_TOOLS.find(function (t) { return t.id === item.tool_slug; });
        if (ft) toolHref = ft.href;
      }

      return '<a href="' + toolHref + '" class="mn-activity-row">' +
        '<span class="mn-activity-icon">' + icon + '</span>' +
        '<span class="mn-activity-name">' + escHtml(toolName) + '</span>' +
        '<span class="mn-activity-value">' + displayVal + '</span>' +
        '<span class="mn-activity-time">' + timeAgo(item.created_at) + '</span>' +
      '</a>';
    }).join('');

    html += '<a href="#" class="mn-view-all" id="mnViewAllHistory">View all history &rarr;</a>';
    container.innerHTML = html;
  }

  /* ── 4. Recommended for You ── */
  function renderRecommendations() {
    var container = _el('mnRecommendations');
    if (!container || typeof AFRO_TOOLS === 'undefined') return;

    var loc = resolveCountry();
    var interests = (_profile && _profile.interests) || [];
    var recentSlugs = _history.map(function (h) { return h.tool_slug; });

    // Build interest category set
    var intCategories = {};
    interests.forEach(function (intId) {
      var opt = (window.INTEREST_OPTIONS || []).find(function (o) { return o.id === intId; });
      if (opt) opt.categories.forEach(function (c) { intCategories[c] = opt.label; });
    });

    // Recommend based on last used tool
    var lastSlug = _history.length > 0 ? _history[0].tool_slug : null;
    var FOLLOW_UP = {
      'ng-paye': ['budget-planner', 'salary-benchmark', 'invoice-generator'],
      'ke-paye': ['budget-planner', 'salary-benchmark', 'invoice-generator'],
      'za-paye': ['budget-planner', 'salary-benchmark', 'invoice-generator'],
      'gh-paye': ['budget-planner', 'salary-benchmark', 'invoice-generator'],
      'currency-converter': ['remittance-comparison', 'crypto'],
      'crypto-profit': ['crypto-tax', 'portfolio-tracker']
    };
    var followUps = lastSlug && FOLLOW_UP[lastSlug] ? FOLLOW_UP[lastSlug] : [];

    var scored = AFRO_TOOLS.filter(function (t) {
      return t.status === 'live' || t.status === 'new';
    }).map(function (t) {
      var score = 0;
      var reason = '';
      // Follow-up from last tool
      if (followUps.indexOf(t.id) !== -1) { score += 15; reason = 'Based on your recent calculation'; }
      // Interest match
      if (intCategories[t.category]) { score += 10; reason = reason || 'Matches your interests'; }
      // Country match
      if (loc.code && (t.countries.indexOf('ALL') !== -1 || t.countries.indexOf(loc.code) !== -1)) score += 5;
      // New tool boost
      if (t.status === 'new') score += 3;
      score += (t.priority || 0) / 10;
      // Avoid recently used
      if (recentSlugs.indexOf(t.id) !== -1) score -= 20;
      return { tool: t, score: score, reason: reason };
    }).sort(function (a, b) { return b.score - a.score; }).slice(0, 3);

    if (scored.length === 0 || scored[0].score <= 0) {
      scored = AFRO_TOOLS.filter(function (t) { return t.status === 'live'; })
        .sort(function (a, b) { return (b.priority || 0) - (a.priority || 0); })
        .slice(0, 3).map(function (t) { return { tool: t, score: 0, reason: 'Popular tool' }; });
    }

    var reasonText = scored[0] && scored[0].reason ? scored[0].reason : 'Popular tools';
    container.innerHTML =
      '<div class="mn-rec-hint">' + reasonText + '</div>' +
      '<div class="mn-rec-row">' + scored.map(function (item) {
        var t = item.tool;
        return '<a href="' + t.href + '" class="mn-rec-card">' +
          '<span class="mn-rec-icon">' + t.icon + '</span>' +
          '<span class="mn-rec-name">' + escHtml(t.name) + '</span>' +
        '</a>';
      }).join('') + '</div>';
  }

  /* ── 5. Quick Actions ── */
  function renderQuickActions() {
    var container = _el('mnQuickActions');
    if (!container) return;
    var loc = resolveCountry();
    var payeLink = COUNTRY_PAYE_MAP[loc.code] || '/salary-tax/';
    var isPro = _user && _user.tier === 'pro';

    var actions = [
      { icon: '&#x1F4B0;', label: 'Calculate Pay', href: payeLink },
      { icon: '&#x1F4B1;', label: 'Convert Currency', href: '/tools/currency-converter/' },
      { icon: '&#x1F4C4;', label: 'Create PDF', href: '/document-pdf/' },
      { icon: '&#x1F4C2;', label: 'View Vault', href: '#myWorkspace' }
    ];
    if (isPro) {
      actions.push({ icon: '&#x2699;&#xFE0F;', label: 'Manage Plan', href: '/pro/' });
    } else {
      actions.push({ icon: '&#x2B50;', label: 'Upgrade to Pro', href: '/pro/', cls: 'mn-qa-pro' });
    }

    container.innerHTML = actions.map(function (a) {
      return '<a href="' + a.href + '" class="mn-qa-btn' + (a.cls ? ' ' + a.cls : '') + '">' +
        '<span class="mn-qa-icon">' + a.icon + '</span>' +
        '<span class="mn-qa-label">' + a.label + '</span>' +
      '</a>';
    }).join('');
  }

  /* ── Skeleton loaders for initial state ── */
  function showSkeletons() {
    var summary = _el('mnSummaryCards');
    if (summary) {
      summary.innerHTML = [1, 2, 3].map(function () {
        return '<div class="mn-summary-card">' + skeleton('60%', '14px') + skeleton('80%', '28px') + skeleton('40%', '12px') + '</div>';
      }).join('');
    }
    var activity = _el('mnRecentActivity');
    if (activity) {
      activity.innerHTML = [1, 2, 3, 4, 5].map(function () {
        return '<div class="mn-activity-row" style="pointer-events:none">' + skeleton('24px', '24px') + skeleton('50%', '14px') + skeleton('20%', '14px') + skeleton('15%', '12px') + '</div>';
      }).join('');
    }
  }

  /* ── Main init ── */
  async function initDashboardApp() {
    _user = AfroAuth.getUser();
    if (!_user) return;

    // Show skeletons immediately
    showSkeletons();
    renderHeader();
    renderQuickActions();

    // Fetch data in parallel
    var profilePromise = typeof fetchFullProfile === 'function' ? fetchFullProfile() : Promise.resolve(null);
    var historyPromise = window.AfroHistory ? AfroHistory.getRecent(10) : Promise.resolve([]);
    var monthlyPromise = window.AfroHistory ? AfroHistory.getMonthlyCount() : Promise.resolve({ count: 0 });
    var fxPromise = fetch('/api/fx-rates?base=USD').then(function (r) { return r.json(); }).catch(function () { return null; });

    // Also try localStorage profile
    try {
      var cached = localStorage.getItem('afro_profile_extended');
      if (cached) _profile = JSON.parse(cached);
    } catch (e) {}

    try {
      var results = await Promise.all([profilePromise, historyPromise, monthlyPromise, fxPromise]);
      if (results[0]) {
        _profile = Object.assign(_profile, results[0]);
        localStorage.setItem('afro_profile_extended', JSON.stringify(_profile));
      }
      _history = results[1] || [];
      _monthlyCount = results[2] || { count: 0 };
      _fxData = results[3];
    } catch (e) {
      console.warn('[DashboardApp] data fetch error:', e);
    }

    // Render all sections
    renderHeader();
    renderSummaryCards();
    renderRecentActivity();
    renderRecommendations();
    renderQuickActions();
  }

  /* ── Expose ── */
  window.DashboardApp = {
    init: initDashboardApp,
    renderHeader: renderHeader,
    renderSummaryCards: renderSummaryCards,
    renderRecentActivity: renderRecentActivity,
    renderRecommendations: renderRecommendations,
    renderQuickActions: renderQuickActions
  };

})(window, document);
