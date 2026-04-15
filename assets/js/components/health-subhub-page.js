(function () {
  'use strict';

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderToolCard(tool, connected) {
    var badgeClass = tool.status === 'new' ? 'health-route-tool-badge new' : 'health-route-tool-badge';
    var badgeLabel = connected
      ? 'Connected surface'
      : (tool.status === 'new' ? 'New' : 'Live');
    var countryLabel = (tool.countries && tool.countries[0] && tool.countries[0] !== 'ALL')
      ? tool.countries[0]
      : (connected ? 'Cross-category' : 'Health');

    return [
      '<a href="', escapeHtml(tool.href), '" class="health-route-tool-card">',
        '<div class="health-route-tool-top">',
          '<span class="health-route-tool-icon">', escapeHtml(tool.icon || '🏥'), '</span>',
          '<span class="', badgeClass, '">', escapeHtml(badgeLabel), '</span>',
        '</div>',
        '<h3>', escapeHtml(tool.name), '</h3>',
        '<p>', escapeHtml(tool.desc), '</p>',
        '<div class="health-route-tool-footer">',
          '<span>', escapeHtml(countryLabel), '</span>',
          '<span>Open →</span>',
        '</div>',
      '</a>'
    ].join('');
  }

  function renderLinkCard(link) {
    return [
      '<a class="health-route-link-card" href="', escapeHtml(link.href), '">',
        escapeHtml(link.label),
      '</a>'
    ].join('');
  }

  function initHealthSubhubPage() {
    if (typeof AfroHealth === 'undefined') {
      return;
    }

    var key = document.body.getAttribute('data-health-subhub');
    if (!key) {
      return;
    }

    var subhub = AfroHealth.getSubhub(key);
    if (!subhub) {
      return;
    }

    var title = document.getElementById('health-subhub-title');
    var lead = document.getElementById('health-subhub-lead');
    var eyebrow = document.getElementById('health-subhub-eyebrow');
    var toolCount = document.getElementById('health-subhub-tool-count');
    var connectedCount = document.getElementById('health-subhub-connected-count');
    var totalRegistryCount = document.getElementById('health-subhub-total-registry-count');
    var toolsLabel = document.getElementById('health-subhub-primary-label');
    var connectedLabel = document.getElementById('health-subhub-connected-label');
    var note = document.getElementById('health-subhub-note');
    var toolsNode = document.getElementById('health-subhub-tools');
    var connectedNode = document.getElementById('health-subhub-connected-tools');
    var linksNode = document.getElementById('health-subhub-links');

    if (title) title.textContent = subhub.title;
    if (lead) lead.textContent = subhub.description;
    if (eyebrow) eyebrow.textContent = subhub.eyebrow;
    if (toolCount) toolCount.textContent = subhub.tools.length;
    if (connectedCount) connectedCount.textContent = subhub.connectedTools.length;
    if (totalRegistryCount) totalRegistryCount.textContent = AfroHealth.getRegistryCount();
    if (toolsLabel) toolsLabel.textContent = subhub.primaryLabel;
    if (connectedLabel) connectedLabel.textContent = subhub.connectedLabel;
    if (note) note.textContent = subhub.note;

    if (toolsNode) {
      toolsNode.innerHTML = subhub.tools.length
        ? subhub.tools.map(function (tool) { return renderToolCard(tool, false); }).join('')
        : '<p class="health-route-empty">No health tools are mapped to this route yet.</p>';
    }

    if (connectedNode) {
      connectedNode.innerHTML = subhub.connectedTools.length
        ? subhub.connectedTools.map(function (tool) { return renderToolCard(tool, true); }).join('')
        : '<p class="health-route-empty">No connected surfaces are mapped to this route yet.</p>';
    }

    if (linksNode) {
      linksNode.innerHTML = subhub.relatedLinks.map(renderLinkCard).join('');
    }
  }

  if (typeof onRegistryReady === 'function') {
    onRegistryReady(initHealthSubhubPage);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (typeof AFRO_TOOLS !== 'undefined') {
        initHealthSubhubPage();
      } else {
        document.addEventListener('afrotools:registry-ready', initHealthSubhubPage);
      }
    });
  }
})();
