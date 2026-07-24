(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.engines = root.AfroTools.engines || {};
  root.AfroTools.engines.pensionProjectionPlanner = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var VERSION = 'pension-user-assumptions-2026-v1';
  var MAX_SOURCE_AGE_DAYS = 366;

  function number(value, label, min, max) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) throw new Error(label + ' must be between ' + min + ' and ' + max + '.');
    return parsed;
  }

  function date(value, label) {
    var parsed = new Date(String(value) + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value)) || Number.isNaN(parsed.getTime())) throw new Error(label + ' must be a valid date.');
    return parsed;
  }

  function validate(input) {
    input = input || {};
    var currency = String(input.currency || '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Currency must be a three-letter ISO code.');
    if (input.schemeInputsConfirmed !== true) throw new Error('Confirm that the balance and contribution amounts match your current statement or scheme terms.');
    if (input.assumptionsConfirmed !== true) throw new Error('Confirm that return, fee and inflation values are planning assumptions, not guarantees.');
    var sourceLabel = String(input.sourceLabel || '').trim();
    if (sourceLabel.length < 5) throw new Error('Name the current statement, scheme rule or provider source.');
    var checked = date(input.sourceCheckedDate, 'Source checked date');
    var asOf = date(input.asOfDate, 'Calculation date');
    var ageDays = Math.floor((asOf.getTime() - checked.getTime()) / 86400000);
    if (ageDays < 0) throw new Error('Source checked date cannot be after the calculation date.');
    if (ageDays > MAX_SOURCE_AGE_DAYS) throw new Error('Recheck the source before calculating; it is more than 366 days old.');
    var values = {
      currency: currency,
      currentBalance: number(input.currentBalance, 'Current balance', 0, 1e15),
      monthlyPersonal: number(input.monthlyPersonal, 'Monthly personal contribution', 0, 1e12),
      monthlyEmployer: number(input.monthlyEmployer, 'Monthly employer contribution', 0, 1e12),
      monthlyVoluntary: number(input.monthlyVoluntary, 'Monthly voluntary contribution', 0, 1e12),
      years: number(input.years, 'Projection years', 1, 60),
      annualReturnPercent: number(input.annualReturnPercent, 'Gross annual return', -99.99, 100),
      annualFeePercent: number(input.annualFeePercent, 'Annual fee drag', 0, 100),
      inflationPercent: number(input.inflationPercent, 'Annual inflation', -99.99, 100),
      contributionGrowthPercent: number(input.contributionGrowthPercent, 'Annual contribution growth', -99.99, 100),
      sourceLabel: sourceLabel,
      sourceCheckedDate: String(input.sourceCheckedDate),
      asOfDate: String(input.asOfDate),
      sourceAgeDays: ageDays
    };
    if (!Number.isInteger(values.years)) throw new Error('Projection years must be a whole number.');
    if (values.annualReturnPercent - values.annualFeePercent <= -100) throw new Error('Gross return minus fee drag must be greater than -100%.');
    return values;
  }

  function project(values, annualReturnPercent) {
    var netAnnualRate = (annualReturnPercent - values.annualFeePercent) / 100;
    if (netAnnualRate <= -1) throw new Error('Net annual return must be greater than -100%.');
    var monthlyRate = Math.pow(1 + netAnnualRate, 1 / 12) - 1;
    var contributionGrowth = values.contributionGrowthPercent / 100;
    var balance = values.currentBalance;
    var personalTotal = 0;
    var employerTotal = 0;
    var voluntaryTotal = 0;
    var yearly = [];
    for (var month = 0; month < values.years * 12; month += 1) {
      var projectionYear = Math.floor(month / 12);
      var factor = Math.pow(1 + contributionGrowth, projectionYear);
      var personal = values.monthlyPersonal * factor;
      var employer = values.monthlyEmployer * factor;
      var voluntary = values.monthlyVoluntary * factor;
      balance = balance * (1 + monthlyRate) + personal + employer + voluntary;
      personalTotal += personal;
      employerTotal += employer;
      voluntaryTotal += voluntary;
      if ((month + 1) % 12 === 0) yearly.push({ year: (month + 1) / 12, balance: balance });
    }
    var futureContributions = personalTotal + employerTotal + voluntaryTotal;
    var investmentGrowth = balance - values.currentBalance - futureContributions;
    var realValue = balance / Math.pow(1 + values.inflationPercent / 100, values.years);
    return {
      annualReturnPercent: annualReturnPercent,
      netAnnualReturnPercent: annualReturnPercent - values.annualFeePercent,
      monthlyRate: monthlyRate,
      endingBalance: balance,
      realValue: realValue,
      personalContributions: personalTotal,
      employerContributions: employerTotal,
      voluntaryContributions: voluntaryTotal,
      futureContributions: futureContributions,
      investmentGrowth: investmentGrowth,
      yearly: yearly
    };
  }

  function calculate(input) {
    var values = validate(input);
    var base = project(values, values.annualReturnPercent);
    var lower = project(values, Math.max(-99.99 + values.annualFeePercent, values.annualReturnPercent - 2));
    var higher = project(values, Math.min(100, values.annualReturnPercent + 2));
    return { version: VERSION, inputs: values, base: base, lower: lower, higher: higher };
  }

  return Object.freeze({ VERSION: VERSION, MAX_SOURCE_AGE_DAYS: MAX_SOURCE_AGE_DAYS, calculate: calculate });
});
