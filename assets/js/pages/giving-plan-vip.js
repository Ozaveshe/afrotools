(function () {
  'use strict';
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.givingPlan;
  var config = window.GivingPlanPage || {};
  if (!engine) return;
  var result = null;
  var status = document.getElementById('gp-status');
  var currency = document.getElementById('gp-currency');
  function value(id) { return Number(document.getElementById(id).value); }
  function input() {
    return {
      referenceAmount: value('gp-reference'),
      chosenRatePercent: value('gp-rate'),
      additionalOffering: value('gp-offering'),
      pledgeGoal: value('gp-pledge'),
      pledgePeriods: value('gp-periods'),
      essentialCosts: value('gp-essentials'),
      confirmedChoice: document.getElementById('gp-confirm').checked
    };
  }
  function money(number) {
    return new Intl.NumberFormat(config.locale || 'en', {
      style: 'currency',
      currency: currency.options[currency.selectedIndex].dataset.code,
      maximumFractionDigits: 2
    }).format(number);
  }
  function percent(number) {
    return number === null ? config.notApplicable : new Intl.NumberFormat(config.locale || 'en', {
      style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(number);
  }
  function set(id, text) { document.getElementById(id).textContent = text; }
  function render() {
    set('gp-total', money(result.plannedContribution));
    set('gp-percentage', money(result.percentageContribution));
    set('gp-offering-result', money(result.input.additionalOffering));
    set('gp-pledge-result', money(result.pledgePerPeriod));
    set('gp-remaining', money(result.remainingAfterPlan));
    set('gp-share', percent(result.plannedShareOfReference));
    set('gp-essentials-result', money(result.input.essentialCosts));
    set('gp-reference-result', money(result.input.referenceAmount));
  }
  function calculate(event) {
    if (event) event.preventDefault();
    try {
      result = engine.plan(input());
      render();
      status.textContent = config.updated;
    } catch (error) {
      result = null;
      status.textContent = error.message;
    }
  }
  function ensure() { if (!result) calculate(); return result; }
  function rows() {
    return [
      [config.labels.reference, money(result.input.referenceAmount)],
      [config.labels.rate, result.input.chosenRatePercent.toFixed(2) + '%'],
      [config.labels.percentage, money(result.percentageContribution)],
      [config.labels.offering, money(result.input.additionalOffering)],
      [config.labels.pledgeGoal, money(result.input.pledgeGoal)],
      [config.labels.pledgePeriods, String(result.input.pledgePeriods)],
      [config.labels.pledgeAllocation, money(result.pledgePerPeriod)],
      [config.labels.total, money(result.plannedContribution)],
      [config.labels.essentials, money(result.input.essentialCosts)],
      [config.labels.remaining, money(result.remainingAfterPlan)],
      [config.labels.share, percent(result.plannedShareOfReference)]
    ];
  }
  function summary() {
    return [config.reportTitle].concat(rows().map(function (row) { return row[0] + ': ' + row[1]; }))
      .concat(['', config.methodNote, config.disclaimer]).join('\n');
  }
  function copy() {
    if (!ensure()) return;
    if (!navigator.clipboard) { status.textContent = config.copyUnavailable; return; }
    navigator.clipboard.writeText(summary()).then(function () { status.textContent = config.copied; })
      .catch(function () { status.textContent = config.copyUnavailable; });
  }
  function json() {
    if (!ensure()) return;
    var payload = {
      schemaVersion: 1,
      tool: 'tithe-offering',
      currency: currency.options[currency.selectedIndex].dataset.code,
      inputs: result.input,
      results: {
        percentageContribution: result.percentageContribution,
        pledgePerPeriod: result.pledgePerPeriod,
        plannedContribution: result.plannedContribution,
        remainingAfterPlan: result.remainingAfterPlan,
        plannedShareOfReference: result.plannedShareOfReference
      },
      definitions: engine.formulaParameters
    };
    var url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = config.jsonFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    status.textContent = config.downloaded;
  }
  async function pdf() {
    if (!ensure()) return;
    try {
      if (!window.AfroTools || !window.AfroTools.pdf) throw new Error(config.pdfUnavailable);
      await window.AfroTools.pdf.generate({
        noGate: true, skipGate: true, title: config.reportTitle, subtitle: config.reportSubtitle,
        country: config.privatePlan, toolId: 'tithe-offering',
        heroStats: rows().slice(2, 5).concat([rows()[7]]).map(function (row, index) {
          return { label: row[0], value: row[1], highlight: index === 3 };
        }),
        sections: [
          { title: config.inputsTitle, rows: rows().slice(0, 2).concat(rows().slice(4, 7)).concat(rows().slice(8, 9)).map(function (row) { return { label: row[0], value: row[1] }; }) },
          { title: config.boundaryTitle, rows: [{ label: config.boundaryLabel, value: config.methodNote }] }
        ],
        disclaimer: config.disclaimer
      });
      status.textContent = config.pdfReady;
    } catch (error) { status.textContent = error.message; }
  }
  var form = document.getElementById('gp-form');
  form.addEventListener('submit', calculate);
  form.addEventListener('reset', function () { setTimeout(calculate, 0); });
  form.addEventListener('input', function () { status.textContent = config.changed; });
  currency.addEventListener('change', function () { if (result) render(); });
  document.getElementById('gp-copy').addEventListener('click', copy);
  document.getElementById('gp-json').addEventListener('click', json);
  document.getElementById('gp-pdf').addEventListener('click', pdf);
  calculate();
})();
