(function () {
  'use strict';
  const form = document.getElementById('ng-fee-form');
  const output = document.getElementById('ng-fee-result');
  const error = document.getElementById('ng-fee-error');
  const money = new Intl.NumberFormat('en-NG', {style: 'currency', currency: 'NGN'});

  function clearResult() {
    output.hidden = true;
    output.replaceChildren();
    error.textContent = '';
  }
  function showProvider(name, basis, fee, amount, count) {
    const card = document.createElement('div');
    card.className = 'offer-card';
    const heading = document.createElement('h3');
    heading.textContent = name;
    const detail = document.createElement('p');
    detail.textContent = basis;
    const list = document.createElement('dl');
    for (const [label, kobo] of [
      ['Fee per payment', fee], ['Net per payment', amount - fee], ['Monthly fees', fee * count]
    ]) {
      const term = document.createElement('dt');
      const value = document.createElement('dd');
      term.textContent = label;
      value.textContent = kobo < 0 ? 'Fee exceeds payment; check the provider minimum.' : money.format(kobo / 100);
      list.append(term, value);
    }
    card.append(heading, detail, list);
    output.append(card);
  }
  form.addEventListener('input', clearResult);
  form.addEventListener('change', clearResult);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearResult();
    const amount = document.getElementById('ng-sale').valueAsNumber;
    const count = document.getElementById('ng-count').valueAsNumber;
    const channel = document.getElementById('ng-fee-channel').value;
    const kobo = Math.round(amount * 100);
    const engine = window.AfroTools && window.AfroTools.PaystackFeePlanner;
    if (!engine) {
      error.textContent = 'The fee calculator could not load. Refresh the page or use the provider pricing links below.';
      return;
    }
    const paystack = engine.calculate({country: 'NG', amount, count, channel});
    if (!paystack.ok || !Number.isSafeInteger(kobo * count)) {
      error.textContent = 'Enter an amount in naira and kobo and a whole payment count within the supported range.';
      return;
    }
    const percent = channel === 'local' ? 2 : 4.8;
    const base = Math.round(kobo * (channel === 'local' ? 20 : 48) / 1000);
    const vat = Math.round(base * 75 / 1000);
    let basis = 'Published card fee';
    if (paystack.breakdown.fixedWaived) basis += ' · ₦100 flat fee waived';
    if (paystack.breakdown.capped) basis += ' · ₦2,000 local cap applied';
    showProvider('Paystack', basis, Math.round(paystack.perTransaction.fee * 100), kobo, count);
    showProvider('Flutterwave', percent + '% fee ' + money.format(base / 100) +
      ' + VAT ' + money.format(vat / 100), base + vat, kobo, count);
    output.hidden = false;
    output.focus();
  });
})();
