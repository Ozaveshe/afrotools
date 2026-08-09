(function initSwTransportRemainingController(root) {
  'use strict';
  root.AfroLocalOnly = true;
  var body = document.body;
  var kind = body && body.getAttribute('data-sw-transport-kind');
  var toolId = body && body.getAttribute('data-sw-transport-owner');
  var engine = root.SwTransportPlanningEngine;
  var result = document.getElementById('swt-results');
  if (!kind || !toolId || !engine || !result) return;

  var primary = document.getElementById('swt-primary');
  var sub = document.getElementById('swt-sub');
  var metrics = document.getElementById('swt-metrics');
  var note = document.getElementById('swt-note');
  var status = document.createElement('p');
  status.className = 'swt-warning';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  result.parentNode.insertBefore(status, result);

  function currency() {
    var field = document.getElementById('currency');
    return field ? field.value : '';
  }

  function symbol() {
    var symbols = { KES: 'KSh ', TZS: 'TSh ', UGX: 'USh ', RWF: 'RF ', NGN: 'NGN ', GHS: 'GHS ', ZAR: 'R ', ZMW: 'ZK ', BWP: 'BWP ', NAD: 'NAD ', MZN: 'MZN ', ETB: 'ETB ', XOF: 'CFA ', XAF: 'FCFA ', EGP: 'EGP ', MAD: 'MAD ', USD: '$' };
    return symbols[currency()] || (currency() ? currency() + ' ' : '');
  }

  function format(item) {
    if (item.type === 'money') return symbol() + Math.round(item.value || 0).toLocaleString('en-US');
    if (item.type === 'percent') return Number(item.value || 0).toFixed(1) + '%';
    return String(item.value == null ? '' : item.value);
  }

  function values() {
    var output = { currency: currency() };
    document.querySelectorAll('input[id],select[id]').forEach(function (field) {
      if (field.type === 'checkbox') return;
      output[field.id] = field.type === 'number' || field.inputMode === 'decimal' ? Number(field.value) : field.value;
    });
    return output;
  }

  function checklist() {
    var all = Array.prototype.slice.call(document.querySelectorAll('.swt-check input[type="checkbox"]'));
    return { yes: all.filter(function (field) { return field.checked; }).length, total: all.length };
  }

  function clear(message) {
    result.classList.remove('on');
    primary.textContent = '';
    sub.textContent = '';
    metrics.textContent = '';
    note.textContent = '';
    root.__swTransportRecord = null;
    status.textContent = message || '';
  }

  function render(outcome) {
    if (!outcome.ok) {
      clear(outcome.error);
      return;
    }
    primary.textContent = format(outcome.primary);
    sub.textContent = outcome.sub;
    metrics.innerHTML = outcome.metrics.map(function (item) {
      return '<div class="swt-metric"><strong>' + format(item) + '</strong><span>' + item.label + '</span></div>';
    }).join('');
    note.textContent = outcome.note;
    result.classList.add('on');
    root.__swTransportRecord = { toolId: toolId, input: values(), output: outcome };
    status.textContent = 'Makadirio yamekamilika kwenye kifaa hiki.';
  }

  root.swtCalc = function calculateTransport() {
    render(engine.calculate(kind, values(), checklist()));
  };

  var actions = document.createElement('div');
  actions.className = 'swt-actions';
  actions.innerHTML = '<button class="swt-button" type="button" data-sw-transport-copy>Nakili muhtasari</button>' +
    '<button class="swt-button" type="button" data-sw-transport-reset>Weka upya</button>';
  result.parentNode.insertBefore(actions, result.nextSibling);

  actions.querySelector('[data-sw-transport-copy]').addEventListener('click', function () {
    if (!root.__swTransportRecord) { status.textContent = 'Kokotoa kwanza.'; return; }
    var summary = primary.textContent + ' — ' + sub.textContent + '. Makadirio ya kupanga; thibitisha na mamlaka au mtoa huduma.';
    var clipboard = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(summary) : Promise.reject(new Error('clipboard'));
    clipboard.then(function () { status.textContent = 'Muhtasari umenakiliwa.'; })
      .catch(function () { status.textContent = 'Kunakili kumezuiwa na kivinjari.'; });
  });

  actions.querySelector('[data-sw-transport-reset]').addEventListener('click', function () {
    document.querySelectorAll('input[id]').forEach(function (field) {
      if (field.type === 'checkbox') field.checked = false;
      else field.value = '';
    });
    clear('Fomu imerejeshwa.');
  });
})(window);
