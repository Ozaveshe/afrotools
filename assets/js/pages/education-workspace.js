(function () {
  'use strict';
  // Existing deep links continue to open optional planning sections.
  function revealHash() {
    var id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    var parent = target.parentElement;
    while (parent) {
      if (parent.tagName === 'DETAILS') parent.open = true;
      parent = parent.parentElement;
    }
    target.scrollIntoView({ block: 'start' });
  }
  window.addEventListener('hashchange', revealHash);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', revealHash);
  else revealHash();
})();
