(function () {
  'use strict';
  var engine = window.StudentLoanEngine;
  var current = null;
  var byId = function (id) { return document.getElementById(id); };

  function number(id) { return byId(id).value.trim(); }
  function label() { return byId('slr-label').value.trim().slice(0, 12); }
  function money(value) {
    var prefix = label();
    return (prefix ? prefix + ' ' : '') + Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  function monthsText(months) {
    var years = Math.floor(months / 12);
    var remainder = months % 12;
    return (years ? years + 'y ' : '') + (remainder ? remainder + 'm' : '');
  }
  function setStatus(message) { byId('slr-action-status').textContent = message || ''; }
  function addMetric(parent, heading, value, note) {
    var card = document.createElement('div');
    card.className = 'rs';
    [['lbl', heading], ['val', value], ['sub', note]].forEach(function (part) {
      var element = document.createElement('div');
      element.className = part[0];
      element.textContent = part[1];
      card.appendChild(element);
    });
    parent.appendChild(card);
  }
  function makeCell(row, value, tag) {
    var cell = document.createElement(tag || 'td');
    cell.textContent = value;
    row.appendChild(cell);
  }
  function renderSchedule(plan) {
    var host = byId('slr-schedule');
    host.replaceChildren();
    var title = document.createElement('h3');
    title.className = 'schedule-title';
    title.textContent = 'Amortization schedule preview';
    var caption = document.createElement('p');
    caption.className = 'schedule-caption';
    caption.textContent = 'First 12 payments plus the final payment. Download the report for a portable summary.';
    var wrap = document.createElement('div');
    wrap.className = 'schedule-wrap';
    var table = document.createElement('table');
    table.className = 'sched-table';
    var head = document.createElement('thead');
    var headerRow = document.createElement('tr');
    ['Month', 'Payment', 'Interest', 'Principal', 'Balance'].forEach(function (text) { makeCell(headerRow, text, 'th'); });
    head.appendChild(headerRow);
    var body = document.createElement('tbody');
    var rows = plan.schedule.slice(0, 12);
    if (plan.schedule.length > 12) rows.push(plan.schedule[plan.schedule.length - 1]);
    rows.forEach(function (entry, index) {
      var row = document.createElement('tr');
      makeCell(row, index === 12 ? entry.month + ' (final)' : entry.month);
      makeCell(row, money(entry.payment));
      makeCell(row, money(entry.interest));
      makeCell(row, money(entry.principal));
      makeCell(row, money(entry.balance));
      body.appendChild(row);
    });
    table.append(head, body);
    wrap.appendChild(table);
    host.append(title, caption, wrap);
  }
  function calculate(event) {
    if (event) event.preventDefault();
    byId('slr-error').textContent = '';
    setStatus('');
    try {
      current = engine.compare({
        principal: number('slr-amount'),
        annualRate: number('slr-rate'),
        months: Number(number('slr-years')) * 12,
        extraPayment: number('slr-extra')
      });
      var plan = current.plan;
      var grid = byId('slr-grid');
      grid.replaceChildren();
      addMetric(grid, 'Scheduled monthly payment', money(plan.scheduledPayment), 'Before any extra payment');
      addMetric(grid, 'Planned monthly payment', money(plan.monthlyPayment), plan.extraPayment ? 'Includes ' + money(plan.extraPayment) + ' extra' : 'No extra payment');
      addMetric(grid, 'Estimated payoff', monthsText(plan.payoffMonths), plan.payoffMonths + ' monthly payments');
      addMetric(grid, 'Estimated interest', money(plan.totalInterest), 'Fixed-rate model only');
      if (plan.extraPayment > 0) {
        addMetric(grid, 'Estimated time saved', monthsText(current.monthsSaved) || '0m', 'Compared with no extra payment');
        addMetric(grid, 'Estimated interest saved', money(current.interestSaved), 'Compared with no extra payment');
      }
      byId('slr-summary').textContent = 'Based only on the amount, fixed annual rate and repayment term you entered.';
      renderSchedule(plan);
      byId('slr-result').classList.add('show');
      byId('slr-result').focus();
    } catch (error) {
      current = null;
      byId('slr-result').classList.remove('show');
      byId('slr-error').textContent = error.message;
      byId('slr-error').focus();
    }
  }
  function report() {
    if (!current) calculate();
    if (!current) return '';
    var plan = current.plan;
    return [
      'Fixed-payment student loan estimate - AfroTools',
      'Loan amount: ' + money(plan.principal),
      'Annual fixed interest rate: ' + plan.annualRate + '%',
      'Contractual term: ' + plan.contractualMonths + ' months',
      'Extra monthly payment: ' + money(plan.extraPayment),
      '',
      'Scheduled monthly payment: ' + money(plan.scheduledPayment),
      'Planned monthly payment: ' + money(plan.monthlyPayment),
      'Estimated payoff: ' + plan.payoffMonths + ' months',
      'Estimated total paid: ' + money(plan.totalPaid),
      'Estimated total interest: ' + money(plan.totalInterest),
      'Estimated time saved: ' + current.monthsSaved + ' months',
      'Estimated interest saved: ' + money(current.interestSaved),
      '',
      'This is a fixed-rate, equal-payment planning model. It is not an official lender statement and does not model income-contingent, payroll-deduction, variable-rate, grace-period, fee, penalty or statutory scheme rules. Confirm all terms and any early-payment treatment with your provider.'
    ].join('\n');
  }
  function copyReport() {
    var text = report();
    if (!text) return;
    navigator.clipboard.writeText(text).then(function () { setStatus('Repayment brief copied.'); })
      .catch(function () { setStatus('Copy is unavailable. Download the TXT brief instead.'); });
  }
  function downloadReport() {
    var text = report();
    if (!text) return;
    var link = document.createElement('a');
    var url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    link.href = url;
    link.download = 'student-loan-fixed-payment-estimate.txt';
    link.click();
    URL.revokeObjectURL(url);
    setStatus('TXT repayment brief downloaded.');
  }
  function reset() {
    byId('slr-form').reset();
    byId('slr-result').classList.remove('show');
    byId('slr-error').textContent = '';
    setStatus('');
    current = null;
    byId('slr-amount').focus();
  }
  function setupFaq() {
    document.querySelectorAll('.faq-q').forEach(function (button) {
      button.addEventListener('click', function () {
        var answer = document.getElementById(button.getAttribute('aria-controls'));
        var open = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!open));
        answer.hidden = open;
      });
    });
  }
  byId('slr-form').addEventListener('submit', calculate);
  byId('slr-reset').addEventListener('click', reset);
  byId('slr-copy').addEventListener('click', copyReport);
  byId('slr-download').addEventListener('click', downloadReport);
  byId('slr-print').addEventListener('click', function () { if (report()) window.print(); });
  setupFaq();
}());
