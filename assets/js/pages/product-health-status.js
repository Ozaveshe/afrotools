(function () {
  'use strict';

  var api = window.AfroTools && window.AfroTools.productHealth;
  var snapshotNode = document.getElementById('productHealthSnapshot');
  if (!api || !snapshotNode) return;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function formatDate(value) {
    var iso = api.toIso(value);
    if (!iso) return 'Not verified';
    return new Date(iso).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  }

  function renderRows(target, rows) {
    target.innerHTML = rows.map(function (row) {
      var status = api.normalizeStatus(row.status);
      var next = row.next_expected_check ? '<span>Next expected check: ' + escapeHtml(formatDate(row.next_expected_check)) + '</span>' : '';
      return '<article class="status-row" data-product-id="' + escapeHtml(row.id) + '">' +
        '<div class="status-name">' + escapeHtml(row.name) + '</div>' +
        '<div><span class="status-badge" data-status="' + escapeHtml(status) + '">' + escapeHtml(api.LABELS[status]) + '</span></div>' +
        '<div class="status-copy">' + escapeHtml(row.coverage || 'Coverage not reported.') + (row.reason ? '<strong>' + escapeHtml(row.reason) + '</strong>' : '') + '</div>' +
        '<div class="status-date"><time datetime="' + escapeHtml(api.toIso(row.last_verified) || '') + '">' + escapeHtml(formatDate(row.last_verified)) + '</time>' + next + '</div>' +
      '</article>';
    }).join('');
  }

  function replaceRow(rows, id, update) {
    for (var i = 0; i < rows.length; i += 1) {
      if (rows[i].id !== id) continue;
      rows[i] = Object.assign({}, rows[i], update);
      rows[i].status = api.normalizeStatus(rows[i].status);
      rows[i].status_label = api.LABELS[rows[i].status];
      return;
    }
  }

  function updateSummary(snapshot, liveAvailable) {
    var rows = snapshot.platform.concat(snapshot.products);
    var counts = rows.reduce(function (out, row) {
      var key = api.normalizeStatus(row.status);
      out[key] = (out[key] || 0) + 1;
      return out;
    }, {});
    var state = counts.temporarily_unavailable ? 'temporarily_unavailable' : counts.stale ? 'stale' : counts.degraded ? 'degraded' : counts.partial_coverage ? 'partial_coverage' : counts.unknown ? 'unknown' : 'operational';
    var summary = document.getElementById('healthSummary');
    summary.dataset.state = state;
    var known = rows.length - (counts.unknown || 0);
    summary.querySelector('strong').textContent = api.LABELS[state] + ' — ' + known + ' of ' + rows.length + ' areas have verified evidence';
    summary.querySelector('span:last-child').textContent = liveAvailable
      ? 'Live checks were combined with the static source snapshot. Coverage and freshness remain separate.'
      : 'Live checks are unavailable; showing the source-derived snapshot without assuming runtime health.';
  }

  function applyFreshness(snapshot, payload) {
    if (!payload || !payload.categories) return false;
    var map = { fuel: 'fuel', electricity: 'electricity', forex: 'fx' };
    Object.keys(map).forEach(function (key) {
      var row = payload.categories[key];
      if (!row) return;
      var status = api.normalizeStatus(row.status);
      if (status === api.STATUS.OPERATIONAL && (!row.updatedAt || !row.source || row.records_count === 0)) status = api.STATUS.UNKNOWN;
      replaceRow(snapshot.products, map[key], {
        status: status,
        last_verified: row.updatedAt || null,
        reason: status === api.STATUS.OPERATIONAL ? 'Live freshness evidence is within its product threshold.' : 'Live freshness evidence is ' + api.LABELS[status].toLowerCase() + '.'
      });
    });

    if (payload.scholarship) {
      var scholarship = payload.scholarship;
      var scholarshipStatus = scholarship.status === 'ok' && scholarship.count > 0 ? api.STATUS.OPERATIONAL : api.normalizeStatus(scholarship.status);
      replaceRow(snapshot.products, 'scholarships', {
        status: scholarshipStatus,
        last_verified: scholarship.lastCheckedAt || null,
        coverage: scholarship.count > 0 ? scholarship.count + ' public scholarship opportunities available in the checked feed.' : 'No usable public scholarship rows were confirmed.',
        reason: scholarshipStatus === api.STATUS.OPERATIONAL ? null : 'The public feed is limited, stale or unavailable.'
      });
    }

    replaceRow(snapshot.platform, 'apis-functions', {
      status: payload.overall_health === 'healthy' ? api.STATUS.OPERATIONAL : api.normalizeStatus(payload.overall_health),
      last_verified: payload.checked_at || null,
      reason: 'This describes the public data-health function and its checked dependencies, not every API route.'
    });
    return true;
  }

  function applyAfroStream(snapshot, payload) {
    if (!payload || !payload.generated_at) return false;
    var creators = payload.creators && Number(payload.creators.published || 0);
    var streams = payload.streams && Number(payload.streams.total_published || 0);
    var news = payload.news && Number(payload.news.total_published || 0);
    var sourceErrors = payload.sources && Number(payload.sources.with_error || 0);
    var staleSources = payload.sources && Number(payload.sources.stale_over_7d || 0);
    var status = creators > 0 && streams > 0 && news > 0 ? api.STATUS.OPERATIONAL : api.STATUS.DEGRADED;
    if (status === api.STATUS.OPERATIONAL && (sourceErrors > 0 || staleSources > 0)) status = api.STATUS.PARTIAL;
    replaceRow(snapshot.products, 'afrostream', {
      status: status,
      last_verified: payload.generated_at,
      coverage: creators + ' published creators, ' + streams + ' historical stream rows and ' + news + ' published news items checked live.',
      reason: status === api.STATUS.OPERATIONAL ? null : (sourceErrors + ' source errors and ' + staleSources + ' stale sources remain isolated from historical content.')
    });
    return true;
  }

  function fetchJson(url) {
    return fetch(url, { credentials: 'same-origin', cache: 'no-store' }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    });
  }

  var snapshot;
  try {
    snapshot = JSON.parse(snapshotNode.textContent);
  } catch (error) {
    return;
  }
  snapshot.platform = (snapshot.platform || []).map(function (row) { return Object.assign({}, row); });
  snapshot.products = (snapshot.products || []).map(function (row) { return Object.assign({}, row); });

  var platformTarget = document.getElementById('platformStatus');
  var productTarget = document.getElementById('productStatus');
  renderRows(platformTarget, snapshot.platform);
  renderRows(productTarget, snapshot.products);
  updateSummary(snapshot, false);

  Promise.allSettled([
    fetchJson('/api/data-freshness'),
    fetchJson('/api/afrostream/health'),
    fetchJson('/status/release.json')
  ]).then(function (results) {
    var liveAvailable = false;
    if (results[0].status === 'fulfilled') liveAvailable = applyFreshness(snapshot, results[0].value) || liveAvailable;
    if (results[1].status === 'fulfilled') liveAvailable = applyAfroStream(snapshot, results[1].value.data) || liveAvailable;
    renderRows(platformTarget, snapshot.platform);
    renderRows(productTarget, snapshot.products);
    updateSummary(snapshot, liveAvailable);

    var release = results[2].status === 'fulfilled' ? api.safeReleaseMetadata(results[2].value) : null;
    var releaseNode = document.getElementById('releaseStatus');
    if (release && release.production && release.commit && release.built_at) {
      releaseNode.textContent = 'Production build ' + release.commit.slice(0, 7) + ' was created ' + formatDate(release.built_at) + '. Commit subjects and internal deploy details are not exposed.';
    } else {
      releaseNode.textContent = 'Production deploy identity is unavailable in this build. No local or preview build is presented as production.';
    }
  });
})();
