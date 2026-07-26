(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.eduSavingsEngine = engine;
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  function numeric(value) {
    if (value === '' || value === null || value === undefined) return 0;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function futureValueFactor(monthlyRate, months, timing) {
    if (months <= 0) return 0;
    var factor = Math.abs(monthlyRate) < 1e-12
      ? months
      : (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
    return timing === 'beginning' ? factor * (1 + monthlyRate) : factor;
  }

  function calculate(input) {
    input = input || {};
    var todayCost = numeric(input.todayCost);
    var months = numeric(input.months);
    var inflationRate = numeric(input.inflationRate);
    var currentSavings = numeric(input.currentSavings);
    var monthlyContribution = numeric(input.monthlyContribution);
    var annualGrowthRate = numeric(input.annualGrowthRate);
    var timing = input.timing === 'beginning' ? 'beginning' : 'end';
    var errors = [];

    if (![todayCost, months, inflationRate, currentSavings, monthlyContribution, annualGrowthRate].every(Number.isFinite)) {
      errors.push('Enter valid numbers in every numeric field.');
    }
    if (Number.isFinite(todayCost) && todayCost <= 0) errors.push('Today’s education cost must be above zero.');
    if (Number.isFinite(months) && (!Number.isInteger(months) || months < 1 || months > 600)) {
      errors.push('Time until the target must be a whole number from 1 to 600 months.');
    }
    if (Number.isFinite(currentSavings) && currentSavings < 0 || Number.isFinite(monthlyContribution) && monthlyContribution < 0) {
      errors.push('Savings and contributions must be zero or greater.');
    }
    if (Number.isFinite(inflationRate) && (inflationRate < -50 || inflationRate > 100)) {
      errors.push('Education-cost inflation must be between -50% and 100%.');
    }
    if (Number.isFinite(annualGrowthRate) && (annualGrowthRate < -50 || annualGrowthRate > 100)) {
      errors.push('Nominal annual growth must be between -50% and 100%.');
    }
    if (errors.length) return { ok: false, errors: Array.from(new Set(errors)) };

    var years = months / 12;
    var monthlyGrowthRate = annualGrowthRate / 100 / 12;
    var futureCost = todayCost * Math.pow(1 + inflationRate / 100, years);
    var currentSavingsFutureValue = currentSavings * Math.pow(1 + monthlyGrowthRate, months);
    var contributionFactor = futureValueFactor(monthlyGrowthRate, months, timing);
    var contributionFutureValue = monthlyContribution * contributionFactor;
    var projectedFund = currentSavingsFutureValue + contributionFutureValue;
    var gap = futureCost - projectedFund;
    var requiredMonthlyContribution = Math.max(0, futureCost - currentSavingsFutureValue) / contributionFactor;
    var totalCashContributed = currentSavings + monthlyContribution * months;
    var nominalGrowthAmount = projectedFund - totalCashContributed;

    return {
      ok: true,
      todayCost: todayCost,
      months: months,
      years: years,
      inflationRate: inflationRate,
      futureCost: futureCost,
      currentSavings: currentSavings,
      monthlyContribution: monthlyContribution,
      annualGrowthRate: annualGrowthRate,
      monthlyGrowthRate: monthlyGrowthRate,
      timing: timing,
      contributionFactor: contributionFactor,
      currentSavingsFutureValue: currentSavingsFutureValue,
      contributionFutureValue: contributionFutureValue,
      projectedFund: projectedFund,
      gap: gap,
      requiredMonthlyContribution: requiredMonthlyContribution,
      totalCashContributed: totalCashContributed,
      nominalGrowthAmount: nominalGrowthAmount
    };
  }

  return { calculate: calculate, futureValueFactor: futureValueFactor };
});
