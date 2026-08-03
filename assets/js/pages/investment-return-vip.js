(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.investmentReturn;
  var language = (document.documentElement.lang || 'en').slice(0, 2);
  var locale = language === 'fr' ? 'fr' : language === 'sw' ? 'sw' : 'en';
  var copy = {
    en: {
      ready:'Projection created locally.', stale:'Inputs changed. Calculate again before copying or exporting.',
      invalid:'Check the amounts, rates, term and compounding frequency.', copied:'Summary copied.',
      copyUnavailable:'Copy is unavailable in this browser.', copyFailed:'Copy failed.', csvReady:'CSV downloaded locally.',
      pdfReady:'PDF generated locally.', pdfUnavailable:'PDF creation is unavailable.', year:'Year ', month:'Month ',
      chart:'Projected balance over time', beginningNote:'Monthly contributions are added before each month\'s growth.',
      endNote:'Monthly contributions are added after each month\'s growth.', lower:'Lower rate', higher:'Higher rate',
      enteredRate:'% entered annual rate', title:'Investment return projection', final:'Final projected value',
      contributed:'Total contributed', gain:'Projected gain / loss', gainRatio:'Gain on contributions',
      effective:'Effective annual return', real:'Real annual return', purchasing:'Today-money value',
      assumptions:'Assumptions', initial:'Initial investment', monthly:'Monthly contribution', entered:'Entered nominal annual return (%)',
      periods:'Compounding periods per year', timing:'Contribution timing', years:'Investment period (years)', inflation:'Inflation assumption (%)',
      period:'Period', balance:'Projected balance', beginning:'beginning of month', end:'end of month',
      boundary:'Planning estimate only. Returns are not guaranteed; fees and taxes are not modelled.',
      pdfTitle:'Investment Return Projection', pdfSubtitleYears:' years — ', pdfSubtitleRate:'% entered annual return',
      country:'Pan-African planning tool', pdfSection:'Assumptions and purchasing power', frequency:'Compounding frequency',
      frequencyValue:' times per year', monthlyTiming:'Monthly contribution timing',
      source:'Method reviewed against the U.S. SEC Investor.gov compound-interest input model and the Fisher real-return relationship.',
      disclaimer:'Planning estimate only. The entered return and inflation rates are assumptions, not forecasts. Fees, taxes, volatility, defaults, currency movement and provider rules are not modelled.',
      csvFile:'investment-return-projection.csv'
    },
    fr: {
      ready:'Projection créée localement.', stale:'Les données ont changé. Recalculez avant de copier ou d’exporter.',
      invalid:'Vérifiez les montants, les taux, la durée et la fréquence de capitalisation.', copied:'Résumé copié.',
      copyUnavailable:'La copie n’est pas disponible dans ce navigateur.', copyFailed:'Échec de la copie.', csvReady:'CSV téléchargé localement.',
      pdfReady:'PDF généré localement.', pdfUnavailable:'La création du PDF est indisponible.', year:'Année ', month:'Mois ',
      chart:'Solde projeté dans le temps', beginningNote:'Les versements mensuels sont ajoutés avant la croissance de chaque mois.',
      endNote:'Les versements mensuels sont ajoutés après la croissance de chaque mois.', lower:'Taux inférieur', higher:'Taux supérieur',
      enteredRate:' % de rendement annuel saisi', title:'Projection du rendement d’investissement', final:'Valeur finale projetée',
      contributed:'Total versé', gain:'Gain / perte projeté', gainRatio:'Gain sur les versements',
      effective:'Rendement annuel effectif', real:'Rendement annuel réel', purchasing:'Valeur en monnaie actuelle',
      assumptions:'Hypothèses', initial:'Capital initial', monthly:'Versement mensuel', entered:'Rendement annuel nominal saisi (%)',
      periods:'Périodes de capitalisation par an', timing:'Moment du versement', years:'Durée du placement (années)', inflation:'Hypothèse d’inflation (%)',
      period:'Période', balance:'Solde projeté', beginning:'début de mois', end:'fin de mois',
      boundary:'Estimation de planification uniquement. Les rendements ne sont pas garantis ; frais et impôts ne sont pas modélisés.',
      pdfTitle:'Projection du rendement d’investissement', pdfSubtitleYears:' ans — ', pdfSubtitleRate:' % de rendement annuel saisi',
      country:'Outil de planification panafricain', pdfSection:'Hypothèses et pouvoir d’achat', frequency:'Fréquence de capitalisation',
      frequencyValue:' fois par an', monthlyTiming:'Moment du versement mensuel',
      source:'Méthode vérifiée avec le modèle d’entrées d’intérêts composés d’Investor.gov et la relation de Fisher pour le rendement réel.',
      disclaimer:'Estimation de planification uniquement. Rendement et inflation saisis sont des hypothèses, pas des prévisions. Frais, impôts, volatilité, défauts, change et règles des fournisseurs ne sont pas modélisés.',
      csvFile:'projection-rendement-investissement.csv'
    },
    sw: {
      ready:'Makadirio yamekokotolewa kwenye kifaa chako.', stale:'Taarifa zimebadilika. Kokotoa tena kabla ya kunakili au kupakua.',
      invalid:'Kagua kiasi, viwango, muda na marudio ya kujumuisha riba.', copied:'Muhtasari umenakiliwa.',
      copyUnavailable:'Kunakili hakupatikani kwenye kivinjari hiki.', copyFailed:'Kunakili kumeshindikana.', csvReady:'CSV imepakuliwa kwenye kifaa chako.',
      pdfReady:'PDF imeundwa kwenye kifaa chako.', pdfUnavailable:'Uundaji wa PDF haupatikani.', year:'Mwaka ', month:'Mwezi ',
      chart:'Salio linalokadiriwa kwa muda', beginningNote:'Michango ya kila mwezi huongezwa kabla ya ukuaji wa mwezi.',
      endNote:'Michango ya kila mwezi huongezwa baada ya ukuaji wa mwezi.', lower:'Kiwango cha chini', higher:'Kiwango cha juu',
      enteredRate:'% kiwango cha mwaka kilichoingizwa', title:'Makadirio ya faida ya uwekezaji', final:'Thamani ya mwisho inayokadiriwa',
      contributed:'Jumla ya michango', gain:'Faida / hasara inayokadiriwa', gainRatio:'Faida kwa michango',
      effective:'Faida halisi ya mwaka', real:'Faida halisi baada ya mfumuko', purchasing:'Thamani kwa pesa ya leo',
      assumptions:'Makadirio', initial:'Uwekezaji wa kuanzia', monthly:'Mchango wa kila mwezi', entered:'Faida ya kawaida ya mwaka iliyoingizwa (%)',
      periods:'Vipindi vya kujumuisha riba kwa mwaka', timing:'Wakati wa mchango', years:'Muda wa uwekezaji (miaka)', inflation:'Makadirio ya mfumuko wa bei (%)',
      period:'Kipindi', balance:'Salio linalokadiriwa', beginning:'mwanzoni mwa mwezi', end:'mwishoni mwa mwezi',
      boundary:'Makadirio ya kupanga tu. Faida haijahakikishwa; ada na kodi hazijahesabiwa.',
      pdfTitle:'Makadirio ya Faida ya Uwekezaji', pdfSubtitleYears:' miaka — ', pdfSubtitleRate:'% kiwango cha mwaka kilichoingizwa',
      country:'Zana ya kupanga kwa Afrika', pdfSection:'Makadirio na uwezo wa kununua', frequency:'Marudio ya kujumuisha riba',
      frequencyValue:' kwa mwaka', monthlyTiming:'Wakati wa mchango wa kila mwezi',
      source:'Mbinu imehakikiwa dhidi ya modeli ya riba ya mchanganyiko ya Investor.gov na uhusiano wa Fisher wa faida halisi.',
      disclaimer:'Makadirio ya kupanga tu. Faida na mfumuko ulioingiza ni dhana, si utabiri. Ada, kodi, mabadiliko ya soko, kushindwa kulipa, mwendo wa sarafu na masharti ya mtoa huduma hayajahesabiwa.',
      csvFile:'makadirio-faida-uwekezaji.csv'
    }
  }[locale];

  var result = null;
  var resultSignature = null;
  var form = document.getElementById('ir-form');
  var currency = document.getElementById('ir-currency');
  var status = document.getElementById('ir-status');
  var exportButtons = ['ir-copy', 'ir-csv', 'ir-pdf'].map(function (id) { return document.getElementById(id); });
  function value(id) { return Number(document.getElementById(id).value); }
  function node(tag, text, className) {
    var element = document.createElement(tag);
    if (text != null) element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  function clear(element) { while (element.firstChild) element.removeChild(element.firstChild); }
  function input() {
    return {
      displayCurrency:currency.options[currency.selectedIndex].dataset.code,
      initialInvestment:value('ir-initial'), monthlyContribution:value('ir-monthly'),
      annualRatePercent:value('ir-rate'), years:value('ir-years'), compoundsPerYear:value('ir-compound'),
      contributionTiming:document.getElementById('ir-timing').value, inflationRatePercent:value('ir-inflation')
    };
  }
  function signature(values) { return JSON.stringify(values || input()); }
  function isCurrent() { return Boolean(result && resultSignature === signature()); }
  function formatMoney(amount) {
    var option = currency.options[currency.selectedIndex];
    return new Intl.NumberFormat(locale, { style:'currency', currency:option.dataset.code, maximumFractionDigits:2 }).format(amount);
  }
  function formatPercent(amount) {
    return new Intl.NumberFormat(locale, { style:'percent', minimumFractionDigits:2, maximumFractionDigits:2 }).format(amount);
  }
  function setExports(enabled) { exportButtons.forEach(function (button) { button.disabled = !enabled; }); }
  function clearResult(message) {
    result = null;
    resultSignature = null;
    document.getElementById('ir-final').textContent = '—';
    clear(document.getElementById('ir-metrics'));
    clear(document.getElementById('ir-chart'));
    clear(document.getElementById('ir-sensitivity'));
    clear(document.getElementById('ir-year-body'));
    document.getElementById('ir-result-note').textContent = copy.endNote;
    setExports(false);
    status.textContent = message || '';
  }
  function markStale() { if (result && !isCurrent()) clearResult(copy.stale); }
  function appendMetric(container, label, valueText, className) {
    var item = node('div', null, 'ir-metric');
    item.appendChild(node('span', label));
    item.appendChild(node('strong', valueText, className));
    container.appendChild(item);
  }
  function renderMetrics() {
    var container = document.getElementById('ir-metrics');
    var gainClass = result.projectedGain >= 0 ? 'ir-positive' : 'ir-negative';
    clear(container);
    appendMetric(container, copy.contributed, formatMoney(result.totalContributed));
    appendMetric(container, copy.gain, formatMoney(result.projectedGain), gainClass);
    appendMetric(container, copy.gainRatio, formatPercent(result.gainOnContributions), gainClass);
    appendMetric(container, copy.effective, formatPercent(result.effectiveAnnualRate));
    appendMetric(container, copy.real, formatPercent(result.realEffectiveAnnualRate));
    appendMetric(container, copy.purchasing, formatMoney(result.purchasingPowerValue));
  }
  function renderChart(rows, initialValue) {
    var svg = document.getElementById('ir-chart');
    var namespace = 'http://www.w3.org/2000/svg';
    clear(svg);
    if (!rows.length) return;
    var chartRows = [{ month:0, balance:initialValue }].concat(rows);
    var maximum = Math.max.apply(null, chartRows.map(function (row) { return row.balance; }).concat([1]));
    var points = chartRows.map(function (row, index) {
      var x = index / (chartRows.length - 1) * 960 + 20;
      var y = 185 - row.balance / maximum * 155;
      return x.toFixed(1) + ',' + y.toFixed(1);
    });
    var title = document.createElementNS(namespace, 'title'); title.textContent = copy.chart; svg.appendChild(title);
    var area = document.createElementNS(namespace, 'path');
    area.setAttribute('class', 'ir-chart-area'); area.setAttribute('d', 'M 20,190 ' + points.join(' ') + ' 980,190 Z'); svg.appendChild(area);
    var line = document.createElementNS(namespace, 'polyline');
    line.setAttribute('class', 'ir-chart-line'); line.setAttribute('points', points.join(' ')); svg.appendChild(line);
  }
  function periodLabel(row) { return row.year % 1 === 0 ? copy.year + row.year : copy.month + row.month; }
  function renderTable(rows) {
    var body = document.getElementById('ir-year-body');
    clear(body);
    rows.forEach(function (row) {
      var tr = node('tr');
      [periodLabel(row), formatMoney(row.totalContributed), formatMoney(row.projectedGain), formatMoney(row.balance)].forEach(function (text, index) {
        var td = node('td');
        td.appendChild(index === 3 ? node('strong', text) : document.createTextNode(text));
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
  }
  function renderSensitivity(values) {
    var container = document.getElementById('ir-sensitivity');
    clear(container);
    engine.sensitivity(values, 2).forEach(function (scenario) {
      var item = node('div', null, 'ir-scenario');
      var label = scenario.label === 'Lower' ? copy.lower : scenario.label === 'Higher' ? copy.higher : scenario.label;
      item.appendChild(node('span', label));
      item.appendChild(node('strong', formatMoney(scenario.finalValue)));
      item.appendChild(node('small', scenario.annualRatePercent.toFixed(2) + copy.enteredRate));
      container.appendChild(item);
    });
  }
  function calculate(event) {
    if (event) event.preventDefault();
    try {
      if (!engine) throw new Error(copy.invalid);
      var values = input();
      result = engine.project(values);
      resultSignature = signature(values);
      document.getElementById('ir-final').textContent = formatMoney(result.finalValue);
      document.getElementById('ir-result-note').textContent = result.input.contributionTiming === 'beginning' ? copy.beginningNote : copy.endNote;
      renderMetrics();
      renderChart(result.yearData, result.input.initialInvestment);
      renderTable(result.yearData);
      renderSensitivity(values);
      setExports(true);
      status.textContent = copy.ready;
      document.getElementById('ir-final').focus();
    } catch (error) {
      clearResult(copy.invalid);
    }
  }
  function summaryRows() {
    return [
      [copy.final, formatMoney(result.finalValue)], [copy.contributed, formatMoney(result.totalContributed)],
      [copy.gain, formatMoney(result.projectedGain)], [copy.effective, formatPercent(result.effectiveAnnualRate)],
      [copy.real, formatPercent(result.realEffectiveAnnualRate)], [copy.purchasing, formatMoney(result.purchasingPowerValue)]
    ];
  }
  function summaryText() {
    return [copy.title].concat(summaryRows().map(function (row) { return row[0] + ': ' + row[1]; }), [
      copy.assumptions + ': ' + result.input.annualRatePercent + '%, ' + copy.inflation + ': ' + result.input.inflationRatePercent + '%, ' + copy.years + ': ' + result.input.years + ', ' + copy.timing + ': ' + (result.input.contributionTiming === 'beginning' ? copy.beginning : copy.end) + '.',
      copy.boundary
    ]).join('\n');
  }
  function copySummary() {
    if (!isCurrent()) return;
    if (!navigator.clipboard) { status.textContent = copy.copyUnavailable; return; }
    navigator.clipboard.writeText(summaryText()).then(function () { status.textContent = copy.copied; })
      .catch(function () { status.textContent = copy.copyFailed; });
  }
  function csvCell(cell) { return '"' + String(cell == null ? '' : cell).replace(/"/g, '""') + '"'; }
  function downloadCsv() {
    if (!isCurrent()) return;
    var lines = [[copy.title], [copy.initial,result.input.initialInvestment.toFixed(2)], [copy.monthly,result.input.monthlyContribution.toFixed(2)],
      [copy.entered,result.input.annualRatePercent.toFixed(2)], [copy.periods,String(result.input.compoundsPerYear)],
      [copy.timing,result.input.contributionTiming === 'beginning' ? copy.beginning : copy.end], [copy.years,String(result.input.years)],
      [copy.inflation,result.input.inflationRatePercent.toFixed(2)], [], [copy.period,copy.contributed,copy.gain,copy.balance]
    ].concat(result.yearData.map(function (row) { return [periodLabel(row),row.totalContributed.toFixed(2),row.projectedGain.toFixed(2),row.balance.toFixed(2)]; }));
    var blob = new Blob(['\uFEFF' + lines.map(function (row) { return row.map(csvCell).join(','); }).join('\r\n')], { type:'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob); var link = document.createElement('a');
    link.href = url; link.download = copy.csvFile; document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0); status.textContent = copy.csvReady;
  }
  async function downloadPdf() {
    if (!isCurrent()) return;
    try {
      if (!window.AfroTools || !window.AfroTools.pdf) throw new Error(copy.pdfUnavailable);
      await window.AfroTools.pdf.generate({
        noGate:true, skipGate:true, title:copy.pdfTitle,
        subtitle:result.input.years + copy.pdfSubtitleYears + result.input.annualRatePercent + copy.pdfSubtitleRate,
        toolId:'investment-return', country:copy.country, effectiveRate:result.effectiveAnnualRate,
        heroStats:summaryRows().slice(0,4).map(function (row,index) { return { label:row[0], value:row[1], highlight:index===0 }; }),
        sections:[{ title:copy.pdfSection, rows:[
          { label:copy.initial, value:formatMoney(result.input.initialInvestment) },
          { label:copy.monthly, value:formatMoney(result.input.monthlyContribution) },
          { label:copy.frequency, value:result.input.compoundsPerYear + copy.frequencyValue },
          { label:copy.monthlyTiming, value:result.input.contributionTiming === 'beginning' ? copy.beginning : copy.end },
          { label:copy.inflation, value:result.input.inflationRatePercent + '%' },
          { label:copy.real, value:formatPercent(result.realEffectiveAnnualRate) },
          { label:copy.purchasing, value:formatMoney(result.purchasingPowerValue), type:'total' }
        ] }], source:copy.source, disclaimer:copy.disclaimer
      });
      status.textContent = copy.pdfReady;
    } catch (error) { status.textContent = copy.pdfUnavailable; }
  }

  form.addEventListener('submit', calculate);
  form.addEventListener('input', markStale);
  form.addEventListener('change', markStale);
  form.addEventListener('reset', function () { window.setTimeout(function () { clearResult(''); }, 0); });
  document.getElementById('ir-copy').addEventListener('click', copySummary);
  document.getElementById('ir-csv').addEventListener('click', downloadCsv);
  document.getElementById('ir-pdf').addEventListener('click', downloadPdf);
  clearResult('');
})();
