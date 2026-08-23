(function () {
  'use strict';
  var api = window.AfroTools && window.AfroTools.productHealth;
  var statusNode = document.getElementById('productionBuildStatus');
  var releasesNode = document.getElementById('publicReleaseNotes');
  if (!api || !statusNode || !releasesNode) return;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function fetchJson(url) {
    return fetch(url, { credentials: 'same-origin', cache: 'no-store' }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    });
  }

  Promise.allSettled([fetchJson('/changelog/releases.json'), fetchJson('/status/release.json')]).then(function (results) {
    if (results[0].status === 'fulfilled' && Array.isArray(results[0].value.releases)) {
      releasesNode.innerHTML = results[0].value.releases.slice(0, 4).map(function (release) {
        var date = api.toIso(release.merged_at);
        var areas = Array.isArray(release.areas) ? release.areas.join(' · ') : '';
        return '<article class="production-release">' +
          '<time datetime="' + escapeHtml(date || '') + '">' + escapeHtml(date ? new Date(date).toLocaleDateString('en', { year:'numeric', month:'short', day:'numeric', timeZone:'UTC' }) : 'Date unavailable') + '</time>' +
          '<strong>' + escapeHtml(release.title) + '</strong>' +
          '<span>' + escapeHtml(release.summary) + (areas ? '<br>' + escapeHtml(areas) : '') + '</span>' +
        '</article>';
      }).join('');
    } else {
      releasesNode.innerHTML = '<p>Public release annotations are temporarily unavailable. Historical notes remain below.</p>';
    }

    var release = results[1].status === 'fulfilled' ? api.safeReleaseMetadata(results[1].value) : null;
    if (release && release.production && release.commit && release.built_at) {
      statusNode.textContent = 'Production build ' + release.commit.slice(0, 7) + ' was created ' + new Date(release.built_at).toLocaleDateString('en', { year:'numeric', month:'short', day:'numeric', timeZone:'UTC' }) + '. Only approved public annotations are shown below.';
    } else {
      statusNode.textContent = 'Verified production build metadata is unavailable here. The notes below are approved merged-release annotations, not a deployment claim.';
    }
  });
})();
