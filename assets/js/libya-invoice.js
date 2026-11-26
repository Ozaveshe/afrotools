'use strict';

(() => {
  const form = document.getElementById('libya-invoice');
  const figures = document.getElementById('figures');
  const invalid = document.getElementById('invalid');
  const locale = document.documentElement.lang;
  const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'LYD' });

  function thousandths(input) {
    const amount = locale === 'fr' ? input.trim().replace(',', '.') : input.trim();
    if (!/^\d+(?:\.\d{1,3})?$/.test(amount)) return NaN;
    const [whole, fraction = ''] = amount.split('.');
    return Number(whole) * 1000 + Number(fraction.padEnd(3, '0'));
  }

  form.addEventListener('input', () => {
    invalid.hidden = true;
    figures.hidden = true;
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const lines = form.elements.lines.value.split(/\r?\n/).filter(line => line.trim());
    const items = lines.reduce((sum, line) => sum + thousandths(line), 0);
    const feeText = form.elements.fees.value.trim();
    const fees = feeText ? thousandths(feeText) : 0;
    const total = items + fees;
    if (!lines.length || !Number.isSafeInteger(total)) {
      invalid.hidden = false;
      figures.hidden = true;
      return;
    }
    for (const [key, amount] of Object.entries({ items, vat: 0, fees, total })) {
      figures.querySelector('[data-value="' + key + '"]').textContent = currency.format(amount / 1000);
    }
    invalid.hidden = true;
    figures.hidden = false;
  });
})();
