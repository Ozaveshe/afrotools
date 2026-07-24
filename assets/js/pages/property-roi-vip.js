(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.propertyInvestmentAnalysis;
  var config = window.PropertyRoiPage || {};
  if (!engine) return;

  var result = null;
  var form = document.getElementById('pr-form');
  var currency = document.getElementById('pr-currency');
  var status = document.getElementById('pr-status');

  function value(id) { return Number(document.getElementById(id).value); }
  function input() {
    return {
      purchasePrice: value('pr-purchase'),
      buyingCosts: value('pr-buying-costs'),
      improvements: value('pr-improvements'),
      salePrice: value('pr-sale'),
      sellingCosts: value('pr-selling-costs'),
      taxPaid: value('pr-tax'),
      grossRent: value('pr-rent'),
      vacancyLoss: value('pr-vacancy'),
      operatingExpenses: value('pr-operating'),
      financingCosts: value('pr-financing'),
      yearsHeld: value('pr-years')
    };
  }
  function money(number) {
    var option = currency.options[currency.selectedIndex];
    return new Intl.NumberFormat(config.locale || 'en', {
      style: 'currency', currency: option.dataset.code, maximumFractionDigits: 2
    }).format(number);
  }
  function percent(number) {
    return new Intl.NumberFormat(config.locale || 'en', {
      style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(number);
  }
  function set(id, text, tone) {
    var element = document.getElementById(id);
    element.textContent = text;
    if (tone) element.dataset.tone = tone;
  }
  function calculate(event) {
    if (event) event.preventDefault();
    try {
      result = engine.analyse(input());
      var tone = result.totalProfit >= 0 ? 'positive' : 'negative';
      set('pr-profit', money(result.totalProfit), tone);
      set('pr-total-roi', percent(result.totalRoi), tone);
      set('pr-average-roi', percent(result.simpleAverageAnnualRoi), tone);
      set('pr-capital-change', money(result.capitalPriceChange), result.capitalPriceChange >= 0 ? 'positive' : 'negative');
      set('pr-net-cashflow', money(result.netOperatingCashFlow), result.netOperatingCashFlow >= 0 ? 'positive' : 'negative');
      set('pr-net-sale', money(result.netSaleProceeds));
      set('pr-basis', money(result.propertyBasis));
      set('pr-gross-yield', percent(result.grossRentalYield));
      set('pr-net-yield', percent(result.netRentalYield), result.netRentalYield >= 0 ? 'positive' : 'negative');
      set('pr-inflows', money(result.totalCashInflows));
      set('pr-outflows', money(result.totalCashOutflows));
      document.getElementById('pr-results').classList.add('is-ready');
      status.textContent = config.updated || 'Analysis updated locally.';
    } catch (error) {
      result = null;
      status.textContent = (config.errors && config.errors[error.message]) || error.message;
    }
  }
  function ensureResult() {
    if (!result) calculate();
    return result;
  }
  function rows() {
    return [
      [config.labels.totalProfit, money(result.totalProfit)],
      [config.labels.totalRoi, percent(result.totalRoi)],
      [config.labels.averageRoi, percent(result.simpleAverageAnnualRoi)],
      [config.labels.netCashflow, money(result.netOperatingCashFlow)],
      [config.labels.netSale, money(result.netSaleProceeds)],
      [config.labels.propertyBasis, money(result.propertyBasis)],
      [config.labels.grossYield, percent(result.grossRentalYield)],
      [config.labels.netYield, percent(result.netRentalYield)]
    ];
  }
  function summary() {
    return [config.reportTitle].concat(rows().map(function (row) { return row[0] + ': ' + row[1]; }), [
      config.assumptionSummary(result.input),
      config.disclaimer
    ]).join('\n');
  }
  function copySummary() {
    if (!ensureResult()) return;
    if (!navigator.clipboard) { status.textContent = config.copyUnavailable; return; }
    navigator.clipboard.writeText(summary()).then(function () {
      status.textContent = config.copied;
    }).catch(function () { status.textContent = config.copyUnavailable; });
  }
  function downloadJson() {
    if (!ensureResult()) return;
    var payload = {
      schemaVersion: 1,
      tool: 'property-roi',
      currency: currency.options[currency.selectedIndex].dataset.code,
      inputs: result.input,
      results: {
        propertyBasis: result.propertyBasis,
        capitalPriceChange: result.capitalPriceChange,
        netOperatingCashFlow: result.netOperatingCashFlow,
        netSaleProceeds: result.netSaleProceeds,
        totalProfit: result.totalProfit,
        totalRoi: result.totalRoi,
        simpleAverageAnnualRoi: result.simpleAverageAnnualRoi,
        grossRentalYield: result.grossRentalYield,
        netRentalYield: result.netRentalYield
      },
      definitions: engine.formulaParameters
    };
    var url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = config.jsonFilename || 'property-investment-analysis.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    status.textContent = config.downloaded;
  }
  async function downloadPdf() {
    if (!ensureResult()) return;
    try {
      if (!window.AfroTools || !window.AfroTools.pdf) throw new Error(config.pdfUnavailable);
      await window.AfroTools.pdf.generate({
        noGate: true,
        skipGate: true,
        title: config.reportTitle,
        subtitle: config.reportSubtitle(result.input),
        toolId: 'property-roi',
        country: config.countryLabel,
        heroStats: rows().slice(0, 4).map(function (row, index) {
          return { label: row[0], value: row[1], highlight: index === 0 };
        }),
        sections: [
          { title: config.breakdownTitle, rows: rows().slice(4).map(function (row) {
            return { label: row[0], value: row[1] };
          }) },
          { title: config.methodTitle || 'Method boundary', rows: [
            { label: config.methodLabel || 'Calculation basis', value: config.methodNote }
          ] }
        ],
        disclaimer: config.disclaimer
      });
      status.textContent = config.pdfReady;
    } catch (error) { status.textContent = error.message; }
  }

  form.addEventListener('submit', calculate);
  form.addEventListener('reset', function () { window.setTimeout(calculate, 0); });
  currency.addEventListener('change', calculate);
  document.getElementById('pr-copy').addEventListener('click', copySummary);
  document.getElementById('pr-json').addEventListener('click', downloadJson);
  document.getElementById('pr-pdf').addEventListener('click', downloadPdf);
  form.addEventListener('input', function () { status.textContent = config.changed; });
  calculate();
})();
