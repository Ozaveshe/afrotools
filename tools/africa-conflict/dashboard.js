(function () {
  'use strict';

  let map = null;
  let markerLayer = null;
  let allConflicts = [];
  let filteredConflicts = [];
  let recentEvents = [];
  let selectedSlug = '';
  let currentLayer = 'all';
  let conflictById = {};

  const riskOrder = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    minimal: 4
  };

  const regionLabels = {
    'east-africa': 'East Africa',
    'west-africa': 'West Africa',
    'north-africa': 'North Africa',
    'central-africa': 'Central Africa',
    'southern-africa': 'Southern Africa',
    sahel: 'Sahel',
    'horn-of-africa': 'Horn of Africa'
  };

  const layerMeta = {
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

  const filters = {
    search: '',
    region: 'all',
    risk: 'all',
    african: true,
    eventType: '',
    eventScope: 'all',
    fatalOnly: false
  };

  const apiOrigin = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
    ? 'https://afrotools.com'
    : '';

  const kpiConfig = [
    { icon: 'conflicts', label: 'Active conflicts', key: 'active_conflicts', sub: 'ACLED / Manual', color: '#dc2626' },
    { icon: 'displaced', label: 'Total displaced', key: 'total_displaced', sub: 'UNHCR', color: '#ea580c', formatter: AfroConflict.formatNumber },
    { icon: 'fatalities', label: 'Est. fatalities', key: 'fatalities', sub: 'UCDP / ACLED', color: '#dc2626', formatter: null },
    { icon: 'spend', label: 'Military spend / yr', key: 'military_spend_usd_m', sub: 'SIPRI / Manual', color: '#d97706', formatter: AfroConflict.formatCurrency },
    { icon: 'loss', label: 'Est. economic loss', key: 'economic_loss_max_usd_b', sub: 'World Bank / Manual', color: '#ca8a04', formatter: function (value) { return 'USD ' + Number(value || 0).toFixed(1) + 'B+'; } },
    { icon: 'risk', label: 'Critical risk', key: 'critical_risk_count', sub: 'AfroConflict', color: '#dc2626' },
    { icon: 'spillover', label: 'Spillover threats', key: 'spillover_threat_countries', sub: 'AfroConflict', color: '#0f766e', formatter: function (value) { return value + ' countries'; } },
    { icon: 'escalation', label: 'New escalations', key: 'new_escalations_30d', sub: 'Recent 30d', color: '#2563eb' }
  ];

  const eventIconMap = {
    battle: 'crosshair',
    airstrike: 'air',
    explosion_remote: 'burst',
    protest: 'waves',
    riot: 'flame',
    violence_against_civilians: 'shield',
    strategic_development: 'compass',
    agreement: 'handshake',
    ceasefire_violation: 'alert',
    displacement_event: 'route'
  };

  const svgIcons = {
    conflicts: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"></path><path d="M4 12h16"></path><path d="M4 17h10"></path></svg>',
    displaced: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="2.5"></circle><path d="M6 19c4-7 8-7 12 0"></path></svg>',
    fatalities: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 20 19H4z"></path><path d="M12 10v4"></path><path d="M12 16h.01"></path></svg>',
    spend: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V11"></path><path d="M12 19V7"></path><path d="M19 19V4"></path></svg>',
    loss: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"></path><path d="m6 10 4 4 4-4 4 4"></path></svg>',
    risk: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l2-4 4 8 2-4h6"></path></svg>',
    spillover: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16"></path><path d="m6 10 6-6 6 6"></path><path d="m6 14 6 6 6-6"></path></svg>',
    escalation: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7"></path><path d="M10 7h7v7"></path></svg>',
    crosshair: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><path d="M12 3v3"></path><path d="M12 18v3"></path><path d="M3 12h3"></path><path d="M18 12h3"></path></svg>',
    air: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 13 8-2 4-6 2 1-2 6 6 2-1 2-6-1-3 4-1-1 1-4-4-1z"></path></svg>',
    burst: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.2 5.3L20 10l-4.2 3.2L17 19l-5-3-5 3 1.2-5.8L4 10l5.8-1.7z"></path></svg>',
    waves: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="9" r="2"></circle><circle cx="15" cy="8" r="2"></circle><path d="M5 18c1.5-2 3.5-3 7-3s5.5 1 7 3"></path></svg>',
    flame: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4c2 3 4 4.5 4 8a4 4 0 1 1-8 0c0-2 1-3.5 4-8z"></path></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4 7 3v5c0 5-3.5 7.5-7 8-3.5-.5-7-3-7-8V7z"></path></svg>',
    compass: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="m15.5 8.5-2 7-5 2 2-7z"></path></svg>',
    handshake: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 12 2 2 4-4"></path><path d="m6 13-2-2 3-3h4"></path><path d="m18 11 2 2-3 3h-4"></path></svg>',
    alert: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 20 19H4z"></path><path d="M12 10v4"></path><path d="M12 16h.01"></path></svg>',
    route: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="18" r="1.5"></circle><circle cx="12" cy="6" r="1.5"></circle><circle cx="18" cy="18" r="1.5"></circle><path d="m7.5 16.5 3.3-8.1"></path><path d="m13.2 8.4 3.3 8.1"></path></svg>'
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return document.querySelectorAll(selector);
  }

  function api(path) {
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

  function titleize(value) {
    return String(value || '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, function (match) {
        return match.toUpperCase();
      });
  }

  function lower(value) {
    return String(value || '').toLowerCase();
  }

  function truncate(value, maxLength) {
    const text = String(value || '').trim();
    if (!text) {
      return '';
    }

    return text.length <= maxLength ? text : text.slice(0, Math.max(0, maxLength - 3)).trim() + '...';
  }

  function renderIcon(name, sizeClass) {
    const icon = svgIcons[name] || svgIcons.compass;
    const className = sizeClass ? 'acd-inline-icon ' + sizeClass : 'acd-inline-icon';
    return '<span class="' + className + '" aria-hidden="true">' + icon + '</span>';
  }

  function countryMarkText(country) {
    const text = String(country || '').trim();
    if (!text) {
      return 'AF';
    }

    if (/^[A-Za-z]{2}$/.test(text)) {
      return text.toUpperCase();
    }

    const initials = text.split(/\s+/).map(function (part) { return part[0]; }).filter(Boolean).slice(0, 2).join('');
    return (initials || text.slice(0, 2)).toUpperCase();
  }

  function renderCountryMark(country) {
    const label = countryMarkText(country);
    const aria = escapeHtml(country || 'Africa');
    return '<span class="acd-country-mark" role="img" aria-label="' + aria + '">' + escapeHtml(label) + '</span>';
  }

  function totalDisplaced(conflict) {
    return (Number(conflict.idps_count) || 0) + (Number(conflict.refugees_count) || 0);
  }

  function conflictDuration(conflict) {
    if (conflict.duration_days) {
      return AfroConflict.formatDuration(conflict.duration_days);
    }

    if (!conflict.start_date) {
      return '--';
    }

    const start = new Date(conflict.start_date);
    if (isNaN(start.getTime())) {
      return '--';
    }

    const days = Math.max(1, Math.round((Date.now() - start.getTime()) / 86400000));
    return AfroConflict.formatDuration(days);
  }

  function riskValue(risk) {
    return Object.prototype.hasOwnProperty.call(riskOrder, risk) ? riskOrder[risk] : 5;
  }

  function hasSpillover(conflict) {
    return (conflict.spillover_countries || []).length > 0 || riskValue(conflict.spillover_risk) <= 2;
  }

  function conflictName(conflict) {
    return conflict.short_name || conflict.name || 'Unnamed conflict';
  }

  function conflictSummary(conflict) {
    return conflict.summary || conflict.why_persists || conflict.peace_efforts || '';
  }

  function economicLossLabel(conflict) {
    if (!conflict.economic_loss_max_usd_b) {
      return '--';
    }

    if (conflict.economic_loss_min_usd_b) {
      return 'USD ' + conflict.economic_loss_min_usd_b + '-' + conflict.economic_loss_max_usd_b + 'B';
    }

    return 'USD ' + conflict.economic_loss_max_usd_b + 'B';
  }

  function buildConflictIndex(conflicts) {
    conflictById = {};
    conflicts.forEach(function (conflict) {
      if (conflict.id) {
        conflictById[conflict.id] = conflict;
      }
    });
  }

  function aggregateStats(conflicts) {
    const stats = {
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
    const spilloverCountries = {};

    conflicts.forEach(function (conflict) {
      if (!conflict.is_african) {
        return;
      }

      stats.active_conflicts += 1;
      stats.total_displaced += totalDisplaced(conflict);
      stats.fatalities_min += Number(conflict.fatalities_min) || 0;
      stats.fatalities_max += Number(conflict.fatalities_max) || 0;
      stats.military_spend_usd_m += Number(conflict.military_spend_usd_m) || 0;
      stats.economic_loss_max_usd_b += Number(conflict.economic_loss_max_usd_b) || 0;

      if (conflict.escalation_risk === 'critical') {
        stats.critical_risk_count += 1;
      }

      (conflict.spillover_countries || []).forEach(function (country) {
        spilloverCountries[country] = true;
      });

      if (conflict.status === 'escalating') {
        stats.new_escalations_30d += 1;
      }
    });

    stats.spillover_threat_countries = Object.keys(spilloverCountries).length;
    return stats;
  }

  function renderEmptyState(mark, title) {
    return '<div class="acd-empty"><div class="acd-empty-mark">' + escapeHtml(mark) + '</div><div class="acd-empty-title">' + escapeHtml(title) + '</div></div>';
  }

  function renderKpis(stats) {
    const container = $('#acd-kpi-row');
    if (!container) {
      return;
    }

    const resolvedStats = stats || aggregateStats(allConflicts);
    container.innerHTML = kpiConfig.map(function (card) {
      let value;

      if (card.key === 'fatalities') {
        value = AfroConflict.formatRange(resolvedStats.fatalities_min, resolvedStats.fatalities_max);
      } else if (card.formatter) {
        value = card.formatter(resolvedStats[card.key]);
      } else {
        value = resolvedStats[card.key];
      }

      return [
        '<article class="acd-kpi-card" data-color="' + escapeHtml(card.color) + '">',
        '<div class="acd-kpi-icon">' + renderIcon(card.icon) + '</div>',
        '<div class="acd-kpi-value">' + escapeHtml(value) + '</div>',
        '<div class="acd-kpi-label">' + escapeHtml(card.label) + '</div>',
        '<div class="acd-kpi-sub">' + escapeHtml(card.sub) + '</div>',
        '</article>'
      ].join('');
    }).join('');
  }

  function renderRegionFilterOptions(conflicts) {
    const select = $('#acd-region-filter');
    if (!select) {
      return;
    }

    const counts = {};
    conflicts.forEach(function (conflict) {
      (conflict.regions || []).forEach(function (region) {
        counts[region] = (counts[region] || 0) + 1;
      });
    });

    const regions = Object.keys(counts).sort(function (left, right) {
      return (regionLabels[left] || titleize(left)).localeCompare(regionLabels[right] || titleize(right));
    });

    select.innerHTML = '<option value="all">All regions</option>' + regions.map(function (region) {
      const label = regionLabels[region] || titleize(region);
      return '<option value="' + escapeHtml(region) + '">' + escapeHtml(label + ' (' + counts[region] + ')') + '</option>';
    }).join('');
    select.value = filters.region;
  }

  function getFilteredConflicts() {
    const search = lower(filters.search);

    return allConflicts
      .filter(function (conflict) {
        if (filters.african && !conflict.is_african) {
          return false;
        }

        if (filters.region !== 'all' && !(conflict.regions || []).includes(filters.region)) {
          return false;
        }

        if (filters.risk !== 'all' && conflict.escalation_risk !== filters.risk) {
          return false;
        }

        if (!search) {
          return true;
        }

        const haystack = [
          conflict.name,
          conflict.short_name,
          conflict.primary_country,
          (conflict.countries_involved || []).join(' '),
          (conflict.regions || []).join(' '),
          conflict.summary
        ].join(' ');

        return lower(haystack).indexOf(search) !== -1;
      })
      .slice()
      .sort(function (left, right) {
        const riskDifference = riskValue(left.escalation_risk) - riskValue(right.escalation_risk);
        if (riskDifference !== 0) {
          return riskDifference;
        }

        return (Number(right.fatalities_max) || 0) - (Number(left.fatalities_max) || 0);
      });
  }

  function getCurrentConflict() {
    return filteredConflicts.find(function (conflict) {
      return conflict.slug === selectedSlug;
    }) || filteredConflicts[0] || null;
  }

  function syncCurrentConflict() {
    const conflict = getCurrentConflict();
    selectedSlug = conflict ? conflict.slug : '';
    return conflict;
  }

  function renderHeroStatline(currentConflict) {
    const statline = $('#acd-hero-statline');
    if (!statline) {
      return;
    }

    if (!filteredConflicts.length) {
      statline.textContent = 'No conflicts match the current filter set.';
      return;
    }

    const urgentCount = filteredConflicts.filter(function (conflict) {
      return riskValue(conflict.escalation_risk) <= 1;
    }).length;

    const displaced = filteredConflicts.reduce(function (sum, conflict) {
      return sum + totalDisplaced(conflict);
    }, 0);

    const regionCount = {};
    filteredConflicts.forEach(function (conflict) {
      (conflict.regions || []).forEach(function (region) {
        regionCount[region] = true;
      });
    });

    const parts = [
      filteredConflicts.length + ' conflicts in scope',
      urgentCount + ' critical/high urgency',
      AfroConflict.formatNumber(displaced) + ' displaced across this filter'
    ];

    if (currentConflict) {
      parts.push('focus: ' + conflictName(currentConflict));
    }

    if (Object.keys(regionCount).length) {
      parts.push(Object.keys(regionCount).length + ' regions');
    }

    statline.textContent = parts.join(' | ');
  }

  function renderHeroChip(label, value) {
    return '<div class="acd-hero-chip"><span class="acd-hero-chip-label">' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></div>';
  }

  function renderHeroChips() {
    const container = $('#acd-hero-chips');
    if (!container) {
      return;
    }

    if (!filteredConflicts.length) {
      container.innerHTML = '';
      return;
    }

    const priorityConflict = filteredConflicts[0];
    const mostDisplaced = filteredConflicts.slice().sort(function (left, right) {
      return totalDisplaced(right) - totalDisplaced(left);
    })[0];
    const spilloverCount = filteredConflicts.filter(hasSpillover).length;
    const eventFeedLabel = recentEvents.length ? recentEvents.length + ' recent records' : 'Awaiting sync';

    container.innerHTML = [
      renderHeroChip('Priority', conflictName(priorityConflict)),
      renderHeroChip('Most displaced', countryMarkText(mostDisplaced.primary_country) + ' - ' + AfroConflict.formatNumber(totalDisplaced(mostDisplaced))),
      renderHeroChip('Spillover active', spilloverCount + ' theatres'),
      renderHeroChip('Event feed', eventFeedLabel)
    ].join('');
  }

  function renderActiveFilters() {
    const container = $('#acd-active-filters');
    if (!container) {
      return;
    }

    const tags = [];
    if (filters.search) {
      tags.push('Search: ' + filters.search);
    }

    if (filters.region !== 'all') {
      tags.push('Region: ' + (regionLabels[filters.region] || titleize(filters.region)));
    }

    if (filters.risk !== 'all') {
      tags.push('Risk: ' + titleize(filters.risk));
    }

    if (!filters.african) {
      tags.push('Global impact included');
    }

    if (!tags.length) {
      container.innerHTML = '<span class="acd-filter-hint">All African conflicts are in scope. Use the map or watchlist to pin a live briefing.</span>';
      return;
    }

    container.innerHTML = tags.map(function (tag) {
      return '<span class="acd-filter-tag">' + escapeHtml(tag) + '</span>';
    }).join('');
  }

  function renderBriefingStat(label, value) {
    return '<div class="acd-briefing-stat"><span class="acd-briefing-stat-label">' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></div>';
  }

  function renderBriefingCard(conflict) {
    const card = $('#acd-briefing-card');
    if (!card) {
      return;
    }

    if (!conflict) {
      card.innerHTML = renderEmptyState('BRF', 'No live briefing is available for this filter.');
      return;
    }

    const summary = truncate(conflictSummary(conflict), 210) || 'No analyst summary entered yet for this conflict.';
    const spilloverCount = (conflict.spillover_countries || []).length;

    card.innerHTML = [
      '<div class="acd-briefing-overline">Live briefing</div>',
      '<div class="acd-briefing-title-row">',
      '<h2 class="acd-briefing-title">' + escapeHtml(conflictName(conflict)) + '</h2>',
      AfroConflict.riskBadge(conflict.escalation_risk, ''),
      '</div>',
      '<div class="acd-briefing-meta">',
      AfroConflict.statusBadge(conflict.status),
      '<span>' + renderCountryMark(conflict.primary_country) + ' ' + escapeHtml(conflict.primary_country || 'Primary theatre') + '</span>',
      '<span>' + escapeHtml(conflictDuration(conflict)) + '</span>',
      '</div>',
      '<p class="acd-briefing-summary">' + escapeHtml(summary) + '</p>',
      '<div class="acd-briefing-stats">',
      renderBriefingStat('Fatalities', AfroConflict.formatRange(conflict.fatalities_min, conflict.fatalities_max)),
      renderBriefingStat('Displaced', AfroConflict.formatNumber(totalDisplaced(conflict))),
      renderBriefingStat('Spillover', spilloverCount ? spilloverCount + ' states' : 'Contained'),
      '</div>',
      '<div class="acd-briefing-links">',
      '<button class="acd-btn acd-btn-primary" type="button" data-center-map="' + escapeHtml(conflict.slug) + '">Center on map</button>',
      '<a class="acd-btn acd-btn-outline" href="/tools/africa-conflict/detail.html?id=' + encodeURIComponent(conflict.slug) + '">Open dossier</a>',
      '</div>'
    ].join('');

    const centerButton = card.querySelector('[data-center-map]');
    if (centerButton) {
      centerButton.addEventListener('click', function () {
        centerMap(conflict);
      });
    }
  }

  function renderFocusMetric(label, value) {
    return '<div class="acd-focus-metric"><span>' + escapeHtml(label) + '</span><strong>' + value + '</strong></div>';
  }

  function renderFocusCard(conflict) {
    const card = $('#acd-focus-card');
    if (!card) {
      return;
    }

    if (!conflict) {
      card.innerHTML = renderEmptyState('PIN', 'Select a conflict to open a live briefing.');
      return;
    }

    const triggerTags = (conflict.key_triggers || []).slice(0, 4).map(function (trigger) {
      return '<span class="acd-tag">' + escapeHtml(titleize(trigger)) + '</span>';
    }).join('');

    const economyTags = (conflict.resource_links || []).slice(0, 4).map(function (resource) {
      return '<span class="acd-tag">' + escapeHtml(titleize(resource)) + '</span>';
    }).join('');

    const spilloverMark = (conflict.spillover_countries || []).map(function (country) {
      return countryMarkText(country);
    }).join(', ');

    card.innerHTML = [
      '<div class="acd-focus-overline">Selected conflict</div>',
      '<div class="acd-focus-header">',
      '<div>',
      '<h2 class="acd-focus-title">' + escapeHtml(conflictName(conflict)) + '</h2>',
      '<div class="acd-focus-meta">',
      AfroConflict.statusBadge(conflict.status),
      AfroConflict.riskBadge(conflict.escalation_risk, 'Escalation'),
      AfroConflict.riskBadge(conflict.spillover_risk, 'Spillover'),
      '</div>',
      '</div>',
      '<a class="acd-card-link" href="/tools/africa-conflict/detail.html?id=' + encodeURIComponent(conflict.slug) + '">View intelligence -></a>',
      '</div>',
      '<div class="acd-focus-grid">',
      renderFocusMetric('Primary country', renderCountryMark(conflict.primary_country) + ' ' + escapeHtml(conflict.primary_country || '--')),
      renderFocusMetric('Displaced', escapeHtml(AfroConflict.formatNumber(totalDisplaced(conflict)))),
      renderFocusMetric('Fatalities', escapeHtml(AfroConflict.formatRange(conflict.fatalities_min, conflict.fatalities_max))),
      renderFocusMetric('Economic loss', escapeHtml(economicLossLabel(conflict))),
      '</div>',
      '<p class="acd-focus-summary">' + escapeHtml(truncate(conflict.why_persists || conflictSummary(conflict), 340) || 'Analyst summary is still being added for this dossier.') + '</p>',
      spilloverMark ? '<div class="acd-focus-strip"><span>Exposed neighbors</span><strong>' + escapeHtml(spilloverMark) + '</strong></div>' : '',
      triggerTags ? '<div class="acd-tag-list"><h3>Key triggers</h3><div class="acd-tags">' + triggerTags + '</div></div>' : '',
      economyTags ? '<div class="acd-tag-list"><h3>Conflict economy links</h3><div class="acd-tags">' + economyTags + '</div></div>' : ''
    ].join('');
  }

  function renderWatchlist(conflicts, currentConflict) {
    const list = $('#acd-top-list');
    const count = $('#acd-watchlist-count');

    if (!list) {
      return;
    }

    if (!conflicts.length) {
      list.innerHTML = renderEmptyState('LIST', 'No conflicts match these filters.');
      if (count) {
        count.textContent = '0 in scope';
      }
      return;
    }

    const visibleConflicts = conflicts.slice(0, 8);
    if (count) {
      count.textContent = conflicts.length + ' in scope';
    }

    list.innerHTML = visibleConflicts.map(function (conflict) {
      return [
        '<button class="acd-conflict-row' + (currentConflict && currentConflict.slug === conflict.slug ? ' is-active' : '') + '" data-slug="' + escapeHtml(conflict.slug) + '" type="button">',
        '<div class="acd-row-topline">',
        '<span class="acd-row-risk-dot" style="background:' + (AfroConflict.CONFIG.riskColors[conflict.escalation_risk] || '#6b7280') + '"></span>',
        '<span class="acd-row-name">' + renderCountryMark(conflict.primary_country) + '<span class="acd-row-name-text">' + escapeHtml(conflictName(conflict)) + '</span></span>',
        '</div>',
        '<div class="acd-row-meta">',
        AfroConflict.statusBadge(conflict.status),
        '<span class="acd-row-meta-text">' + escapeHtml(conflictDuration(conflict)) + '</span>',
        '</div>',
        '<div class="acd-row-metrics">',
        '<span>' + renderIcon('fatalities', 'acd-inline-icon--sm') + escapeHtml(AfroConflict.formatRange(conflict.fatalities_min, conflict.fatalities_max)) + '</span>',
        '<span>' + renderIcon('displaced', 'acd-inline-icon--sm') + escapeHtml(AfroConflict.formatNumber(totalDisplaced(conflict))) + '</span>',
        '</div>',
        '</button>'
      ].join('');
    }).join('');

    $$('.acd-conflict-row').forEach(function (row) {
      row.addEventListener('click', function () {
        selectConflict(this.getAttribute('data-slug'), true);
      });
    });
  }

  function renderSignalMetric(label, value, className) {
    return '<div class="acd-signal-metric"><span>' + escapeHtml(label) + '</span><strong class="' + escapeHtml(className || '') + '">' + escapeHtml(value) + '</strong></div>';
  }

  function renderSignalBoard(conflicts) {
    const summary = $('#acd-signal-summary');
    const riskMix = $('#acd-risk-mix');
    const regionPressure = $('#acd-region-pressure');

    if (!summary || !riskMix || !regionPressure) {
      return;
    }

    if (!conflicts.length) {
      summary.innerHTML = renderEmptyState('SIG', 'No signal mix exists for the current filter.');
      riskMix.innerHTML = '';
      regionPressure.innerHTML = '';
      return;
    }

    const resourceLinked = conflicts.filter(function (conflict) {
      return conflict.resource_links && conflict.resource_links.length;
    }).length;
    const climateLinked = conflicts.filter(function (conflict) {
      return conflict.climate_link;
    }).length;
    const foodLinked = conflicts.filter(function (conflict) {
      return conflict.food_insecurity_link;
    }).length;
    const spilloverActive = conflicts.filter(hasSpillover).length;
    const averageDisplaced = Math.round(conflicts.reduce(function (sum, conflict) {
      return sum + totalDisplaced(conflict);
    }, 0) / Math.max(1, conflicts.length));

    summary.innerHTML = [
      renderSignalMetric('High urgency', conflicts.filter(function (conflict) { return riskValue(conflict.escalation_risk) <= 1; }).length + ' theatres', 'tone-critical'),
      renderSignalMetric('Resource-linked', resourceLinked + ' dossiers'),
      renderSignalMetric('Climate-linked', climateLinked + ' dossiers'),
      renderSignalMetric('Food insecurity link', foodLinked + ' dossiers'),
      renderSignalMetric('Spillover active', spilloverActive + ' theatres', 'tone-warning'),
      renderSignalMetric('Average displaced', AfroConflict.formatNumber(averageDisplaced))
    ].join('');

    const riskCounts = { critical: 0, high: 0, medium: 0, low: 0, minimal: 0 };
    conflicts.forEach(function (conflict) {
      const risk = conflict.escalation_risk || 'minimal';
      if (!Object.prototype.hasOwnProperty.call(riskCounts, risk)) {
        riskCounts[risk] = 0;
      }
      riskCounts[risk] += 1;
    });

    riskMix.innerHTML = ['critical', 'high', 'medium', 'low', 'minimal'].map(function (risk) {
      const count = riskCounts[risk] || 0;
      const width = Math.max(4, Math.round((count / conflicts.length) * 100));
      const color = AfroConflict.CONFIG.riskColors[risk] || '#6b7280';
      return '<div class="acd-bar-row"><div class="acd-bar-label"><span>' + escapeHtml(titleize(risk)) + '</span><strong>' + count + '</strong></div><div class="acd-bar-track"><div class="acd-bar-fill" style="width:' + width + '%;background:' + color + '"></div></div></div>';
    }).join('');

    const regionSummary = {};
    conflicts.forEach(function (conflict) {
      const regions = conflict.regions && conflict.regions.length ? conflict.regions : ['unclassified'];
      regions.forEach(function (region) {
        if (!regionSummary[region]) {
          regionSummary[region] = { count: 0, displaced: 0, critical: 0 };
        }
        regionSummary[region].count += 1;
        regionSummary[region].displaced += totalDisplaced(conflict);
        if (riskValue(conflict.escalation_risk) <= 1) {
          regionSummary[region].critical += 1;
        }
      });
    });

    regionPressure.innerHTML = Object.keys(regionSummary)
      .sort(function (left, right) {
        return regionSummary[right].count - regionSummary[left].count;
      })
      .slice(0, 6)
      .map(function (region) {
        const metrics = regionSummary[region];
        return '<div class="acd-region-row"><div><strong>' + escapeHtml(regionLabels[region] || titleize(region)) + '</strong><span>' + metrics.count + ' conflicts - ' + metrics.critical + ' high urgency</span></div><div class="acd-region-metric">' + escapeHtml(AfroConflict.formatNumber(metrics.displaced)) + '</div></div>';
      }).join('');
  }

  function resolveEventConflict(eventRecord) {
    if (eventRecord.conflict_id && conflictById[eventRecord.conflict_id]) {
      return conflictById[eventRecord.conflict_id];
    }

    if (eventRecord.ac_conflicts && eventRecord.ac_conflicts.id && conflictById[eventRecord.ac_conflicts.id]) {
      return conflictById[eventRecord.ac_conflicts.id];
    }

    return eventRecord.ac_conflicts || null;
  }

  function renderEventFeed(currentConflict) {
    const feed = $('#acd-events-feed');
    const meta = $('#acd-events-meta');
    const panel = $('.acd-events-panel');

    if (!feed || !meta) {
      return;
    }

    if (!recentEvents.length) {
      if (panel) {
        panel.classList.add('is-empty');
      }
      meta.textContent = 'Recent event data is still populating.';
      feed.innerHTML = renderEmptyState('EVT', 'No recent event stream is available yet.');
      return;
    }

    const events = recentEvents
      .filter(function (eventRecord) {
        if (filters.eventType && eventRecord.event_type !== filters.eventType) {
          return false;
        }

        if (filters.fatalOnly && !(Number(eventRecord.fatalities) > 0)) {
          return false;
        }

        if (filters.eventScope === 'selected' && currentConflict) {
          const relatedConflict = resolveEventConflict(eventRecord);
          if (!relatedConflict) {
            return false;
          }

          if (eventRecord.conflict_id && currentConflict.id) {
            return eventRecord.conflict_id === currentConflict.id;
          }

          return relatedConflict.slug === currentConflict.slug;
        }

        return true;
      })
      .sort(function (left, right) {
        return new Date(right.event_date) - new Date(left.event_date);
      });

    if (panel) {
      panel.classList.remove('is-empty');
    }

    meta.textContent = events.length + ' events shown' + (filters.eventScope === 'selected' && currentConflict ? ' for ' + conflictName(currentConflict) : '') + '.';

    if (!events.length) {
      feed.innerHTML = renderEmptyState('EVT', 'No events match the current event filters.');
      return;
    }

    feed.innerHTML = events.slice(0, 10).map(function (eventRecord) {
      const relatedConflict = resolveEventConflict(eventRecord);
      const eventIcon = eventIconMap[eventRecord.event_type] || 'compass';
      const actors = [eventRecord.actor1, eventRecord.actor2].filter(Boolean).join(' vs ');
      const focusButton = relatedConflict && relatedConflict.slug
        ? '<button class="acd-event-action" type="button" data-event-focus="' + escapeHtml(relatedConflict.slug) + '">Pin briefing</button>'
        : '';

      return [
        '<article class="acd-event-card">',
        '<div class="acd-event-card-top">',
        '<div class="acd-event-pill">' + renderIcon(eventIcon, 'acd-inline-icon--sm') + escapeHtml(titleize(eventRecord.event_type || 'event')) + '</div>',
        '<div class="acd-event-date">' + escapeHtml(AfroConflict.formatDate(eventRecord.event_date)) + '</div>',
        '</div>',
        '<h3 class="acd-event-location">' + escapeHtml(eventRecord.location || 'Location not specified') + '</h3>',
        '<div class="acd-event-conflict">' + (relatedConflict
          ? renderCountryMark(relatedConflict.primary_country) + '<span>' + escapeHtml(conflictName(relatedConflict)) + '</span>'
          : '<span>Unmatched conflict record</span>') + '</div>',
        actors ? '<p class="acd-event-actors">' + escapeHtml(actors) + '</p>' : '',
        '<div class="acd-event-footer"><span>' + (Number(eventRecord.fatalities) > 0 ? 'Fatalities reported: ' + escapeHtml(String(eventRecord.fatalities)) : 'No fatality count reported') + '</span>' + focusButton + '</div>',
        '</article>'
      ].join('');
    }).join('');

    $$('[data-event-focus]').forEach(function (button) {
      button.addEventListener('click', function () {
        selectConflict(this.getAttribute('data-event-focus'), true);
      });
    });
  }

  function markerRadius(conflict) {
    const baseValue = currentLayer === 'displacement'
      ? totalDisplaced(conflict)
      : currentLayer === 'spillover'
        ? Math.max(350000 * (conflict.spillover_countries || []).length, Number(conflict.fatalities_max) || 0)
        : Number(conflict.fatalities_max) || Number(conflict.fatalities_min) || 0;

    if (currentLayer === 'displacement') {
      return Math.min(34, Math.max(8, 8 * Math.sqrt(baseValue / 200000)));
    }

    if (currentLayer === 'spillover') {
      return Math.min(28, Math.max(9, 3 * (conflict.spillover_countries || []).length + 8));
    }

    if (currentLayer === 'density') {
      return Math.min(30, Math.max(7, 6 * Math.sqrt(baseValue / 1200)));
    }

    return Math.min(24, Math.max(6, 5 * Math.sqrt(baseValue / 1200)));
  }

  function renderMap(conflicts) {
    const mapStatus = $('#acd-map-status');
    const mapFootnote = $('#acd-map-footnote');
    const visibleConflicts = conflicts.filter(function (conflict) {
      return conflict.lat && conflict.lng && (currentLayer !== 'spillover' || hasSpillover(conflict));
    });
    const currentConflict = getCurrentConflict();

    if (mapFootnote) {
      mapFootnote.textContent = layerMeta[currentLayer].footnote;
    }

    if (typeof L === 'undefined') {
      if (mapStatus) {
        mapStatus.textContent = 'Leaflet failed to load.';
      }
      $('#acd-map').innerHTML = renderEmptyState('MAP', 'The map library did not load.');
      return;
    }

    if (!map) {
      map = AfroConflict.renderMap('acd-map', [], { center: [4, 18], zoom: 3 });
      markerLayer = L.layerGroup().addTo(map);
      window.setTimeout(function () {
        if (map) {
          map.invalidateSize();
        }
      }, 100);
    }

    if (!markerLayer) {
      return;
    }

    markerLayer.clearLayers();
    if (mapStatus) {
      mapStatus.textContent = visibleConflicts.length + ' mapped - ' + layerMeta[currentLayer].label;
    }

    visibleConflicts.forEach(function (conflict) {
      const isSelected = currentConflict && currentConflict.slug === conflict.slug;
      let fillColor = AfroConflict.CONFIG.riskColors[conflict.escalation_risk] || '#6b7280';
      let strokeColor = fillColor;
      let fillOpacity = currentLayer === 'density' ? 0.2 : 0.45;
      let dashArray = null;

      if (currentLayer === 'displacement') {
        fillColor = '#38bdf8';
        strokeColor = '#0ea5e9';
        fillOpacity = isSelected ? 0.55 : 0.32;
      }

      if (currentLayer === 'spillover') {
        fillColor = AfroConflict.CONFIG.riskColors[conflict.spillover_risk] || fillColor;
        strokeColor = fillColor;
        fillOpacity = isSelected ? 0.4 : 0.16;
        dashArray = '6 4';
      }

      const marker = L.circleMarker([conflict.lat, conflict.lng], {
        radius: markerRadius(conflict),
        fillColor: fillColor,
        color: strokeColor,
        weight: isSelected ? 3 : 1.5,
        opacity: 0.95,
        fillOpacity: fillOpacity,
        dashArray: dashArray
      });

      marker.bindPopup([
        '<div class="acd-map-popup">',
        '<div class="acd-mp-header">' + renderCountryMark(conflict.primary_country) + '<strong>' + escapeHtml(conflictName(conflict)) + '</strong></div>',
        '<div class="acd-mp-badges">' + AfroConflict.statusBadge(conflict.status) + AfroConflict.riskBadge(conflict.escalation_risk, 'Risk') + '</div>',
        '<div class="acd-mp-stats">',
        '<div class="acd-map-popup-row"><span>Fatalities</span><strong>' + escapeHtml(AfroConflict.formatRange(conflict.fatalities_min, conflict.fatalities_max)) + '</strong></div>',
        '<div class="acd-map-popup-row"><span>Displaced</span><strong>' + escapeHtml(AfroConflict.formatNumber(totalDisplaced(conflict))) + '</strong></div>',
        '<div class="acd-map-popup-row"><span>Spillover</span><strong>' + escapeHtml((conflict.spillover_countries || []).length ? (conflict.spillover_countries || []).map(countryMarkText).join(', ') : 'Contained') + '</strong></div>',
        '</div>',
        '<a href="/tools/africa-conflict/detail.html?id=' + encodeURIComponent(conflict.slug) + '" class="acd-mp-link">View intelligence -></a>',
        '</div>'
      ].join(''));

      marker.on('click', function () {
        selectConflict(conflict.slug, false);
      });

      markerLayer.addLayer(marker);
    });
  }

  function centerMap(conflict) {
    if (map && conflict && conflict.lat && conflict.lng) {
      map.flyTo([conflict.lat, conflict.lng], Math.max(map.getZoom(), 4), { duration: 0.7 });
    }
  }

  function renderDashboard() {
    filteredConflicts = getFilteredConflicts();
    const currentConflict = syncCurrentConflict();

    renderHeroStatline(currentConflict);
    renderHeroChips();
    renderActiveFilters();
    renderBriefingCard(currentConflict);
    renderFocusCard(currentConflict);
    renderWatchlist(filteredConflicts, currentConflict);
    renderSignalBoard(filteredConflicts);
    renderEventFeed(currentConflict);
    renderMap(filteredConflicts);
  }

  function selectConflict(slug, shouldCenterMap) {
    selectedSlug = slug || '';
    const currentConflict = syncCurrentConflict();

    renderHeroStatline(currentConflict);
    renderHeroChips();
    renderBriefingCard(currentConflict);
    renderFocusCard(currentConflict);
    renderWatchlist(filteredConflicts, currentConflict);
    renderEventFeed(currentConflict);
    renderMap(filteredConflicts);

    if (shouldCenterMap && currentConflict) {
      centerMap(currentConflict);
    }
  }

  function syncRiskButtons() {
    $$('#acd-risk-pills .acd-filter-chip').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-risk') === filters.risk);
    });
  }

  function syncToggleButtons() {
    const africanToggle = $('#acd-african-toggle');
    const fatalToggle = $('#acd-fatal-toggle');

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

    $('#acd-search').value = '';
    $('#acd-region-filter').value = 'all';
    $('#acd-event-type').value = '';
    $('#acd-event-scope').value = 'all';

    syncRiskButtons();
    syncToggleButtons();
    renderDashboard();
  }

  async function loadDashboardData() {
    try {
      const responses = await Promise.all([
        fetch(api('/api/stats')),
        fetch(api('/api/conflicts')),
        fetch(api('/api/events/recent'))
      ]);

      recentEvents = [];
      buildConflictIndex(allConflicts = []);
      renderRegionFilterOptions(allConflicts);

      if (responses[1].ok) {
        const conflictsPayload = await responses[1].json();
        allConflicts = conflictsPayload.data || [];
        buildConflictIndex(allConflicts);
        renderRegionFilterOptions(allConflicts);
      }

      if (responses[0].ok) {
        const statsPayload = await responses[0].json();
        renderKpis(statsPayload.data || aggregateStats(allConflicts));
      } else {
        renderKpis(aggregateStats(allConflicts));
      }

      if (responses[2].ok) {
        const eventsPayload = await responses[2].json();
        recentEvents = eventsPayload.data || [];
      }

      syncRiskButtons();
      syncToggleButtons();
      renderDashboard();
    } catch (error) {
      console.error('[AfroConflict]', error);

      filteredConflicts = [];
      recentEvents = [];
      selectedSlug = '';
      buildConflictIndex(allConflicts = []);
      renderRegionFilterOptions(allConflicts);
      renderKpis(aggregateStats(allConflicts));
      renderHeroStatline(null);
      renderHeroChips();
      renderActiveFilters();
      renderBriefingCard(null);
      renderFocusCard(null);
      renderWatchlist([], null);
      renderSignalBoard([]);
      renderEventFeed(null);
      renderMap([]);

      $('#acd-hero-statline').textContent = 'Live dashboard feed unavailable. Refresh to retry.';
      $('#acd-active-filters').innerHTML = '<span class="acd-filter-hint">Live dashboard feed unavailable.</span>';

      const watchlistCount = $('#acd-watchlist-count');
      if (watchlistCount) {
        watchlistCount.textContent = 'Unavailable';
      }

      const eventsMeta = $('#acd-events-meta');
      if (eventsMeta) {
        eventsMeta.textContent = 'Event feed unavailable.';
      }

      const mapStatus = $('#acd-map-status');
      if (mapStatus) {
        mapStatus.textContent = 'Live feed unavailable.';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    AfroConflict.init();

    $('#acd-search').addEventListener('input', function () {
      filters.search = this.value.trim();
      renderDashboard();
    });

    $('#acd-region-filter').addEventListener('change', function () {
      filters.region = this.value;
      renderDashboard();
    });

    $$('#acd-risk-pills .acd-filter-chip').forEach(function (button) {
      button.addEventListener('click', function () {
        filters.risk = this.getAttribute('data-risk') || 'all';
        syncRiskButtons();
        renderDashboard();
      });
    });

    $('#acd-african-toggle').addEventListener('click', function () {
      filters.african = !filters.african;
      syncToggleButtons();
      renderDashboard();
    });

    $('#acd-reset-filters').addEventListener('click', resetFilters);

    $$('.acd-map-toggle').forEach(function (button) {
      button.addEventListener('click', function () {
        currentLayer = this.getAttribute('data-layer') || 'all';
        $$('.acd-map-toggle').forEach(function (toggle) {
          toggle.classList.remove('active');
        });
        this.classList.add('active');
        renderMap(filteredConflicts);
      });
    });

    $('#acd-event-type').addEventListener('change', function () {
      filters.eventType = this.value;
      renderEventFeed(getCurrentConflict());
    });

    $('#acd-event-scope').addEventListener('change', function () {
      filters.eventScope = this.value;
      renderEventFeed(getCurrentConflict());
    });

    $('#acd-fatal-toggle').addEventListener('click', function () {
      filters.fatalOnly = !filters.fatalOnly;
      syncToggleButtons();
      renderEventFeed(getCurrentConflict());
    });

    loadDashboardData();
    window.setInterval(function () {
      if (!document.hidden) {
        loadDashboardData();
      }
    }, 300000);
  });
}());
