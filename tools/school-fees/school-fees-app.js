(function (window, document) {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.schoolFeesEngine;
  var visibleRows = [];

  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }
  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }
  function titleCase(value) {
    return String(value || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }
  function money(value, currency) {
    return (currency ? currency + ' ' : '') + Math.round(Number(value) || 0).toLocaleString('en');
  }
  function sourceLabel(value) {
    return {
      self_observed: 'Self reported',
      receipt: 'Receipt or schedule',
      official_notice: 'Official notice',
      community_check: 'Community confirmation',
      school_website: 'School website'
    }[String(value || '').toLowerCase()] || 'Contributor record';
  }
  function dateLabel(value) {
    if (!value) return '';
    var date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  function context() {
    var cockpit = window.AfroEdu && typeof window.AfroEdu.getCockpitState === 'function'
      ? window.AfroEdu.getCockpitState() || {}
      : readJson('afroedu-cockpit-state', {});
    var profile = readJson('afroedu-profile-cache', {});
    var schools = Array.isArray(cockpit.universities) ? cockpit.universities.slice(0, 3) : [];
    var budgets = Array.isArray(cockpit.budgetSignals) ? cockpit.budgetSignals : [];
    var latest = budgets[0] || {};
    return {
      schools: schools,
      destination: latest.routeDestination || latest.destination || (profile.target_countries || [])[0] || '',
      level: latest.studyLevel || latest.level || profile.target_study_level || '',
      affordability: latest.affordabilityBand || ''
    };
  }
  function renderContext() {
    var data = context();
    var banner = byId('sfRouteBanner');
    var panel = byId('sfShortlistPanel');
    var filterActions = byId('sfFilterActions');
    var hasContext = data.schools.length || data.destination || data.level || data.affordability;
    banner.classList.add('is-visible');
    banner.innerHTML =
      '<div class="sf-route-copy"><span class="sf-route-kicker">' + (hasContext ? 'Saved browser context' : 'General comparison') + '</span>' +
      '<h2 class="sf-route-title">' + (hasContext ? 'Use your saved route as a filter, not as proof' : 'Compare published records carefully') + '</h2>' +
      '<p class="sf-route-body">' + (hasContext
        ? 'This device has education-planning context. It can help narrow the feed, but it does not make a fee record more accurate.'
        : 'No saved education context is needed. Filter the public feed and confirm every amount directly with the school.') + '</p></div>';
    panel.innerHTML = '';
    panel.classList.remove('is-visible');
    if (data.schools.length) {
      panel.classList.add('is-visible');
      panel.innerHTML = '<div class="sf-section-head"><div><span class="sf-section-kicker">Saved shortlist</span><h3>Schools saved on this device</h3>' +
        '<p class="sf-section-copy">These names are read from local browser storage and are not uploaded by this page.</p></div></div>' +
        '<div class="sf-compare-grid">' + data.schools.map(function (school) {
          return '<article class="sf-compare-card"><h4 class="sf-compare-title">' + escapeHtml(school.name || 'Saved school') + '</h4>' +
            '<p class="sf-card-note">' + escapeHtml(school.country || '') + '</p><div class="sf-card-actions">' +
            '<a class="sf-mini-link" href="/tools/university-ranking/">Review shortlist</a></div></article>';
        }).join('') + '</div>';
    }
    var actions = [];
    if (data.level) actions.push('<button class="sf-filter-chip" type="button" data-level="' + escapeHtml(titleCase(data.level)) + '">Filter to ' + escapeHtml(titleCase(data.level)) + '</button>');
    if (byId('mdCountry').value || byId('mdCity').value || byId('mdLevel').value || byId('mdType').value) {
      actions.push('<button class="sf-filter-chip" type="button" data-clear-filters>Clear filters</button>');
    }
    filterActions.innerHTML = actions.join('');
    byId('sfNextSteps').innerHTML =
      '<div class="sf-side-route"><strong>1. Compare the record</strong><p>Check its period, observation date, source and review state before using the amount.</p></div>' +
      '<div class="sf-side-route"><strong>2. Confirm with the school</strong><p>Ask for the current written schedule, included extras, deadlines, instalment rules and refund terms.</p></div>' +
      '<div class="sf-side-route"><strong>3. Test the annual budget</strong><p>Only annual-labelled rows are passed to Student Budget as annual fees. Other periods stay clearly labelled.</p>' +
      '<div class="sf-side-actions"><a class="sf-mini-link" href="/tools/student-budget/">Open Student Budget</a></div></div>';
    byId('sfCoverageNote').textContent = 'Coverage depends on published records matching the filters. An empty result is not evidence that a school has no fees.';
  }
  function summary(rows) {
    visibleRows = rows.slice();
    byId('mdList').setAttribute('aria-busy', 'false');
    var proofCount = rows.filter(function (row) { return engine.safeProofUrl(row.proof_url); }).length;
    var verifiedCount = rows.filter(function (row) { return engine.trustState(row).label === 'Verified and reviewed'; }).length;
    var currencies = {};
    rows.forEach(function (row) {
      var currency = engine.normalizeCurrency(row.currency_code || row.currency);
      if (currency) currencies[currency] = true;
    });
    return '<div class="md-stat"><div class="md-stat-value">' + rows.length + '</div><div class="md-stat-label">Published records</div></div>' +
      '<div class="md-stat"><div class="md-stat-value">' + verifiedCount + '</div><div class="md-stat-label">Verified + reviewed</div></div>' +
      '<div class="md-stat"><div class="md-stat-value">' + proofCount + '</div><div class="md-stat-label">Proof-linked</div></div>' +
      '<div class="md-stat"><div class="md-stat-value">' + Object.keys(currencies).length + '</div><div class="md-stat-label">Currencies shown</div></div>';
  }
  function studentBudgetUrl(row, normalized) {
    var params = new URLSearchParams();
    params.set('school', row.institution_name || 'School');
    params.set('source', 'school-fees');
    params.set('feeConfidence', normalized.trust.label);
    params.set('feePeriod', normalized.period);
    if (normalized.currency) params.set('currency', normalized.currency);
    if (normalized.isAnnual) params.set('annualFee', String(normalized.total));
    else params.set('reportedFee', String(normalized.total));
    return '/tools/student-budget/?' + params.toString();
  }
  function renderCard(row, helpers) {
    var normalized = engine.normalizeRow(row);
    var observed = dateLabel(row.observed_at);
    var trustClass = normalized.trust.tone === 'good' ? 'sf-fit-good' : normalized.trust.tone === 'ok' ? 'sf-fit-ok' : 'sf-fit-warn';
    return '<article class="md-card"><h3>' + helpers.escapeHtml(row.institution_name || 'Institution') + '</h3>' +
      '<p>' + helpers.escapeHtml([row.city, row.education_level, row.institution_type].filter(Boolean).join(' · ') || 'Details not stated') + '</p>' +
      '<div class="md-meta"><span class="md-pill">' + helpers.escapeHtml(money(normalized.total, normalized.currency)) + ' reported total</span>' +
      '<span class="md-pill">Tuition ' + helpers.escapeHtml(money(normalized.tuition, normalized.currency)) + '</span>' +
      '<span class="md-pill">Extras ' + helpers.escapeHtml(money(normalized.extras, normalized.currency)) + '</span>' +
      '<span class="md-pill">' + helpers.escapeHtml(sourceLabel(row.source_type)) + '</span>' +
      '<span class="sf-live-pill ' + trustClass + '">' + helpers.escapeHtml(normalized.trust.label) + '</span>' +
      (observed ? '<span class="md-pill">Observed ' + helpers.escapeHtml(observed) + '</span>' : '') + '</div>' +
      '<p class="md-card-period">Fee period: <strong>' + helpers.escapeHtml(normalized.period) + '</strong>. ' +
      (normalized.isAnnual ? 'This row can be handed off as an annual planning amount.' : 'This row is not labelled annual, so the handoff will not pretend it is annual tuition.') + '</p>' +
      '<div class="sf-card-note-inline">' + helpers.escapeHtml(normalized.trust.detail) + '</div>' +
      '<div class="md-card-actions">' +
      (normalized.proofUrl ? '<a class="md-card-proof" href="' + helpers.escapeHtml(normalized.proofUrl) + '" target="_blank" rel="noopener noreferrer">Open supporting link</a>' : '') +
      '<a class="md-card-link" href="' + helpers.escapeHtml(studentBudgetUrl(row, normalized)) + '">Plan in Student Budget</a>' +
      '</div></article>';
  }
  function mount() {
    if (!engine || !window.MarketDataApp || !window.AfroPointsEngine) {
      byId('mdList').innerHTML = '<div class="md-empty" role="status">The fee comparator could not start. Reload the page; if the issue continues, use the private quick check on the main School Fees page.</div>';
      return;
    }
    renderContext();
    new MutationObserver(function () {
      var list = byId('mdList');
      if (list && !/Loading (school fees|live data)/i.test(list.textContent || '')) list.setAttribute('aria-busy', 'false');
    }).observe(byId('mdList'), { childList: true, subtree: true });
    document.addEventListener('click', function (event) {
      var levelButton = event.target.closest('[data-level]');
      if (levelButton) {
        byId('mdLevel').value = levelButton.getAttribute('data-level');
        byId('mdRefresh').click();
      }
      if (event.target.closest('[data-clear-filters]')) {
        ['mdCountry', 'mdCity', 'mdLevel', 'mdType'].forEach(function (id) { byId(id).value = ''; });
        byId('mdRefresh').click();
      }
    });
    byId('mdReportCountry').addEventListener('change', function () {
      byId('mdReportCurrency').value = window.AfroPointsEngine.getCurrency(this.value || 'NG');
    });
    byId('mdSubmitReport').addEventListener('click', function (event) {
      var proof = byId('mdProofUrl').value.trim();
      if (proof && !engine.safeProofUrl(proof)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        byId('mdProofUrl').setCustomValidity('Use a complete HTTPS URL, or leave this field empty.');
        byId('mdProofUrl').reportValidity();
      } else {
        byId('mdProofUrl').setCustomValidity('');
      }
    }, true);
    var observed = byId('mdObservedAt');
    var now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    observed.value = now.toISOString().slice(0, 16);
    window.MarketDataApp.mount({
      endpoint: '/api/school-fees',
      responseKey: 'fees',
      subtype: 'school_fee',
      vertical: 'school_fees',
      reportButtonLabel: 'Submit fee for review',
      emptyStateHtml: 'No published records match these filters. Try a broader filter. Signed-in contributors can submit a record for review.',
      reportFields: [
        { key: 'institution_name', label: 'Institution name', type: 'text', required: true },
        { key: 'education_level', label: 'Level', type: 'select', required: true, options: ['Primary', 'Secondary', 'University', 'Vocational', 'International'] },
        { key: 'institution_type', label: 'Institution type', type: 'select', required: true, options: ['Public', 'Private', 'Faith-based', 'International'] },
        { key: 'annual_tuition', label: 'Tuition amount reported', type: 'number', required: true, min: 0 },
        { key: 'extras_total', label: 'Extras for the same period', type: 'number', required: false, min: 0 },
        { key: 'period', label: 'Fee period', type: 'select', required: true, options: ['Annual', 'Term', 'Semester', 'One-time'] }
      ],
      renderSummary: summary,
      renderCard: renderCard
    });
  }

  document.addEventListener('DOMContentLoaded', mount);
})(window, document);
