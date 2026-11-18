'use strict';

(() => {
  const element = id => document.getElementById(id);
  const form = element('estimate');
  const basis = element('basis');
  const money = amount => 'MWK ' + amount.toLocaleString('en', { maximumFractionDigits: 2 });
  let report = '';

  function update() {
    element('results').classList.remove('on');
    element('download').hidden = true;
    report = '';
    const gratuity = basis.value === 'gratuity';
    element('wageLabel').textContent = gratuity ? 'Final monthly salary (MWK)' : 'Current monthly qualifying wage (MWK)';
    element('eligibility').textContent = gratuity
      ? 'Select this only for termination, retirement or death with confirmed employer pension exemption and at least three continuous months in a given year.'
      : 'For severance, confirm a qualifying termination under section 35 and check the exclusions below.';
    for (const id of ['lastSalary', 'yearsOfService', 'extraMonths']) {
      element(id).disabled = basis.value === 'unknown';
    }
  }

  form.addEventListener('input', update);
  update();

  form.addEventListener('submit', event => {
    event.preventDefault();
    const wage = element('lastSalary').valueAsNumber;
    const years = element('yearsOfService').valueAsNumber;
    const months = element('extraMonths').valueAsNumber;
    let title = 'Check your eligibility';
    let amount = '';
    let detail = 'Confirm the reason for leaving, any employer pension exemption and your contract with your employer or District Labour Office before estimating a payment.';
    if (basis.value === 'severance') {
      const weeks = Math.min(years, 5) * 2 + Math.min(Math.max(years - 5, 0), 5) * 3 + Math.max(years - 10, 0) * 4;
      const weekly = wage * 12 / 52;
      title = 'Estimated statutory severance';
      amount = money(weekly * weeks);
      detail = money(wage) + ' monthly qualifying wage × 12 ÷ 52 × ' + weeks + ' weeks. ' + years + ' completed years qualify for the schedule. Additional months earn no extra weeks.';
    }
    if (basis.value === 'gratuity') {
      const totalMonths = years * 12 + months;
      title = 'Estimated pension-exempt gratuity';
      amount = money(totalMonths >= 3 ? wage * 0.05 * totalMonths : 0);
      detail = totalMonths >= 3
        ? money(wage) + ' final monthly salary × 5% × ' + totalMonths + ' completed months.'
        : 'The three-month continuous service minimum has not been reached.';
    }
    element('resultTitle').textContent = title;
    element('amount').textContent = amount;
    element('explanation').textContent = detail;
    element('results').classList.add('on');
    if (amount) {
      report = [title, amount, detail, 'Service entered: ' + years + ' years and ' + months + ' months.',
        element('eligibility').textContent, 'Malawi Employment Act, sections 35 / 35A and First Schedule', element('law').href,
        ...(basis.value === 'severance' ? [element('case').href] : [])].join('\n');
      element('download').hidden = false;
    }
  });

  element('download').addEventListener('click', () => {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([report], {type: 'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'malawi-' + basis.value + '-estimate.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
