(function () {
  'use strict';

  function visible(node) {
    return Boolean(node && (node.offsetWidth || node.offsetHeight || node.getClientRects().length));
  }

  function controlValue(control) {
    if (control.type === 'password' || control.type === 'file') return undefined;
    if (control.type === 'checkbox' || control.type === 'radio') return control.checked;
    return control.value;
  }

  function collectInputs() {
    var entries = {};
    Array.prototype.forEach.call(
      document.querySelectorAll('input, select, textarea'),
      function (control, index) {
        if (!visible(control) || control.disabled) return;
        var value = controlValue(control);
        if (typeof value === 'undefined') return;
        var key = control.id || control.name || ('control-' + (index + 1));
        entries[key] = value;
      }
    );
    return entries;
  }

  function collectResult() {
    var candidates = document.querySelectorAll(
      'output, [aria-live], .result, .results, [id*="result" i], [class*="result" i]'
    );
    var text = [];
    Array.prototype.forEach.call(candidates, function (node) {
      var value = visible(node) ? String(node.innerText || node.textContent || '').trim() : '';
      if (value && text.indexOf(value) === -1) text.push(value);
    });
    return text.join('\n\n').slice(0, 12000);
  }

  function download(payload) {
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    var link = document.createElement('a');
    link.download = payload.owner + '-etat-local.json';
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    window.setTimeout(function () {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
  }

  document.addEventListener('click', function (event) {
    var button = event.target && event.target.closest('[data-fr-engineering-export]');
    if (!button) return;
    event.preventDefault();
    var config = window.AfroToolsFrenchEngineering || {};
    download({
      schema: 'afrotools-fr-engineering-local-export-v1',
      owner: config.id || button.getAttribute('data-fr-engineering-export'),
      source: config.source || '',
      route: window.location.pathname,
      privacy: 'local-first',
      exportedAt: new Date().toISOString(),
      inputs: collectInputs(),
      result: collectResult()
    });
    var status = document.querySelector('[data-fr-engineering-export-status]');
    if (status) status.textContent = 'Export JSON créé localement.';
  });
}());
