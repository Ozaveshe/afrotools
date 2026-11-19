(() => {
  'use strict';
  const form = document.getElementById('somalia-estimate');
  const { basis, currency, lastSalary, yearsOfService, rate } = form.elements;
  const results = document.getElementById('results');
  function refresh() {
    const contract = basis.value === 'contract';
    document.getElementById('rate-field').hidden = !contract;
    rate.disabled = !contract;
    rate.required = contract;
    results.classList.remove('on');
    results.replaceChildren();
  }
  form.addEventListener('input', refresh);
  form.addEventListener('change', refresh);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const contract = basis.value === 'contract';
    const factor = contract ? rate.valueAsNumber : 1;
    const amount = lastSalary.valueAsNumber * yearsOfService.valueAsNumber * factor;
    const money = new Intl.NumberFormat('en', {
      style: 'currency', currency: currency.value, currencyDisplay: 'code',
      maximumFractionDigits: 2
    });
    const title = document.createElement('h2');
    title.className = 'hr-res-hero-label';
    title.textContent = contract ? 'Estimated contractual gratuity' : 'Estimated redundancy pay';
    const total = document.createElement('p');
    total.className = 'hr-res-hero-amount';
    total.textContent = Number.isFinite(amount) ? money.format(amount) : 'Amount is too large';
    const detail = document.createElement('p');
    detail.textContent = money.format(lastSalary.valueAsNumber) + ' monthly salary × ' +
      yearsOfService.valueAsNumber + ' full years × ' + factor + ' month(s) of salary per year.';
    const box = document.createElement('div');
    box.className = 'hr-res-hero';
    box.append(title, total, detail);
    results.replaceChildren(box);
    results.classList.add('on');
  });
  refresh();
})();
