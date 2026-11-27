'use strict';
const form = document.getElementById('quote-form');
const result = document.getElementById('quote-result');
const format = new Intl.NumberFormat('en-BW', { style: 'currency', currency: 'BWP', currencyDisplay: 'code' });
form.addEventListener('input', () => result.replaceChildren());
form.addEventListener('submit', event => {
  event.preventDefault();
  const fields = Array.from(form.querySelectorAll('input'));
  const unknown = fields.filter(field => field.value === '');
  const sums = { landed: 0, road: 0 };
  for (const field of fields) {
    if (field.value !== '') sums[field.dataset.stage] += Math.round(field.valueAsNumber * 100);
  }
  const pendingBorder = unknown.some(field => field.dataset.stage === 'landed');
  const append = text => {
    const line = document.createElement('p');
    line.textContent = text;
    result.append(line);
  };
  result.replaceChildren();
  append((pendingBorder ? 'Known landed costs' : 'Quoted landed total') + ' — ' + format.format(sums.landed / 100));
  append((unknown.length ? 'Known on-road costs' : 'Quoted on-road total') + ' — ' + format.format((sums.landed + sums.road) / 100));
  if (unknown.length) append('Still to quote — ' + unknown.map(field => field.labels[0].textContent.trim()).join(', ') + '.');
});
