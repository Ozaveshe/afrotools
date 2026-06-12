;(function () {
  'use strict';

  var state = {
    conflicts: [],
    events: [],
    previousSnapshot: null,
    loaded: false,
    timer: null
  };

  var riskOrder = { critical: 0, high: 1, medium: 2, low: 3, minimal: 4 };
  var regionLabels = {
    'east-africa': 'East Africa',
    'west-africa': 'West Africa',
    'north-africa': 'North Africa',
    'central-africa': 'Central Africa',
    'southern-africa': 'Southern Africa',
    sahel: 'Sahel',
    'horn-of-africa': 'Horn of Africa'
  };

  function $(id) {
    return document.getElementById(id);
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function apiPath(path) {
    var local = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return (local ? 'https://afrotools.com' : '') + path;
  }

  function title(value) {
    return String(value || '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, function (match) { return match.toUpperCase(); });
  }

  function norm(value) {
    return String(value || '').toLowerCase();
  }

  function fmtNumber(value) {
    var n = Number(value || 0);
    if (!n) return '0';
    if (window.AfroConflict && AfroConflict.formatNumber) return AfroConflict.formatNumber(n);
    return n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n.toLocaleString();
  }

  function fmtRange(min, max) {
    if (!Number(min || 0) && !Number(max || 0)) return '0';
    if (window.AfroConflict && AfroConflict.formatRange) return AfroConflict.formatRange(min, max);
    return fmtNumber(min) + '-' + fmtNumber(max);
  }

  function fmtDate(value) {
    if (!value) return '';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function displaced(conflict) {
    return Number(conflict.idps_count || 0) + Number(conflict.refugees_count || 0);
  }

  function riskScore(risk) {
    return Object.prototype.hasOwnProperty.call(riskOrder, risk) ? riskOrder[risk] : 5;
  }

  function hasSpillover(conflict) {
    return (conflict.spillover_countries || []).length > 0 || riskScore(conflict.spillover_risk) <= 2;
  }

  function currentFilters() {
    var search = $('acd-search');
    var region = $('acd-region-filter');
    var african = $('acd-african-toggle');
    var activeRisk = document.querySelector('#acd-risk-pills .acd-filter-chip.is-active');
    return {
      search: search ? search.value.trim() : '',
      region: region ? region.value : 'all',
      risk: activeRisk ? activeRisk.getAttribute('data-risk') || 'all' : 'all',
      african: african ? african.getAttribute('aria-pressed') !== 'false' : true
    };
  }

  function filterConflicts(filters) {
    var search = norm(filters.search);
    return state.conflicts.filter(function (conflict) {
      var searchable = [
        conflict.name,
        conflict.short_name,
        conflict.primary_country,
        (conflict.countries_involved || []).join(' '),
        (conflict.regions || []).join(' '),
        conflict.summary
      ].join(' ');
      if (filters.african && !conflict.is_african) return false;
      if (filters.region !== 'all' && !(conflict.regions || []).includes(filters.region)) return false;
      if (filters.risk !== 'all' && conflict.escalation_risk !== filters.risk) return false;
      if (search && norm(searchable).indexOf(search) === -1) return false;
      return true;
    });
  }

  function matchingEvents(conflicts) {
    var byId = {};
    var bySlug = {};
    conflicts.forEach(function (conflict) {
      if (conflict.id) byId[conflict.id] = true;
      if (conflict.slug) bySlug[conflict.slug] = true;
    });
    return state.events.filter(function (event) {
      if (event.conflict_id && byId[event.conflict_id]) return true;
      if (event.ac_conflicts && event.ac_conflicts.slug && bySlug[event.ac_conflicts.slug]) return true;
      return false;
    });
  }

  function latestSourceDate(conflicts, events) {
    var dates = [];
    conflicts.forEach(function (conflict) {
      ['fatalities_date', 'displacement_date'].forEach(function (key) {
        if (conflict[key]) dates.push(conflict[key]);
      });
    });
    events.forEach(function (event) {
      if (event.event_date) dates.push(event.event_date);
    });
    return dates
      .map(function (value) { return new Date(value); })
      .filter(function (date) { return !Number.isNaN(date.getTime()); })
      .sort(function (a, b) { return b - a; })[0] || null;
  }

  function makeSnapshot() {
    var filters = currentFilters();
    var conflicts = filterConflicts(filters);
    var events = matchingEvents(conflicts);
    var riskCounts = {};
    var spilloverCountries = {};
    var totals = {
      conflicts: conflicts.length,
      highUrgency: 0,
      displaced: 0,
      fatalitiesMin: 0,
      fatalitiesMax: 0,
      eventCount: events.length,
      eventFatalities: 0,
      spilloverTheatres: 0
    };
    conflicts.forEach(function (conflict) {
      var risk = conflict.escalation_risk || 'unknown';
      riskCounts[risk] = (riskCounts[risk] || 0) + 1;
      if (riskScore(risk) <= 1) totals.highUrgency += 1;
      totals.displaced += displaced(conflict);
      totals.fatalitiesMin += Number(conflict.fatalities_min || 0);
      totals.fatalitiesMax += Number(conflict.fatalities_max || 0);
      if (hasSpillover(conflict)) totals.spilloverTheatres += 1;
      (conflict.spillover_countries || []).forEach(function (country) {
        spilloverCountries[country] = true;
      });
    });
    events.forEach(function (event) {
      totals.eventFatalities += Number(event.fatalities || 0);
    });
    var topRisk = Object.keys(riskCounts).sort(function (a, b) {
      return (riskCounts[b] - riskCounts[a]) || riskScore(a) - riskScore(b);
    })[0] || 'none';
    totals.spilloverCountries = Object.keys(spilloverCountries).length;
    return {
      filters: filters,
      totals: totals,
      topRisk: topRisk,
      sourceDate: latestSourceDate(conflicts, events)
    };
  }

  function delta(current, previous, key) {
    if (!previous) return '';
    var diff = Number(current.totals[key] || 0) - Number(previous.totals[key] || 0);
    if (!diff) return 'No filter change';
    return (diff > 0 ? '+' : '') + fmtNumber(diff) + ' vs previous filter';
  }

  function deltaRange(current, previous) {
    if (!previous) return '';
    var minDiff = Number(current.totals.fatalitiesMin || 0) - Number(previous.totals.fatalitiesMin || 0);
    var maxDiff = Number(current.totals.fatalitiesMax || 0) - Number(previous.totals.fatalitiesMax || 0);
    if (!minDiff && !maxDiff) return 'No filter change';
    var min = (minDiff > 0 ? '+' : '') + fmtNumber(minDiff);
    var max = (maxDiff > 0 ? '+' : '') + fmtNumber(maxDiff);
    return 'min ' + min + ', max ' + max + ' vs previous filter';
  }

  function scopeLabel(filters) {
    var parts = [];
    if (filters.search) parts.push('Search: ' + filters.search);
    if (filters.region !== 'all') parts.push(regionLabels[filters.region] || title(filters.region));
    if (filters.risk !== 'all') parts.push(title(filters.risk) + ' risk');
    if (!filters.african) parts.push('African + global impact');
    return parts.length ? parts.join(' | ') : 'All African conflicts';
  }

  function card(label, value, detail) {
    return [
      '<article class="acd-what-changed-card">',
      '<span>' + esc(label) + '</span>',
      '<strong>' + esc(value) + '</strong>',
      detail ? '<small>' + esc(detail) + '</small>' : '',
      '</article>'
    ].join('');
  }

  function render() {
    var grid = $('acd-what-changed-grid');
    var mode = $('acd-what-changed-mode');
    var badge = $('acd-what-changed-badge');
    if (!grid || !mode || !badge || !state.loaded) return;

    var snapshot = makeSnapshot();
    var previous = state.previousSnapshot;
    var currentOnly = !previous;
    var totals = snapshot.totals;
    var sourceDate = snapshot.sourceDate ? fmtDate(snapshot.sourceDate) : 'No source date in current data';

    badge.textContent = currentOnly ? 'Current snapshot' : 'Filter comparison';
    mode.textContent = currentOnly
      ? 'Current snapshot for ' + scopeLabel(snapshot.filters) + '. No comparison baseline is available yet.'
      : 'Compared with the previous filter scope, not a time trend. Current scope: ' + scopeLabel(snapshot.filters) + '.';

    grid.innerHTML = [
      card(
        'Risk',
        totals.highUrgency + ' critical/high of ' + totals.conflicts,
        currentOnly ? title(snapshot.topRisk) + ' is the largest current risk group' : delta(snapshot, previous, 'highUrgency')
      ),
      card(
        'Events',
        fmtNumber(totals.eventCount) + ' recent records',
        currentOnly ? 'Filtered to conflicts in current scope' : delta(snapshot, previous, 'eventCount')
      ),
      card(
        'Displacement',
        fmtNumber(totals.displaced),
        currentOnly ? 'IDPs plus refugees in current scope' : delta(snapshot, previous, 'displaced')
      ),
      card(
        'Fatalities',
        fmtRange(totals.fatalitiesMin, totals.fatalitiesMax),
        currentOnly ? fmtNumber(totals.eventFatalities) + ' fatalities in recent event records' : deltaRange(snapshot, previous)
      ),
      card(
        'Spillover',
        totals.spilloverTheatres + ' theatres',
        totals.spilloverCountries + ' exposed states' + (currentOnly ? '' : '; ' + delta(snapshot, previous, 'spilloverCountries'))
      ),
      card(
        'Source date',
        sourceDate,
        'Latest date present in filtered conflict or event data'
      )
    ].join('');

    state.previousSnapshot = snapshot;
  }

  function scheduleRender() {
    window.clearTimeout(state.timer);
    state.timer = window.setTimeout(render, 80);
  }

  function bindControls() {
    ['acd-search', 'acd-region-filter', 'acd-african-toggle', 'acd-reset-filters'].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener(id === 'acd-search' ? 'input' : 'click', scheduleRender);
      if (id === 'acd-region-filter') el.addEventListener('change', scheduleRender);
    });
    document.querySelectorAll('#acd-risk-pills .acd-filter-chip').forEach(function (button) {
      button.addEventListener('click', scheduleRender);
    });
  }

  function setUnavailable() {
    var grid = $('acd-what-changed-grid');
    var mode = $('acd-what-changed-mode');
    var badge = $('acd-what-changed-badge');
    if (badge) badge.textContent = 'Unavailable';
    if (mode) mode.textContent = 'Conflict data is unavailable, so no filter comparison can be calculated.';
    if (grid) grid.innerHTML = '<div class="acd-empty"><div class="acd-empty-mark">DATA</div><div class="acd-empty-title">What changed cannot load right now.</div></div>';
  }

  function load() {
    Promise.all([
      fetch(apiPath('/api/conflicts')).then(function (res) { return res.ok ? res.json() : Promise.reject(new Error('conflicts unavailable')); }),
      fetch(apiPath('/api/events/recent')).then(function (res) { return res.ok ? res.json() : { data: [] }; })
    ]).then(function (responses) {
      state.conflicts = Array.isArray(responses[0].data) ? responses[0].data : [];
      state.events = Array.isArray(responses[1].data) ? responses[1].data : [];
      state.loaded = true;
      render();
    }).catch(setUnavailable);
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindControls();
    load();
  });
}());
