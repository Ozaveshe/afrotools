(function () {
  'use strict';

  function renderToolCard(tool) {
    var badgeClass = tool.status === 'new' ? 'edu-tool-badge new' : 'edu-tool-badge';
    var badgeLabel = tool.status === 'new' ? 'New' : 'Live';
    var countryLabel = (tool.countries && tool.countries[0] && tool.countries[0] !== 'ALL')
      ? tool.countries[0]
      : 'Tool';

    return [
      '<a href="', tool.href, '" class="edu-tool-card">',
        '<div class="edu-tool-top">',
          '<span class="edu-tool-icon">', tool.icon || '🎓', '</span>',
          '<span class="', badgeClass, '">', badgeLabel, '</span>',
        '</div>',
        '<h3>', tool.name, '</h3>',
        '<p>', tool.desc, '</p>',
        '<div class="edu-tool-card-footer">',
          '<span>', countryLabel, '</span>',
          '<span>Open →</span>',
        '</div>',
      '</a>'
    ].join('');
  }

  function renderSystemItem(link) {
    return [
      '<a class="edu-link-card" href="', link.href, '">',
        link.label,
      '</a>'
    ].join('');
  }

  function initEducationSubhubPage() {
    if (typeof AfroEducation === 'undefined') return;

    var key = document.body.getAttribute('data-education-subhub');
    if (!key) return;

    var subhub = AfroEducation.getSubhub(key);
    if (!subhub) return;

    var title = document.getElementById('edu-subhub-title');
    var lead = document.getElementById('edu-subhub-lead');
    var eyebrow = document.getElementById('edu-subhub-eyebrow');
    var toolCount = document.getElementById('edu-subhub-tool-count');
    var totalRegistryCount = document.getElementById('edu-subhub-total-registry-count');
    var toolsNode = document.getElementById('edu-subhub-tools');
    var linksNode = document.getElementById('edu-subhub-links');

    if (title) title.textContent = subhub.title;
    if (lead) lead.textContent = subhub.description;
    if (eyebrow) eyebrow.textContent = subhub.eyebrow;
    if (toolCount) toolCount.textContent = subhub.tools.length;
    if (totalRegistryCount) totalRegistryCount.textContent = AfroEducation.getRegistryCount();

    if (toolsNode) {
      if (subhub.tools.length) {
        toolsNode.innerHTML = subhub.tools.map(renderToolCard).join('');
      } else {
        toolsNode.innerHTML = '<p class="edu-empty">No tools are mapped to this education route yet.</p>';
      }
    }

    if (linksNode) {
      linksNode.innerHTML = subhub.relatedLinks.map(renderSystemItem).join('');
    }
  }

  if (typeof onRegistryReady === 'function') {
    onRegistryReady(initEducationSubhubPage);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (typeof AFRO_TOOLS !== 'undefined') {
        initEducationSubhubPage();
      } else {
        document.addEventListener('afrotools:registry-ready', initEducationSubhubPage);
      }
    });
  }
})();
