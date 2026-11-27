'use strict';

const nigeriaContributions = (() => {
  const byId = id => document.getElementById(id);
  const money = amount => 'NGN ' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const kobo = value => Math.round((value + Number.EPSILON) * 100) / 100;
  const read = id => byId('ng-' + id).value;
  let currentBrief = '';

  function clear() {
    currentBrief = '';
    byId('ng-out').hidden = true;
    byId('ng-notice').textContent = '';
  }

  function sync() {
    clear();
    const active = byId('country').value === 'NG';
    byId('ng-fields').hidden = !active;
    byId('se-toggle').closest('.ss-se-row').style.display = active ? 'none' : '';
    if (active) {
      byId('se-toggle').checked = false;
      byId('se-panel').classList.remove('visible');
      byId('se-panel').style.display = 'none';
      byId('results').style.display = 'none';
      byId('ai-obs').textContent = 'Enter your scheme details to estimate Nigerian contributions.';
    } else {
      byId('se-panel').style.removeProperty('display');
    }
    const personal = read('sector') === 'self';
    const basicOption = byId('ng-health').querySelector('[value=basic]');
    basicOption.disabled = personal;
    if (personal && read('health') === 'basic') byId('ng-health').value = '';
    const payroll = !personal && byId('ng-include-payroll').checked;
    const state = {
      employee: !personal,
      private: read('sector') === 'private',
      pension: !personal && ['split', 'employer'].includes(read('pension')),
      basic: !personal && read('health') === 'basic',
      manual: read('health') === 'confirmed',
      payroll,
      ecs: payroll && read('ecs') === 'included',
      annual: payroll && Number(read('count')) >= 25 && read('zone') === 'outside'
    };
    byId('ng-fields').querySelectorAll('[data-ng-when]').forEach(group => {
      group.hidden = !state[group.dataset.ngWhen];
    });
    byId('ng-fields').querySelectorAll('input,select').forEach(control => {
      control.disabled = !active || !!control.closest('[hidden]');
    });
  }

  function amount(id, label, maximum = Infinity) {
    const el = byId('ng-' + id);
    const value = el.valueAsNumber;
    if (!Number.isFinite(value) || value < 0 || value > maximum || !el.validity.valid) {
      el.focus();
      throw new Error('Enter a valid ' + label + (Number.isFinite(maximum) ? ' no greater than ' + money(maximum) : '') + '.');
    }
    return value;
  }

  function calculate(gross) {
    clear();
    const rows = [];
    const sector = read('sector');
    const self = sector === 'self';
    if (!sector) { byId('ng-sector').focus(); throw new Error('Choose employment status.'); }
    const pension = self ? 'excluded' : read('pension');
    const health = read('health');
    if (!pension || !health) throw new Error('Choose the applicable pension and health arrangements.');
    function row(scheme, basis, worker, employer) {
      rows.push({ scheme, basis, worker: kobo(worker), employer: kobo(employer) });
    }
    if (pension === 'excluded') row('Pension', 'Outside the selected payroll arrangement', 0, 0);
    else {
      const base = amount('emoluments', 'monthly pensionable pay', gross);
      if (base === 0) throw new Error('Enter positive monthly pensionable pay for the selected arrangement.');
      const split = pension === 'split';
      row('Pension', money(base) + (split ? ' × 8% worker and 10% employer' : ' × 20% employer'), split ? base * .08 : 0, base * (split ? .10 : .20));
    }
    const opted = sector !== 'private' || byId('ng-nhf').checked;
    const housing = gross >= 70000 && opted;
    row('National Housing Fund', housing ? money(gross) + ' monthly income × 2.5%' : gross < 70000 ? 'Below NGN 70,000 monthly threshold' : 'Private-sector worker did not opt in', housing ? gross * .025 : 0, 0);
    if (health === 'basic' && !self) {
      const base = amount('basic', 'monthly basic salary', gross);
      if (base === 0) throw new Error('Enter positive basic salary for percentage-based health contributions.');
      row('Health insurance', money(base) + ' basic pay × confirmed 5% worker and 10% employer', base * .05, base * .10);
    } else if (health === 'confirmed') {
      row('Health insurance', 'Confirmed monthly amounts entered from the plan', amount('health-worker', 'worker health amount', gross), self ? 0 : amount('health-employer', 'employer health amount'));
    } else row('Health insurance', 'Outside this estimate', 0, 0);
    const worker = kobo(rows.reduce((n, r) => n + r.worker, 0));
    const employer = kobo(rows.reduce((n, r) => n + r.employer, 0));
    if (worker > gross) throw new Error('The selected worker contributions exceed the entered monthly income.');
    const lines = ['Nigeria contribution estimate', 'Employment: ' + byId('ng-sector').selectedOptions[0].textContent,
      'Monthly gross income: ' + money(gross), '', 'Monthly personal contribution breakdown'];
    for (const r of rows) lines.push(r.scheme + ' — ' + r.basis + '. Worker: ' + money(r.worker) + ' | Employer: ' + money(r.employer));
    lines.push('', 'Worker contributions included: ' + money(worker), 'Employer contributions for this worker: ' + money(employer),
      'Income after selected worker contributions, before PAYE and other deductions: ' + money(gross - worker));
    if (!self && byId('ng-include-payroll').checked) {
      const count = amount('count', 'whole number of employees');
      if (!Number.isInteger(count) || count < 1) throw new Error('Enter at least one employee.');
      if (!read('zone') || !read('ecs')) throw new Error('Select the free-trade-zone status and ECS coverage.');
      lines.push('', 'Employer-wide levies (separate from the worker totals)', 'Employees: ' + count + ' | Free trade zone: ' + (read('zone') === 'inside' ? 'yes' : 'no'));
      if (read('ecs') === 'included') {
        const payroll = amount('monthly-payroll', 'total monthly covered payroll');
        lines.push('NSITF ECS: ' + money(kobo(payroll * .01)) + ' monthly, using 1% of ' + money(payroll) + ' covered monthly payroll.');
      } else lines.push('NSITF ECS: outside this estimate.');
      if (count >= 25 && read('zone') === 'outside') {
        const payroll = amount('annual-payroll', 'total annual payroll');
        lines.push('ITF: ' + money(kobo(payroll * .01)) + ' annually, using 1% of ' + money(payroll) + ' annual payroll.');
      } else lines.push('ITF: outside the general contribution rule (25 or more employees outside a free-trade zone).');
    } else lines.push('', 'Employer-wide NSITF ECS and ITF levies excluded from this estimate.');
    lines.push('', 'Sources and scope', ...Array.from(byId('ng-sources').querySelectorAll('a'), a => a.textContent + ' — ' + a.href));
    currentBrief = lines.join('\n');
    byId('ng-summary').textContent = currentBrief.split('\nSources and scope')[0].trim();
    byId('ng-out').hidden = false;
    byId('ng-out').scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  function run(gross) {
    try { calculate(gross); } catch (err) { byId('ng-notice').textContent = err.message; }
  }
  function init() {
    byId('ng-fields').addEventListener('input', sync);
    byId('ng-fields').addEventListener('change', sync);
    byId('monthly-salary').addEventListener('input', clear);
    byId('ng-copy').addEventListener('click', async () => {
      if (!currentBrief) return;
      try { await navigator.clipboard.writeText(currentBrief); byId('ng-notice').textContent = 'Contribution estimate copied.'; }
      catch { byId('ng-notice').textContent = 'Copy unavailable. Download the text summary.'; }
    });
    byId('ng-download').addEventListener('click', () => {
      if (!currentBrief) return;
      const url = URL.createObjectURL(new Blob([currentBrief + '\n'], { type: 'text/plain;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = 'nigeria-contributions.txt'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    sync();
  }
  return { init, sync, run };
})();
document.addEventListener('DOMContentLoaded', nigeriaContributions.init);
