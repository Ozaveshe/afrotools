(function initHa04Core(root) {
  'use strict';

  function byId(id) { return document.getElementById(id); }
  function number(value, digits) {
    return new Intl.NumberFormat('ha-NG', { maximumFractionDigits: digits == null ? 2 : digits }).format(Number(value) || 0);
  }
  function money(value, currency) {
    return new Intl.NumberFormat('ha-NG', { style: 'currency', currency: currency || 'NGN', maximumFractionDigits: 0 }).format(Number(value) || 0);
  }
  function option(value, label) {
    var node = document.createElement('option'); node.value = value; node.textContent = label; return node;
  }
  function downloadJson(object, filename) {
    var blob = new Blob([JSON.stringify(object, null, 2)], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob); var link = document.createElement('a');
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }
  function setStatus(message, error) {
    var node = byId('actionStatus'); if (!node) return;
    node.textContent = message || ''; node.style.color = error ? 'var(--ha04-danger)' : 'var(--ha04-accent-strong)';
  }
  function enableActions(enabled) {
    document.querySelectorAll('[data-result-action]').forEach(function (button) { button.disabled = !enabled; });
  }
  function fail(message, field) {
    var error = byId('formError'); if (error) error.textContent = message;
    setStatus('Ba a kammala lissafin ba. Gyara filin da aka nuna.', true);
    if (field) field.focus(); return null;
  }
  function showResult() {
    var empty = byId('emptyState'); var panel = byId('resultPanel');
    if (empty) empty.hidden = true; if (panel) { panel.hidden = false; panel.focus(); }
    enableActions(true);
  }
  function clearResult(testApi) {
    var empty = byId('emptyState'); var panel = byId('resultPanel');
    if (empty) empty.hidden = false; if (panel) panel.hidden = true;
    if (byId('formError')) byId('formError').textContent = '';
    setStatus(''); enableActions(false); if (testApi) testApi.latest = null;
  }
  function baseReport(config, input, result) {
    return {
      schemaVersion: 1,
      sourceId: config.sourceId,
      route: config.route,
      language: 'ha',
      generatedAt: new Date().toISOString(),
      input: input,
      result: result,
      provenance: {
        sourceLabel: config.sourceLabel,
        sourceLinks: config.sourceLinks,
        dataReviewed: config.dataReviewed,
        confidence: config.confidence,
        liveData: false,
        assumptions: config.assumptions,
        limit: 'Kiyasin tsarawa ne kawai; ba tabbacin amfanin gona, farashi, yanayi ko riba ba ne.'
      },
      privacy: 'An yi lissafi a wannan burauzar. Ba a aika bayanan shigarwa zuwa sabar ba.'
    };
  }
  function bind(config, api) {
    var form = byId(config.formId);
    root.__HA04_TEST__ = api;
    enableActions(false);
    form.addEventListener('submit', function (event) { event.preventDefault(); api.calculate(); });
    form.addEventListener('input', function () { clearResult(api); });
    form.addEventListener('change', function (event) { clearResult(api); if (api.onChange) api.onChange(event); });
    form.addEventListener('reset', function () {
      setTimeout(function () { if (api.initialise) api.initialise(); clearResult(api); var first = form.querySelector('select, input'); if (first) first.focus(); }, 0);
    });
    document.addEventListener('click', function (event) {
      var button = event.target.closest('[data-result-action]'); if (!button) return;
      if (!api.latest) { setStatus('Fara yin lissafi kafin ka sauke rahoto.', true); return; }
      if (button.dataset.resultAction === 'json') {
        downloadJson(api.report(), config.filename); setStatus('An sauke rahoton JSON.');
      }
    });
  }

  root.Ha04 = { byId: byId, number: number, money: money, option: option, setStatus: setStatus, enableActions: enableActions, fail: fail, showResult: showResult, clearResult: clearResult, baseReport: baseReport, bind: bind };
})(window);
