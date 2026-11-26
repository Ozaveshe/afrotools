'use strict';

const form = document.getElementById('quotes');
const results = document.getElementById('results');
const summary = document.getElementById('summary');
const input = id => document.getElementById(id);
const number = id => input(id).valueAsNumber;

function quote(suffix, defaultName, billableParts, messages, money, unitPrice) {
  const name = input('name' + suffix).value.trim() || defaultName;
  const rate = number('rate' + suffix);
  const discount = number('discount' + suffix);
  const fee = number('fee' + suffix);
  const discounted = billableParts * rate * (1 - discount / 100);
  const total = Math.round((discounted + fee) * 100) / 100;
  const line = name + ' — jimillar wata: ' + money.format(total)
    + '; kowane saƙo: ' + unitPrice.format(total / messages)
    + '\nFarashin sashe: ' + unitPrice.format(rate) + '; rangwame: ' + discount
    + '%; sauran kuɗaɗe: ' + money.format(fee);
  return { name, total, line };
}

function calculate() {
  const volume = number('volume');
  const parts = volume * number('segments');
  const currency = input('currency').value;
  const money = new Intl.NumberFormat('ha', { style: 'currency', currency, currencyDisplay: 'code',
    minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const unitPrice = new Intl.NumberFormat('ha', { style: 'currency', currency, currencyDisplay: 'code',
    minimumFractionDigits: 2, maximumFractionDigits: 4 });
  const first = quote('A', 'Kamfani na farko', parts, volume, money, unitPrice);
  const second = quote('B', 'Kamfani na biyu', parts, volume, money, unitPrice);
  const difference = Math.abs(first.total - second.total);
  const lower = first.total < second.total ? first : second;
  return [input('market').value.trim() + ' — ' + input('kind').value,
    'Saƙonnin wata: ' + volume.toLocaleString('ha'),
    'Sassa a kowane saƙo: ' + number('segments'),
    'Sassan SMS da za a caje: ' + parts.toLocaleString('ha'), first.line, second.line,
    difference === 0 ? 'Kuɗin kamfanonin biyu ya yi daidai.'
      : lower.name + ' ya fi araha da ' + money.format(difference) + ' a wata.'].join('\n');
}

form.addEventListener('input', () => { results.hidden = true; });
form.addEventListener('submit', event => {
  event.preventDefault();
  summary.textContent = calculate();
  results.hidden = false;
  summary.scrollIntoView({ block: 'nearest' });
});

input('download').addEventListener('click', () => {
  if (!form.reportValidity()) return;
  const text = 'AfroTools — Kwatanta farashin SMS\n' + calculate();
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'kwatanta-farashin-sms.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
