(function () {
  'use strict';
  function update() {
    var api = window.AfroProArchitecture;
    if (!api) return;
    var summary = api.getSummary();
    document.querySelectorAll('[data-pro-count]').forEach(function (el) { el.textContent = String(summary[el.getAttribute('data-pro-count')]); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', update); else update();
})();
