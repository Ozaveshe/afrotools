(() => {
  const form = document.getElementById('tfsa-form');
  const annual = document.getElementById('tfsa-annual');
  const lifetime = document.getElementById('tfsa-lifetime');
  const planned = document.getElementById('tfsa-planned');
  const result = document.getElementById('tfsa-result');
  const rand = cents => 'R' + (cents / 100).toLocaleString('en-GB', { maximumFractionDigits: 2 });
  const cents = input => Math.round(input.valueAsNumber * 100);
  form.hidden = false;
  form.addEventListener('input', () => {
    lifetime.setCustomValidity('');
    result.textContent = '';
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (cents(lifetime) < cents(annual)) {
      lifetime.setCustomValidity('Include this tax year in your lifetime contributions.');
      lifetime.reportValidity();
      return;
    }
    const annualBalance = 4600000 - cents(annual);
    const lifetimeBalance = 50000000 - cents(lifetime);
    const room = Math.max(0, Math.min(annualBalance, lifetimeBalance));
    const limitMessage = (name, balance) => balance < 0
      ? name + ' limit already exceeded by ' + rand(-balance) + '.'
      : name + ' room: ' + rand(balance) + '.';
    const lines = [
      'You can still contribute ' + rand(room) + ' in 2026/27.',
      limitMessage('Annual', annualBalance),
      limitMessage('Lifetime', lifetimeBalance)
    ];
    if (planned.value !== '') {
      const remaining = room - cents(planned);
      lines.push(remaining < 0
        ? 'Your proposed contribution exceeds the available room by ' + rand(-remaining) + '.'
        : 'Your proposed contribution fits, leaving ' + rand(remaining) + ' this tax year.');
    }
    result.textContent = lines.join(' ');
  });
})();
