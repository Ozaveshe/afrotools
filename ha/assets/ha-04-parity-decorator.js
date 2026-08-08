(function enhanceHa04ExistingApps(root) {
  'use strict';
  var configs = {
    '/ha/kayan-aiki/sarrafa-rogo/': { sourceId: 'cassava-processing-nigeria', filename: 'afrotools-sarrafa-rogo-ng.json', source: 'FAO, IITA da bayanan kasuwar gida a AfroTools' },
    '/ha/noma/amfanin-gona-najeriya/': { sourceId: 'crop-yield-nigeria', filename: 'afrotools-amfanin-gona-ng.json', source: 'FAOSTAT, HarvestStat Africa, NBS, World Bank da CGIAR' },
    '/ha/noma/taki-najeriya/': { sourceId: 'fertilizer-nigeria', filename: 'afrotools-taki-ng.json', source: 'FAOSTAT, NBS, World Bank da CGIAR' },
    '/ha/noma/ban-ruwa-najeriya/': { sourceId: 'irrigation-nigeria', filename: 'afrotools-ban-ruwa-ng.json', source: 'FAO Paper 56, CLIMWAT 2.0, NBS da World Bank' },
    '/ha/kayan-aiki/ribar-gona/': { sourceId: 'farm-profit-nigeria', filename: 'afrotools-ribar-gona-ng.json', source: 'FAOSTAT, ILO, WFP, APHLIS da bayanan noma na ƙasa' },
    '/ha/noma/yawan-iri-najeriya/': { sourceId: 'seed-rate-ng', filename: 'afrotools-yawan-iri-ng.json', source: 'FAO, NASC, IITA, NBS, CGIAR da World Bank' }
  };
  var path = location.pathname.replace(/index\.html$/, ''); if (path.slice(-1) !== '/') path += '/';
  var config = configs[path]; if (!config) return;
  var initial = [], latest = null, original = root.calculate;

  function controls() { return Array.from(document.querySelectorAll('main input, main select, main textarea')); }
  function inputLabel(node) { var label = node.id && document.querySelector('label[for="' + node.id + '"]'); return label ? label.textContent.trim() : (node.name || node.id || 'fili'); }
  function collectInputs() {
    var output = {};
    controls().forEach(function (node) {
      if (!node.id || node.type === 'file') return;
      if ((node.type === 'checkbox' || node.type === 'radio') && !node.checked) return;
      output[node.id] = { label: inputLabel(node), value: node.type === 'checkbox' ? true : node.value };
    });
    return output;
  }
  function invalidControl() {
    return controls().find(function (node) {
      if (node.disabled || node.type === 'hidden' || node.type === 'file' || node.offsetParent === null) return false;
      if (typeof node.checkValidity === 'function' && !node.checkValidity()) return true;
      if (node.type === 'number' && node.value !== '' && !Number.isFinite(Number(node.value))) return true;
      return false;
    });
  }
  function resultText() {
    var panel = document.getElementById('resultsPanel'); return panel ? panel.innerText.replace(/\s+/g, ' ').trim() : '';
  }
  function successful() {
    var panel = document.getElementById('resultsPanel'); if (!panel) return false;
    var text = resultText(); return getComputedStyle(panel).display !== 'none' && text && !/^[-–—\s]*$/.test(text) && text.indexOf('--') !== 0;
  }
  function status(message, error) {
    var node = document.querySelector('[data-ha04-status]'); if (!node) return;
    node.textContent = message || ''; node.style.color = error ? '#a12622' : '#176b42';
  }
  function setEnabled(enabled) { var node = document.querySelector('[data-ha04-json]'); if (node) node.disabled = !enabled; }
  function download() {
    if (!latest) { status('Yi lissafi kafin sauke rahoto.', true); return; }
    var report = { schemaVersion: 1, sourceId: config.sourceId, route: path, language: 'ha', generatedAt: new Date().toISOString(), input: latest.input, result: { takaitaccenSakamako: latest.result }, provenance: { sourceLabel: config.source, dataReviewed: '2026-08-08', liveData: false, confidence: 'Kiyasin tsarawa; a tabbatar da bayanan yankin', assumptions: 'An yi amfani da ƙimar da aka adana a injin AfroTools.', limit: 'Ba tabbacin amfanin gona, farashi, kuɗi ko sakamakon hukuma ba ne.' }, privacy: 'An yi lissafi a wannan burauzar; ba a aika shigarwa zuwa sabar ko URL ba.' };
    var url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' }));
    var link = document.createElement('a'); link.href = url; link.download = config.filename; document.body.appendChild(link); link.click(); link.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 0); status('An sauke rahoton JSON.');
  }
  function reset() {
    initial.forEach(function (item) { item.node.value = item.value; item.node.checked = item.checked; });
    latest = null; root.__HA04_EXISTING_TEST__.latest = null; setEnabled(false); status('An sake farawa.');
    var panel = document.getElementById('resultsPanel'); if (panel) panel.style.display = 'none';
    var first = controls().find(function (node) { return !node.disabled && node.type !== 'hidden'; }); if (first) first.focus();
    document.dispatchEvent(new CustomEvent('ha04:reset', { detail: { sourceId: config.sourceId } }));
  }
  function install() {
    initial = controls().map(function (node) { return { node: node, value: node.value, checked: node.checked }; });
    var calculateButton = document.querySelector('button[onclick*="calculate"]');
    if (calculateButton) {
      var actions = document.createElement('div'); actions.className = 'ha-action-buttons'; actions.setAttribute('data-ha04-parity-actions', '');
      actions.innerHTML = '<button type="button" class="ha-secondary-btn" data-ha04-reset>Sake farawa</button><button type="button" class="ha-secondary-btn" data-ha04-json disabled>Sauke JSON</button><span data-ha04-status role="status" aria-live="polite"></span>';
      calculateButton.parentNode.appendChild(actions);
    }
    var panel = document.getElementById('resultsPanel'); if (panel) { panel.tabIndex = -1; panel.setAttribute('aria-live', 'polite'); }
    document.addEventListener('click', function (event) { if (event.target.closest('[data-ha04-reset]')) reset(); if (event.target.closest('[data-ha04-json]')) download(); });
    if (typeof original === 'function') {
      root.calculate = function enhancedCalculate() {
        var invalid = invalidControl();
        if (invalid) { status('Gyara filin “' + inputLabel(invalid) + '” kafin lissafi.', true); invalid.focus(); return null; }
        var value = original.apply(this, arguments);
        setTimeout(function () {
          if (successful()) { latest = { input: collectInputs(), result: resultText() }; root.__HA04_EXISTING_TEST__.latest = latest; setEnabled(true); status('An kammala lissafi a wannan burauzar.'); if (panel) panel.focus(); }
        }, 0);
        return value;
      };
    }
    root.__HA04_EXISTING_TEST__ = { sourceId: config.sourceId, latest: null, reset: reset, collectInputs: collectInputs, resultText: resultText };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})(window);
