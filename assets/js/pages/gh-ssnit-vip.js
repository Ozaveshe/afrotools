(function () {
  'use strict';
  var root = document.querySelector('[data-gh-ssnit]');
  var engine = window.GH_SSNIT;
  if (!root || !engine) return;

  var locale = root.dataset.locale || 'en';
  var messages = {
    en: {
      salary: 'Enter a positive monthly basic salary.',
      count: 'Employee count must be a whole number from 1 to 10,000.',
      average: 'The best-36-month average must be zero or positive.',
      months: 'Contribution months must be a whole number from 0 to 720.',
      age: 'Retirement age must be from 55 to 60.',
      date: 'This verified calculator supports contribution dates from 1 January through 23 July 2026.',
      ready: 'Estimate ready. No input left this browser.',
      changed: 'Inputs changed. Calculate again.',
      copied: 'Estimate copied locally.',
      exported: 'Local export created.',
      full: 'Age-60 planning estimate. SSNIT must confirm the earnings record and credited months.',
      early: 'Eligible-age scenario only. SSNIT applies an age-reduction factor; this calculator does not invent that factor.',
      short: 'Fewer than 180 contribution months: no monthly old-age pension estimate is shown. Ask SSNIT about the applicable lump-sum treatment.',
      missing: 'Enter the average monthly salary for the best 36 months to estimate an age-60 pension.'
    },
    fr: {
      salary: 'Saisissez un salaire de base mensuel positif.',
      count: 'Le nombre de salariés doit être un entier de 1 à 10 000.',
      average: 'La moyenne des 36 meilleurs mois doit être nulle ou positive.',
      months: 'Le nombre de mois cotisés doit être un entier de 0 à 720.',
      age: 'L’âge de retraite doit être compris entre 55 et 60 ans.',
      date: 'Ce calculateur vérifié couvre les cotisations du 1er janvier au 23 juillet 2026.',
      ready: 'Estimation prête. Aucune donnée n’a quitté ce navigateur.',
      changed: 'Données modifiées. Recalculez.',
      copied: 'Estimation copiée localement.',
      exported: 'Export local créé.',
      full: 'Estimation indicative à 60 ans. SSNIT doit confirmer l’historique des salaires et les mois validés.',
      early: 'Scénario d’âge admissible uniquement. SSNIT applique un facteur de réduction; ce calculateur ne l’invente pas.',
      short: 'Moins de 180 mois cotisés : aucune pension mensuelle de vieillesse n’est estimée. Demandez à SSNIT le traitement forfaitaire applicable.',
      missing: 'Saisissez la moyenne mensuelle des 36 meilleurs mois pour estimer la pension à 60 ans.'
    }
  }[locale];

  var form = document.getElementById('ss-form');
  var results = document.getElementById('ss-results');
  var error = document.getElementById('ss-error');
  var status = document.getElementById('ss-status');
  var actions = document.querySelectorAll('[data-ss-action]');
  var current = null;

  function value(id) { return document.getElementById(id).value; }
  function input() {
    return {
      contributionDate: value('ss-date'),
      basicSalary: value('ss-salary'),
      employeeCount: value('ss-count'),
      averageBest36Monthly: value('ss-best36'),
      contributionMonths: value('ss-months'),
      retirementAge: value('ss-age')
    };
  }
  function money(value) {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-GH', {
      style: 'currency',
      currency: 'GHS',
      maximumFractionDigits: 2
    }).format(value);
  }
  function percent(value) {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-GH', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
  function set(id, value) { document.getElementById(id).textContent = value; }
  function enable(on) { actions.forEach(function (button) { button.disabled = !on; }); }
  function clear(message) {
    current = null;
    results.hidden = true;
    enable(false);
    if (message) status.textContent = message;
  }
  function benefitMessage(result) {
    if (result.benefit.status === 'full_pension_estimate') return messages.full;
    if (result.benefit.status === 'early_reduction_required') return messages.early;
    if (result.benefit.status === 'below_minimum_months') return messages.short;
    return messages.missing;
  }
  function summary() {
    return [
      root.dataset.pdfTitle,
      root.dataset.insurableLabel + ': ' + money(current.insurableSalary),
      root.dataset.employeeLabel + ': ' + money(current.payroll.employeeDeduction),
      root.dataset.employerLabel + ': ' + money(current.payroll.employerContribution),
      root.dataset.tier1Label + ': ' + money(current.payroll.tier1Remittance),
      root.dataset.tier2Label + ': ' + money(current.payroll.tier2Remittance),
      root.dataset.rightLabel + ': ' + percent(current.benefit.pensionRight),
      root.dataset.pensionLabel + ': ' + (current.benefit.estimatedMonthlyPension === null ? root.dataset.withheldLabel : money(current.benefit.estimatedMonthlyPension)),
      benefitMessage(current)
    ].join('\n');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var result = engine.calculate(input());
    if (!result.ok) {
      clear();
      error.textContent =
        result.error === 'unsupported_date' ? messages.date :
        result.error === 'invalid_employee_count' ? messages.count :
        result.error === 'invalid_average_salary' ? messages.average :
        result.error === 'invalid_months' ? messages.months :
        result.error === 'invalid_age' ? messages.age : messages.salary;
      return;
    }
    current = result;
    error.textContent = '';
    set('ss-total', money(result.payroll.totalContribution));
    set('ss-insurable', money(result.insurableSalary));
    set('ss-employee-result', money(result.payroll.employeeDeduction));
    set('ss-employer-result', money(result.payroll.employerContribution));
    set('ss-tier1-result', money(result.payroll.tier1Remittance));
    set('ss-tier2-result', money(result.payroll.tier2Remittance));
    set('ss-right-result', percent(result.benefit.pensionRight));
    set('ss-pension-result', result.benefit.estimatedMonthlyPension === null
      ? root.dataset.withheldLabel
      : money(result.benefit.estimatedMonthlyPension));
    set('ss-adjustment', root.dataset['adjustment' + result.salaryAdjustment.replace(/(^|_)([a-z])/g, function (_, __, letter) { return letter.toUpperCase(); })]);
    set('ss-benefit-note', benefitMessage(result));
    results.hidden = false;
    enable(true);
    status.textContent = messages.ready;
  });
  form.addEventListener('input', function () { if (current) clear(messages.changed); });
  form.addEventListener('change', function () { if (current) clear(messages.changed); });
  document.getElementById('ss-reset').addEventListener('click', function () {
    form.reset();
    error.textContent = '';
    status.textContent = '';
    clear();
  });

  function csvCell(value) {
    var text = String(value);
    if (/^[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function download(name, type, content) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    status.textContent = messages.exported;
  }
  document.getElementById('ss-copy').addEventListener('click', function () {
    var done = function () { status.textContent = messages.copied; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summary()).then(done).catch(function () {
        window.prompt(root.dataset.copyPrompt, summary());
        done();
      });
    } else {
      window.prompt(root.dataset.copyPrompt, summary());
      done();
    }
  });
  document.getElementById('ss-csv').addEventListener('click', function () {
    var rows = [
      ['item', 'value'],
      ['contribution_date', current.contributionDate],
      ['basic_salary_monthly', current.basicSalary],
      ['insurable_salary_monthly', current.insurableSalary],
      ['employee_count', current.employeeCount],
      ['employee_deduction', current.payroll.employeeDeduction],
      ['employer_contribution', current.payroll.employerContribution],
      ['tier_1_remittance', current.payroll.tier1Remittance],
      ['tier_2_remittance', current.payroll.tier2Remittance],
      ['contribution_months', current.benefit.contributionMonths],
      ['pension_right', current.benefit.pensionRight],
      ['estimated_monthly_pension', current.benefit.estimatedMonthlyPension === null ? 'withheld' : current.benefit.estimatedMonthlyPension]
    ];
    download('ghana-ssnit-estimate.csv', 'text/csv;charset=utf-8', rows.map(function (row) {
      return row.map(csvCell).join(',');
    }).join('\n'));
  });
  document.getElementById('ss-json').addEventListener('click', function () {
    download('ghana-ssnit-estimate.json', 'application/json', JSON.stringify({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      privacy: 'Local Ghana SSNIT planning estimate. Contains user-entered salary data.',
      estimate: current
    }, null, 2));
  });
  document.getElementById('ss-pdf').addEventListener('click', async function () {
    if (window.AfroTools && window.AfroTools.pdf) {
      await window.AfroTools.pdf.generate({
        toolId: 'gh-ssnit',
        category: 'finance',
        title: root.dataset.pdfTitle,
        subtitle: engine.RULES.scheme + ' · ' + current.contributionDate,
        noGate: true,
        skipGate: true,
        heroStats: [
          [root.dataset.totalLabel, money(current.payroll.totalContribution)],
          [root.dataset.tier1Label, money(current.payroll.tier1Remittance)],
          [root.dataset.pensionLabel, current.benefit.estimatedMonthlyPension === null ? root.dataset.withheldLabel : money(current.benefit.estimatedMonthlyPension)]
        ],
        sections: [{
          title: root.dataset.breakdownTitle,
          rows: [
            [root.dataset.insurableLabel, money(current.insurableSalary)],
            [root.dataset.employeeLabel, money(current.payroll.employeeDeduction)],
            [root.dataset.employerLabel, money(current.payroll.employerContribution)],
            [root.dataset.tier2Label, money(current.payroll.tier2Remittance)],
            [root.dataset.rightLabel, percent(current.benefit.pensionRight)]
          ]
        }],
        source: engine.RULES.source + ' · reviewed ' + engine.RULES.verifiedThrough,
        disclaimer: root.dataset.pdfDisclaimer
      });
      status.textContent = messages.exported;
    } else {
      window.print();
    }
  });
  clear();
})();
