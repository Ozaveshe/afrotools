(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.guineaBissauPaye = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  var EMPLOYEE_INSS_RATE = 0.08;
  var EMPLOYER_INSS_RATE = 0.14;
  var SOURCE_CHECKED_ON = '2026-04-06';
  var BANDS = [
    { width: 25000, rate: 0 },
    { width: 25000, rate: 0.02 },
    { width: 50000, rate: 0.06 },
    { width: 100000, rate: 0.12 },
    { width: 200000, rate: 0.20 },
    { width: Infinity, rate: 0.30 }
  ];
  function round(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
  function taxBands(value) {
    var remaining = Math.max(0, Number(value) || 0);
    var tax = 0;
    var from = 0;
    var rows = [];
    BANDS.forEach(function (band) {
      if (remaining <= 0) return;
      var income = Math.min(remaining, band.width);
      var amount = income * band.rate;
      rows.push({ from: from, to: band.width === Infinity ? null : from + band.width, rate: band.rate, income: income, tax: round(amount) });
      tax += amount;
      remaining -= income;
      from += band.width;
    });
    return { tax: round(tax), rows: rows };
  }
  function calculate(input) {
    input = input || {};
    var grossMonthly = Number(input.grossMonthly);
    if (!Number.isFinite(grossMonthly) || grossMonthly < 0) return { ok: false, error: 'grossMonthly must be zero or more' };
    var secondary = input.secondary === true;
    var includeEmployeeInss = input.includeEmployeeInss !== false;
    var employeeInssMonthly = includeEmployeeInss ? round(grossMonthly * EMPLOYEE_INSS_RATE) : 0;
    var employerInssMonthly = round(grossMonthly * EMPLOYER_INSS_RATE);
    var taxableMonthly = secondary ? grossMonthly : Math.max(0, grossMonthly - employeeInssMonthly);
    var calculation = secondary ? { tax: round(grossMonthly * 0.30), rows: [{ from: 0, to: null, rate: 0.30, income: grossMonthly, tax: round(grossMonthly * 0.30) }] } : taxBands(taxableMonthly);
    var netMonthly = round(grossMonthly - employeeInssMonthly - calculation.tax);
    return {
      ok: true,
      grossMonthly: grossMonthly,
      grossAnnual: round(grossMonthly * 12),
      taxableMonthly: round(taxableMonthly),
      employeeInssRate: includeEmployeeInss ? EMPLOYEE_INSS_RATE : 0,
      employeeInssMonthly: employeeInssMonthly,
      employeeInssAnnual: round(employeeInssMonthly * 12),
      employerInssRate: EMPLOYER_INSS_RATE,
      employerInssMonthly: employerInssMonthly,
      employerInssAnnual: round(employerInssMonthly * 12),
      payeMonthly: calculation.tax,
      payeAnnual: round(calculation.tax * 12),
      netMonthly: netMonthly,
      netAnnual: round(netMonthly * 12),
      employerCostMonthly: round(grossMonthly + employerInssMonthly),
      employerCostAnnual: round((grossMonthly + employerInssMonthly) * 12),
      secondary: secondary,
      bands: calculation.rows,
      sourceCheckedOn: SOURCE_CHECKED_ON
    };
  }
  return { employeeInssRate: EMPLOYEE_INSS_RATE, employerInssRate: EMPLOYER_INSS_RATE, sourceCheckedOn: SOURCE_CHECKED_ON, lastUpdated: SOURCE_CHECKED_ON, bands: BANDS, calculate: calculate };
}));
