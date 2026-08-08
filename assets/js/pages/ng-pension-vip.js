(function () {
  'use strict';

  var root = document.querySelector('[data-ng-pension]');
  var engine = window.NgPensionEngine;
  if (!root || !engine) return;

  var locale = root.dataset.locale || 'en';
  var copies = {
    en: { amount: 'Enter a non-negative RSA balance, positive monthly pensionable emoluments, and non-negative voluntary contribution.', rate: 'Use contribution rates from 0% to 100%.', assumption: 'Net return and salary growth must be greater than -100% and no more than 1,000%.', period: 'Projection years must be a whole number from 1 to 60.', evidence: 'Add both source labels and dates checked within the last 365 days.', ready: 'Scenario ready. No input left this browser.', changed: 'Inputs changed. Calculate again.', reset: 'Form reset. Enter a new scenario.', copied: 'Scenario copied locally.', exported: 'Local export created.', year: 'Year', csv: ['year', 'monthly_emoluments', 'monthly_contribution', 'cumulative_contributions', 'projected_balance'], privacy: 'Local user-entered Nigeria CPS scenario.' },
    fr: { amount: 'Saisissez un solde RSA positif ou nul, une rémunération mensuelle positive et une cotisation volontaire positive ou nulle.', rate: 'Utilisez des taux de cotisation entre 0 % et 100 %.', assumption: 'Le rendement net et la croissance salariale doivent être supérieurs à -100 % et inférieurs ou égaux à 1 000 %.', period: 'La durée doit être un nombre entier de 1 à 60 ans.', evidence: 'Ajoutez les deux sources et des dates vérifiées au cours des 365 derniers jours.', ready: 'Scénario prêt. Aucune donnée n’a quitté ce navigateur.', changed: 'Données modifiées. Recalculez.', reset: 'Formulaire réinitialisé. Saisissez un nouveau scénario.', copied: 'Scénario copié localement.', exported: 'Export local créé.', year: 'Année', csv: ['annee', 'remuneration_mensuelle', 'cotisation_mensuelle', 'cotisations_cumulees', 'solde_projete'], privacy: 'Scénario CPS Nigeria saisi par l’utilisateur et traité localement.' },
    ha: { amount: 'Shigar da ma’aunin RSA marar ragi, albashin fansho na wata mai kyau, da gudummawar son rai marar ragi.', rate: 'Yi amfani da kaso daga 0% zuwa 100%.', assumption: 'Ribar net da karuwar albashi su fi -100% kuma kada su wuce 1,000%.', period: 'Shekarun hasashe su kasance lamba daga 1 zuwa 60.', evidence: 'Shigar da sunayen tushe biyu da ranakun da aka duba cikin kwanaki 365.', ready: 'Hasashe ya shirya. Babu bayanin da ya bar burauzar nan.', changed: 'An canza bayanai. Sake lissafawa.', reset: 'An sake saita fom. Shigar da sabon hasashe.', copied: 'An kwafi hasashen a na’urar.', exported: 'An kirkiri fitarwa a na’urar.', year: 'Shekara', csv: ['shekara', 'albashin_wata', 'gudummawar_wata', 'jimillar_gudummawa', 'ma_aunin_hasashe'], privacy: 'Hasashen CPS na Najeriya da mai amfani ya shigar, ana sarrafa shi a na’urar.' },
    sw: { amount: 'Weka salio la RSA lisilo hasi, malipo ya pensheni ya mwezi yaliyo zaidi ya sifuri na mchango wa hiari usio hasi.', rate: 'Tumia viwango vya michango kuanzia 0% hadi 100%.', assumption: 'Faida halisi na ukuaji wa mshahara lazima viwe zaidi ya -100% na visizidi 1,000%.', period: 'Miaka ya makadirio lazima iwe namba kamili kuanzia 1 hadi 60.', evidence: 'Weka majina ya vyanzo vyote viwili na tarehe zilizokaguliwa ndani ya siku 365 zilizopita.', ready: 'Makadirio yako tayari. Hakuna data iliyoondoka kwenye kivinjari hiki.', changed: 'Umebadili data. Kokotoa tena.', reset: 'Fomu imewekwa upya. Weka makadirio mapya.', copied: 'Makadirio yamenakiliwa kwenye kifaa.', exported: 'Faili imeundwa kwenye kifaa.', year: 'Mwaka', csv: ['mwaka', 'malipo_ya_pensheni_ya_mwezi', 'mchango_wa_mwezi', 'michango_iliyokusanywa', 'salio_lililokadiriwa'], privacy: 'Makadirio ya CPS Nigeria yaliyoingizwa na mtumiaji na kuchakatwa kwenye kifaa.' }
  };
  var copy = copies[locale] || copies.en;
  var form = document.getElementById('np-form');
  var results = document.getElementById('np-results');
  var error = document.getElementById('np-error');
  var status = document.getElementById('np-status');
  var actions = document.querySelectorAll('[data-np-action]');
  var current = null;

  function field(id) { return document.getElementById(id); }
  function value(id) { return field(id).value; }
  function input() { return { openingBalance: value('np-balance'), monthlyEmoluments: value('np-emoluments'), employeeRate: value('np-employee'), employerRate: value('np-employer'), voluntaryContribution: value('np-voluntary'), annualNetReturn: value('np-return'), annualSalaryGrowth: value('np-growth'), years: value('np-years'), sourceLabel: value('np-source'), sourceDate: value('np-source-date'), returnSource: value('np-return-source'), returnSourceDate: value('np-return-date') }; }
  function money(value) { return new Intl.NumberFormat(locale, { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(value); }
  function enable(on) { actions.forEach(function (button) { button.disabled = !on; }); }
  function clear(message) { current = null; results.hidden = true; enable(false); if (message) status.textContent = message; }
  function summary() { return root.dataset.pdfTitle + '\n' + current.sourceLabel + ' · ' + current.sourceDate + '\n' + current.returnSource + ' · ' + current.returnSourceDate + '\n' + root.dataset.balanceLabel + ': ' + money(current.projectedBalance) + '\n' + root.dataset.contributionLabel + ': ' + money(current.futureContributions) + '\n' + root.dataset.growthLabel + ': ' + money(current.modeledGrowth); }
  function focusFor(code) { return field(code === 'invalid_amount' ? 'np-emoluments' : code === 'invalid_rate' ? 'np-employee' : code === 'invalid_assumption' ? 'np-return' : code === 'invalid_period' ? 'np-years' : 'np-source'); }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var result = engine.calculateScenario(input());
    if (!result.ok) {
      clear();
      error.textContent = result.error === 'invalid_amount' ? copy.amount : result.error === 'invalid_rate' ? copy.rate : result.error === 'invalid_assumption' ? copy.assumption : result.error === 'invalid_period' ? copy.period : copy.evidence;
      focusFor(result.error).focus();
      return;
    }
    current = result;
    error.textContent = '';
    [['np-employee-result', result.firstEmployeeContribution], ['np-employer-result', result.firstEmployerContribution], ['np-total-result', result.firstTotalContribution], ['np-future-result', result.futureContributions], ['np-growth-result', result.modeledGrowth], ['np-balance-result', result.projectedBalance], ['np-final-emoluments', result.finalMonthlyEmoluments]].forEach(function (pair) { field(pair[0]).textContent = money(pair[1]); });
    field('np-evidence').textContent = result.sourceLabel + ' · ' + result.sourceDate + ' | ' + result.returnSource + ' · ' + result.returnSourceDate + ' | ' + result.annualNetReturn + '%';
    var body = field('np-schedule'); body.replaceChildren();
    result.schedule.forEach(function (row) { var tr = document.createElement('tr'); [copy.year + ' ' + row.year, money(row.monthlyEmoluments), money(row.monthlyContribution), money(row.cumulativeContributions), money(row.balance)].forEach(function (text) { var td = document.createElement('td'); td.textContent = text; tr.appendChild(td); }); body.appendChild(tr); });
    results.hidden = false; enable(true); status.textContent = copy.ready; results.focus();
  });
  form.addEventListener('input', function () { if (current) clear(copy.changed); });
  form.addEventListener('change', function () { if (current) clear(copy.changed); });
  field('np-reset').addEventListener('click', function () { form.reset(); clear(copy.reset); error.textContent = ''; field('np-balance').focus(); });

  function csvCell(value) { var text = String(value); if (/^[=+\-@]/.test(text)) text = "'" + text; return '"' + text.replace(/"/g, '""') + '"'; }
  function download(name, type, content) { var url = URL.createObjectURL(new Blob([content], { type: type })); var anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url); status.textContent = copy.exported; }
  field('np-copy').addEventListener('click', function () { var done = function () { status.textContent = copy.copied; }; navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(summary()).then(done).catch(function () { window.prompt(root.dataset.copyPrompt, summary()); done(); }) : (window.prompt(root.dataset.copyPrompt, summary()), done()); });
  field('np-csv').addEventListener('click', function () { download('nigeria-pension-scenario.csv', 'text/csv;charset=utf-8', [copy.csv.map(csvCell).join(',')].concat(current.schedule.map(function (row) { return [row.year, row.monthlyEmoluments, row.monthlyContribution, row.cumulativeContributions, row.balance].map(csvCell).join(','); })).join('\n')); });
  field('np-json').addEventListener('click', function () { download('nigeria-pension-scenario.json', 'application/json', JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), privacy: copy.privacy, scenario: current }, null, 2)); });
  field('np-pdf').addEventListener('click', async function () { if (window.AfroTools && window.AfroTools.pdf) { await window.AfroTools.pdf.generate({ toolId: 'ng-pension', category: 'finance', title: root.dataset.pdfTitle, subtitle: current.sourceLabel + ' · ' + current.sourceDate, noGate: true, skipGate: true, heroStats: [[root.dataset.balanceLabel, money(current.projectedBalance)], [root.dataset.contributionLabel, money(current.futureContributions)], [root.dataset.growthLabel, money(current.modeledGrowth)]], sections: [{ title: root.dataset.scheduleTitle, rows: current.schedule.map(function (row) { return [copy.year + ' ' + row.year, money(row.monthlyContribution) + ' / ' + money(row.balance)]; }) }], source: current.sourceLabel + ' · ' + current.sourceDate + '; ' + current.returnSource + ' · ' + current.returnSourceDate, disclaimer: root.dataset.pdfDisclaimer }); status.textContent = copy.exported; } else window.print(); });
  clear();
}());
