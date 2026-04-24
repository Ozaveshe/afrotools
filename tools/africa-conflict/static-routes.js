(function (window) {
  'use strict';

  var conflictRoutes = {"sudan-civil-war":"/tools/africa-conflict/conflicts/sudan-civil-war/","sahel-regional":"/tools/africa-conflict/conflicts/sahel-regional/","mali-sahel":"/tools/africa-conflict/conflicts/mali-sahel/","burkina-faso-insurgency":"/tools/africa-conflict/conflicts/burkina-faso-insurgency/","drc-eastern-conflict":"/tools/africa-conflict/conflicts/drc-eastern-conflict/","somalia-al-shabaab":"/tools/africa-conflict/conflicts/somalia-al-shabaab/","south-sudan-conflict":"/tools/africa-conflict/conflicts/south-sudan-conflict/","nigeria-boko-haram":"/tools/africa-conflict/conflicts/nigeria-boko-haram/","car-civil-war":"/tools/africa-conflict/conflicts/car-civil-war/","ethiopia-amhara":"/tools/africa-conflict/conflicts/ethiopia-amhara/","mozambique-cabo-delgado":"/tools/africa-conflict/conflicts/mozambique-cabo-delgado/","niger-post-coup":"/tools/africa-conflict/conflicts/niger-post-coup/","ethiopia-eritrea-tigray":"/tools/africa-conflict/conflicts/ethiopia-eritrea-tigray/","libya-conflict":"/tools/africa-conflict/conflicts/libya-conflict/","cameroon-anglophone":"/tools/africa-conflict/conflicts/cameroon-anglophone/","kenya-communal-violence":"/tools/africa-conflict/conflicts/kenya-communal-violence/","western-sahara":"/tools/africa-conflict/conflicts/western-sahara/"};

  function fallbackConflictUrl(slug) {
    return '/tools/africa-conflict/detail.html?id=' + encodeURIComponent(slug || '');
  }

  function conflictUrl(slug) {
    return conflictRoutes[slug] || fallbackConflictUrl(slug);
  }

  function rewriteLegacyDetailLinks(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var links = scope.querySelectorAll('a[href*="/tools/africa-conflict/detail.html?id="], a[href*="detail.html?id="]');
    links.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var match = href.match(/[?&]id=([^&#]+)/);
      if (!match) return;
      var slug = decodeURIComponent(match[1] || '');
      if (Object.prototype.hasOwnProperty.call(conflictRoutes, slug)) {
        link.setAttribute('href', conflictRoutes[slug]);
      }
    });
  }

  window.AfroConflictStaticRoutes = {
    conflicts: conflictRoutes,
    hasConflict: function (slug) {
      return Object.prototype.hasOwnProperty.call(conflictRoutes, slug);
    },
    conflict: conflictUrl,
    fallbackConflict: fallbackConflictUrl,
    rewriteLegacyDetailLinks: rewriteLegacyDetailLinks
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        rewriteLegacyDetailLinks(document);
      });
    } else {
      rewriteLegacyDetailLinks(document);
    }

    if (typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function (records) {
        records.forEach(function (record) {
          record.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) rewriteLegacyDetailLinks(node);
          });
        });
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }
})(window);
