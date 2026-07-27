(function (root) {
  'use strict';

  var HIGH_RISK_CADENCE_DAYS = 30;
  var SOURCE_LEDGER_URL = '/data/telecom/official-sources.json';

  function parseReviewDate(value) {
    var match = String(value || '').match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
    if (!match) return null;
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3] || 1);
    var date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year
      || date.getUTCMonth() !== month - 1
      || date.getUTCDate() !== day
    ) return null;
    return date;
  }

  function dayAge(reviewedAt, now) {
    var reviewed = parseReviewDate(reviewedAt);
    if (!reviewed) return null;
    var age = Math.floor((now.getTime() - reviewed.getTime()) / 86400000);
    return age < 0 ? null : age;
  }

  function classify(reviewedAt, now) {
    var ageDays = dayAge(reviewedAt, now || new Date());
    return {
      reviewedAt: reviewedAt || null,
      ageDays: ageDays,
      stale: ageDays === null || ageDays > HIGH_RISK_CADENCE_DAYS,
      cadenceDays: HIGH_RISK_CADENCE_DAYS
    };
  }

  function readableDate(value) {
    var date = parseReviewDate(value);
    if (!date) return 'unknown';
    return date.toLocaleDateString('en', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function createGuard(state) {
    var guard = document.createElement('aside');
    guard.id = 'telecom-freshness-guard';
    guard.className = 'telecom-freshness-guard';
    guard.setAttribute('role', state.stale ? 'alert' : 'status');
    guard.setAttribute('aria-live', 'polite');
    guard.innerHTML = [
      '<strong>',
      state.stale ? 'Archived planning snapshot' : 'Planning data review',
      '</strong>',
      '<span>Reviewed ',
      readableDate(state.reviewedAt),
      state.ageDays === null ? '' : ' (' + state.ageDays + ' days ago)',
      '. Bundled operator prices, coverage, availability, roaming, TV and USSD details are not live offers. ',
      'Replace prices with the operator app or a written quote, and verify SIM or portability rules with the regulator before acting.</span>',
      '<a href="',
      SOURCE_LEDGER_URL,
      '">Review source coverage and known gaps</a>'
    ].join('');
    return guard;
  }

  function injectStyles() {
    if (document.getElementById('telecom-freshness-guard-styles')) return;
    var style = document.createElement('style');
    style.id = 'telecom-freshness-guard-styles';
    style.textContent = [
      '.telecom-freshness-guard{box-sizing:border-box;display:grid;gap:.45rem;',
      'width:min(1120px,calc(100% - 2rem));margin:1rem auto;padding:1rem 1.1rem;',
      'border:1px solid #b7791f;border-radius:.75rem;background:#fffbeb;color:#713f12;',
      'font:inherit;line-height:1.5}',
      '.telecom-freshness-guard>*{min-width:0;overflow-wrap:anywhere}',
      '.telecom-freshness-guard strong{font-size:1rem}',
      '.telecom-freshness-guard span{font-size:.92rem}',
      '.telecom-freshness-guard a{width:fit-content;max-width:100%;color:inherit;font-weight:700;',
      'text-decoration:underline;text-underline-offset:.18em}',
      '.telecom-freshness-guard a:focus-visible{outline:3px solid currentColor;outline-offset:3px}',
      '@media(max-width:375px){.telecom-freshness-guard{width:calc(100% - 1rem);margin:.5rem auto;padding:.85rem}}',
      '@media(prefers-color-scheme:dark){.telecom-freshness-guard{background:#2b2110;color:#fde68a;border-color:#d97706}}',
      '[data-theme="dark"] .telecom-freshness-guard,.dark .telecom-freshness-guard{background:#2b2110;color:#fde68a;border-color:#d97706}'
    ].join('');
    document.head.appendChild(style);
  }

  function init() {
    if (document.getElementById('telecom-freshness-guard')) return;
    var dataset = root.TELECOM_DATA || {};
    var state = classify(dataset.lastUpdated, new Date());
    injectStyles();
    var guard = createGuard(state);
    var main = document.querySelector('main');
    if (main) {
      main.insertBefore(guard, main.firstChild);
    } else {
      var footer = document.querySelector('afro-footer, footer');
      document.body.insertBefore(guard, footer || document.body.firstChild);
    }
    document.documentElement.setAttribute('data-telecom-snapshot-state', state.stale ? 'stale' : 'reviewed');
  }

  root.AfroTools = root.AfroTools || {};
  root.AfroTools.telecomFreshness = {
    classify: classify,
    parseReviewDate: parseReviewDate,
    cadenceDays: HIGH_RISK_CADENCE_DAYS
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
