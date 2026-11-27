'use strict';

const nigeriaContributions = (() => {
  const language = document.documentElement.lang.split('-')[0];
  const messages = window.AfroNigeriaContributionMessages?.[language] || {};
  const t = text => messages[text] || text;
  const french = language === 'fr';
  const byId = id => document.getElementById(id);
  const money = amount => 'NGN ' + amount.toLocaleString(({ fr: 'fr-FR', sw: 'sw-KE' })[language] || 'en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const kobo = value => Math.round((value + Number.EPSILON) * 100) / 100;
  const read = id => byId('ng-' + id).value;
  let currentBrief = '';

  function clear() {
    currentBrief = '';
    if (byId('ng-out')) byId('ng-out').hidden = true;
    byId('ng-notice').textContent = '';
  }

  function sync() {
    clear();
    const active = byId('country').value === 'NG';
    byId('ng-fields').hidden = !active;
    const incomeLabel = document.querySelector(french ? 'label[for=salary]' : 'label[for=monthly-salary]');
    if (!incomeLabel.dataset.originalText) incomeLabel.dataset.originalText = incomeLabel.textContent;
    incomeLabel.textContent = active ? t('Monthly gross income') : incomeLabel.dataset.originalText;
    if (!french) {
      byId('se-toggle').closest('.ss-se-row').style.display = active ? 'none' : '';
      if (active) {
        byId('se-toggle').checked = false;
        byId('se-panel').classList.remove('visible');
        byId('se-panel').style.display = 'none';
        byId('results').style.display = 'none';
        byId('ai-obs').textContent = t('Enter your scheme details to estimate Nigerian contributions.');
      } else {
        byId('se-panel').style.removeProperty('display');
      }
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
      throw new Error(t('Enter a valid ') + label + (Number.isFinite(maximum) ? t(' no greater than ') + money(maximum) : '') + '.');
    }
    return value;
  }

  function calculate(gross) {
    if (!Number.isFinite(gross) || gross <= 0) throw new Error(t('Enter positive monthly gross income.'));
    clear();
    const rows = [];
    const sector = read('sector');
    const self = sector === 'self';
    if (!sector) { byId('ng-sector').focus(); throw new Error(t('Choose employment status.')); }
    const pension = self ? 'excluded' : read('pension');
    const health = read('health');
    if (!pension || !health) throw new Error(t('Choose the applicable pension and health arrangements.'));
    function row(scheme, basis, worker, employer) {
      rows.push({ scheme, basis, worker: kobo(worker), employer: kobo(employer) });
    }
    if (pension === 'excluded') row(t('Pension'), t('Outside the selected payroll arrangement'), 0, 0);
    else {
      const base = amount('emoluments', t('monthly pensionable pay'), gross);
      if (base === 0) throw new Error(t('Enter positive monthly pensionable pay for the selected arrangement.'));
      const split = pension === 'split';
      row(t('Pension'), money(base) + (split ? t(' × 8% worker and 10% employer') : t(' × 20% employer')), split ? base * .08 : 0, base * (split ? .10 : .20));
    }
    const opted = sector !== 'private' || byId('ng-nhf').checked;
    const housing = gross >= 70000 && opted;
    row(t('National Housing Fund'), housing ? money(gross) + t(' monthly income × 2.5%') : gross < 70000 ? t('Below NGN 70,000 monthly threshold') : t('Private-sector worker did not opt in'), housing ? gross * .025 : 0, 0);
    if (health === 'basic' && !self) {
      const base = amount('basic', t('monthly basic salary'), gross);
      if (base === 0) throw new Error(t('Enter positive basic salary for percentage-based health contributions.'));
      row(t('Health insurance'), money(base) + t(' basic pay × confirmed 5% worker and 10% employer'), base * .05, base * .10);
    } else if (health === 'confirmed') {
      row(t('Health insurance'), t('Confirmed monthly amounts entered from the plan'), amount('health-worker', t('worker health amount'), gross), self ? 0 : amount('health-employer', t('employer health amount')));
    } else row(t('Health insurance'), t('Outside this estimate'), 0, 0);
    const worker = kobo(rows.reduce((n, r) => n + r.worker, 0));
    const employer = kobo(rows.reduce((n, r) => n + r.employer, 0));
    if (worker > gross) throw new Error(t('The selected worker contributions exceed the entered monthly income.'));
    const lines = [t('Nigeria contribution estimate'), t('Employment: ') + byId('ng-sector').selectedOptions[0].textContent,
      t('Monthly gross income: ') + money(gross), '', t('Monthly personal contribution breakdown')];
    for (const r of rows) lines.push(r.scheme + ' — ' + r.basis + t('. Worker: ') + money(r.worker) + t(' | Employer: ') + money(r.employer));
    lines.push('', t('Worker contributions included: ') + money(worker), t('Employer contributions for this worker: ') + money(employer),
      t('Income after selected worker contributions, before PAYE and other deductions: ') + money(gross - worker));
    if (!self && byId('ng-include-payroll').checked) {
      const count = amount('count', t('whole number of employees'));
      if (!Number.isInteger(count) || count < 1) throw new Error(t('Enter at least one employee.'));
      if (!read('zone') || !read('ecs')) throw new Error(t('Select the free-trade-zone status and ECS coverage.'));
      lines.push('', t('Employer-wide levies (separate from the worker totals)'), t('Employees: ') + count + t(' | Free trade zone: ') + (read('zone') === 'inside' ? t('yes') : t('no')));
      if (read('ecs') === 'included') {
        const payroll = amount('monthly-payroll', t('total monthly covered payroll'));
        lines.push(t('NSITF ECS: ') + money(kobo(payroll * .01)) + t(' monthly, using 1% of ') + money(payroll) + t(' covered monthly payroll.'));
      } else lines.push(t('NSITF ECS: outside this estimate.'));
      if (count >= 25 && read('zone') === 'outside') {
        const payroll = amount('annual-payroll', t('total annual payroll'));
        lines.push(t('ITF: ') + money(kobo(payroll * .01)) + t(' annually, using 1% of ') + money(payroll) + t(' annual payroll.'));
      } else lines.push(t('ITF: outside the general contribution rule (25 or more employees outside a free-trade zone).'));
    } else lines.push('', t('Employer-wide NSITF ECS and ITF levies excluded from this estimate.'));
    const contentLines = lines.slice();
    const sources = Array.from(byId('ng-sources').querySelectorAll('a'), a => a.textContent + ' — ' + a.href);
    lines.push('', t('Sources and scope'), ...sources);
    currentBrief = lines.join('\n');
    if (french) return { nigeria: true, lines: contentLines.filter(Boolean), sources, reviewDate: '2026-11-27' };
    byId('ng-summary').textContent = contentLines.join('\n').trim();
    byId('ng-out').hidden = false;
    byId('ng-out').scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  function run(gross) {
    try { calculate(gross); } catch (err) { byId('ng-notice').textContent = err.message; }
  }
  function init() {
    byId('ng-fields').addEventListener('input', sync);
    byId('ng-fields').addEventListener('change', sync);
    (byId('monthly-salary') || byId('salary')).addEventListener('input', clear);
    if (french) {
      byId('country').addEventListener('change', sync);
      sync();
      return;
    }
    byId('ng-copy').addEventListener('click', async () => {
      if (!currentBrief) return;
      try { await navigator.clipboard.writeText(currentBrief); byId('ng-notice').textContent = t('Contribution estimate copied.'); }
      catch { byId('ng-notice').textContent = t('Copy unavailable. Download the text summary.'); }
    });
    byId('ng-download').addEventListener('click', () => {
      if (!currentBrief) return;
      const url = URL.createObjectURL(new Blob([currentBrief + '\n'], { type: 'text/plain;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = 'nigeria-contributions.txt'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    sync();
  }
  return { init, sync, run, calculate };
})();
document.addEventListener('DOMContentLoaded', nigeriaContributions.init);
