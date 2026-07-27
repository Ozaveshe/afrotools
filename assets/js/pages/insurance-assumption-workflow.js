(function () {
  'use strict';

  var root = document.querySelector('[data-insurance-workflow]');
  if (!root) return;
  var form = root.querySelector('form');
  var output = root.querySelector('[data-result]');
  var mode = root.dataset.mode;
  var currency = root.dataset.currency || 'your currency';
  var money = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });

  function number(name) {
    var field = form.elements[name];
    if (!field || field.value.trim() === '') return NaN;
    return Number(field.value);
  }
  function valid(values) {
    return values.every(function (value) { return Number.isFinite(value) && value >= 0; });
  }
  function say(message) {
    output.textContent = message;
    output.focus();
  }
  function format(value) {
    return currency + ' ' + money.format(value);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;

    if (mode === 'need') {
      var annual = number('annual'), years = number('years'), debts = number('debts');
      var education = number('education'), other = number('other'), available = number('available');
      if (!valid([annual, years, debts, education, other, available]) || years === 0) {
        say('Enter non-negative amounts and at least one year.');
        return;
      }
      var need = annual * years + debts + education + other;
      var gap = Math.max(0, need - available);
      say('Planning gap: ' + format(gap) + '. Gross needs ' + format(need) +
        ' minus available resources ' + format(available) +
        '. This is not a policy recommendation or quote.');
      return;
    }

    if (mode === 'compare') {
      var ap = number('aPremium'), ae = number('aExcess'), al = number('aLimit');
      var bp = number('bPremium'), be = number('bExcess'), bl = number('bLimit');
      if (!valid([ap, ae, al, bp, be, bl]) || al === 0 || bl === 0) {
        say('Enter non-negative costs and a positive annual limit for both plans.');
        return;
      }
      var ac = ap + ae, bc = bp + be;
      var lower = ac === bc ? 'The known-cost scenarios are equal.' :
        (ac < bc ? 'Plan A has the lower entered premium-plus-excess scenario.' : 'Plan B has the lower entered premium-plus-excess scenario.');
      say('Plan A: ' + format(ac) + ' known cost, ' + format(al) + ' entered limit. Plan B: ' +
        format(bc) + ' known cost, ' + format(bl) + ' entered limit. ' + lower +
        ' Coverage, exclusions, networks and waiting periods can outweigh price; this is not a recommendation.');
      return;
    }

    if (mode === 'contribution') {
      var base = number('base'), employee = number('employee'), employer = number('employer'), months = number('months');
      if (!valid([base, employee, employer, months]) || months === 0 || employee > 100 || employer > 100) {
        say('Enter a positive period and rates from 0% to 100%.');
        return;
      }
      var employeeTotal = base * employee / 100 * months;
      var employerTotal = base * employer / 100 * months;
      say('Using only your entered assumptions: employee ' + format(employeeTotal) +
        ', employer ' + format(employerTotal) + ', combined ' + format(employeeTotal + employerTotal) +
        '. Confirm the current statutory basis and rates with the responsible authority.');
      return;
    }

    if (mode === 'claim') {
      var incident = new Date(form.elements.incident.value + 'T00:00:00');
      var planned = new Date(form.elements.planned.value + 'T00:00:00');
      var windowDays = number('windowDays');
      if (!Number.isFinite(incident.getTime()) || !Number.isFinite(planned.getTime()) || !valid([windowDays]) || windowDays === 0) {
        say('Enter both dates and a positive notification window from your policy.');
        return;
      }
      var elapsed = Math.floor((planned - incident) / 86400000);
      if (elapsed < 0) {
        say('Planned notification cannot be before the incident date.');
        return;
      }
      var remaining = windowDays - elapsed;
      say('Your entered policy window: ' + windowDays + ' days. Planned notification is day ' + elapsed +
        '. Assumption status: ' + (remaining >= 0 ? remaining + ' day(s) remain' : Math.abs(remaining) + ' day(s) beyond the entered window') +
        '. Contact the insurer promptly; this tool does not decide claim validity.');
      return;
    }

    if (mode === 'warning') {
      var checked = form.querySelectorAll('input[type=checkbox]:checked').length;
      say('You marked ' + checked + ' review signal(s). This is not a fraud finding. Preserve records, verify the intermediary and policy with the regulator or insurer, and report concerns through an official channel.');
      return;
    }

    var exposure = number('exposure'), rate = number('rate'), fixed = number('fixed'), contingency = number('contingency');
    if (!valid([exposure, rate, fixed, contingency]) || exposure === 0 || rate > 100 || contingency > 100) {
      say('Enter a positive exposure and rates from 0% to 100%.');
      return;
    }
    var subtotal = exposure * rate / 100 + fixed;
    var total = subtotal * (1 + contingency / 100);
    say('Assumption total: ' + format(total) + ' (' + format(subtotal) + ' before contingency). ' +
      'All rates and fixed amounts came from you; this is not a live premium, quote, valuation, eligibility result or coverage decision.');
  });

  root.querySelector('[data-action=reset]').addEventListener('click', function () {
    form.reset();
    output.textContent = '';
    form.querySelector('input,select').focus();
  });

  var stamp = root.dataset.sourceDate;
  var ageTarget = root.querySelector('[data-source-age]');
  if (stamp && ageTarget) {
    var age = Math.floor((Date.now() - new Date(stamp + 'T00:00:00Z').getTime()) / 86400000);
    ageTarget.textContent = age > 60
      ? 'Stale for high-risk figures: dataset floor is ' + age + ' days old (60-day review cadence).'
      : 'Dataset floor is ' + age + ' days old.';
  }
}());
