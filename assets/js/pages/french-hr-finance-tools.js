(function () {
  'use strict';
  var app = document.querySelector('[data-frhr-app]');
  var engine = window.AfroTools && window.AfroTools.HREngine;
  if (!app || !engine) return;

  var mode = app.dataset.frhrApp;
  var checkedDates = {
    overtime: '2026-03-29',
    leave: '2026-04-03',
    social: '2026-03-29',
    pension: '2026-03-29'
  };
  var MAX_AGE_DAYS = 366;
  var sourceDate = checkedDates[mode];
  var form = app.querySelector('form');
  var country = app.querySelector('[name="country"]');
  var resultBox = app.querySelector('[data-result]');
  var resultRows = app.querySelector('[data-result-rows]');
  var sourceBox = app.querySelector('[data-source]');
  var status = app.querySelector('[data-status]');
  var error = app.querySelector('[data-error]');
  var lastResult = null;

  function dataSet() {
    if (mode === 'overtime') return window.OVERTIME_RULES;
    if (mode === 'leave') return window.LEAVE_ENTITLEMENTS;
    if (mode === 'social') return window.SOCIAL_SECURITY;
    return window.PENSION_SYSTEMS;
  }
  function ageDays(value) {
    var parsed = new Date(value + 'T00:00:00Z');
    return Number.isNaN(parsed.getTime()) ? Infinity : Math.floor((Date.now() - parsed.getTime()) / 86400000);
  }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }
  function field(name) { return app.querySelector('[name="' + name + '"]'); }
  function number(name) { return Number(field(name).value); }
  function format(value, currencyCode) {
    return new Intl.NumberFormat('fr', { style: 'currency', currency: currencyCode, maximumFractionDigits: 2 }).format(value);
  }
  function populateCountries() {
    var data = dataSet();
    if (!data) return false;
    Object.keys(data).sort(function (a, b) { return data[a].name.localeCompare(data[b].name, 'fr'); }).forEach(function (code) {
      var option = document.createElement('option');
      option.value = code;
      option.textContent = data[code].name;
      country.appendChild(option);
    });
    country.value = data.SN ? 'SN' : Object.keys(data)[0];
    return country.options.length > 0;
  }
  function block(message) {
    error.textContent = message;
    form.querySelectorAll('input,select,button').forEach(function (control) { control.disabled = true; });
    resultBox.hidden = true;
  }
  function freshnessReady() {
    if (!dataSet()) { block('Les données locales de référence sont absentes. Aucun résultat n’est calculé.'); return false; }
    if (!sourceDate || ageDays(sourceDate) > MAX_AGE_DAYS) { block('Les données n’ont pas été vérifiées au cours des 366 derniers jours. Le calcul est bloqué jusqu’à une nouvelle revue des sources.'); return false; }
    app.querySelector('[data-checked-date]').textContent = sourceDate;
    return true;
  }
  function rowsFor(result) {
    if (mode === 'overtime') return [
      ['Pays', result.country],
      ['Taux horaire de base', result.fHourlyRate],
      ['Coefficient appliqué', result.otMultiplier.toFixed(2) + '×'],
      ['Paiement des heures supplémentaires', result.fOvertimePay],
      ['Rémunération mensuelle totale', result.fTotalPay],
      ['Taux horaire effectif', result.fEffectiveHourly]
    ];
    if (mode === 'leave') {
      var taken = number('daysTaken');
      return [
        ['Pays', result.country],
        ['Congé annuel légal', result.annualLeave.days + ' jours'],
        ['Congé annuel restant', Math.max(0, result.annualLeave.days - taken) + ' jours'],
        ['Congé maladie', result.sickLeave.days == null ? 'À vérifier selon règle locale' : result.sickLeave.days + ' jours'],
        ['Congé maternité', result.maternityLeave.weeks + ' semaines'],
        ['Congé paternité', (result.paternityLeave.days || 0) + ' jours'],
        ['Jours fériés indicatifs', result.publicHolidays + ' jours']
      ];
    }
    if (mode === 'social') return [
      ['Pays', result.country],
      ['Cotisations salarié', result.fTotalEmployee],
      ['Cotisations employeur', result.fTotalEmployer],
      ['Total des cotisations', result.fTotalContribution],
      ['Net après ces retenues', result.fNetAfterDeductions],
      ['Coût total employeur', result.fTotalCostToEmployer]
    ];
    return [
      ['Pays ou régime', result.country],
      ['Années jusqu’à la retraite', result.yearsToRetirement],
      ['Solde final projeté', result.fFinalBalance],
      ['Retrait mensuel indicatif à 4 %', result.fMonthlyPension],
      ['Ratio de remplacement indicatif', result.fReplacementRatio],
      ['Total cotisé', format(result.totalContributed, result.currency)],
      ['Croissance projetée', format(result.totalGrowth, result.currency)]
    ];
  }
  function sourceText(result) {
    var data = dataSet()[country.value] || {};
    if (mode === 'overtime') return (data.standardHours && data.standardHours.law) || 'Droit du travail et convention applicables à confirmer';
    if (mode === 'leave') return (data.annualLeave && data.annualLeave.law) || 'Code du travail et politique employeur à confirmer';
    if (mode === 'social') return (data.schemes || []).map(function (scheme) { return scheme.law || scheme.name; }).filter(Boolean).join(' ; ') || 'Organismes de sécurité sociale à confirmer';
    return data.notes || 'Règles du régime et du fournisseur à confirmer';
  }
  function calculate(event) {
    if (event) event.preventDefault();
    error.textContent = '';
    try {
      if (!freshnessReady()) return;
      if (mode === 'overtime') lastResult = engine.calculateOvertime({ country: country.value, monthlySalary: number('salary'), overtimeHours: number('hours'), dayType: field('dayType').value });
      else if (mode === 'leave') lastResult = engine.getLeaveEntitlements(country.value);
      else if (mode === 'social') lastResult = engine.calculateSocialSecurity(country.value, number('salary'));
      else lastResult = engine.projectPension({ country: country.value, currentAge: number('currentAge'), retirementAge: number('retirementAge'), currentSalary: number('salary'), salaryGrowth: number('salaryGrowth'), contributionRate: number('contributionRate'), growthRate: number('growthRate'), currentBalance: number('balance') });
      if (!lastResult) throw new Error('Aucun résultat n’est disponible pour ces valeurs.');
      resultRows.innerHTML = rowsFor(lastResult).map(function (row) { return '<dt>' + escapeHtml(row[0]) + '</dt><dd>' + escapeHtml(row[1]) + '</dd>'; }).join('');
      sourceBox.textContent = sourceText(lastResult);
      resultBox.hidden = false;
      status.textContent = 'Calcul effectué localement. Aucune valeur n’a été envoyée.';
      resultBox.focus({ preventScroll: true });
    } catch (failure) {
      lastResult = null;
      resultBox.hidden = true;
      error.textContent = failure.message || 'Vérifiez les valeurs saisies.';
    }
  }
  function summaryRows() { return rowsFor(lastResult); }
  function summaryText() {
    return [document.title].concat(summaryRows().map(function (row) { return row[0] + ' : ' + row[1]; }), [
      'Source ou règle à vérifier : ' + sourceText(lastResult),
      'Données vérifiées le : ' + sourceDate,
      'Estimation de planification uniquement. Vérifiez les règles, plafonds, exemptions et dates auprès de l’autorité, du régime et de l’employeur.'
    ]).join('\n');
  }
  function download(name, type, content) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a');
    link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }
  function ensureResult() { if (!lastResult) calculate(); return Boolean(lastResult); }
  app.querySelector('[data-copy]').addEventListener('click', function () {
    if (!ensureResult()) return;
    if (!navigator.clipboard) { status.textContent = 'Copie indisponible ; utilisez le TXT.'; return; }
    navigator.clipboard.writeText(summaryText()).then(function () { status.textContent = 'Résumé copié.'; }, function () { status.textContent = 'Copie indisponible ; utilisez le TXT.'; });
  });
  app.querySelector('[data-share]').addEventListener('click', function () {
    if (!ensureResult()) return;
    if (navigator.share) navigator.share({ title: document.title, text: summaryText() }).then(function () { status.textContent = 'Résumé partagé.'; }).catch(function () { status.textContent = 'Partage annulé.'; });
    else if (navigator.clipboard) navigator.clipboard.writeText(summaryText()).then(function () { status.textContent = 'Résumé copié pour partage.'; });
  });
  app.querySelector('[data-json]').addEventListener('click', function () {
    if (!ensureResult()) return;
    download(mode + '-fr.json', 'application/json;charset=utf-8', JSON.stringify({ checkedDate: sourceDate, source: sourceText(lastResult), result: lastResult }, null, 2));
    status.textContent = 'JSON téléchargé localement.';
  });
  app.querySelector('[data-csv]').addEventListener('click', function () {
    if (!ensureResult()) return;
    var csv = [['Champ', 'Valeur']].concat(summaryRows()).map(function (row) { return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
    download(mode + '-fr.csv', 'text/csv;charset=utf-8', '\uFEFF' + csv); status.textContent = 'CSV téléchargé localement.';
  });
  app.querySelector('[data-txt]').addEventListener('click', function () {
    if (!ensureResult()) return;
    download(mode + '-fr.txt', 'text/plain;charset=utf-8', summaryText()); status.textContent = 'TXT téléchargé localement.';
  });
  app.querySelector('[data-pdf]').addEventListener('click', async function () {
    if (!ensureResult()) return;
    if (!window.AfroTools || !window.AfroTools.pdf) { status.textContent = 'Bibliothèque PDF indisponible.'; return; }
    await window.AfroTools.pdf.generate({ noGate: true, skipGate: true, toolId: mode + '-fr', category: 'financial', title: document.querySelector('h1').textContent, subtitle: 'Estimation locale vérifiée le ' + sourceDate, heroStats: summaryRows().slice(0, 4), sections: [{ title: 'Résultat', rows: summaryRows().slice(4) }, { title: 'Source et hypothèses', rows: [['Règle à vérifier', sourceText(lastResult)], ['Date de vérification', sourceDate]] }], source: sourceText(lastResult), disclaimer: 'Estimation de planification uniquement. Vérifiez les règles, plafonds, exemptions et dates auprès de l’autorité, du régime et de l’employeur.' });
    status.textContent = 'PDF généré localement.';
  });
  app.querySelector('[data-save]').addEventListener('click', function () {
    var values = {};
    form.querySelectorAll('input,select').forEach(function (control) { if (control.name) values[control.name] = control.value; });
    localStorage.setItem('afrotools.frhr.' + mode, JSON.stringify(values));
    status.textContent = 'Hypothèses enregistrées uniquement sur cet appareil.';
  });
  app.querySelector('[data-clear]').addEventListener('click', function () {
    localStorage.removeItem('afrotools.frhr.' + mode); form.reset(); lastResult = null; resultBox.hidden = true; status.textContent = 'Hypothèses locales effacées.';
  });
  form.addEventListener('submit', calculate);
  form.addEventListener('reset', function () { window.setTimeout(function () { lastResult = null; resultBox.hidden = true; error.textContent = ''; status.textContent = 'Formulaire réinitialisé.'; }, 0); });
  if (!freshnessReady() || !populateCountries()) { if (!country.options.length) block('Aucun pays n’est disponible dans les données locales.'); return; }
  try {
    var saved = JSON.parse(localStorage.getItem('afrotools.frhr.' + mode) || 'null');
    if (saved) Object.keys(saved).forEach(function (name) { var control = field(name); if (control) control.value = saved[name]; });
  } catch (_) {}
})();
