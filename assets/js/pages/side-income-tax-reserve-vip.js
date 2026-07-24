(function () {
  'use strict';
  var root = document.querySelector('[data-side-income-reserve]');
  var engine = window.AfroTools && window.AfroTools.SideIncomeTaxReserve;
  if (!root || !engine) return;
  var locale = root.dataset.locale || 'en';
  var messages = {
    en: { context: 'Add a currency, jurisdiction and tax period.', amount: 'Enter non-negative practical money amounts.', costs: 'Refunds and costs cannot exceed gross revenue.', assumption: 'Use a reserve rate from 0% to 100% and 1 to 12 instalments.', evidence: 'Add the official notice or adviser source and a checked date within 365 days.', ready: 'Planning reserve ready. No input left this browser.', changed: 'Inputs changed. Run the plan again.', exported: 'Local export created.', copied: 'Plan copied locally.' },
    fr: { context: 'Ajoutez une devise, une juridiction et une p&eacute;riode fiscale.', amount: 'Saisissez des montants positifs et plausibles.', costs: 'Les remboursements et co&ucirc;ts ne peuvent pas d&eacute;passer le chiffre d&rsquo;affaires.', assumption: 'Utilisez un taux de r&eacute;serve de 0 % &agrave; 100 % et 1 &agrave; 12 versements.', evidence: 'Ajoutez la source officielle ou du conseiller et une date v&eacute;rifi&eacute;e dans les 365 jours.', ready: 'R&eacute;serve de planification pr&ecirc;te. Aucune saisie ne quitte ce navigateur.', changed: 'Les champs ont chang&eacute;. Relancez le plan.', exported: 'Export local cr&eacute;&eacute;.', copied: 'Plan copi&eacute; localement.' }
  }[locale];
  var current = null;
  var form = document.getElementById('sir-form');
  var results = document.getElementById('sir-results');
  var error = document.getElementById('sir-error');
  var status = document.getElementById('sir-status');
  var actions = document.querySelectorAll('[data-sir-result-action]');
  function value(id) { return document.getElementById(id).value; }
  function input() { return { currency: value('sir-currency'), jurisdiction: value('sir-jurisdiction'), taxPeriod: value('sir-period'), grossRevenue: value('sir-gross'), refunds: value('sir-refunds'), platformFees: value('sir-platform-fees'), otherExpenses: value('sir-expenses'), taxCredits: value('sir-credits'), reserveRatePct: value('sir-rate'), instalments: value('sir-instalments'), evidenceLabel: value('sir-source'), evidenceDate: value('sir-date') }; }
  function money(number) { return (current ? current.currency : value('sir-currency').toUpperCase()) + ' ' + Number(number).toLocaleString(locale, { maximumFractionDigits: 2 }); }
  function setActions(enabled) { actions.forEach(function (button) { button.disabled = !enabled; }); }
  function clear(message) { current = null; results.hidden = true; setActions(false); error.textContent = ''; if (message) status.innerHTML = message; }
  function rows() { return [[root.dataset.grossLabel, current.grossRevenue], [root.dataset.costsLabel, current.totalCosts], [root.dataset.profitLabel, current.planningProfit], [root.dataset.beforeLabel, current.reserveBeforeCredits], [root.dataset.creditsLabel, current.taxCredits], [root.dataset.reserveLabel, current.reserveAfterCredits], [root.dataset.cashLabel, current.cashAfterReserve], [root.dataset.instalmentLabel, current.reservePerInstalment]]; }
  function summary() { return root.dataset.pdfTitle + '\n' + root.dataset.jurisdictionLabel + ': ' + current.jurisdiction + '\n' + root.dataset.periodLabel + ': ' + current.taxPeriod + '\n' + root.dataset.profitLabel + ': ' + money(current.planningProfit) + '\n' + root.dataset.reserveLabel + ': ' + money(current.reserveAfterCredits) + '\n' + root.dataset.sourceLabel + ': ' + current.evidenceLabel + ' - ' + current.evidenceDate; }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var output = engine.calculate(input());
    if (!output.ok) {
      clear();
      error.innerHTML = output.error === 'invalid_context' ? messages.context : output.error === 'invalid_amount' ? messages.amount : output.error === 'invalid_costs' ? messages.costs : output.error === 'invalid_evidence' ? messages.evidence : messages.assumption;
      return;
    }
    current = output;
    error.textContent = '';
    document.getElementById('sir-profit').textContent = money(output.planningProfit);
    document.getElementById('sir-reserve').textContent = money(output.reserveAfterCredits);
    document.getElementById('sir-instalment').textContent = money(output.reservePerInstalment);
    document.getElementById('sir-cash').textContent = money(output.cashAfterReserve);
    document.getElementById('sir-cost-ratio').textContent = output.expenseRatioPct.toFixed(2) + '%';
    document.getElementById('sir-reserve-ratio').textContent = output.reserveGrossRatePct.toFixed(2) + '%';
    document.getElementById('sir-evidence').textContent = output.jurisdiction + ' - ' + output.taxPeriod + ' - ' + output.evidenceLabel + ' - ' + output.evidenceDate + ' - ' + output.reserveRatePct.toFixed(2) + '%';
    document.getElementById('sir-breakdown').innerHTML = rows().map(function (row) { return '<tr><td>' + row[0] + '</td><td>' + money(row[1]) + '</td></tr>'; }).join('');
    results.hidden = false;
    setActions(true);
    status.innerHTML = messages.ready;
  });
  form.addEventListener('input', function () { if (current) clear(messages.changed); });
  form.addEventListener('change', function () { if (current) clear(messages.changed); });
  document.getElementById('sir-reset').addEventListener('click', function () { form.reset(); clear(); status.textContent = ''; });
  function download(name, type, content) { var url = URL.createObjectURL(new Blob([content], { type: type })); var link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); status.innerHTML = messages.exported; }
  function csvCell(value) { var text = String(value); if (/^[=+\-@]/.test(text)) text = "'" + text; return '"' + text.replace(/"/g, '""') + '"'; }
  document.getElementById('sir-csv').addEventListener('click', function () { download('side-income-tax-reserve.csv', 'text/csv;charset=utf-8', ['"Metric","Value"'].concat(rows().map(function (row) { return csvCell(row[0]) + ',' + csvCell(row[1]); })).concat(['"Jurisdiction",' + csvCell(current.jurisdiction), '"Tax period",' + csvCell(current.taxPeriod), '"Evidence",' + csvCell(current.evidenceLabel), '"Evidence date",' + csvCell(current.evidenceDate)]).join('\n')); });
  document.getElementById('sir-json').addEventListener('click', function () { download('side-income-tax-reserve.json', 'application/json', JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), privacy: 'Private user-entered tax reserve plan.', plan: current }, null, 2)); });
  document.getElementById('sir-copy').addEventListener('click', function () { var done = function () { status.innerHTML = messages.copied; }; var content = summary(); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(content).then(done).catch(function () { window.prompt(root.dataset.copyPrompt, content); done(); }); else { window.prompt(root.dataset.copyPrompt, content); done(); } });
  document.getElementById('sir-pdf').addEventListener('click', async function () { if (!current) return; if (window.AfroTools && window.AfroTools.pdf) { await window.AfroTools.pdf.generate({ toolId: 'side-hustle-tax', category: 'financial', title: root.dataset.pdfTitle, subtitle: current.jurisdiction + ' - ' + current.taxPeriod, noGate: true, skipGate: true, heroStats: [[root.dataset.profitLabel, money(current.planningProfit)], [root.dataset.reserveLabel, money(current.reserveAfterCredits)], [root.dataset.cashLabel, money(current.cashAfterReserve)]], sections: [{ title: root.dataset.breakdownTitle, rows: rows().map(function (row) { return [row[0], money(row[1])]; }) }], source: root.dataset.pdfSource + ' ' + current.evidenceLabel + ' - ' + current.evidenceDate, disclaimer: root.dataset.pdfDisclaimer }); status.innerHTML = messages.exported; } else { window.print(); } });
  clear();
})();
