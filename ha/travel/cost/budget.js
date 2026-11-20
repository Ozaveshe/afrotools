const form = document.getElementById('budget');
const output = form.querySelector('output');
form.addEventListener('input', () => { output.textContent = ''; });
form.addEventListener('submit', event => {
  event.preventDefault();
  const { people, days, nights, transport, daily, stay, currency } = form.elements;
  const count = people.valueAsNumber;
  const total = count * (Number(transport.value) + days.valueAsNumber * Number(daily.value))
    + nights.valueAsNumber * Number(stay.value);
  if (!Number.isFinite(total) || total <= 0) {
    output.textContent = 'Shigar da kuɗin sufuri, abinci ko masauki domin samun sakamako.';
    return;
  }
  const money = new Intl.NumberFormat('ha-NG', { style: 'currency', currency: currency.value });
  output.textContent = 'Jimillar kuɗin tafiya: ' + money.format(total)
    + '. Rabon kowane matafiyi: ' + money.format(total / count) + '.';
});
