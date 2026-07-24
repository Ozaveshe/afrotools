(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.rentBuyScenario = engine;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var MAX_AMOUNT = 1000000000000000;
  var MAX_MONTHS = 600;
  var SIDES = ['rent', 'buy'];

  function amount(value, field) {
    var number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > MAX_AMOUNT) {
      throw new RangeError(field + ' must be between 0 and ' + MAX_AMOUNT + '.');
    }
    return number;
  }

  function months(value) {
    var number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > MAX_MONTHS) {
      throw new RangeError('horizonMonths must be a whole number between 1 and ' + MAX_MONTHS + '.');
    }
    return number;
  }

  function side(input, key, horizonMonths) {
    var prefix = key === 'rent' ? 'rent' : 'buy';
    var values = {
      upfrontCash: amount(input[prefix + 'UpfrontCash'], prefix + 'UpfrontCash'),
      monthlyHousing: amount(input[prefix + 'MonthlyHousing'], prefix + 'MonthlyHousing'),
      monthlyOther: amount(input[prefix + 'MonthlyOther'], prefix + 'MonthlyOther'),
      otherOneOff: amount(input[prefix + 'OtherOneOff'], prefix + 'OtherOneOff'),
      finalCashReceived: amount(input[prefix + 'FinalCashReceived'], prefix + 'FinalCashReceived')
    };
    var monthlyCashOut = values.monthlyHousing + values.monthlyOther;
    var grossCashOut = values.upfrontCash + monthlyCashOut * horizonMonths + values.otherOneOff;
    return {
      input: values,
      monthlyCashOut: monthlyCashOut,
      horizonMonthlyCashOut: monthlyCashOut * horizonMonths,
      grossCashOut: grossCashOut,
      finalCashReceived: values.finalCashReceived,
      netCashCost: grossCashOut - values.finalCashReceived
    };
  }

  function compare(input) {
    input = input || {};
    if (input.confirmedInputs !== true) {
      throw new Error('Confirm that every amount is your entered scenario assumption.');
    }
    var horizonMonths = months(input.horizonMonths);
    var rent = side(input, 'rent', horizonMonths);
    var buy = side(input, 'buy', horizonMonths);
    var difference = buy.netCashCost - rent.netCashCost;
    return {
      horizonMonths: horizonMonths,
      rent: rent,
      buy: buy,
      difference: difference,
      absoluteDifference: Math.abs(difference),
      lowerEnteredCashCost: difference > 0 ? 'rent' : difference < 0 ? 'buy' : 'equal'
    };
  }

  return {
    compare: compare,
    sides: SIDES.slice(),
    limits: { maximumAmount: MAX_AMOUNT, maximumMonths: MAX_MONTHS },
    formulaParameters: {
      scope: 'Equal-horizon cash-flow comparison using only user-entered amounts.',
      grossCashOut: 'upfront cash + (monthly housing + monthly other) x horizon months + other one-off cash',
      netCashCost: 'gross cash out - final cash received at the horizon',
      difference: 'buy net cash cost - rent net cash cost',
      finalCashBoundary: 'Final cash received is entered by the user. The tool does not forecast a deposit refund, sale price, remaining mortgage balance, tax or transaction cost.',
      excludedAssumptions: 'No appreciation, rent growth, interest rate, tax rate, investment return, opportunity cost, country preset or break-even forecast is supplied.',
      decisionBoundary: 'The lower entered cash cost describes only the submitted scenario and is not a recommendation to rent or buy.'
    }
  };
});
