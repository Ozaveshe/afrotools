(function () {
  'use strict';
  const form = document.getElementById('domestic-budget');
  const fields = form.elements;
  const result = document.getElementById('budget-result');
  const status = document.getElementById('budget-status');
  const money = new Intl.NumberFormat('fr', {style: 'currency', currency: form.dataset.currency, currencyDisplay: 'code'});
  function numeric(field) { return fields[field].valueAsNumber || 0; }
  function synchronize() {
    const daily = fields.period.value === 'daily';
    document.getElementById('days-field').hidden = !daily;
    fields.days.disabled = !daily;
    fields.days.required = daily;
    fields.multiplier.required = numeric('overtime') > 0;
    fields.multiplier.min = fields.multiplier.required ? '1' : '0';
    fields.basePay.setCustomValidity(fields.basePay.value && numeric('basePay') <= 0 ? 'Saisissez une rémunération positive.' : '');
    fields.hours.setCustomValidity(fields.hours.value && numeric('hours') <= 0 ? 'Saisissez un nombre d’heures positif.' : '');
    status.textContent = '';
    result.hidden = true;
  }
  form.addEventListener('input', synchronize);
  form.addEventListener('change', synchronize);
  form.addEventListener('invalid', event => {
    const details = event.target.closest('details');
    if (details) details.open = true;
  }, true);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const allowances = numeric('allowances'), other = numeric('other');
    const estimate = window.AfroTools.frHrPayroll.domesticBudget({
      basePay: numeric('basePay'), payPeriod: fields.period.value, hoursPerWeek: numeric('hours'),
      daysPerWeek: numeric('days'), overtimeHours: numeric('overtime'), overtimeMultiplier: numeric('multiplier'),
      allowances, employerPct: numeric('contribution'), adminCost: other,
    });
    if (!Number.isFinite(estimate.annualCost)) {
      status.textContent = 'Montants trop élevés. Vérifiez les valeurs saisies.';
      return;
    }
    const breakdown = Object.assign({ allowances, other }, estimate);
    result.querySelectorAll('[data-budget]').forEach(node => { node.textContent = money.format(breakdown[node.dataset.budget]); });
    result.hidden = false;
    status.textContent = 'Budget employeur mensuel estimé : ' + money.format(estimate.monthlyCost) + '.';
  });
  synchronize();
})();
