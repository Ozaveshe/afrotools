(function () {
  'use strict';
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.staffCostPlanner;
  if (!engine) return;
  var result = null;
  var status = document.getElementById('scp-status');
  var currency = 'NGN';
  function number(id) { return Number(document.getElementById(id).value || 0); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function input() {
    return {
      currency: document.getElementById('scp-currency').value, headcount: number('scp-headcount'), horizonMonths: number('scp-horizon'),
      monthlySalary: number('scp-salary'), monthlyEmployerObligations: number('scp-obligations'), monthlyBenefits: number('scp-benefits'), monthlyOtherRecurring: number('scp-recurring'),
      recruitmentCost: number('scp-recruitment'), equipmentCost: number('scp-equipment'), annualExtras: number('scp-annual-extras'), contingencyPercent: number('scp-contingency'),
      sourceLabel: document.getElementById('scp-source-label').value, sourceCheckedDate: document.getElementById('scp-source-date').value, asOfDate: today(),
      employeeStatusConfirmed: document.getElementById('scp-status-confirm').checked, obligationEvidenceConfirmed: document.getElementById('scp-source-confirm').checked
    };
  }
  function money(value) { return new Intl.NumberFormat('en', { style: 'currency', currency: currency, maximumFractionDigits: 2 }).format(value); }
  function metric(label, value) { return '<div class="scp-metric"><span>' + label + '</span><strong>' + value + '</strong></div>'; }
  function rows() {
    return [
      ['Cash salary for horizon', money(result.salaryForHorizon)], ['Employer obligations per person / month', money(result.perPerson.employerObligations)],
      ['Benefits per person / month', money(result.perPerson.benefits)], ['Other recurring per person / month', money(result.perPerson.otherRecurring)],
      ['Team recurring cost / month', money(result.teamRecurringMonthly)], ['Recruitment and equipment', money(result.oneOffTeam)],
      ['Annual extras in horizon', money(result.annualExtrasForHorizon)], ['Planning contingency (' + result.contingencyPercent.toFixed(2) + '%)', money(result.contingency)],
      ['Total staff budget', money(result.horizonTotal)]
    ];
  }
  function render() {
    document.getElementById('scp-total').textContent = money(result.horizonTotal);
    document.getElementById('scp-result-note').textContent = result.headcount + ' staff over ' + result.horizonMonths + ' month' + (result.horizonMonths === 1 ? '' : 's') + '. Source checked ' + result.sourceAgeDays + ' day' + (result.sourceAgeDays === 1 ? '' : 's') + ' ago.';
    document.getElementById('scp-metrics').innerHTML = metric('Monthly planning average', money(result.monthlyPlanningAverage)) + metric('Recurring cost per person', money(result.perPerson.recurringMonthly)) + metric('Cost per person for horizon', money(result.costPerPersonForHorizon)) + metric('Load above cash salary', money(result.loadAboveSalary) + ' (' + result.loadPercent.toFixed(2) + '%)');
    document.getElementById('scp-breakdown').innerHTML = rows().map(function (row) { return '<tr><th scope="row">' + row[0] + '</th><td>' + row[1] + '</td></tr>'; }).join('');
    document.getElementById('scp-evidence').textContent = 'Evidence used: ' + result.sourceLabel + ' - checked ' + result.sourceCheckedDate + '. This label is included in local exports but is not stored by AfroTools.';
  }
  function calculate(event) {
    if (event) event.preventDefault();
    try { result = engine.calculate(input()); currency = result.currency; render(); status.textContent = ''; }
    catch (error) { result = null; document.getElementById('scp-total').textContent = 'No budget'; document.getElementById('scp-result-note').textContent = 'Resolve the evidence message before using a number.'; document.getElementById('scp-metrics').innerHTML = ''; document.getElementById('scp-breakdown').innerHTML = ''; document.getElementById('scp-evidence').textContent = ''; status.textContent = error.message; }
  }
  function summary() { return ['Staff cost planning brief', result.headcount + ' staff - ' + result.horizonMonths + ' months', 'Currency: ' + result.currency].concat(rows().map(function (row) { return row[0] + ': ' + row[1]; }), ['Evidence: ' + result.sourceLabel + ' (checked ' + result.sourceCheckedDate + ')', 'Boundary: employer planning only; no PAYE, take-home, worker classification, termination liability, filing or legal approval.']).join('\n'); }
  function copy() {
    if (!result) calculate(); if (!result) return;
    if (!navigator.clipboard) { status.textContent = 'Copy is unavailable in this browser.'; return; }
    navigator.clipboard.writeText(summary()).then(function () { status.textContent = 'Staff budget summary copied.'; }).catch(function () { status.textContent = 'Copy failed.'; });
  }
  function csv() {
    if (!result) calculate(); if (!result) return;
    var data = [['Staff cost planning brief'], ['Headcount', result.headcount], ['Planning horizon months', result.horizonMonths], ['Currency', result.currency], ['Evidence source', result.sourceLabel], ['Source checked date', result.sourceCheckedDate]].concat(rows());
    var content = '\uFEFF' + data.map(function (row) { return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
    var url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' })); var a = document.createElement('a'); a.href = url; a.download = 'staff-cost-planning-brief.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 0); status.textContent = 'CSV downloaded locally.';
  }
  async function pdf() {
    if (!result) calculate(); if (!result) return;
    try {
      if (!window.AfroTools || !window.AfroTools.pdf) throw new Error('PDF library is unavailable.');
      await window.AfroTools.pdf.generate({ noGate: true, skipGate: true, title: 'Staff Cost Planning Brief', subtitle: result.headcount + ' staff - ' + result.horizonMonths + ' months', toolId: 'staff-cost', country: 'User-evidenced employer plan', heroStats: [{ label: 'Total staff budget', value: money(result.horizonTotal), highlight: true }, { label: 'Monthly planning average', value: money(result.monthlyPlanningAverage) }, { label: 'Recurring per person', value: money(result.perPerson.recurringMonthly) }, { label: 'Load above cash salary', value: result.loadPercent.toFixed(2) + '%' }], sections: [{ title: 'Budget breakdown', rows: rows().slice(0, -1).map(function (row) { return { label: row[0], value: row[1] }; }) }, { title: 'Evidence boundary', rows: [{ label: 'Source label', value: result.sourceLabel }, { label: 'Source checked', value: result.sourceCheckedDate }, { label: 'Employment status', value: 'User confirmed as reviewed' }] }], source: 'Cost categories follow IAS 19 employee-benefit context. Employer-obligation amounts and current legal treatment are supplied and confirmed by the user.', disclaimer: 'Planning estimate only. This brief does not calculate employee PAYE or take-home, determine worker status, calculate termination liability, process payroll, file returns or provide legal or tax advice.' });
      status.textContent = 'PDF generated locally.';
    } catch (error) { status.textContent = error.message; }
  }
  document.getElementById('scp-form').addEventListener('submit', calculate);
  document.getElementById('scp-form').addEventListener('reset', function () { setTimeout(function () { document.getElementById('scp-source-date').value = today(); calculate(); }, 0); });
  document.getElementById('scp-copy').addEventListener('click', copy); document.getElementById('scp-csv').addEventListener('click', csv); document.getElementById('scp-pdf').addEventListener('click', pdf);
  document.getElementById('scp-source-date').value = today(); calculate();
})();
