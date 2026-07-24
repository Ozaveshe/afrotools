(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.investmentReturn;
  if (!engine) return;
  var result = null;
  var currency = document.getElementById('ir-currency');
  var status = document.getElementById('ir-status');

  function value(id) { return Number(document.getElementById(id).value); }
  function formatMoney(amount) {
    var option = currency.options[currency.selectedIndex];
    return new Intl.NumberFormat('en', { style: 'currency', currency: option.dataset.code, maximumFractionDigits: 2 }).format(amount);
  }
  function formatPercent(amount) { return new Intl.NumberFormat('en', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount); }
  function metric(label, value, className) { return '<div class="ir-metric"><span>' + label + '</span><strong class="' + (className || '') + '">' + value + '</strong></div>'; }
  function input() {
    return {
      initialInvestment: value('ir-initial'),
      monthlyContribution: value('ir-monthly'),
      annualRatePercent: value('ir-rate'),
      years: value('ir-years'),
      compoundsPerYear: value('ir-compound'),
      contributionTiming: document.getElementById('ir-timing').value,
      inflationRatePercent: value('ir-inflation')
    };
  }

  function renderChart(rows, initialValue) {
    var svg = document.getElementById('ir-chart');
    if (!rows.length) { svg.innerHTML = ''; return; }
    var chartRows = [{ month: 0, balance: initialValue }].concat(rows);
    var max = Math.max.apply(null, chartRows.map(function (row) { return row.balance; }).concat([1]));
    var points = chartRows.map(function (row, index) {
      var x = index / (chartRows.length - 1) * 960 + 20;
      var y = 185 - row.balance / max * 155;
      return x.toFixed(1) + ',' + y.toFixed(1);
    });
    var area = '20,190 ' + points.join(' ') + ' 980,190';
    svg.innerHTML = '<title>Projected balance over time</title><path class="ir-chart-area" d="M ' + area + ' Z"></path><polyline class="ir-chart-line" points="' + points.join(' ') + '"></polyline>';
  }

  function renderTable(rows) {
    document.getElementById('ir-year-body').innerHTML = rows.map(function (row) {
      var label = row.year % 1 === 0 ? 'Year ' + row.year : 'Month ' + row.month;
      return '<tr><td>' + label + '</td><td>' + formatMoney(row.totalContributed) + '</td><td>' + formatMoney(row.projectedGain) + '</td><td><strong>' + formatMoney(row.balance) + '</strong></td></tr>';
    }).join('');
  }

  function calculate(event) {
    if (event) event.preventDefault();
    try {
      result = engine.project(input());
      var gainClass = result.projectedGain >= 0 ? 'ir-positive' : 'ir-negative';
      document.getElementById('ir-final').textContent = formatMoney(result.finalValue);
      document.getElementById('ir-metrics').innerHTML =
        metric('Total contributed', formatMoney(result.totalContributed)) +
        metric('Projected gain / loss', formatMoney(result.projectedGain), gainClass) +
        metric('Gain on contributions', formatPercent(result.gainOnContributions), gainClass) +
        metric('Effective annual return', formatPercent(result.effectiveAnnualRate)) +
        metric('Real annual return', formatPercent(result.realEffectiveAnnualRate)) +
        metric('Today-money value', formatMoney(result.purchasingPowerValue));
      document.getElementById('ir-result-note').textContent = result.input.contributionTiming === 'beginning'
        ? 'Monthly contributions are added before each month\'s growth.'
        : 'Monthly contributions are added after each month\'s growth.';
      renderChart(result.yearData, result.input.initialInvestment);
      renderTable(result.yearData);
      document.getElementById('ir-sensitivity').innerHTML = engine.sensitivity(input(), 2).map(function (scenario) {
        return '<div class="ir-scenario"><span>' + scenario.label + ' rate</span><strong>' + formatMoney(scenario.finalValue) + '</strong><small>' + scenario.annualRatePercent.toFixed(2) + '% entered annual rate</small></div>';
      }).join('');
      status.textContent = '';
    } catch (error) {
      result = null;
      status.textContent = error.message;
    }
  }

  function summaryRows() {
    return [
      ['Final projected value', formatMoney(result.finalValue)],
      ['Total contributed', formatMoney(result.totalContributed)],
      ['Projected gain / loss', formatMoney(result.projectedGain)],
      ['Effective annual return', formatPercent(result.effectiveAnnualRate)],
      ['Real annual return', formatPercent(result.realEffectiveAnnualRate)],
      ['Today-money value', formatMoney(result.purchasingPowerValue)]
    ];
  }

  function summaryText() {
    return ['Investment return projection'].concat(summaryRows().map(function (row) { return row[0] + ': ' + row[1]; }), [
      'Assumptions: ' + result.input.annualRatePercent + '% annual rate, ' + result.input.inflationRatePercent + '% inflation, ' + result.input.years + ' years, contributions at month ' + result.input.contributionTiming + '.',
      'Planning estimate only. Returns are not guaranteed; fees and taxes are not modelled.'
    ]).join('\n');
  }

  function copySummary() {
    if (!result) calculate();
    if (!result || !navigator.clipboard) { status.textContent = 'Copy is unavailable in this browser.'; return; }
    navigator.clipboard.writeText(summaryText()).then(function () { status.textContent = 'Summary copied.'; }).catch(function () { status.textContent = 'Copy failed.'; });
  }

  function downloadCsv() {
    if (!result) calculate();
    if (!result) return;
    var lines = [
      ['Investment return projection'],
      ['Initial investment', result.input.initialInvestment.toFixed(2)],
      ['Monthly contribution', result.input.monthlyContribution.toFixed(2)],
      ['Entered nominal annual return (%)', result.input.annualRatePercent.toFixed(2)],
      ['Compounding periods per year', String(result.input.compoundsPerYear)],
      ['Contribution timing', result.input.contributionTiming + ' of month'],
      ['Investment period (years)', String(result.input.years)],
      ['Inflation assumption (%)', result.input.inflationRatePercent.toFixed(2)],
      [],
      ['Period', 'Total contributed', 'Projected gain or loss', 'Projected balance']
    ].concat(result.yearData.map(function (row) {
      return [row.year % 1 === 0 ? 'Year ' + row.year : 'Month ' + row.month, row.totalContributed.toFixed(2), row.projectedGain.toFixed(2), row.balance.toFixed(2)];
    }));
    function csvCell(cell) { return '"' + String(cell == null ? '' : cell).replace(/"/g, '""') + '"'; }
    var blob = new Blob(['\uFEFF' + lines.map(function (row) { return row.map(csvCell).join(','); }).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url; link.download = 'investment-return-projection.csv'; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    status.textContent = 'CSV downloaded locally.';
  }

  async function downloadPdf() {
    if (!result) calculate();
    if (!result) return;
    try {
      if (!window.AfroTools || !window.AfroTools.pdf) throw new Error('PDF library is unavailable.');
      await window.AfroTools.pdf.generate({
        noGate: true,
        skipGate: true,
        title: 'Investment Return Projection',
        subtitle: result.input.years + ' years - ' + result.input.annualRatePercent + '% entered annual return',
        toolId: 'investment-return',
        country: 'Pan-African planning tool',
        effectiveRate: result.effectiveAnnualRate,
        heroStats: summaryRows().slice(0, 4).map(function (row, index) { return { label: row[0], value: row[1], highlight: index === 0 }; }),
        sections: [{ title: 'Assumptions and purchasing power', rows: [
          { label: 'Initial investment', value: formatMoney(result.input.initialInvestment) },
          { label: 'Monthly contribution', value: formatMoney(result.input.monthlyContribution) },
          { label: 'Compounding frequency', value: result.input.compoundsPerYear + ' times per year' },
          { label: 'Monthly contribution timing', value: result.input.contributionTiming + ' of month' },
          { label: 'Inflation assumption', value: result.input.inflationRatePercent + '%' },
          { label: 'Real annual return', value: formatPercent(result.realEffectiveAnnualRate) },
          { label: 'Today-money value', value: formatMoney(result.purchasingPowerValue), type: 'total' }
        ] }],
        source: 'Method reviewed against the U.S. SEC Investor.gov compound-interest input model and the Fisher real-return relationship.',
        disclaimer: 'Planning estimate only. The entered return and inflation rates are assumptions, not forecasts. Fees, taxes, volatility, defaults, currency movement and provider rules are not modelled.'
      });
      status.textContent = 'PDF generated locally.';
    } catch (error) { status.textContent = error.message; }
  }

  document.getElementById('ir-form').addEventListener('submit', calculate);
  document.getElementById('ir-form').addEventListener('reset', function () { window.setTimeout(calculate, 0); });
  document.getElementById('ir-copy').addEventListener('click', copySummary);
  document.getElementById('ir-csv').addEventListener('click', downloadCsv);
  document.getElementById('ir-pdf').addEventListener('click', downloadPdf);
  currency.addEventListener('change', calculate);
  calculate();
})();
