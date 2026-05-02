!function(win) {
  'use strict';

  var root = win.AfroTools = win.AfroTools || {};
  var STATES = {
    loading: { label: 'Checking', text: 'Checking latest available data' },
    live: { label: 'Live', text: 'Live data loaded' },
    cached: { label: 'Cached', text: 'Showing cached data' },
    stale: { label: 'Stale', text: 'Showing stale data' },
    unavailable: { label: 'Unavailable', text: 'Data unavailable' },
    error: { label: 'Error', text: 'Data unavailable' }
  };

  function ensureStyle() {
    if (document.getElementById('live-data-status-css')) return;
    var style = document.createElement('style');
    style.id = 'live-data-status-css';
    style.textContent = [
      '.live-data-status{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:.78rem;font-weight:700;line-height:1.4;color:#334155}',
      '.live-data-status__badge{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:3px 9px;border:1px solid transparent;font-size:.68rem;text-transform:uppercase;letter-spacing:.05em}',
      '.live-data-status__dot{width:7px;height:7px;border-radius:999px;background:currentColor}',
      '.live-data-status--loading .live-data-status__badge{background:#e0f2fe;color:#075985;border-color:#bae6fd}',
      '.live-data-status--live .live-data-status__badge{background:#dcfce7;color:#166534;border-color:#bbf7d0}',
      '.live-data-status--cached .live-data-status__badge{background:#e0e7ff;color:#3730a3;border-color:#c7d2fe}',
      '.live-data-status--stale .live-data-status__badge{background:#fef3c7;color:#92400e;border-color:#fde68a}',
      '.live-data-status--unavailable .live-data-status__badge,.live-data-status--error .live-data-status__badge{background:#fee2e2;color:#991b1b;border-color:#fecaca}',
      '.live-data-status__meta{color:inherit;font-weight:600}',
      '.live-data-status__source{color:#64748b;font-weight:600}',
      '.live-data-status__retry{border:0;background:transparent;color:#0063d1;font:inherit;font-weight:800;padding:0;text-decoration:underline;cursor:pointer}'
    ].join('');
    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseTimestamp(value) {
    if (!value) return null;
    var time = Date.parse(value);
    return Number.isFinite(time) ? new Date(time) : null;
  }

  function formatAge(timestamp) {
    var date = timestamp instanceof Date ? timestamp : parseTimestamp(timestamp);
    if (!date) return '';
    var diff = Math.max(0, Date.now() - date.getTime());
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'updated just now';
    if (mins < 60) return 'updated ' + mins + ' min ago';
    var hours = Math.floor(mins / 60);
    if (hours < 48) return 'updated ' + hours + 'h ago';
    return 'updated ' + Math.floor(hours / 24) + 'd ago';
  }

  function formatDate(timestamp) {
    var date = timestamp instanceof Date ? timestamp : parseTimestamp(timestamp);
    if (!date) return '';
    try {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (err) {
      return date.toISOString().slice(0, 10);
    }
  }

  function ageMinutes(timestamp) {
    var date = timestamp instanceof Date ? timestamp : parseTimestamp(timestamp);
    if (!date) return Infinity;
    return Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  }

  function stateForTimestamp(timestamp, options) {
    options = options || {};
    var mins = ageMinutes(timestamp);
    if (!Number.isFinite(mins)) return 'unavailable';
    var liveMinutes = options.liveMinutes || 60;
    var staleMinutes = options.staleMinutes || 1440;
    if (mins <= liveMinutes) return 'live';
    if (mins <= staleMinutes) return 'cached';
    return 'stale';
  }

  function resolveTarget(target) {
    if (!target) return null;
    return typeof target === 'string' ? document.querySelector(target) : target;
  }

  function update(target, options) {
    ensureStyle();
    options = options || {};
    var el = resolveTarget(target);
    if (!el) return null;
    var state = STATES[options.state] ? options.state : 'unavailable';
    var cfg = STATES[state];
    var message = options.message || cfg.text;
    var timestamp = options.timestamp || null;
    var source = options.source || '';
    var age = options.ageLabel || formatAge(timestamp);
    var date = options.dateLabel || formatDate(timestamp);
    var meta = options.meta || age || date;
    var label = options.label || cfg.label;
    var retryLabel = options.retryLabel || '';

    el.classList.remove(
      'live-data-status--loading',
      'live-data-status--live',
      'live-data-status--cached',
      'live-data-status--stale',
      'live-data-status--unavailable',
      'live-data-status--error'
    );
    el.classList.add('live-data-status', 'live-data-status--' + state);
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', state === 'loading' ? 'polite' : 'off');

    var html = '<span class="live-data-status__badge"><span class="live-data-status__dot"></span>' + escapeHtml(label) + '</span>' +
      '<span class="live-data-status__meta">' + escapeHtml(message) + (meta ? ' - ' + escapeHtml(meta) : '') + '</span>';
    if (source) html += '<span class="live-data-status__source">Source: ' + escapeHtml(source) + '</span>';
    if (retryLabel) html += '<button type="button" class="live-data-status__retry">' + escapeHtml(retryLabel) + '</button>';
    el.innerHTML = html;

    if (retryLabel && typeof options.onRetry === 'function') {
      var button = el.querySelector('.live-data-status__retry');
      if (button) button.addEventListener('click', options.onRetry);
    }
    return el;
  }

  root.LiveDataStatus = {
    update: update,
    parseTimestamp: parseTimestamp,
    formatAge: formatAge,
    formatDate: formatDate,
    ageMinutes: ageMinutes,
    stateForTimestamp: stateForTimestamp
  };
}(window);
