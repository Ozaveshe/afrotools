'use strict';

const form = document.querySelector('.sales-scenario form');
const figures = document.getElementById('figures');
const invalid = document.getElementById('invalid');
const money = new Intl.NumberFormat(document.documentElement.lang, {
  style: 'currency',
  currency: 'SSP'
});

form.addEventListener('input', () => {
  figures.hidden = true;
  invalid.hidden = true;
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const amount = form.elements.amount.valueAsNumber;
  const rate = form.elements.rate.valueAsNumber / 100;
  const inclusive = form.elements.basis.value === 'gross';
  const net = inclusive ? amount / (1 + rate) : amount;
  const tax = inclusive ? amount - net : net * rate;
  const total = inclusive ? amount : net + tax;
  if (![net, tax, total].every(Number.isFinite)) {
    invalid.hidden = false;
    figures.hidden = true;
    return;
  }
  for (const [key, value] of Object.entries({ net, tax, total })) {
    figures.querySelector('[data-value="' + key + '"]').textContent = money.format(value);
  }
  invalid.hidden = true;
  figures.hidden = false;
});
