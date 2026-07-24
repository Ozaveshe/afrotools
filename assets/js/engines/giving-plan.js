(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.givingPlan = engine;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  var MAX_AMOUNT = 1000000000000000;
  var MAX_PERIODS = 600;

  function amount(value, field) {
    var number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > MAX_AMOUNT) {
      throw new RangeError(field + ' must be between 0 and ' + MAX_AMOUNT + '.');
    }
    return number;
  }
  function rate(value) {
    var number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > 100) {
      throw new RangeError('chosenRatePercent must be between 0 and 100.');
    }
    return number;
  }
  function periods(value) {
    var number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > MAX_PERIODS) {
      throw new RangeError('pledgePeriods must be a whole number between 1 and ' + MAX_PERIODS + '.');
    }
    return number;
  }
  function plan(input) {
    input = input || {};
    if (input.confirmedChoice !== true) {
      throw new Error('Confirm that the percentage and amounts are your own choices.');
    }
    var values = {
      referenceAmount: amount(input.referenceAmount, 'referenceAmount'),
      chosenRatePercent: rate(input.chosenRatePercent),
      additionalOffering: amount(input.additionalOffering, 'additionalOffering'),
      pledgeGoal: amount(input.pledgeGoal, 'pledgeGoal'),
      pledgePeriods: periods(input.pledgePeriods),
      essentialCosts: amount(input.essentialCosts, 'essentialCosts')
    };
    var percentageContribution = values.referenceAmount * values.chosenRatePercent / 100;
    var pledgePerPeriod = values.pledgeGoal / values.pledgePeriods;
    var plannedContribution = percentageContribution + values.additionalOffering + pledgePerPeriod;
    return {
      input: values,
      percentageContribution: percentageContribution,
      pledgePerPeriod: pledgePerPeriod,
      plannedContribution: plannedContribution,
      remainingAfterEssentials: values.referenceAmount - values.essentialCosts,
      remainingAfterPlan: values.referenceAmount - values.essentialCosts - plannedContribution,
      plannedShareOfReference: values.referenceAmount > 0 ? plannedContribution / values.referenceAmount : null
    };
  }
  return {
    plan: plan,
    limits: { maximumAmount: MAX_AMOUNT, maximumPledgePeriods: MAX_PERIODS, maximumRatePercent: 100 },
    formulaParameters: {
      scope: 'Private arithmetic for a user-directed giving plan over one user-defined planning period.',
      percentageContribution: 'reference amount x user-chosen percentage / 100',
      pledgePerPeriod: 'user-entered pledge goal / user-entered number of planning periods',
      plannedContribution: 'percentage contribution + additional offering + pledge allocation for this period',
      remainingAfterPlan: 'reference amount - entered essential costs - planned contribution',
      faithBoundary: 'No percentage, obligation, religious interpretation, recipient, timing or affordability verdict is supplied.',
      claimBoundary: 'No prosperity outcome, blessing, tax deductibility, financial advice or donation receipt claim is supplied.'
    }
  };
});
