// engines/africa-conflict-engine.js
// AfroConflict — Client-side data logic IIFE module
// Usage: AfroConflict.init() / AfroConflict.getConflicts() / etc.

var AfroConflict = (function () {
  'use strict';

  // ── Configuration ────────────────────────────────────────────────
  var CONFIG = {
    apiBase: '/.netlify/functions/conflict-data',
    mapCenter: [2.0, 20.0],
    mapZoom: 3,
    refreshInterval: 300000, // 5 minutes
    riskColors: {
      critical: '#dc2626',
      high:     '#ea580c',
      medium:   '#ca8a04',
      low:      '#65a30d',
      minimal:  '#16a34a',
      unknown:  '#6b7280'
    },
    statusColors: {
      emerging:        '#8b5cf6',
      active:          '#ea580c',
      escalating:      '#dc2626',
      stalemated:      '#d97706',
      'de-escalating': '#65a30d',
      frozen:          '#6b7280',
      negotiation:     '#3b82f6',
      'post-conflict': '#16a34a'
    },
    conflictTypeLabels: {
      civil_war:            'Civil War',
      insurgency:           'Insurgency',
      interstate:           'Interstate',
      proxy_war:            'Proxy War',
      coup:                 'Coup/Post-Coup',
      communal:             'Communal Violence',
      separatist:           'Separatist',
      foreign_intervention: 'Foreign Intervention',
      hybrid:               'Hybrid',
      frozen:               'Frozen Conflict',
      criminal_violence:    'Criminal Violence'
    },
    evidenceColors: {
      confirmed:  '#16a34a',
      alleged:    '#d97706',
      suspected:  '#ea580c',
      disputed:   '#6b7280',
      historical: '#475569'
    },
    stageLabels: {
      1: 'Emerging',
      2: 'Active Escalation',
      3: 'Stalemated High Intensity',
      4: 'Frozen / Ceasefire',
      5: 'Negotiation / Peace Process',
      6: 'Post-Conflict'
    },
    eventTypeIcons: {
      battle:                     '⚔️',
      airstrike:                  '✈️',
      explosion_remote:           '💥',
      protest:                    '✊',
      riot:                       '🔥',
      violence_against_civilians: '⚠️',
      strategic_development:      '📋',
      agreement:                  '🤝',
      ceasefire_violation:        '❌',
      displacement_event:         '🏕️'
    }
  };

  // ── Internal cache ───────────────────────────────────────────────
  var _cache = {};
  var _cacheTime = {};
  var CACHE_TTL = 300000; // 5 min

  function _cacheGet(key) {
    if (_cache[key] && (Date.now() - _cacheTime[key]) < CACHE_TTL) {
      return _cache[key];
    }
    return null;
  }

  function _cacheSet(key, val) {
    _cache[key] = val;
    _cacheTime[key] = Date.now();
  }

  // ── API fetch helper ─────────────────────────────────────────────
  async function _apiFetch(path, params) {
    var url = CONFIG.apiBase + '?' + (params ? new URLSearchParams(params).toString() : '');
    // Map path to query param since Netlify functions use a single endpoint
    if (path) url = '/.netlify/functions/conflict-data?_path=' + encodeURIComponent(path);

    var cacheKey = url;
    var cached = _cacheGet(cacheKey);
    if (cached) return cached;

    var res = await fetch(url);
    if (!res.ok) throw new Error('API error: ' + res.status);
    var json = await res.json();
    _cacheSet(cacheKey, json);
    return json;
  }

  // Direct fetch for simpler calls
  async function _fetch(url) {
    var cached = _cacheGet(url);
    if (cached) return cached;
    var res = await fetch(url);
    if (!res.ok) throw new Error('Fetch error: ' + res.status);
    var json = await res.json();
    _cacheSet(url, json);
    return json;
  }

  // ── Public API methods ───────────────────────────────────────────

  var _refreshTimer = null;

  function init() {
    // Set up auto-refresh if page is visible (guard against double-init)
    if (typeof document !== 'undefined' && !_refreshTimer) {
      _refreshTimer = setInterval(function () {
        if (!document.hidden) {
          Object.keys(_cache).forEach(function (k) { delete _cache[k]; });
        }
      }, CONFIG.refreshInterval);
    }
  }

  async function getStats() {
    return _fetch('/.netlify/functions/conflict-data?action=stats');
  }

  async function getConflicts(filters) {
    var qs = new URLSearchParams(Object.assign({ action: 'list' }, filters || {}));
    return _fetch('/.netlify/functions/conflict-data?' + qs);
  }

  async function getConflict(slug) {
    return _fetch('/.netlify/functions/conflict-data?action=detail&slug=' + slug);
  }

  async function getEvents(slug, filters) {
    var qs = new URLSearchParams(Object.assign({ action: 'events', slug: slug }, filters || {}));
    return _fetch('/.netlify/functions/conflict-data?' + qs);
  }

  async function getActors(slug) {
    return _fetch('/.netlify/functions/conflict-data?action=actors&slug=' + slug);
  }

  async function getTimeline(slug) {
    return _fetch('/.netlify/functions/conflict-data?action=timeline&slug=' + slug);
  }

  async function getForecast(slug) {
    return _fetch('/.netlify/functions/conflict-data?action=forecast&slug=' + slug);
  }

  async function getEconomy(slug) {
    return _fetch('/.netlify/functions/conflict-data?action=economy&slug=' + slug);
  }

  async function getDisplacement(slug) {
    return _fetch('/.netlify/functions/conflict-data?action=displacement&slug=' + slug);
  }

  async function getRecentEvents() {
    return _fetch('/.netlify/functions/conflict-data?action=recent_events');
  }

  // ── Map rendering ────────────────────────────────────────────────
  function renderMap(mapId, conflicts, options) {
    if (typeof L === 'undefined') {
      console.error('Leaflet not loaded');
      return null;
    }

    var opts = options || {};
    var map = L.map(mapId, {
      center: opts.center || CONFIG.mapCenter,
      zoom: opts.zoom || CONFIG.mapZoom,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    if (conflicts && conflicts.length) {
      conflicts.forEach(function (c) {
        if (!c.lat || !c.lng) return;
        var color = CONFIG.riskColors[c.escalation_risk] || CONFIG.riskColors.unknown;
        var size = Math.min(40, Math.max(10, Math.sqrt((c.fatalities_max || 1000) / 1000) * 15));
        var isPulsing = c.status === 'escalating';

        var marker = L.circleMarker([c.lat, c.lng], {
          radius: size,
          fillColor: color,
          color: color,
          weight: 2,
          opacity: 0.9,
          fillOpacity: isPulsing ? 0.6 : 0.5,
          className: isPulsing ? 'acd-pulse-marker' : ''
        }).addTo(map);

        marker.bindPopup(renderMapPopup(c));
      });
    }

    return map;
  }

  function renderMapPopup(c) {
    var statusColor = CONFIG.statusColors[c.status] || '#6b7280';
    var riskColor = CONFIG.riskColors[c.escalation_risk] || '#6b7280';
    return '<div class="acd-map-popup">' +
      '<div class="acd-mp-header">' +
        '<span class="acd-mp-flag">' + flagEmoji(c.primary_country) + '</span>' +
        '<strong>' + (c.short_name || c.name) + '</strong>' +
      '</div>' +
      '<div class="acd-mp-badges">' +
        '<span class="acd-badge" style="background:' + statusColor + '20;color:' + statusColor + '">' + (c.status || '').toUpperCase() + '</span>' +
        '<span class="acd-badge" style="background:' + riskColor + '20;color:' + riskColor + '">' + (c.escalation_risk || '').toUpperCase() + ' RISK</span>' +
      '</div>' +
      '<div class="acd-mp-stats">' +
        '<div>☠️ ' + formatRange(c.fatalities_min, c.fatalities_max) + ' est. fatalities</div>' +
        '<div>🏕️ ' + formatNumber(c.idps_count + c.refugees_count) + ' displaced</div>' +
      '</div>' +
      '<a href="/tools/africa-conflict/detail.html?id=' + c.slug + '" class="acd-mp-link">View Intelligence →</a>' +
    '</div>';
  }

  // ── Card rendering ───────────────────────────────────────────────
  function renderConflictCard(c, opts) {
    opts = opts || {};
    var riskColor = CONFIG.riskColors[c.escalation_risk] || '#6b7280';
    var spilloverRiskColor = CONFIG.riskColors[c.spillover_risk] || '#6b7280';
    var resources = (c.resource_links || []).map(function(r) {
      return '<span class="acd-resource-tag">' + resourceIcon(r) + ' ' + r.replace(/_/g,' ') + '</span>';
    }).join('');

    return '<div class="acd-conflict-card" data-slug="' + c.slug + '" ' +
        'style="border-left-color:' + riskColor + '">' +
      '<div class="acd-card-top">' +
        statusBadge(c.status) +
        '<span class="acd-type-tag">' + (CONFIG.conflictTypeLabels[c.conflict_type] || c.conflict_type) + '</span>' +
        '<span class="acd-country-flag">' + (c.countries_involved || [c.primary_country]).map(flagEmoji).join(' ') + '</span>' +
      '</div>' +
      '<h3 class="acd-card-name">' + c.name + '</h3>' +
      '<div class="acd-card-stats">' +
        '<div class="acd-stat"><span class="acd-stat-icon">☠️</span><span>' + formatRange(c.fatalities_min, c.fatalities_max) + '</span><small>Est. Fatalities</small></div>' +
        '<div class="acd-stat"><span class="acd-stat-icon">🏕️</span><span>' + formatNumber((c.idps_count||0)+(c.refugees_count||0)) + '</span><small>Displaced</small></div>' +
        '<div class="acd-stat"><span class="acd-stat-icon">📅</span><span>' + formatDuration(c.duration_days) + '</span><small>Duration</small></div>' +
        (c.economic_loss_max_usd_b ? '<div class="acd-stat"><span class="acd-stat-icon">💰</span><span>USD ' + c.economic_loss_max_usd_b + 'B</span><small>Est. Econ. Loss</small></div>' : '') +
      '</div>' +
      '<div class="acd-card-risks">' +
        riskBadge(c.escalation_risk, 'Escalation') +
        riskBadge(c.spillover_risk, 'Spillover') +
      '</div>' +
      (resources ? '<div class="acd-resource-tags">' + resources + '</div>' : '') +
      (!c.is_african ? '<div class="acd-global-badge">🌐 Global Impact on Africa</div>' : '') +
      '<a href="/tools/africa-conflict/detail.html?id=' + c.slug + '" class="acd-card-link">View Intelligence →</a>' +
    '</div>';
  }

  function renderKPICard(label, value, sub, icon, color) {
    return '<div class="acd-kpi-card">' +
      '<div class="acd-kpi-icon">' + (icon || '') + '</div>' +
      '<div class="acd-kpi-value" data-count="' + value + '">' + value + '</div>' +
      '<div class="acd-kpi-label">' + label + '</div>' +
      (sub ? '<div class="acd-kpi-sub">' + sub + '</div>' : '') +
    '</div>';
  }

  // ── Badge helpers ─────────────────────────────────────────────────
  function statusBadge(status) {
    var color = CONFIG.statusColors[status] || '#6b7280';
    var label = (status || 'unknown').replace(/-/g,' ').toUpperCase();
    return '<span class="acd-status-badge" style="background:' + color + '20;color:' + color + ';border:1px solid ' + color + '40">' + label + '</span>';
  }

  function riskBadge(risk, prefix) {
    var color = CONFIG.riskColors[risk] || '#6b7280';
    var label = (prefix ? prefix + ': ' : '') + (risk || 'unknown').toUpperCase();
    return '<span class="acd-risk-badge" style="background:' + color + '20;color:' + color + '">' + label + '</span>';
  }

  function evidenceBadge(level) {
    var color = CONFIG.evidenceColors[level] || '#6b7280';
    return '<span class="acd-evidence-badge" style="background:' + color + '20;color:' + color + ';border:1px solid ' + color + '40">' + (level || 'unknown').toUpperCase() + '</span>';
  }

  // ── Format utilities ──────────────────────────────────────────────
  function formatNumber(n) {
    if (!n || isNaN(n)) return '—';
    n = parseInt(n, 10);
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
    return n.toLocaleString();
  }

  function formatCurrency(millions) {
    if (!millions || isNaN(millions)) return '—';
    var m = parseFloat(millions);
    if (m >= 1000) return 'USD ' + (m / 1000).toFixed(1) + 'B';
    return 'USD ' + m.toFixed(0) + 'M';
  }

  function formatDuration(days) {
    if (!days || isNaN(days)) return '—';
    days = parseInt(days, 10);
    var yrs = Math.floor(days / 365);
    var mos = Math.floor((days % 365) / 30);
    if (yrs >= 1 && mos > 0) return yrs + 'yr ' + mos + 'mo';
    if (yrs >= 1) return yrs + ' yr' + (yrs > 1 ? 's' : '');
    if (mos >= 1) return mos + ' mo';
    return days + ' days';
  }

  function formatRange(min, max) {
    if (!min && !max) return '—';
    var fmin = formatNumber(min);
    var fmax = formatNumber(max);
    if (fmin === fmax) return fmin;
    return fmin + '–' + fmax;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ── Flag emoji from ISO 2-letter code ────────────────────────────
  function flagEmoji(iso2) {
    if (!iso2 || iso2.length !== 2) return '🌍';
    // EH = Western Sahara — use special unicode
    if (iso2 === 'EH') return '🏳';
    var offset = 127397;
    try {
      return String.fromCodePoint(
        iso2.toUpperCase().charCodeAt(0) + offset,
        iso2.toUpperCase().charCodeAt(1) + offset
      );
    } catch(e) { return '🌍'; }
  }

  function resourceIcon(resource) {
    var icons = {
      gold: '🪙', oil: '🛢️', diamonds: '💎', coltan: '🔩',
      cobalt: '⚡', uranium: '☢️', natural_gas: '🔥',
      timber: '🌲', cassiterite: '🪨', wolframite: '🔩',
      phosphates: '🧪', cattle: '🐄', charcoal: '🪵',
      coal: '⛏️', water: '💧', arms: '🔫'
    };
    return icons[resource] || '📦';
  }

  // ── Count-up animation ────────────────────────────────────────────
  function animateCountUp(el, target, duration) {
    if (!el) return;
    duration = duration || 1500;
    var start = 0;
    var startTime = null;
    var isFloat = String(target).includes('.');

    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = start + (target - start) * eased;
      el.textContent = isFloat ? current.toFixed(1) : Math.round(current).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ── Conflict stage visual ─────────────────────────────────────────
  function renderStageIndicator(stage) {
    var labels = CONFIG.stageLabels;
    var html = '<div class="acd-stage-indicator">';
    for (var i = 1; i <= 6; i++) {
      var active = i === stage;
      var past = i < stage;
      html += '<div class="acd-stage-step ' + (active ? 'active' : '') + (past ? ' past' : '') + '">' +
        '<div class="acd-stage-dot"></div>' +
        '<div class="acd-stage-label">' + labels[i] + '</div>' +
      '</div>';
    }
    html += '</div>';
    return html;
  }

  // ── Expose public interface ───────────────────────────────────────
  return {
    init: init,
    getConflicts: getConflicts,
    getConflict: getConflict,
    getStats: getStats,
    getEvents: getEvents,
    getActors: getActors,
    getTimeline: getTimeline,
    getForecast: getForecast,
    getEconomy: getEconomy,
    getDisplacement: getDisplacement,
    getRecentEvents: getRecentEvents,
    renderMap: renderMap,
    renderConflictCard: renderConflictCard,
    renderKPICard: renderKPICard,
    formatNumber: formatNumber,
    formatCurrency: formatCurrency,
    formatDuration: formatDuration,
    formatRange: formatRange,
    formatDate: formatDate,
    riskBadge: riskBadge,
    statusBadge: statusBadge,
    evidenceBadge: evidenceBadge,
    flagEmoji: flagEmoji,
    resourceIcon: resourceIcon,
    animateCountUp: animateCountUp,
    renderStageIndicator: renderStageIndicator,
    CONFIG: CONFIG
  };

})();
