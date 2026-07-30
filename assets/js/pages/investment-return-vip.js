(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.investmentReturn;
  if (!engine) return;
  var result = null;
  var currency = document.getElementById('ir-currency');
  var status = document.getElementById('ir-status');
  var french = document.documentElement.lang === 'fr';
  function t(english, frenchCopy) { return french ? frenchCopy : english; }

  function value(id) { return Number(document.getElementById(id).value); }
  function formatMoney(amount) {
    var option = currency.options[currency.selectedIndex];
    return new Intl.NumberFormat(french ? 'fr' : 'en', { style: 'currency', currency: option.dataset.code, maximumFractionDigits: 2 }).format(amount);
  }
  function formatPercent(amount) { return new Intl.NumberFormat(french ? 'fr' : 'en', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount); }
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
    svg.innerHTML = '<title>' + t('Projected balance over time','Solde projeté dans le temps') + '</title><path class="ir-chart-area" d="M ' + area + ' Z"></path><polyline class="ir-chart-line" points="' + points.join(' ') + '"></polyline>';
  }

  function renderTable(rows) {
    document.getElementById('ir-year-body').innerHTML = rows.map(function (row) {
      var label = row.year % 1 === 0 ? t('Year ','Année ') + row.year : t('Month ','Mois ') + row.month;
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
        metric(t('Total contributed','Total versé'), formatMoney(result.totalContributed)) +
        metric(t('Projected gain / loss','Gain / perte projeté'), formatMoney(result.projectedGain), gainClass) +
        metric(t('Gain on contributions','Gain sur les versements'), formatPercent(result.gainOnContributions), gainClass) +
        metric(t('Effective annual return','Rendement annuel effectif'), formatPercent(result.effectiveAnnualRate)) +
        metric(t('Real annual return','Rendement annuel réel'), formatPercent(result.realEffectiveAnnualRate)) +
        metric(t('Today-money value','Valeur en monnaie actuelle'), formatMoney(result.purchasingPowerValue));
      document.getElementById('ir-result-note').textContent = result.input.contributionTiming === 'beginning'
        ? t('Monthly contributions are added before each month\'s growth.','Les versements mensuels sont ajoutés avant la croissance de chaque mois.')
        : t('Monthly contributions are added after each month\'s growth.','Les versements mensuels sont ajoutés après la croissance de chaque mois.');
      renderChart(result.yearData, result.input.initialInvestment);
      renderTable(result.yearData);
      document.getElementById('ir-sensitivity').innerHTML = engine.sensitivity(input(), 2).map(function (scenario) {
        var label = scenario.label === 'Lower' ? t('Lower','Inférieur') : scenario.label === 'Higher' ? t('Higher','Supérieur') : scenario.label;
        return '<div class="ir-scenario"><span>' + label + t(' rate','') + '</span><strong>' + formatMoney(scenario.finalValue) + '</strong><small>' + scenario.annualRatePercent.toFixed(2) + t('% entered annual rate',' % de rendement annuel saisi') + '</small></div>';
      }).join('');
      status.textContent = '';
    } catch (error) {
      result = null;
      status.textContent = error.message;
    }
  }

  function summaryRows() {
    return [
      [t('Final projected value','Valeur finale projetée'), formatMoney(result.finalValue)],
      [t('Total contributed','Total versé'), formatMoney(result.totalContributed)],
      [t('Projected gain / loss','Gain / perte projeté'), formatMoney(result.projectedGain)],
      [t('Effective annual return','Rendement annuel effectif'), formatPercent(result.effectiveAnnualRate)],
      [t('Real annual return','Rendement annuel réel'), formatPercent(result.realEffectiveAnnualRate)],
      [t('Today-money value','Valeur en monnaie actuelle'), formatMoney(result.purchasingPowerValue)]
    ];
  }

  function summaryText() {
    return [t('Investment return projection','Projection du rendement d’investissement')].concat(summaryRows().map(function (row) { return row[0] + ': ' + row[1]; }), [
      french ? 'Hypothèses : rendement annuel de ' + result.input.annualRatePercent + ' %, inflation de ' + result.input.inflationRatePercent + ' %, durée de ' + result.input.years + ' ans, versements en ' + (result.input.contributionTiming === 'beginning' ? 'début' : 'fin') + ' de mois.' : 'Assumptions: ' + result.input.annualRatePercent + '% annual rate, ' + result.input.inflationRatePercent + '% inflation, ' + result.input.years + ' years, contributions at month ' + result.input.contributionTiming + '.',
      t('Planning estimate only. Returns are not guaranteed; fees and taxes are not modelled.','Estimation de planification uniquement. Les rendements ne sont pas garantis ; frais et impôts ne sont pas modélisés.')
    ]).join('\n');
  }

  function copySummary() {
    if (!result) calculate();
    if (!result || !navigator.clipboard) { status.textContent = t('Copy is unavailable in this browser.','La copie n’est pas disponible dans ce navigateur.'); return; }
    navigator.clipboard.writeText(summaryText()).then(function () { status.textContent = t('Summary copied.','Résumé copié.'); }).catch(function () { status.textContent = t('Copy failed.','Échec de la copie.'); });
  }

  function downloadCsv() {
    if (!result) calculate();
    if (!result) return;
    var lines = [
      [t('Investment return projection','Projection du rendement d’investissement')],
      [t('Initial investment','Capital initial'), result.input.initialInvestment.toFixed(2)],
      [t('Monthly contribution','Versement mensuel'), result.input.monthlyContribution.toFixed(2)],
      [t('Entered nominal annual return (%)','Rendement annuel nominal saisi (%)'), result.input.annualRatePercent.toFixed(2)],
      [t('Compounding periods per year','Périodes de capitalisation par an'), String(result.input.compoundsPerYear)],
      [t('Contribution timing','Moment du versement'), french ? (result.input.contributionTiming === 'beginning' ? 'début de mois' : 'fin de mois') : result.input.contributionTiming + ' of month'],
      [t('Investment period (years)','Durée du placement (années)'), String(result.input.years)],
      [t('Inflation assumption (%)','Hypothèse d’inflation (%)'), result.input.inflationRatePercent.toFixed(2)],
      [],
      [t('Period','Période'), t('Total contributed','Total versé'), t('Projected gain or loss','Gain ou perte projeté'), t('Projected balance','Solde projeté')]
    ].concat(result.yearData.map(function (row) {
      return [row.year % 1 === 0 ? t('Year ','Année ') + row.year : t('Month ','Mois ') + row.month, row.totalContributed.toFixed(2), row.projectedGain.toFixed(2), row.balance.toFixed(2)];
    }));
    function csvCell(cell) { return '"' + String(cell == null ? '' : cell).replace(/"/g, '""') + '"'; }
    var blob = new Blob(['\uFEFF' + lines.map(function (row) { return row.map(csvCell).join(','); }).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url; link.download = french ? 'projection-rendement-investissement.csv' : 'investment-return-projection.csv'; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    status.textContent = t('CSV downloaded locally.','CSV téléchargé localement.');
  }

  async function downloadPdf() {
    if (!result) calculate();
    if (!result) return;
    try {
      if (!window.AfroTools || !window.AfroTools.pdf) throw new Error('PDF library is unavailable.');
      await window.AfroTools.pdf.generate({
        noGate: true,
        skipGate: true,
        title: t('Investment Return Projection','Projection du rendement d’investissement'),
        subtitle: result.input.years + t(' years - ',' ans — ') + result.input.annualRatePercent + t('% entered annual return',' % de rendement annuel saisi'),
        toolId: 'investment-return',
        country: t('Pan-African planning tool','Outil de planification panafricain'),
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
        source: t('Method reviewed against the U.S. SEC Investor.gov compound-interest input model and the Fisher real-return relationship.','Méthode vérifiée avec le modèle d’entrées d’intérêts composés d’Investor.gov et la relation de Fisher pour le rendement réel.'),
        disclaimer: t('Planning estimate only. The entered return and inflation rates are assumptions, not forecasts. Fees, taxes, volatility, defaults, currency movement and provider rules are not modelled.','Estimation de planification uniquement. Rendement et inflation saisis sont des hypothèses, pas des prévisions. Frais, impôts, volatilité, défauts, change et règles des fournisseurs ne sont pas modélisés.')
      });
      status.textContent = t('PDF generated locally.','PDF généré localement.');
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
