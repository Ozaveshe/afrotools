const levyForm = document.getElementById('diamond-levy');
const levyResult = document.getElementById('result');
const levyCurrency = new Intl.NumberFormat('en-ZA', {style: 'currency', currency: 'ZAR'});
levyForm.addEventListener('input', () => { levyResult.hidden = true; });
levyForm.addEventListener('submit', event => {
  event.preventDefault();
  const value = document.getElementById('value').valueAsNumber;
  document.getElementById('gross').value = levyCurrency.format(value * 0.05);
  levyResult.hidden = false;
});
