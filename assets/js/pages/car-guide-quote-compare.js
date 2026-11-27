(() => {
  'use strict';
  const form = document.querySelector('[data-car-quote-compare]');
  if (!form) return;
  const output = form.querySelector('output');
  form.addEventListener('input', () => { output.textContent = ''; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const first = Math.round(form.elements.first.valueAsNumber * 100);
    const second = Math.round(form.elements.second.valueAsNumber * 100);
    if (![first, second].every(Number.isSafeInteger)) {
      output.textContent = 'Enter smaller amounts to compare these quotes accurately.';
      return;
    }
    const difference = Math.abs(first - second) / 100;
    const amount = new Intl.NumberFormat('en', {style:'currency', currency:form.dataset.currency, currencyDisplay:'code'}).format(difference);
    output.textContent = difference === 0 ? 'The two on-road quotes are equal.' : (first < second ? 'The first' : 'The second') + ' quote is lower by ' + amount + '.';
  });
})();
