(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.studentBudgetEngine = engine;
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  function numeric(value) {
    if (value === '' || value === null || value === undefined) return 0;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function calculate(input) {
    input = input || {};
    var months = numeric(input.periodMonths);
    var monthlyIncome = numeric(input.monthlyIncome);
    var periodFunding = numeric(input.periodFunding);
    var monthlyExpenses = input.monthlyExpenses || {};
    var periodExpenses = input.periodExpenses || {};
    var errors = [];
    if (!Number.isFinite(months) || months <= 0 || months > 24) errors.push('Planning period must be above 0 and no more than 24 months.');
    var recurring = {};
    Object.keys(monthlyExpenses).forEach(function (key) {
      recurring[key] = numeric(monthlyExpenses[key]);
      if (!Number.isFinite(recurring[key]) || recurring[key] < 0) errors.push('All amounts must be zero or greater.');
    });
    var oneOff = {};
    Object.keys(periodExpenses).forEach(function (key) {
      oneOff[key] = numeric(periodExpenses[key]);
      if (!Number.isFinite(oneOff[key]) || oneOff[key] < 0) errors.push('All amounts must be zero or greater.');
    });
    if (!Number.isFinite(monthlyIncome) || monthlyIncome < 0 || !Number.isFinite(periodFunding) || periodFunding < 0) {
      errors.push('All amounts must be zero or greater.');
    }
    if (errors.length) return { ok: false, errors: Array.from(new Set(errors)) };
    var monthlyExpenseTotal = Object.values(recurring).reduce(function (sum, value) { return sum + value; }, 0);
    var periodExpenseTotal = Object.values(oneOff).reduce(function (sum, value) { return sum + value; }, 0);
    var totalResources = monthlyIncome * months + periodFunding;
    var totalExpenses = monthlyExpenseTotal * months + periodExpenseTotal;
    var balance = totalResources - totalExpenses;
    var contributions = [];
    Object.keys(recurring).forEach(function (key) { contributions.push({ key: key, amount: recurring[key] * months, cadence: 'monthly' }); });
    Object.keys(oneOff).forEach(function (key) { contributions.push({ key: key, amount: oneOff[key], cadence: 'period' }); });
    contributions.sort(function (a, b) { return b.amount - a.amount || a.key.localeCompare(b.key); });
    return {
      ok: true,
      periodMonths: months,
      monthlyIncome: monthlyIncome,
      periodFunding: periodFunding,
      monthlyExpenses: recurring,
      periodExpenses: oneOff,
      monthlyExpenseTotal: monthlyExpenseTotal,
      periodExpenseTotal: periodExpenseTotal,
      totalResources: totalResources,
      totalExpenses: totalExpenses,
      balance: balance,
      monthlyResourceEquivalent: totalResources / months,
      monthlyExpenseEquivalent: totalExpenses / months,
      monthlyBalanceEquivalent: balance / months,
      coverageRatio: totalExpenses ? totalResources / totalExpenses : null,
      largestExpense: contributions.find(function (entry) { return entry.amount > 0; }) || null,
      contributions: contributions
    };
  }

  return { calculate: calculate };
});
