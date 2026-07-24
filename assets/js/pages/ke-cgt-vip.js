(function () {
  'use strict';
  var app = document.querySelector('[data-ke-cgt-app]');
  var engine = window.AfroTools && window.AfroTools.KenyaCgt;
  if (!app || !engine) return;
  var form = app.querySelector('form');
  var result = app.querySelector('[data-result]');
  var error = app.querySelector('[data-error]');
  var status = app.querySelector('[data-status]');
  var lastSummary = '';

  function field(name) { return app.querySelector('[name="' + name + '"]'); }
  function number(name) { return Number(field(name).value); }
  function checked(name) { return field(name).checked; }
  function copy(key) { return app.dataset[key] || key; }
  function set(selector, value) { app.querySelector(selector).textContent = value; }
  function money(value) {
    return new Intl.NumberFormat(app.dataset.locale || 'en-KE', {
      style: 'currency', currency: 'KES', maximumFractionDigits: 2
    }).format(value);
  }
  function syncExemption() {
    var claimed = checked('exemptionClaimed');
    app.querySelector('[data-exemption-confirm]').hidden = !claimed;
    if (!claimed) field('exemptionConfirmed').checked = false;
  }
  function fail(message, target) {
    result.hidden = true;
    error.textContent = message;
    (target || field('scopeConfirmed')).focus();
  }
  function readInput() {
    return {
      scopeConfirmed: checked('scopeConfirmed'),
      exemptionClaimed: checked('exemptionClaimed'),
      exemptionConfirmed: checked('exemptionConfirmed'),
      transferValue: number('transferValue'),
      acquisitionCost: number('acquisitionCost'),
      acquisitionCosts: number('acquisitionCosts'),
      enhancementCosts: number('enhancementCosts'),
      preservationCosts: number('preservationCosts'),
      transferCosts: number('transferCosts')
    };
  }
  function calculate() {
    error.textContent = '';
    if (!checked('scopeConfirmed')) return fail(copy('scopeError'), field('scopeConfirmed'));
    if (checked('exemptionClaimed') && !checked('exemptionConfirmed')) {
      return fail(copy('exemptionError'), field('exemptionConfirmed'));
    }
    try {
      var out = engine.calculate(readInput());
      set('[data-tax]', money(out.tax));
      app.querySelector('[data-tax]').dataset.amount = String(out.tax);
      set('[data-gain]', money(out.rawGain));
      set('[data-taxable]', money(out.taxableGain));
      set('[data-net-transfer]', money(out.netTransferValue));
      set('[data-adjusted-cost]', money(out.adjustedCost));
      set('[data-net-proceeds]', money(out.netProceedsAfterTax));
      set('[data-treatment]', out.exempt ? copy('exemptLabel') : copy('taxableLabel'));
      set('[data-formula]', money(out.transferValue) + ' - ' + money(out.transferCosts) + ' - ' + money(out.adjustedCost) + ' = ' + money(out.rawGain));
      lastSummary = [
        copy('summaryTitle'),
        copy('reviewLabel') + ': ' + out.reviewedAt,
        copy('gainLabel') + ': ' + money(out.rawGain),
        copy('taxableGainLabel') + ': ' + money(out.taxableGain),
        copy('taxLabel') + ': ' + money(out.tax),
        copy('treatmentLabel') + ': ' + (out.exempt ? copy('exemptLabel') : copy('taxableLabel')),
        copy('scopeNote')
      ].join('\n');
      result.hidden = false;
      result.focus();
    } catch (cause) {
      fail(copy('numberError'));
    }
  }
  function copySummary() {
    if (!lastSummary) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lastSummary).then(function () {
        status.textContent = copy('copied');
      }).catch(function () { status.textContent = copy('copyError'); });
    } else status.textContent = copy('copyError');
  }
  function downloadSummary() {
    if (!lastSummary) return;
    var blob = new Blob([lastSummary + '\n'], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'kenya-cgt-estimate.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    status.textContent = copy('downloaded');
  }
  form.addEventListener('submit', function (event) { event.preventDefault(); calculate(); });
  field('exemptionClaimed').addEventListener('change', syncExemption);
  app.querySelector('[data-copy]').addEventListener('click', copySummary);
  app.querySelector('[data-download]').addEventListener('click', downloadSummary);
  syncExemption();
})();
