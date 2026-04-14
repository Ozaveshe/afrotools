(function () {
  'use strict';

  var map = null;
  var markerLayer = null;
  var allConflicts = [];
  var filteredConflicts = [];
  var recentEvents = [];
  var spotlightSlug = '';
  var activeLayer = 'all';
  var conflictById = {};
  var riskOrder = { critical: 0, high: 1, medium: 2, low: 3, minimal: 4 };
  var regionLabels = {
    'east-africa': 'East Africa',
    'west-africa': 'West Africa',
    'north-africa': 'North Africa',
    'central-africa': 'Central Africa',
    'southern-africa': 'Southern Africa',
    'sahel': 'Sahel',
    'horn-of-africa': 'Horn of Africa'
  };
  var layerMeta = {
    all: {
      label: 'All conflicts',
      footnote: 'Marker size reflects estimated fatalities. Color reflects escalation risk.'
    },
    density: {
      label: 'Conflict intensity',
      footnote: 'Larger circles emphasize the deadliest conflict theatres.'
    },
    displacement: {
      label: 'Displacement lens',
      footnote: 'Marker size reflects the current displaced population.'
    },
    spillover: {
      label: 'Spillover pressure',
      footnote: 'Shows conflicts with active cross-border risk or exposed neighboring states.'
    }
  };
  var filters = {
    search: '',
    region: 'all',
    risk: 'all',
    african: true,
    eventType: '',
    eventScope: 'all',
    fatalOnly: false
  };
  var apiOrigin = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') ? 'https://afrotools.com' : '';

  function q(sel) { return document.querySelector(sel); }
  function qa(sel) { return document.querySelectorAll(sel); }

  function apiUrl(path) {
    return apiOrigin + path;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function titleCase(value) {
    return String(value || '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, function (ch) { return ch.toUpperCase(); });
  }

  function normalize(value) {
    return String(value || '').toLowerCase();
  }

  function truncate(text, length) {
    var raw = String(text || '').trim();
    if (!raw) return '';
    if (raw.length <= length) return raw;
    return raw.slice(0, Math.max(0, length - 1)).trim() + '…';
  }

  function totalDisplaced(conflict) {
    return (Number(conflict.idps_count) || 0) + (Number(conflict.refugees_count) || 0);
  }

  function computeDurationLabel(conflict) {
    if (conflict.duration_days) return AfroConflict.formatDuration(conflict.duration_days);
    if (!conflict.start_date) return '—';
    var start = new Date(conflict.start_date);
    if (isNaN(start.getTime())) return '—';
    var days = Math.max(1, Math.round((Date.now() - start.getTime()) / 86400000));
    return AfroConflict.formatDuration(days);
  }

  function lossLabel(conflict) {
    if (!conflict.economic_loss_max_usd_b) return '—';
    if (conflict.economic_loss_min_usd_b) {
      return 'USD ' + conflict.economic_loss_min_usd_b + '–' + conflict.economic_loss_max_usd_b + 'B';
    }
    return 'USD ' + conflict.economic_loss_max_usd_b + 'B';
  }

  function riskRank(value) {
    return riskOrder[value] !== undefined ? riskOrder[value] : 5;
  }

  function hasSpillover(conflict) {
    return ((conflict.spillover_countries || []).length > 0) || riskRank(conflict.spillover_risk) <= 2;
  }

  function getConflictLabel(conflict) {
    return conflict.short_name || conflict.name || 'Unnamed conflict';
  }

  function getConflictSummary(conflict) {
    return conflict.summary || conflict.why_persists || conflict.peace_efforts || '';
  }

  function sortByPriority(list) {
    return list.slice().sort(function (a, b) {
      var riskDelta = riskRank(a.escalation_risk) - riskRank(b.escalation_risk);
      if (riskDelta !== 0) return riskDelta;
      return (Number(b.fatalities_max) || 0) - (Number(a.fatalities_max) || 0);
    });
  }

  function buildConflictLookup(conflicts) {
    conflictById = {};
    conflicts.forEach(function (conflict) {
      if (conflict.id) conflictById[conflict.id] = conflict;
    });
  }

  function computeFallbackStats(conflicts) {
    var stats = {
      active_conflicts: 0,
      total_displaced: 0,
      fatalities_min: 0,
      fatalities_max: 0,
      military_spend_usd_m: 0,
      economic_loss_max_usd_b: 0,
      critical_risk_count: 0,
      spillover_threat_countries: 0,
      new_escalations_30d: 0
    };
    var spillover = {};

    conflicts.forEach(function (conflict) {
      if (!conflict.is_african) return;
      stats.active_conflicts += 1;
      stats.total_displaced += totalDisplaced(conflict);
      stats.fatalities_min += Number(conflict.fatalities_min) || 0;
      stats.fatalities_max += Number(conflict.fatalities_max) || 0;
      stats.military_spend_usd_m += Number(conflict.military_spend_usd_m) || 0;
      stats.economic_loss_max_usd_b += Number(conflict.economic_loss_max_usd_b) || 0;
      if (conflict.escalation_risk === 'critical') stats.critical_risk_count += 1;
      (conflict.spillover_countries || []).forEach(function (country) {
        spillover[country] = true;
      });
      if (conflict.status === 'escalating') stats.new_escalations_30d += 1;
    });

    stats.spillover_threat_countries = Object.keys(spillover).length;
    return stats;
  }

  function renderKPIs(stats) {
    var kpiRow = q('#acd-kpi-row');
    if (!kpiRow) return;

    var snapshot = stats || computeFallbackStats(allConflicts);
    var kpis = [
      { icon: '⚔️', label: 'Active conflicts', val: snapshot.active_conflicts, sub: 'ACLED / Manual', color: '#dc2626' },
      { icon: '🏕️', label: 'Total displaced', val: AfroConflict.formatNumber(snapshot.total_displaced), sub: 'UNHCR', color: '#ea580c' },
      { icon: '☠️', label: 'Est. fatalities', val: AfroConflict.formatRange(snapshot.fatalities_min, snapshot.fatalities_max), sub: 'UCDP / ACLED', color: '#dc2626' },
      { icon: '💸', label: 'Military spend / yr', val: AfroConflict.formatCurrency(snapshot.military_spend_usd_m), sub: 'SIPRI / Manual', color: '#d97706' },
      { icon: '📉', label: 'Est. economic loss', val: 'USD ' + Number(snapshot.economic_loss_max_usd_b || 0).toFixed(1) + 'B+', sub: 'World Bank / Manual', color: '#ca8a04' },
      { icon: '🚨', label: 'Critical risk', val: snapshot.critical_risk_count, sub: 'AfroConflict', color: '#dc2626' },
      { icon: '🌍', label: 'Spillover threats', val: snapshot.spillover_threat_countries + ' countries', sub: 'AfroConflict', color: '#0f766e' },
      { icon: '📈', label: 'New escalations', val: snapshot.new_escalations_30d, sub: 'Recent 30d', color: '#2563eb' }
    ];

    kpiRow.innerHTML = kpis.map(function (item) {
      return '<article class="acd-kpi-card" data-color="' + escapeHtml(item.color) + '">' +
        '<div class="acd-kpi-icon">' + item.icon + '</div>' +
        '<div class="acd-kpi-value">' + escapeHtml(item.val) + '</div>' +
        '<div class="acd-kpi-label">' + escapeHtml(item.label) + '</div>' +
        '<div class="acd-kpi-sub">' + escapeHtml(item.sub) + '</div>' +
      '</article>';
    }).join('');
  }

  function populateRegionFilter(conflicts) {
    var select = q('#acd-region-filter');
    if (!select) return;

    var counts = {};
    conflicts.forEach(function (conflict) {
      (conflict.regions || []).forEach(function (region) {
        counts[region] = (counts[region] || 0) + 1;
      });
    });

    var options = Object.keys(counts).sort(function (a, b) {
      return (regionLabels[a] || titleCase(a)).localeCompare(regionLabels[b] || titleCase(b));
    });

    select.innerHTML = '<option value="all">All regions</option>' + options.map(function (region) {
      var label = regionLabels[region] || titleCase(region);
      return '<option value="' + escapeHtml(region) + '">' + escapeHtml(label + ' (' + counts[region] + ')') + '</option>';
    }).join('');

    select.value = filters.region;
  }

  function getFilteredConflicts() {
    var search = normalize(filters.search);

    return sortByPriority(allConflicts.filter(function (conflict) {
      if (filters.african && !conflict.is_african) return false;
      if (filters.region !== 'all' && !(conflict.regions || []).includes(filters.region)) return false;
      if (filters.risk !== 'all' && conflict.escalation_risk !== filters.risk) return false;
      if (!search) return true;

      var haystack = [
        conflict.name,
        conflict.short_name,
        conflict.primary_country,
        (conflict.countries_involved || []).join(' '),
        (conflict.regions || []).join(' '),
        conflict.summary
      ].join(' ');

      return normalize(haystack).indexOf(search) !== -1;
    }));
  }

  function getSpotlightConflict() {
    var match = filteredConflicts.find(function (conflict) {
      return conflict.slug === spotlightSlug;
    });
    return match || filteredConflicts[0] || null;
  }

  function ensureSpotlight() {
    var spotlight = getSpotlightConflict();
    spotlightSlug = spotlight ? spotlight.slug : '';
    return spotlight;
  }

  function renderHeroSummary(spotlight) {
    var el = q('#acd-hero-statline');
    if (!el) return;

    if (!filteredConflicts.length) {
      el.textContent = 'No conflicts match the current filter set.';
      return;
    }

    var highRiskCount = filteredConflicts.filter(function (conflict) {
      return riskRank(conflict.escalation_risk) <= 1;
    }).length;
    var displaced = filteredConflicts.reduce(function (sum, conflict) {
      return sum + totalDisplaced(conflict);
    }, 0);
    var regions = {};
    filteredConflicts.forEach(function (conflict) {
      (conflict.regions || []).forEach(function (region) {
        regions[region] = true;
      });
    });

    var message = filteredConflicts.length + ' conflicts in scope';
    message += ' • ' + highRiskCount + ' critical/high risk';
    message += ' • ' + AfroConflict.formatNumber(displaced) + ' displaced across this filter';
    if (spotlight) {
      message += ' • focus: ' + getConflictLabel(spotlight);
    }
    if (Object.keys(regions).length) {
      message += ' • ' + Object.keys(regions).length + ' regions';
    }

    el.textContent = message;
  }

  function renderHeroSignals() {
    var el = q('#acd-hero-chips');
    if (!el) return;

    if (!filteredConflicts.length) {
      el.innerHTML = '';
      return;
    }

    var hottest = filteredConflicts[0];
    var mostDisplaced = filteredConflicts.slice().sort(function (a, b) {
      return totalDisplaced(b) - totalDisplaced(a);
    })[0];
    var spilloverHot = filteredConflicts.filter(hasSpillover).length;
    var eventStatus = recentEvents.length ? recentEvents.length + ' recent records' : 'Awaiting sync';

    el.innerHTML = [
      heroChip('Priority', getConflictLabel(hottest)),
      heroChip('Most displaced', AfroConflict.flagEmoji(mostDisplaced.primary_country) + ' ' + AfroConflict.formatNumber(totalDisplaced(mostDisplaced))),
      heroChip('Spillover active', spilloverHot + ' theatres'),
      heroChip('Event feed', eventStatus)
    ].join('');
  }

  function heroChip(label, value) {
    return '<div class="acd-hero-chip">' +
      '<span class="acd-hero-chip-label">' + escapeHtml(label) + '</span>' +
      '<strong>' + escapeHtml(value) + '</strong>' +
    '</div>';
  }

  function renderActiveFilters() {
    var container = q('#acd-active-filters');
    if (!container) return;

    var chips = [];
    if (filters.search) chips.push('Search: ' + filters.search);
    if (filters.region !== 'all') chips.push('Region: ' + (regionLabels[filters.region] || titleCase(filters.region)));
    if (filters.risk !== 'all') chips.push('Risk: ' + titleCase(filters.risk));
    if (!filters.african) chips.push('Global impact included');

    if (!chips.length) {
      container.innerHTML = '<span class="acd-filter-hint">All African conflicts in scope. Click a marker or watchlist item to pin a live briefing.</span>';
      return;
    }

    container.innerHTML = chips.map(function (chip) {
      return '<span class="acd-filter-tag">' + escapeHtml(chip) + '</span>';
    }).join('');
  }

  function briefingStat(label, value) {
    return '<div class="acd-briefing-stat">' +
      '<span class="acd-briefing-stat-label">' + escapeHtml(label) + '</span>' +
      '<strong>' + escapeHtml(value) + '</strong>' +
    '</div>';
  }

  function renderBriefingCard(conflict) {
    var el = q('#acd-briefing-card');
    if (!el) return;

    if (!conflict) {
      el.innerHTML = '<div class="acd-empty"><div class="acd-empty-icon">🛰️</div><div class="acd-empty-title">No live briefing available for this filter.</div></div>';
      return;
    }

    var summary = truncate(getConflictSummary(conflict), 210);
    var spilloverCount = (conflict.spillover_countries || []).length;

    el.innerHTML = '<div class="acd-briefing-overline">Live briefing</div>' +
      '<div class="acd-briefing-title-row">' +
        '<h2 class="acd-briefing-title">' + escapeHtml(getConflictLabel(conflict)) + '</h2>' +
        AfroConflict.riskBadge(conflict.escalation_risk, '') +
      '</div>' +
      '<div class="acd-briefing-meta">' +
        AfroConflict.statusBadge(conflict.status) +
        '<span>' + AfroConflict.flagEmoji(conflict.primary_country) + ' ' + escapeHtml(conflict.primary_country) + '</span>' +
        '<span>' + escapeHtml(computeDurationLabel(conflict)) + '</span>' +
      '</div>' +
      '<p class="acd-briefing-summary">' + escapeHtml(summary || 'No analyst summary entered yet for this conflict.') + '</p>' +
      '<div class="acd-briefing-stats">' +
        briefingStat('Fatalities', AfroConflict.formatRange(conflict.fatalities_min, conflict.fatalities_max)) +
        briefingStat('Displaced', AfroConflict.formatNumber(totalDisplaced(conflict))) +
        briefingStat('Spillover', spilloverCount ? spilloverCount + ' states' : 'Contained') +
      '</div>' +
      '<div class="acd-briefing-links">' +
        '<button class="acd-btn acd-btn-primary" type="button" data-center-map="' + escapeHtml(conflict.slug) + '">Center on map</button>' +
        '<a class="acd-btn acd-btn-outline" href="/tools/africa-conflict/detail.html?id=' + encodeURIComponent(conflict.slug) + '">Open dossier</a>' +
      '</div>';

    var centerBtn = el.querySelector('[data-center-map]');
    if (centerBtn) {
      centerBtn.addEventListener('click', function () {
        panToConflict(conflict);
      });
    }
  }

  function focusMetric(label, value) {
    return '<div class="acd-focus-metric">' +
      '<span>' + escapeHtml(label) + '</span>' +
      '<strong>' + value + '</strong>' +
    '</div>';
  }

  function renderFocusCard(conflict) {
    var el = q('#acd-focus-card');
    if (!el) return;

    if (!conflict) {
      el.innerHTML = '<div class="acd-empty"><div class="acd-empty-icon">🎯</div><div class="acd-empty-title">Select a conflict to open a live briefing.</div></div>';
      return;
    }

    var triggers = (conflict.key_triggers || []).slice(0, 4).map(function (trigger) {
      return '<span class="acd-tag">' + escapeHtml(titleCase(trigger)) + '</span>';
    }).join('');
    var resources = (conflict.resource_links || []).slice(0, 4).map(function (resource) {
      return '<span class="acd-tag">' + AfroConflict.resourceIcon(resource) + ' ' + escapeHtml(titleCase(resource)) + '</span>';
    }).join('');
    var spilloverFlags = (conflict.spillover_countries || []).map(function (country) {
      return AfroConflict.flagEmoji(country);
    }).join(' ');

    el.innerHTML = '<div class="acd-focus-overline">Selected conflict</div>' +
      '<div class="acd-focus-header">' +
        '<div>' +
          '<h2 class="acd-focus-title">' + escapeHtml(getConflictLabel(conflict)) + '</h2>' +
          '<div class="acd-focus-meta">' +
            AfroConflict.statusBadge(conflict.status) +
            AfroConflict.riskBadge(conflict.escalation_risk, 'Escalation') +
            AfroConflict.riskBadge(conflict.spillover_risk, 'Spillover') +
          '</div>' +
        '</div>' +
        '<a class="acd-card-link" href="/tools/africa-conflict/detail.html?id=' + encodeURIComponent(conflict.slug) + '">View intelligence →</a>' +
      '</div>' +
      '<div class="acd-focus-grid">' +
        focusMetric('Primary country', AfroConflict.flagEmoji(conflict.primary_country) + ' ' + escapeHtml(conflict.primary_country)) +
        focusMetric('Displaced', escapeHtml(AfroConflict.formatNumber(totalDisplaced(conflict)))) +
        focusMetric('Fatalities', escapeHtml(AfroConflict.formatRange(conflict.fatalities_min, conflict.fatalities_max))) +
        focusMetric('Economic loss', escapeHtml(lossLabel(conflict))) +
      '</div>' +
      '<p class="acd-focus-summary">' + escapeHtml(truncate(conflict.why_persists || getConflictSummary(conflict), 340) || 'Analyst summary is still being added for this dossier.') + '</p>' +
      (spilloverFlags ? '<div class="acd-focus-strip"><span>Exposed neighbors</span><strong>' + spilloverFlags + '</strong></div>' : '') +
      (triggers ? '<div class="acd-tag-list"><h3>Key triggers</h3><div class="acd-tags">' + triggers + '</div></div>' : '') +
      (resources ? '<div class="acd-tag-list"><h3>Conflict economy links</h3><div class="acd-tags">' + resources + '</div></div>' : '');
  }

  function renderWatchlist(conflicts, spotlight) {
    var el = q('#acd-top-list');
    var countEl = q('#acd-watchlist-count');
    if (!el) return;

    if (!conflicts.length) {
      el.innerHTML = '<div class="acd-empty"><div class="acd-empty-icon">🧭</div><div class="acd-empty-title">No conflicts match these filters.</div></div>';
      if (countEl) countEl.textContent = '0 in scope';
      return;
    }

    var top = conflicts.slice(0, 8);
    if (countEl) countEl.textContent = conflicts.length + ' in scope';

    el.innerHTML = top.map(function (conflict) {
      var activeClass = spotlight && spotlight.slug === conflict.slug ? ' is-active' : '';
      return '<button class="acd-conflict-row' + activeClass + '" data-slug="' + escapeHtml(conflict.slug) + '" type="button">' +
        '<div class="acd-row-topline">' +
          '<span class="acd-row-risk-dot" style="background:' + (AfroConflict.CONFIG.riskColors[conflict.escalation_risk] || '#6b7280') + '"></span>' +
          '<span class="acd-row-name">' + AfroConflict.flagEmoji(conflict.primary_country) + ' ' + escapeHtml(getConflictLabel(conflict)) + '</span>' +
        '</div>' +
        '<div class="acd-row-meta">' +
          AfroConflict.statusBadge(conflict.status) +
          '<span class="acd-row-meta-text">' + escapeHtml(computeDurationLabel(conflict)) + '</span>' +
        '</div>' +
        '<div class="acd-row-metrics">' +
          '<span>☠️ ' + escapeHtml(AfroConflict.formatRange(conflict.fatalities_min, conflict.fatalities_max)) + '</span>' +
          '<span>🏕️ ' + escapeHtml(AfroConflict.formatNumber(totalDisplaced(conflict))) + '</span>' +
        '</div>' +
      '</button>';
    }).join('');

    qa('.acd-conflict-row').forEach(function (row) {
      row.addEventListener('click', function () {
        setSpotlight(this.getAttribute('data-slug'), true);
      });
    });
  }

  function signalMetric(label, value, tone) {
    return '<div class="acd-signal-metric">' +
      '<span>' + escapeHtml(label) + '</span>' +
      '<strong class="' + escapeHtml(tone || '') + '">' + escapeHtml(value) + '</strong>' +
    '</div>';
  }

  function renderSignalBoard(conflicts) {
    var summaryEl = q('#acd-signal-summary');
    var riskEl = q('#acd-risk-mix');
    var regionEl = q('#acd-region-pressure');
    if (!summaryEl || !riskEl || !regionEl) return;

    if (!conflicts.length) {
      summaryEl.innerHTML = '<div class="acd-empty"><div class="acd-empty-title">No signal mix for the current filter.</div></div>';
      riskEl.innerHTML = '';
      regionEl.innerHTML = '';
      return;
    }

    var resourceLinked = conflicts.filter(function (conflict) {
      return conflict.resource_links && conflict.resource_links.length;
    }).length;
    var climateLinked = conflicts.filter(function (conflict) {
      return conflict.climate_link;
    }).length;
    var foodLinked = conflicts.filter(function (conflict) {
      return conflict.food_insecurity_link;
    }).length;
    var spilloverHot = conflicts.filter(hasSpillover).length;
    var avgDisplacement = Math.round(conflicts.reduce(function (sum, conflict) {
      return sum + totalDisplaced(conflict);
    }, 0) / Math.max(1, conflicts.length));

    summaryEl.innerHTML = signalMetric('High urgency', conflicts.filter(function (conflict) { return riskRank(conflict.escalation_risk) <= 1; }).length + ' theatres', 'tone-critical') +
      signalMetric('Resource-linked', resourceLinked + ' dossiers', '') +
      signalMetric('Climate-linked', climateLinked + ' dossiers', '') +
      signalMetric('Food insecurity link', foodLinked + ' dossiers', '') +
      signalMetric('Spillover active', spilloverHot + ' theatres', 'tone-warning') +
      signalMetric('Average displaced', AfroConflict.formatNumber(avgDisplacement), '');

    var counts = { critical: 0, high: 0, medium: 0, low: 0, minimal: 0 };
    conflicts.forEach(function (conflict) {
      var risk = conflict.escalation_risk || 'minimal';
      if (counts[risk] === undefined) counts[risk] = 0;
      counts[risk] += 1;
    });

    riskEl.innerHTML = ['critical', 'high', 'medium', 'low', 'minimal'].map(function (risk) {
      var count = counts[risk] || 0;
      var share = Math.max(4, Math.round((count / conflicts.length) * 100));
      var color = AfroConflict.CONFIG.riskColors[risk] || '#6b7280';
      return '<div class="acd-bar-row">' +
        '<div class="acd-bar-label"><span>' + escapeHtml(titleCase(risk)) + '</span><strong>' + count + '</strong></div>' +
        '<div class="acd-bar-track"><div class="acd-bar-fill" style="width:' + share + '%;background:' + color + '"></div></div>' +
      '</div>';
    }).join('');

    var regionMap = {};
    conflicts.forEach(function (conflict) {
      var keys = (conflict.regions && conflict.regions.length ? conflict.regions : ['unclassified']);
      keys.forEach(function (region) {
        if (!regionMap[region]) {
          regionMap[region] = { count: 0, displaced: 0, critical: 0 };
        }
        regionMap[region].count += 1;
        regionMap[region].displaced += totalDisplaced(conflict);
        if (riskRank(conflict.escalation_risk) <= 1) regionMap[region].critical += 1;
      });
    });

    var regions = Object.keys(regionMap).sort(function (a, b) {
      return regionMap[b].count - regionMap[a].count;
    }).slice(0, 6);

    regionEl.innerHTML = regions.map(function (region) {
      var item = regionMap[region];
      return '<div class="acd-region-row">' +
        '<div><strong>' + escapeHtml(regionLabels[region] || titleCase(region)) + '</strong><span>' + item.count + ' conflicts · ' + item.critical + ' high urgency</span></div>' +
        '<div class="acd-region-metric">' + escapeHtml(AfroConflict.formatNumber(item.displaced)) + '</div>' +
      '</div>';
    }).join('');
  }

  function resolveEventConflict(eventItem) {
    if (eventItem.conflict_id && conflictById[eventItem.conflict_id]) return conflictById[eventItem.conflict_id];
    if (eventItem.ac_conflicts && eventItem.ac_conflicts.id && conflictById[eventItem.ac_conflicts.id]) return conflictById[eventItem.ac_conflicts.id];
    return eventItem.ac_conflicts || null;
  }

  function getFilteredEvents(spotlight) {
    return recentEvents.filter(function (eventItem) {
      if (filters.eventType && eventItem.event_type !== filters.eventType) return false;
      if (filters.fatalOnly && !(Number(eventItem.fatalities) > 0)) return false;
      if (filters.eventScope === 'selected' && spotlight) {
        var eventConflict = resolveEventConflict(eventItem);
        if (!eventConflict) return false;
        if (eventItem.conflict_id && spotlight.id) return eventItem.conflict_id === spotlight.id;
        return eventConflict.slug === spotlight.slug;
      }
      return true;
    }).sort(function (a, b) {
      return new Date(b.event_date) - new Date(a.event_date);
    });
  }

  function renderEvents(spotlight) {
    var el = q('#acd-events-feed');
    var meta = q('#acd-events-meta');
    var panel = q('.acd-events-panel');
    if (!el || !meta) return;

    var filtered = getFilteredEvents(spotlight);

    if (!recentEvents.length) {
      if (panel) panel.classList.add('is-empty');
      meta.textContent = 'Recent event data is still populating.';
      el.innerHTML = '<div class="acd-empty"><div class="acd-empty-icon">📡</div><div class="acd-empty-title">No recent event stream is available yet.</div></div>';
      return;
    }

    if (panel) panel.classList.remove('is-empty');

    meta.textContent = filtered.length + ' events shown' + (filters.eventScope === 'selected' && spotlight ? ' for ' + getConflictLabel(spotlight) : '') + '.';

    if (!filtered.length) {
      el.innerHTML = '<div class="acd-empty"><div class="acd-empty-icon">🗂️</div><div class="acd-empty-title">No events match the current event filters.</div></div>';
      return;
    }

    el.innerHTML = filtered.slice(0, 10).map(function (eventItem) {
      var eventConflict = resolveEventConflict(eventItem);
      var icon = AfroConflict.CONFIG.eventTypeIcons[eventItem.event_type] || '📋';
      var actors = [eventItem.actor1, eventItem.actor2].filter(Boolean).join(' vs ');
      var focusAction = eventConflict && eventConflict.slug ? '<button class="acd-event-action" type="button" data-event-focus="' + escapeHtml(eventConflict.slug) + '">Pin briefing</button>' : '';

      return '<article class="acd-event-card">' +
        '<div class="acd-event-card-top">' +
          '<div class="acd-event-pill">' + icon + ' ' + escapeHtml(titleCase(eventItem.event_type || 'event')) + '</div>' +
          '<div class="acd-event-date">' + escapeHtml(AfroConflict.formatDate(eventItem.event_date)) + '</div>' +
        '</div>' +
        '<h3 class="acd-event-location">' + escapeHtml(eventItem.location || 'Location not specified') + '</h3>' +
        '<div class="acd-event-conflict">' + (eventConflict ? AfroConflict.flagEmoji(eventConflict.primary_country || '') + ' ' + escapeHtml(getConflictLabel(eventConflict)) : 'Unmatched conflict record') + '</div>' +
        (actors ? '<p class="acd-event-actors">' + escapeHtml(actors) + '</p>' : '') +
        '<div class="acd-event-footer">' +
          '<span>' + (Number(eventItem.fatalities) > 0 ? '☠️ ' + escapeHtml(String(eventItem.fatalities)) + ' fatalities' : 'No fatality count reported') + '</span>' +
          focusAction +
        '</div>' +
      '</article>';
    }).join('');

    qa('[data-event-focus]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setSpotlight(this.getAttribute('data-event-focus'), true);
      });
    });
  }

  function getLayerConflicts(conflicts) {
    return conflicts.filter(function (conflict) {
      if (!conflict.lat || !conflict.lng) return false;
      if (activeLayer === 'spillover') return hasSpillover(conflict);
      return true;
    });
  }

  function mapMetricValue(conflict) {
    if (activeLayer === 'displacement') return totalDisplaced(conflict);
    if (activeLayer === 'spillover') return Math.max((conflict.spillover_countries || []).length * 350000, Number(conflict.fatalities_max) || 0);
    return Number(conflict.fatalities_max) || Number(conflict.fatalities_min) || 0;
  }

  function mapRadius(conflict) {
    var value = mapMetricValue(conflict);
    if (activeLayer === 'displacement') return Math.min(34, Math.max(8, Math.sqrt(value / 200000) * 8));
    if (activeLayer === 'spillover') return Math.min(28, Math.max(9, ((conflict.spillover_countries || []).length * 3) + 8));
    if (activeLayer === 'density') return Math.min(30, Math.max(7, Math.sqrt(value / 1200) * 6));
    return Math.min(24, Math.max(6, Math.sqrt(value / 1200) * 5));
  }

  function markerStyle(conflict, isSpotlight) {
    var color = AfroConflict.CONFIG.riskColors[conflict.escalation_risk] || '#6b7280';
    var fillColor = color;
    var fillOpacity = activeLayer === 'density' ? 0.2 : 0.45;
    var weight = isSpotlight ? 3 : 1.5;
    var dashArray = null;

    if (activeLayer === 'displacement') {
      fillColor = '#38bdf8';
      color = '#0ea5e9';
      fillOpacity = isSpotlight ? 0.55 : 0.32;
    }

    if (activeLayer === 'spillover') {
      color = AfroConflict.CONFIG.riskColors[conflict.spillover_risk] || color;
      fillColor = color;
      fillOpacity = isSpotlight ? 0.4 : 0.16;
      dashArray = '6 4';
    }

    return {
      radius: mapRadius(conflict),
      fillColor: fillColor,
      color: color,
      weight: weight,
      opacity: 0.95,
      fillOpacity: fillOpacity,
      dashArray: dashArray
    };
  }

  function mapPopup(conflict) {
    var spillover = conflict.spillover_countries && conflict.spillover_countries.length ? conflict.spillover_countries.map(function (country) {
      return AfroConflict.flagEmoji(country);
    }).join(' ') : 'Contained';

    return '<div class="acd-map-popup">' +
      '<div class="acd-mp-header"><span class="acd-mp-flag">' + AfroConflict.flagEmoji(conflict.primary_country) + '</span><strong>' + escapeHtml(getConflictLabel(conflict)) + '</strong></div>' +
      '<div class="acd-mp-badges">' + AfroConflict.statusBadge(conflict.status) + AfroConflict.riskBadge(conflict.escalation_risk, 'Risk') + '</div>' +
      '<div class="acd-mp-stats">' +
        '<div>☠️ ' + escapeHtml(AfroConflict.formatRange(conflict.fatalities_min, conflict.fatalities_max)) + '</div>' +
        '<div>🏕️ ' + escapeHtml(AfroConflict.formatNumber(totalDisplaced(conflict))) + ' displaced</div>' +
        '<div>🌍 ' + spillover + '</div>' +
      '</div>' +
      '<a href="/tools/africa-conflict/detail.html?id=' + encodeURIComponent(conflict.slug) + '" class="acd-mp-link">View intelligence →</a>' +
    '</div>';
  }

  function renderMap(conflicts) {
    var mapStatus = q('#acd-map-status');
    var footnote = q('#acd-map-footnote');
    var eligible = getLayerConflicts(conflicts);
    var spotlight = getSpotlightConflict();

    if (footnote) footnote.textContent = layerMeta[activeLayer].footnote;

    if (typeof L === 'undefined') {
      if (mapStatus) mapStatus.textContent = 'Leaflet failed to load.';
      q('#acd-map').innerHTML = '<div class="acd-empty"><div class="acd-empty-title">The map library did not load.</div></div>';
      return;
    }

    if (!map) {
      map = AfroConflict.renderMap('acd-map', [], { center: [4, 18], zoom: 3 });
      markerLayer = L.layerGroup().addTo(map);
      setTimeout(function () {
        if (map) map.invalidateSize();
      }, 100);
    }

    if (!markerLayer) return;

    markerLayer.clearLayers();

    if (mapStatus) {
      mapStatus.textContent = eligible.length + ' mapped • ' + layerMeta[activeLayer].label;
    }

    if (!eligible.length) return;

    eligible.forEach(function (conflict) {
      var isSpotlight = spotlight && spotlight.slug === conflict.slug;
      var marker = L.circleMarker([conflict.lat, conflict.lng], markerStyle(conflict, isSpotlight));
      marker.bindPopup(mapPopup(conflict));
      marker.on('click', function () {
        setSpotlight(conflict.slug, false);
      });
      markerLayer.addLayer(marker);
    });
  }

  function panToConflict(conflict) {
    if (!map || !conflict || !conflict.lat || !conflict.lng) return;
    map.flyTo([conflict.lat, conflict.lng], Math.max(map.getZoom(), 4), { duration: 0.7 });
  }

  function applyDashboardFilters() {
    filteredConflicts = getFilteredConflicts();
    var spotlight = ensureSpotlight();

    renderHeroSummary(spotlight);
    renderHeroSignals();
    renderActiveFilters();
    renderBriefingCard(spotlight);
    renderFocusCard(spotlight);
    renderWatchlist(filteredConflicts, spotlight);
    renderSignalBoard(filteredConflicts);
    renderEvents(spotlight);
    renderMap(filteredConflicts);
  }

  function setSpotlight(slug, panMap) {
    spotlightSlug = slug || '';
    var spotlight = ensureSpotlight();
    renderHeroSummary(spotlight);
    renderHeroSignals();
    renderBriefingCard(spotlight);
    renderFocusCard(spotlight);
    renderWatchlist(filteredConflicts, spotlight);
    renderEvents(spotlight);
    renderMap(filteredConflicts);
    if (panMap && spotlight) {
      panToConflict(spotlight);
    }
  }

  function updateRiskButtons() {
    qa('#acd-risk-pills .acd-filter-chip').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-risk') === filters.risk);
    });
  }

  function updateToggleStates() {
    var africanToggle = q('#acd-african-toggle');
    var fatalToggle = q('#acd-fatal-toggle');
    if (africanToggle) {
      africanToggle.classList.toggle('is-active', filters.african);
      africanToggle.setAttribute('aria-pressed', filters.african ? 'true' : 'false');
      africanToggle.textContent = filters.african ? 'African conflicts only' : 'African + global impact';
    }
    if (fatalToggle) {
      fatalToggle.classList.toggle('is-active', filters.fatalOnly);
      fatalToggle.setAttribute('aria-pressed', filters.fatalOnly ? 'true' : 'false');
    }
  }

  function resetFilters() {
    filters.search = '';
    filters.region = 'all';
    filters.risk = 'all';
    filters.african = true;
    filters.eventType = '';
    filters.eventScope = 'all';
    filters.fatalOnly = false;

    q('#acd-search').value = '';
    q('#acd-region-filter').value = 'all';
    q('#acd-event-type').value = '';
    q('#acd-event-scope').value = 'all';
    updateRiskButtons();
    updateToggleStates();
    applyDashboardFilters();
  }

  function setupControls() {
    q('#acd-search').addEventListener('input', function () {
      filters.search = this.value.trim();
      applyDashboardFilters();
    });

    q('#acd-region-filter').addEventListener('change', function () {
      filters.region = this.value;
      applyDashboardFilters();
    });

    qa('#acd-risk-pills .acd-filter-chip').forEach(function (button) {
      button.addEventListener('click', function () {
        filters.risk = this.getAttribute('data-risk') || 'all';
        updateRiskButtons();
        applyDashboardFilters();
      });
    });

    q('#acd-african-toggle').addEventListener('click', function () {
      filters.african = !filters.african;
      updateToggleStates();
      applyDashboardFilters();
    });

    q('#acd-reset-filters').addEventListener('click', resetFilters);

    qa('.acd-map-toggle').forEach(function (button) {
      button.addEventListener('click', function () {
        activeLayer = this.getAttribute('data-layer') || 'all';
        qa('.acd-map-toggle').forEach(function (item) {
          item.classList.remove('active');
        });
        this.classList.add('active');
        renderMap(filteredConflicts);
      });
    });

    q('#acd-event-type').addEventListener('change', function () {
      filters.eventType = this.value;
      renderEvents(getSpotlightConflict());
    });

    q('#acd-event-scope').addEventListener('change', function () {
      filters.eventScope = this.value;
      renderEvents(getSpotlightConflict());
    });

    q('#acd-fatal-toggle').addEventListener('click', function () {
      filters.fatalOnly = !filters.fatalOnly;
      updateToggleStates();
      renderEvents(getSpotlightConflict());
    });
  }

  async function loadAll() {
    try {
      var responses = await Promise.all([
        fetch(apiUrl('/api/stats')),
        fetch(apiUrl('/api/conflicts')),
        fetch(apiUrl('/api/events/recent'))
      ]);

      allConflicts = [];
      recentEvents = [];
      buildConflictLookup(allConflicts);
      populateRegionFilter(allConflicts);

      if (responses[1].ok) {
        var conflictsJson = await responses[1].json();
        allConflicts = conflictsJson.data || [];
        buildConflictLookup(allConflicts);
        populateRegionFilter(allConflicts);
      }

      if (responses[0].ok) {
        var statsJson = await responses[0].json();
        renderKPIs(statsJson.data || computeFallbackStats(allConflicts));
      } else {
        renderKPIs(computeFallbackStats(allConflicts));
      }

      if (responses[2].ok) {
        var eventsJson = await responses[2].json();
        recentEvents = eventsJson.data || [];
      }

      updateRiskButtons();
      updateToggleStates();
      applyDashboardFilters();
    } catch (err) {
      console.error('[AfroConflict]', err);
      allConflicts = [];
      filteredConflicts = [];
      recentEvents = [];
      spotlightSlug = '';
      buildConflictLookup(allConflicts);
      populateRegionFilter(allConflicts);
      renderKPIs(computeFallbackStats(allConflicts));
      renderHeroSummary(null);
      renderHeroSignals();
      renderActiveFilters();
      q('#acd-briefing-card').innerHTML = '<div class="acd-empty"><div class="acd-empty-icon">⚠️</div><div class="acd-empty-title">We could not load the live dashboard feed.</div></div>';
      q('#acd-focus-card').innerHTML = '<div class="acd-empty"><div class="acd-empty-title">Please refresh to retry.</div></div>';
      q('#acd-top-list').innerHTML = '<div class="acd-empty"><div class="acd-empty-title">Conflict watchlist unavailable.</div></div>';
      q('#acd-events-feed').innerHTML = '<div class="acd-empty"><div class="acd-empty-title">Event feed unavailable.</div></div>';
      renderBriefingCard(null);
      renderFocusCard(null);
      renderWatchlist([], null);
      renderSignalBoard([]);
      renderEvents(null);
      renderMap([]);
      q('#acd-hero-statline').textContent = 'Live dashboard feed unavailable. Refresh to retry.';
      q('#acd-active-filters').innerHTML = '<span class="acd-filter-hint">Live dashboard feed unavailable.</span>';
      q('#acd-watchlist-count').textContent = 'Unavailable';
      q('#acd-events-meta').textContent = 'Event feed unavailable.';
      q('#acd-map-status').textContent = 'Live feed unavailable.';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    AfroConflict.init();
    setupControls();
    loadAll();

    setInterval(function () {
      if (!document.hidden) loadAll();
    }, 300000);
  });

})();
