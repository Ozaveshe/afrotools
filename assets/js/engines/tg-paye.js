(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.togoPaye = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var EMPLOYEE_CNSS_RATE = 0.04;
  var EMPLOYER_CNSS_RATE = 0.175;
  var PROFESSIONAL_DEDUCTION_RATE = 0.28;
  var PROFESSIONAL_DEDUCTION_CAP = 10000000;
  var DEPENDENT_RELIEF_ANNUAL = 120000;
  var MAX_DEPENDENTS = 6;
  var BANDS = [
    { width: 900000, rate: 0 },
    { width: 2100000, rate: 0.03 },
    { width: 3000000, rate: 0.10 },
    { width: 3000000, rate: 0.15 },
    { width: 3000000, rate: 0.20 },
    { width: 3000000, rate: 0.25 },
    { width: 5000000, rate: 0.30 },
    { width: Infinity, rate: 0.35 }
  ];

  function clampDependents(value) {
    var parsed = Math.floor(Number(value) || 0);
    return Math.max(0, Math.min(MAX_DEPENDENTS, parsed));
  }

  function roundDown(value, increment) {
    return Math.floor(Math.max(0, value) / increment) * increment;
  }

  function taxAnnual(taxableIncome) {
    var remaining = Math.max(0, Number(taxableIncome) || 0);
    var from = 0;
    var rawTax = 0;
    var bands = [];
    BANDS.forEach(function (band) {
      if (remaining <= 0) return;
      var income = Math.min(remaining, band.width);
      var taxInBand = income * band.rate;
      bands.push({
        from: from,
        to: band.width === Infinity ? null : from + band.width,
        rate: band.rate,
        income: income,
        tax: taxInBand
      });
      rawTax += taxInBand;
      remaining -= income;
      if (band.width !== Infinity) from += band.width;
    });
    return { rawTax: rawTax, tax: roundDown(rawTax, 10), bands: bands };
  }

  function calculate(input) {
    input = input || {};
    var grossAnnual = Number(input.grossAnnual);
    if (!Number.isFinite(grossAnnual) || grossAnnual < 0) {
      return { ok: false, error: 'Enter an annual gross salary of zero or more.' };
    }
    var dependents = clampDependents(input.dependents);
    var employeeCnssAnnual = grossAnnual * EMPLOYEE_CNSS_RATE;
    var employerCnssAnnual = grossAnnual * EMPLOYER_CNSS_RATE;
    var incomeAfterCnss = Math.max(0, grossAnnual - employeeCnssAnnual);
    var professionalDeduction = Math.min(incomeAfterCnss, PROFESSIONAL_DEDUCTION_CAP) * PROFESSIONAL_DEDUCTION_RATE;
    var dependentRelief = dependents * DEPENDENT_RELIEF_ANNUAL;
    var taxableBeforeRounding = Math.max(0, incomeAfterCnss - professionalDeduction - dependentRelief);
    var taxableIncome = roundDown(taxableBeforeRounding, 1000);
    var paye = taxAnnual(taxableIncome);
    var netAnnual = grossAnnual - employeeCnssAnnual - paye.tax;
    return {
      ok: true,
      grossAnnual: grossAnnual,
      grossMonthly: grossAnnual / 12,
      dependents: dependents,
      employeeCnssAnnual: employeeCnssAnnual,
      employeeCnssMonthly: employeeCnssAnnual / 12,
      employerCnssAnnual: employerCnssAnnual,
      employerCnssMonthly: employerCnssAnnual / 12,
      incomeAfterCnss: incomeAfterCnss,
      professionalDeduction: professionalDeduction,
      dependentRelief: dependentRelief,
      taxableBeforeRounding: taxableBeforeRounding,
      taxableIncome: taxableIncome,
      payeAnnual: paye.tax,
      payeMonthly: paye.tax / 12,
      rawPayeAnnual: paye.rawTax,
      bands: paye.bands,
      netAnnual: netAnnual,
      netMonthly: netAnnual / 12,
      employerCostAnnual: grossAnnual + employerCnssAnnual,
      employerCostMonthly: (grossAnnual + employerCnssAnnual) / 12,
      effectiveTaxRate: grossAnnual ? paye.tax / grossAnnual : 0,
      effectiveDeductionRate: grossAnnual ? (paye.tax + employeeCnssAnnual) / grossAnnual : 0
    };
  }

  function reverse(input) {
    input = input || {};
    var target = Number(input.netAnnual);
    if (!Number.isFinite(target) || target <= 0) return { ok: false, error: 'Enter a net salary greater than zero.' };
    var low = target;
    var high = Math.max(target * 3, 1200000);
    var result;
    for (var index = 0; index < 80; index += 1) {
      var gross = (low + high) / 2;
      result = calculate({ grossAnnual: gross, dependents: input.dependents });
      if (Math.abs(result.netAnnual - target) < 0.01) return result;
      if (result.netAnnual < target) low = gross; else high = gross;
    }
    return result;
  }

  return {
    bands: BANDS,
    employeeCnssRate: EMPLOYEE_CNSS_RATE,
    employerCnssRate: EMPLOYER_CNSS_RATE,
    professionalDeductionRate: PROFESSIONAL_DEDUCTION_RATE,
    professionalDeductionCap: PROFESSIONAL_DEDUCTION_CAP,
    dependentReliefAnnual: DEPENDENT_RELIEF_ANNUAL,
    maxDependents: MAX_DEPENDENTS,
    sourceCheckedOn: '2026-07-22',
    formulaParameters: {
      method: 'annual-employment-income',
      employeeCnssRate: EMPLOYEE_CNSS_RATE,
      employerCnssRate: EMPLOYER_CNSS_RATE,
      professionalDeduction: { rate: PROFESSIONAL_DEDUCTION_RATE, cap: PROFESSIONAL_DEDUCTION_CAP },
      dependentReliefAnnual: DEPENDENT_RELIEF_ANNUAL,
      maximumDependents: MAX_DEPENDENTS,
      taxableRounding: 'down-to-1000-XOF',
      taxRounding: 'down-to-10-XOF',
      bands: BANDS
    },
    roundingPolicy: {
      method: 'statutory-stage-rounding',
      stages: ['annual taxable income down to XOF 1,000', 'annual tax down to XOF 10']
    },
    calculate: calculate,
    reverse: reverse,
    taxAnnual: taxAnnual
  };
}));
