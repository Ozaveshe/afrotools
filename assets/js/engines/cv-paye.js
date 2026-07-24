(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.capeVerdePaye = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var THRESHOLD = 36607;

  function taxMonthly(grossMonthly) {
    var gross = Number(grossMonthly);
    if (!Number.isFinite(gross) || gross < THRESHOLD) {
      return { tax: 0, rawTax: 0, marginalRate: 0, constant: 0 };
    }
    var marginalRate;
    var constant;
    if (gross <= 80000) {
      marginalRate = 0.14;
      constant = 5125;
    } else if (gross <= 150000) {
      marginalRate = 0.21;
      constant = 10725;
    } else {
      marginalRate = 0.25;
      constant = 16725;
    }
    var rawTax = gross * marginalRate - constant;
    var tax = rawTax < 100 ? 100 : Math.round(rawTax);
    return { tax: tax, rawTax: rawTax, marginalRate: marginalRate, constant: constant };
  }

  function calculate(input) {
    input = input || {};
    var grossMonthly = Number(input.grossMonthly);
    if (!Number.isFinite(grossMonthly) || grossMonthly < 0) {
      return { ok: false, error: 'Enter a monthly gross salary of zero or more.' };
    }
    var regime = input.regime === 'DOMESTIC' ? 'DOMESTIC' : 'STANDARD';
    var includeInps = input.includeInps !== false;
    var employeeRate = regime === 'DOMESTIC' ? 0.08 : 0.085;
    var employerRate = regime === 'DOMESTIC' ? 0.15 : 0.16;
    var employeeInpsMonthly = includeInps ? Math.round(grossMonthly * employeeRate) : 0;
    var employerInpsMonthly = includeInps ? Math.round(grossMonthly * employerRate) : 0;
    var withholding = taxMonthly(grossMonthly);
    return {
      ok: true,
      regime: regime,
      grossMonthly: grossMonthly,
      grossAnnual: grossMonthly * 12,
      taxMonthly: withholding.tax,
      taxAnnual: withholding.tax * 12,
      rawTaxMonthly: withholding.rawTax,
      marginalRate: withholding.marginalRate,
      formulaConstant: withholding.constant,
      employeeRate: includeInps ? employeeRate : 0,
      employerRate: includeInps ? employerRate : 0,
      employeeInpsMonthly: employeeInpsMonthly,
      employeeInpsAnnual: employeeInpsMonthly * 12,
      employerInpsMonthly: employerInpsMonthly,
      employerInpsAnnual: employerInpsMonthly * 12,
      netMonthly: grossMonthly - withholding.tax - employeeInpsMonthly,
      netAnnual: (grossMonthly - withholding.tax - employeeInpsMonthly) * 12,
      employerCostMonthly: grossMonthly + employerInpsMonthly,
      employerCostAnnual: (grossMonthly + employerInpsMonthly) * 12,
      effectiveTaxRate: grossMonthly ? withholding.tax / grossMonthly : 0
    };
  }

  function reverse(input) {
    input = input || {};
    var target = Number(input.netMonthly);
    if (!Number.isFinite(target) || target <= 0) return { ok: false, error: 'Enter a net salary greater than zero.' };
    var low = target;
    var high = Math.max(target * 3, THRESHOLD + 1);
    var result;
    for (var index = 0; index < 80; index += 1) {
      var gross = (low + high) / 2;
      result = calculate({ grossMonthly: gross, regime: input.regime, includeInps: input.includeInps });
      if (Math.abs(result.netMonthly - target) < 0.01) return result;
      if (result.netMonthly < target) low = gross; else high = gross;
    }
    return result;
  }

  return {
    thresholdMonthly: THRESHOLD,
    sourceCheckedOn: '2026-07-21',
    taxMonthly: taxMonthly,
    calculate: calculate,
    reverse: reverse
  };
}));
