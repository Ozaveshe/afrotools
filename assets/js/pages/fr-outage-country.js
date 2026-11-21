(function () {
  'use strict';
  const form = document.getElementById('outage-country');
  const result = document.getElementById('outage-result');
  const status = document.getElementById('calculation-status');
  const money = new Intl.NumberFormat('fr', {
    style: 'currency', currency: form.dataset.currency, currencyDisplay: 'code',
  });
  function number(name) {
    return form.elements[name].valueAsNumber || 0;
  }
  function clearResult() {
    result.hidden = true;
    status.textContent = '';
  }
  form.addEventListener('input', clearResult);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const impact = window.AfroTools.calculateOutageIncident({
      outageHours: number('hours'), revenuePerHour: number('revenue'), revenueLossPct: 1,
      uncoveredShare: 1, staffIdleCost: number('staff'), backupCostHour: number('backup'),
      spoiledInventory: number('stock'), spoilagePct: 1, internetPaymentCost: 0,
      recoveryBufferPct: 0, monthlyOutages: number('frequency'),
    });
    if (!Number.isFinite(impact.monthlyExposure) || !Number.isFinite(impact.totalCost)) {
      clearResult();
      status.textContent = 'Montants trop élevés. Vérifiez les valeurs saisies.';
      return;
    }
    result.querySelectorAll('[data-output]').forEach(function (node) {
      node.textContent = money.format(impact[node.dataset.output]);
    });
    result.hidden = false;
    status.textContent = 'Coût estimé par coupure : ' + money.format(impact.totalCost) + '.';
  });
})();
