(function () {
  'use strict';
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.rentBuyScenario;
  var config = window.RentVsBuyPage || {};
  if (!engine) return;

  var result = null;
  var form = document.getElementById('rvb-form');
  var status = document.getElementById('rvb-status');
  var currency = document.getElementById('rvb-currency');

  function value(id) { return Number(document.getElementById(id).value); }
  function input() {
    return {
      horizonMonths: value('rvb-months'),
      confirmedInputs: document.getElementById('rvb-confirm').checked,
      rentUpfrontCash: value('rvb-rent-upfront'),
      rentMonthlyHousing: value('rvb-rent-housing'),
      rentMonthlyOther: value('rvb-rent-other-monthly'),
      rentOtherOneOff: value('rvb-rent-oneoff'),
      rentFinalCashReceived: value('rvb-rent-final'),
      buyUpfrontCash: value('rvb-buy-upfront'),
      buyMonthlyHousing: value('rvb-buy-housing'),
      buyMonthlyOther: value('rvb-buy-other-monthly'),
      buyOtherOneOff: value('rvb-buy-oneoff'),
      buyFinalCashReceived: value('rvb-buy-final')
    };
  }
  function money(number) {
    return new Intl.NumberFormat(config.locale || 'en', {
      style: 'currency',
      currency: currency.options[currency.selectedIndex].dataset.code,
      maximumFractionDigits: 2
    }).format(number);
  }
  function set(id, text) { document.getElementById(id).textContent = text; }
  function sideRows(side, labels) {
    return [
      [labels.upfront, money(side.input.upfrontCash)],
      [labels.monthlyHousing, money(side.input.monthlyHousing)],
      [labels.monthlyOther, money(side.input.monthlyOther)],
      [labels.horizonMonthly, money(side.horizonMonthlyCashOut)],
      [labels.oneOff, money(side.input.otherOneOff)],
      [labels.gross, money(side.grossCashOut)],
      [labels.finalCash, money(side.finalCashReceived)],
      [labels.net, money(side.netCashCost)]
    ];
  }
  function render() {
    var lower = config.lower[result.lowerEnteredCashCost];
    set('rvb-scenario-line', lower.title);
    set('rvb-scenario-note', lower.note);
    set('rvb-gap', money(result.absoluteDifference));
    set('rvb-horizon', config.months(result.horizonMonths));
    set('rvb-rent-net', money(result.rent.netCashCost));
    set('rvb-buy-net', money(result.buy.netCashCost));
    set('rvb-rent-gross', money(result.rent.grossCashOut));
    set('rvb-rent-final-result', money(result.rent.finalCashReceived));
    set('rvb-buy-gross', money(result.buy.grossCashOut));
    set('rvb-buy-final-result', money(result.buy.finalCashReceived));
  }
  function calculate(event) {
    if (event) event.preventDefault();
    try {
      result = engine.compare(input());
      render();
      status.textContent = config.updated;
    } catch (error) {
      result = null;
      status.textContent = error.message;
    }
  }
  function ensure() {
    if (!result) calculate();
    return result;
  }
  function reportRows() {
    return [
      [config.labels.horizon, config.months(result.horizonMonths)],
      [config.labels.rentNet, money(result.rent.netCashCost)],
      [config.labels.buyNet, money(result.buy.netCashCost)],
      [config.labels.difference, money(result.absoluteDifference)],
      [config.labels.scenarioLine, config.lower[result.lowerEnteredCashCost].title]
    ];
  }
  function summary() {
    return [config.reportTitle]
      .concat(reportRows().map(function (row) { return row[0] + ': ' + row[1]; }))
      .concat(['', config.rentTitle])
      .concat(sideRows(result.rent, config.sideLabels).map(function (row) { return row[0] + ': ' + row[1]; }))
      .concat(['', config.buyTitle])
      .concat(sideRows(result.buy, config.sideLabels).map(function (row) { return row[0] + ': ' + row[1]; }))
      .concat(['', config.methodNote, config.disclaimer])
      .join('\n');
  }
  function copy() {
    if (!ensure()) return;
    if (!navigator.clipboard) { status.textContent = config.copyUnavailable; return; }
    navigator.clipboard.writeText(summary()).then(function () {
      status.textContent = config.copied;
    }).catch(function () { status.textContent = config.copyUnavailable; });
  }
  function json() {
    if (!ensure()) return;
    var payload = {
      schemaVersion: 1,
      tool: 'rent-vs-buy',
      currency: currency.options[currency.selectedIndex].dataset.code,
      horizonMonths: result.horizonMonths,
      inputs: { rent: result.rent.input, buy: result.buy.input },
      results: {
        rentNetCashCost: result.rent.netCashCost,
        buyNetCashCost: result.buy.netCashCost,
        difference: result.difference,
        lowerEnteredCashCost: result.lowerEnteredCashCost
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
        noGate: true,
        skipGate: true,
        title: config.reportTitle,
        subtitle: config.reportSubtitle,
        country: config.localScenario,
        toolId: 'rent-vs-buy',
        heroStats: reportRows().slice(0, 4).map(function (row, index) {
          return { label: row[0], value: row[1], highlight: index === 3 };
        }),
        sections: [
          { title: config.rentTitle, rows: sideRows(result.rent, config.sideLabels).map(function (row) { return { label: row[0], value: row[1] }; }) },
          { title: config.buyTitle, rows: sideRows(result.buy, config.sideLabels).map(function (row) { return { label: row[0], value: row[1] }; }) },
          { title: config.boundaryTitle, rows: [{ label: config.boundaryLabel, value: config.methodNote }] }
        ],
        disclaimer: config.disclaimer
      });
      status.textContent = config.pdfReady;
    } catch (error) { status.textContent = error.message; }
  }

  form.addEventListener('submit', calculate);
  form.addEventListener('reset', function () { setTimeout(calculate, 0); });
  form.addEventListener('input', function () { status.textContent = config.changed; });
  currency.addEventListener('change', function () { if (result) render(); });
  document.getElementById('rvb-copy').addEventListener('click', copy);
  document.getElementById('rvb-json').addEventListener('click', json);
  document.getElementById('rvb-pdf').addEventListener('click', pdf);
  calculate();
})();
