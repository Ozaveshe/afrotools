const form = document.getElementById('quotes');
const result = form.querySelector('output');
form.addEventListener('input', () => { result.textContent = ''; });
form.addEventListener('submit', event => {
  event.preventDefault();
  const fields = form.elements;
  const count = fields.people.valueAsNumber;
  function total(fare, extras) {
    return count * (Math.round(fare.valueAsNumber * 100) + Math.round(Number(extras.value) * 100));
  }
  const a = total(fields.fareA, fields.extraA);
  const b = total(fields.fareB, fields.extraB);
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) {
    result.textContent = 'Ṣàyẹ̀wò àwọn iye tí o tẹ̀ sínú àpótí.';
    return;
  }
  const formatter = new Intl.NumberFormat('yo-NG', { style: 'currency', currency: fields.currency.value });
  const money = cents => formatter.format(cents / 100);
  const difference = a === b ? 'Iye owó méjèèjì dọ́gba.' :
    'Tikẹ́ẹ̀tì ' + (a < b ? 'A' : 'B') + ' dín owó rẹ kù ní ' + money(Math.abs(a - b)) + '.';
  result.textContent = 'A: ' + money(a) + '. B: ' + money(b) + '. ' + difference;
});
