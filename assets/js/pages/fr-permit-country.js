(() => {
  'use strict';
  const form = document.querySelector('#permit-budget');
  const fields = form.elements;
  const currency = form.dataset.currency;
  const result = document.querySelector('#result');
  const exchange = document.querySelector('#exchange');
  const format = new Intl.NumberFormat('fr', {style:'currency', currency, currencyDisplay:'code'});
  function update() {
    result.hidden = true;
    const iso = fields.feeCurrency.value.toUpperCase();
    const foreign = iso.length === 3 && iso !== currency;
    exchange.hidden = !foreign;
    fields.rate.required = foreign;
    exchange.querySelector('span').textContent = 'Votre taux de change : 1 ' + iso + ' en ' + currency;
    fields.dependantFee.required = Number(fields.dependants.value) > 0;
  }
  fields.preset.addEventListener('change', () => {
    const preset = fields.preset.selectedOptions[0].dataset;
    fields.mainFee.value = preset.fee ?? '';
    fields.mainFee.readOnly = preset.fee !== undefined;
    fields.feeCurrency.value = preset.iso || currency;
    fields.feeCurrency.readOnly = preset.fee !== undefined;
    fields.rate.value = '';
    update();
  });
  form.addEventListener('input', update);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    for (const key of ['mainApplicants','dependants','mainFee','dependantFee','supportingCosts','professionalCosts','travelCosts','otherCosts','contingencyRate']) values[key] = Number(values[key] || 0);
    values.mainFee *= exchange.hidden ? 1 : Number(fields.rate.value);
    const budget = window.AfroTools.governmentParityEngine.calculatePermit(values);
    if (!budget.ok || !Number.isFinite(budget.total)) return;
    result.querySelectorAll('[data-value]').forEach(node => { node.textContent = format.format(budget[node.dataset.value]); });
    result.hidden = false;
    result.scrollIntoView({block:'nearest'});
  });
  update();
})();
