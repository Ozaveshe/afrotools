(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.engines = root.AfroTools.engines || {};
  root.AfroTools.engines.pensionFundProjection = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var VERSION = 'pension-fund-user-assumptions-2026-v1';
  var MAX_SOURCE_AGE_DAYS = 366;

  function finite(value, label, min, max) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
      throw new Error(label + ' must be between ' + min + ' and ' + max + '.');
    }
    return parsed;
  }

  function date(value, label) {
    var raw = String(value || '');
    var parsed = new Date(raw + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(parsed.getTime())) {
      throw new Error(label + ' must be a valid date.');
    }
    return parsed;
  }

  function validate(input) {
    input = input || {};
    var currentAge = finite(input.currentAge, 'Current age', 18, 70);
    var retirementAge = finite(input.retirementAge, 'Retirement age', 45, 80);
    if (!Number.isInteger(currentAge) || !Number.isInteger(retirementAge)) throw new Error('Ages must be whole years.');
    if (retirementAge <= currentAge) throw new Error('Retirement age must be greater than current age.');
    var currency = String(input.currency || '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Currency must be a three-letter ISO code.');
    if (input.schemeInputsConfirmed !== true) throw new Error('Confirm that salary, balance and contribution inputs match your current records.');
    if (input.assumptionsConfirmed !== true) throw new Error('Confirm that return, fee, inflation and drawdown values are user assumptions, not guarantees.');
    var sourceLabel = String(input.sourceLabel || '').trim();
    if (sourceLabel.length < 5) throw new Error('Name the statement, scheme rule or provider source checked.');
    var checked = date(input.sourceCheckedDate, 'Source checked date');
    var asOf = date(input.asOfDate, 'Calculation date');
    var nextReview = date(input.nextReviewDate, 'Next contribution review date');
    var sourceAgeDays = Math.floor((asOf.getTime() - checked.getTime()) / 86400000);
    if (sourceAgeDays < 0) throw new Error('Source checked date cannot be after the calculation date.');
    if (sourceAgeDays > MAX_SOURCE_AGE_DAYS) throw new Error('Recheck the source before calculating; it is more than 366 days old.');
    var nextReviewDays = Math.floor((nextReview.getTime() - asOf.getTime()) / 86400000);
    var latestReview = new Date(checked.getTime() + MAX_SOURCE_AGE_DAYS * 86400000);
    if (nextReview.getTime() > latestReview.getTime()) throw new Error('Next contribution review date must be no later than 366 days after the source was checked.');
    var values = {
      countryCode: String(input.countryCode || '').trim().toUpperCase(),
      currency: currency,
      currentAge: currentAge,
      retirementAge: retirementAge,
      monthlySalary: finite(input.monthlySalary, 'Monthly salary', 0.01, 1e12),
      salaryGrowthPercent: finite(input.salaryGrowthPercent, 'Annual salary growth', -99.99, 100),
      contributionRatePercent: finite(input.contributionRatePercent, 'Combined contribution rate', 0, 100),
      currentBalance: finite(input.currentBalance, 'Current balance', 0, 1e15),
      annualReturnPercent: finite(input.annualReturnPercent, 'Gross annual return', -99.99, 100),
      annualFeePercent: finite(input.annualFeePercent, 'Annual fee drag', 0, 100),
      inflationPercent: finite(input.inflationPercent, 'Annual inflation', -99.99, 100),
      drawdownPercent: finite(input.drawdownPercent, 'Illustrative annual drawdown', 0, 100),
      sourceLabel: sourceLabel,
      sourceCheckedDate: String(input.sourceCheckedDate),
      nextReviewDate: String(input.nextReviewDate),
      asOfDate: String(input.asOfDate),
      sourceAgeDays: sourceAgeDays,
      nextReviewDays: nextReviewDays,
      reviewDue: nextReviewDays <= 0
    };
    if (values.annualReturnPercent - values.annualFeePercent <= -100) throw new Error('Gross return minus fee drag must be greater than -100%.');
    return values;
  }

  function project(values, annualReturnPercent) {
    var netAnnual = (annualReturnPercent - values.annualFeePercent) / 100;
    if (netAnnual <= -1) throw new Error('Net annual return must be greater than -100%.');
    var monthlyRate = Math.pow(1 + netAnnual, 1 / 12) - 1;
    var years = values.retirementAge - values.currentAge;
    var balance = values.currentBalance;
    var totalContributed = values.currentBalance;
    var salary = values.monthlySalary;
    var yearly = [{ age: values.currentAge, year: 0, balance: balance, totalContributed: totalContributed }];
    for (var year = 1; year <= years; year += 1) {
      for (var month = 0; month < 12; month += 1) {
        var contribution = salary * values.contributionRatePercent / 100;
        balance = balance * (1 + monthlyRate) + contribution;
        totalContributed += contribution;
      }
      yearly.push({ age: values.currentAge + year, year: year, balance: balance, totalContributed: totalContributed });
      salary *= 1 + values.salaryGrowthPercent / 100;
    }
    var investmentGrowth = balance - totalContributed;
    var realValue = balance / Math.pow(1 + values.inflationPercent / 100, years);
    var illustrativeMonthlyDrawdown = balance * values.drawdownPercent / 100 / 12;
    var replacementRatioPercent = salary > 0 ? illustrativeMonthlyDrawdown / salary * 100 : 0;
    return {
      annualReturnPercent: annualReturnPercent,
      netAnnualReturnPercent: annualReturnPercent - values.annualFeePercent,
      endingBalance: balance,
      realValue: realValue,
      totalContributed: totalContributed,
      investmentGrowth: investmentGrowth,
      finalMonthlySalary: salary,
      illustrativeMonthlyDrawdown: illustrativeMonthlyDrawdown,
      replacementRatioPercent: replacementRatioPercent,
      yearly: yearly
    };
  }

  function calculate(input) {
    var values = validate(input);
    var base = project(values, values.annualReturnPercent);
    var lower = project(values, Math.max(-99.99 + values.annualFeePercent, values.annualReturnPercent - 2));
    var higher = project(values, Math.min(100, values.annualReturnPercent + 2));
    return { version: VERSION, inputs: values, years: values.retirementAge - values.currentAge, base: base, lower: lower, higher: higher };
  }

  return Object.freeze({ VERSION: VERSION, MAX_SOURCE_AGE_DAYS: MAX_SOURCE_AGE_DAYS, calculate: calculate });
});
