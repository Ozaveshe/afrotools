(function () {
  'use strict';
  var app = document.querySelector('[data-fr-payroll]');
  if (!app) return;
  var mode = app.dataset.frPayroll;
  var api = window.AfroTools && (mode === 'gw' ? window.AfroTools.guineaBissauPaye : window.AfroTools.saoTomePayroll);
  var form = app.querySelector('form');
  var gross = app.querySelector('[name="grossMonthly"]');
  var secondary = app.querySelector('[name="secondary"]');
  var inss = app.querySelector('[name="includeEmployeeInss"]');
  var resultBox = app.querySelector('[data-result]');
  var resultRows = app.querySelector('[data-result-rows]');
  var status = app.querySelector('[data-status]');
  var error = app.querySelector('[data-error]');
  var lastResult = null;
  var MAX_AGE_DAYS = 366;
  function ageDays(value) { var date = new Date(value + 'T00:00:00Z'); return Number.isNaN(date.getTime()) ? Infinity : Math.floor((Date.now() - date.getTime()) / 86400000); }
  function money(value) { return new Intl.NumberFormat('fr', { style: 'currency', currency: mode === 'gw' ? 'XOF' : 'STN', maximumFractionDigits: 2 }).format(value); }
  function rows(result) {
    if (mode === 'gw') return [
      ['Salaire brut mensuel', money(result.grossMonthly)],
      ['INSS salarié (' + (result.employeeInssRate * 100).toFixed(0) + ' %)', money(result.employeeInssMonthly)],
      ['Revenu imposable mensuel', money(result.taxableMonthly)],
      ['PAYE mensuel', money(result.payeMonthly)],
      ['Salaire net mensuel estimé', money(result.netMonthly)],
      ['INSS employeur (14 %)', money(result.employerInssMonthly)],
      ['Coût employeur mensuel', money(result.employerCostMonthly)]
    ];
    return [
      ['Salaire brut mensuel', money(result.grossMonthly)],
      ['INSS salarié (4 %)', money(result.employeeInssMonthly)],
      ['Après INSS salarié, avant IRS', money(result.afterEmployeeInssMonthly)],
      ['IRS', 'Non calculé — barème actuel non confirmé'],
      ['INSS employeur (6 %)', money(result.employerInssMonthly)],
      ['Coût employeur mensuel', money(result.employerCostMonthly)]
    ];
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, function (character) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]; }); }
  function sourceText() { return mode === 'gw' ? 'DGCI et INSS de Guinée-Bissau — barème et cotisations du modèle anglais, vérifiés le 6 avril 2026.' : 'Décret-loi INSS 19/2022, guide INSS, catalogue IRS officiel et budget 2026, vérifiés le 22 juillet 2026.'; }
  function ready() {
    if (!api || !api.sourceCheckedOn || ageDays(api.sourceCheckedOn) > MAX_AGE_DAYS) {
      error.textContent = 'Les données de calcul sont absentes ou n’ont pas été vérifiées au cours des 366 derniers jours. Aucun résultat n’est produit.';
      form.querySelectorAll('input,button').forEach(function (control) { control.disabled = true; });
      return false;
    }
    app.querySelector('[data-checked-date]').textContent = api.sourceCheckedOn;
    return true;
  }
  function calculate(event) {
    if (event) event.preventDefault();
    error.textContent = '';
    if (!ready()) return;
    lastResult = api.calculate({ grossMonthly: Number(gross.value), secondary: secondary ? secondary.checked : false, includeEmployeeInss: inss ? inss.checked : true });
    if (!lastResult || !lastResult.ok) { resultBox.hidden = true; error.textContent = 'Saisissez un salaire mensuel brut positif ou nul.'; return; }
    resultRows.innerHTML = rows(lastResult).map(function (row) { return '<dt>' + escapeHtml(row[0]) + '</dt><dd>' + escapeHtml(row[1]) + '</dd>'; }).join('');
    resultBox.hidden = false; resultBox.focus({ preventScroll: true });
    status.textContent = mode === 'gw' ? 'Estimation calculée localement.' : 'Cotisations INSS calculées localement ; IRS et salaire net final restent bloqués.';
  }
  function ensure() { if (!lastResult) calculate(); return Boolean(lastResult && lastResult.ok); }
  function text() { return [document.title].concat(rows(lastResult).map(function (row) { return row[0] + ' : ' + row[1]; }), [sourceText(), 'Aide de planification uniquement. Confirmez les règles et obligations auprès des autorités ou d’un professionnel.']).join('\n'); }
  function download(name, type, content) { var url = URL.createObjectURL(new Blob([content], { type: type })); var link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 0); }
  app.querySelector('[data-copy]').addEventListener('click', function () { if (!ensure()) return; navigator.clipboard.writeText(text()).then(function () { status.textContent = 'Résumé copié.'; }); });
  app.querySelector('[data-share]').addEventListener('click', function () { if (!ensure()) return; if (navigator.share) navigator.share({ title: document.title, text: text() }); else navigator.clipboard.writeText(text()).then(function () { status.textContent = 'Résumé copié pour partage.'; }); });
  app.querySelector('[data-json]').addEventListener('click', function () { if (!ensure()) return; download(mode + '-paie-fr.json', 'application/json;charset=utf-8', JSON.stringify({ source: sourceText(), result: lastResult }, null, 2)); status.textContent = 'JSON téléchargé localement.'; });
  app.querySelector('[data-csv]').addEventListener('click', function () { if (!ensure()) return; var csv = [['Champ', 'Valeur']].concat(rows(lastResult)).map(function (row) { return row.map(function (value) { return '"' + String(value).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n'); download(mode + '-paie-fr.csv', 'text/csv;charset=utf-8', '\uFEFF' + csv); status.textContent = 'CSV téléchargé localement.'; });
  app.querySelector('[data-txt]').addEventListener('click', function () { if (!ensure()) return; download(mode + '-paie-fr.txt', 'text/plain;charset=utf-8', text()); status.textContent = 'TXT téléchargé localement.'; });
  app.querySelector('[data-pdf]').addEventListener('click', async function () { if (!ensure()) return; if (!window.AfroTools || !window.AfroTools.pdf) { status.textContent = 'Bibliothèque PDF indisponible.'; return; } await window.AfroTools.pdf.generate({ noGate: true, skipGate: true, toolId: mode + '-paye-fr', category: 'financial', title: document.querySelector('h1').textContent, subtitle: mode === 'st' ? 'INSS vérifié ; IRS volontairement non calculé' : 'Estimation PAYE et INSS', heroStats: rows(lastResult).slice(0, 4), sections: [{ title: 'Détail', rows: rows(lastResult).slice(4) }, { title: 'Source et vérification', rows: [['Source', sourceText()], ['Date', api.sourceCheckedOn]] }], source: sourceText(), disclaimer: 'Aide de planification uniquement. Confirmez taux, barème, exemptions, dépôt et paiement auprès des autorités.' }); status.textContent = 'PDF généré localement.'; });
  app.querySelector('[data-save]').addEventListener('click', function () { localStorage.setItem('afrotools.fr.payroll.' + mode, JSON.stringify({ grossMonthly: gross.value, secondary: secondary && secondary.checked, includeEmployeeInss: inss && inss.checked })); status.textContent = 'Hypothèses enregistrées uniquement sur cet appareil.'; });
  app.querySelector('[data-clear]').addEventListener('click', function () { localStorage.removeItem('afrotools.fr.payroll.' + mode); form.reset(); lastResult = null; resultBox.hidden = true; status.textContent = 'Données locales effacées.'; gross.focus(); });
  form.addEventListener('submit', calculate);
  form.addEventListener('reset', function () { setTimeout(function () { lastResult = null; resultBox.hidden = true; error.textContent = ''; }, 0); });
  if (!ready()) return;
  try { var saved = JSON.parse(localStorage.getItem('afrotools.fr.payroll.' + mode) || 'null'); if (saved) { gross.value = saved.grossMonthly; if (secondary) secondary.checked = Boolean(saved.secondary); if (inss) inss.checked = saved.includeEmployeeInss !== false; } } catch (_) {}
}());
