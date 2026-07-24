(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.zaUif = engine;
    root.UIFEngine = engine;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var MONTHLY_CEILING = 17712;
  var ANNUAL_CEILING = 212544;
  var EMPLOYEE_RATE = 0.01;
  var EMPLOYER_RATE = 0.01;
  var MAX_CREDIT_DAYS = 365;
  var SLIDING_TIER_DAYS = 238;
  var SECOND_TIER_RATE = 0.20;
  var MATERNITY_RATE = 0.66;
  var MATERNITY_MAX_DAYS = 121;

  function finiteNonNegative(value, field) {
    var number = Number(value);
    if (!Number.isFinite(number) || number < 0) throw new RangeError(field + ' must be zero or greater.');
    return number;
  }

  function calculateContribution(input) {
    input = input || {};
    var remuneration = finiteNonNegative(input.monthlyRemuneration, 'monthlyRemuneration');
    var employees = Math.max(1, Math.floor(finiteNonNegative(input.employees == null ? 1 : input.employees, 'employees')));
    var months = Math.max(1, Math.floor(finiteNonNegative(input.months == null ? 1 : input.months, 'months')));
    var contributionBase = Math.min(remuneration, MONTHLY_CEILING);
    var employeeMonthly = contributionBase * EMPLOYEE_RATE;
    var employerMonthly = contributionBase * EMPLOYER_RATE;
    var combinedMonthly = employeeMonthly + employerMonthly;
    return {
      remuneration: remuneration,
      contributionBase: contributionBase,
      employeeMonthly: employeeMonthly,
      employerMonthly: employerMonthly,
      combinedMonthly: combinedMonthly,
      teamPeriodTotal: combinedMonthly * employees * months,
      employees: employees,
      months: months,
      ceilingApplied: remuneration > MONTHLY_CEILING
    };
  }

  function calculateIncomeReplacementRate(dailyIncome) {
    var income = finiteNonNegative(dailyIncome, 'dailyIncome');
    if (income === 0) return 0.60;
    var percentage = 29.2 + (7173.92 / (232.92 + income));
    return Math.min(0.60, Math.max(0.38, percentage / 100));
  }

  function calculateBenefitPlan(input) {
    input = input || {};
    var averageMonthlyRemuneration = finiteNonNegative(input.averageMonthlyRemuneration, 'averageMonthlyRemuneration');
    var availableCreditDays = Math.min(MAX_CREDIT_DAYS, Math.floor(finiteNonNegative(input.availableCreditDays, 'availableCreditDays')));
    var requestedDays = Math.min(MAX_CREDIT_DAYS, Math.floor(finiteNonNegative(input.requestedDays, 'requestedDays')));
    var payableDays = Math.min(availableCreditDays, requestedDays);
    var cappedMonthlyRemuneration = Math.min(averageMonthlyRemuneration, MONTHLY_CEILING);
    var dailyIncome = cappedMonthlyRemuneration * 12 / 365;
    var replacementRate = calculateIncomeReplacementRate(dailyIncome);
    var slidingTierDays = Math.min(payableDays, SLIDING_TIER_DAYS);
    var secondTierDays = Math.max(0, payableDays - slidingTierDays);
    var slidingDailyBenefit = dailyIncome * replacementRate;
    var secondTierDailyBenefit = dailyIncome * SECOND_TIER_RATE;
    return {
      averageMonthlyRemuneration: averageMonthlyRemuneration,
      cappedMonthlyRemuneration: cappedMonthlyRemuneration,
      dailyIncome: dailyIncome,
      replacementRate: replacementRate,
      replacementRatePercent: replacementRate * 100,
      slidingDailyBenefit: slidingDailyBenefit,
      secondTierDailyBenefit: secondTierDailyBenefit,
      availableCreditDays: availableCreditDays,
      requestedDays: requestedDays,
      payableDays: payableDays,
      slidingTierDays: slidingTierDays,
      secondTierDays: secondTierDays,
      estimatedBenefit: slidingDailyBenefit * slidingTierDays + secondTierDailyBenefit * secondTierDays,
      ceilingApplied: averageMonthlyRemuneration > MONTHLY_CEILING
    };
  }

  function calculateMaternityPlan(input) {
    input = input || {};
    var averageMonthlyRemuneration = finiteNonNegative(input.averageMonthlyRemuneration, 'averageMonthlyRemuneration');
    var employerMonthlyPay = finiteNonNegative(input.employerMonthlyPay || 0, 'employerMonthlyPay');
    var requestedDays = Math.min(MATERNITY_MAX_DAYS, Math.floor(finiteNonNegative(input.requestedDays, 'requestedDays')));
    var cappedMonthlyRemuneration = Math.min(averageMonthlyRemuneration, MONTHLY_CEILING);
    var dailyIncome = cappedMonthlyRemuneration * 12 / 365;
    var normalDailyRemuneration = averageMonthlyRemuneration * 12 / 365;
    var fullDailyBenefit = dailyIncome * MATERNITY_RATE;
    var dailyEmployerPay = employerMonthlyPay * 12 / 365;
    var dailyTopUpRoom = Math.max(0, normalDailyRemuneration - dailyEmployerPay);
    var dailyBenefit = Math.min(fullDailyBenefit, dailyTopUpRoom);
    return {
      averageMonthlyRemuneration: averageMonthlyRemuneration,
      cappedMonthlyRemuneration: cappedMonthlyRemuneration,
      employerMonthlyPay: employerMonthlyPay,
      requestedDays: requestedDays,
      payableDays: requestedDays,
      dailyIncome: dailyIncome,
      normalDailyRemuneration: normalDailyRemuneration,
      dailyBenefit: dailyBenefit,
      estimatedBenefit: dailyBenefit * requestedDays,
      topUpLimited: dailyBenefit < fullDailyBenefit,
      ceilingApplied: averageMonthlyRemuneration > MONTHLY_CEILING
    };
  }

  return {
    calculateContribution: calculateContribution,
    calculateIncomeReplacementRate: calculateIncomeReplacementRate,
    calculateBenefitPlan: calculateBenefitPlan,
    calculateMaternityPlan: calculateMaternityPlan,
    constants: {
      monthlyCeiling: MONTHLY_CEILING,
      annualCeiling: ANNUAL_CEILING,
      employeeRate: EMPLOYEE_RATE,
      employerRate: EMPLOYER_RATE,
      maximumCreditDays: MAX_CREDIT_DAYS,
      slidingTierDays: SLIDING_TIER_DAYS,
      secondTierRate: SECOND_TIER_RATE,
      maternityRate: MATERNITY_RATE,
      maternityMaximumDays: MATERNITY_MAX_DAYS
    }
  };
});
