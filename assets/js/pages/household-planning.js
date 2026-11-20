(() => {
  const form = document.querySelector('form[data-plan]');
  const result = form.querySelector('section');
  const format = new Intl.NumberFormat('en', {maximumFractionDigits: 2});
  form.addEventListener('input', () => { result.hidden = true; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const input = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, Number(value)]));
    let values;
    if (form.dataset.plan === 'baby-cost') {
      const recurring = input.monthly * input.months;
      const total = input.setup + recurring;
      values = {recurring, total, gap: Math.max(0, total - input.saved)};
    } else {
      const worth = input.endAssets - input.endDebt;
      values = {balance: input.income - input.expenses, worth, change: worth - (input.startAssets - input.startDebt)};
    }
    for (const [key, value] of Object.entries(values)) {
      form.elements[key].value = Number.isFinite(value) ? format.format(value) : 'Amount exceeds calculator range';
    }
    result.hidden = false;
  });
})();
