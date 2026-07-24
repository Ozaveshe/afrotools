(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.beninPaye = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var EMPLOYEE_CNSS_RATE = 0.036;
  var EMPLOYER_FAMILY_RATE = 0.09;
  var EMPLOYER_PENSION_RATE = 0.064;
  var MIN_RISK_RATE = 0.01;
  var MAX_RISK_RATE = 0.04;
  var BANDS = [
    { width: 60000, rate: 0 },
    { width: 90000, rate: 0.10 },
    { width: 100000, rate: 0.15 },
    { width: 250000, rate: 0.19 },
    { width: Infinity, rate: 0.30 }
  ];

  function normalizeMonth(value) {
    return value === 'march' || value === 'june' ? value : 'standard';
  }

  function normalizeRiskRate(value) {
    var rate = Number(value);
    if (!Number.isFinite(rate)) rate = MIN_RISK_RATE;
    return Math.min(MAX_RISK_RATE, Math.max(MIN_RISK_RATE, rate));
  }

  function taxMonthly(taxableIncome) {
    var remaining = Math.max(0, Number(taxableIncome) || 0);
    var tax = 0;
    var from = 0;
    var bands = [];
    BANDS.forEach(function (band) {
      if (remaining <= 0) return;
      var income = Math.min(remaining, band.width);
      var bandTax = income * band.rate;
      bands.push({ from: from, to: band.width === Infinity ? null : from + band.width, rate: band.rate, income: income, tax: bandTax });
      tax += bandTax;
      remaining -= income;
      if (band.width !== Infinity) from += band.width;
    });
    return { tax: tax, bands: bands };
  }

  function broadcastLevy(month, taxableIncome) {
    if (month === 'march') return taxableIncome > 0 ? 1000 : 0;
    if (month === 'june') return taxableIncome > 60000 ? 3000 : 0;
    return 0;
  }

  function calculate(input) {
    input = input || {};
    var grossMonthly = Number(input.grossMonthly);
    if (!Number.isFinite(grossMonthly) || grossMonthly < 0) return { ok: false, error: 'Enter a monthly gross salary of zero or more.' };
    var month = normalizeMonth(input.month);
    var riskRate = normalizeRiskRate(input.riskRate);
    var taxBaseMonthly = grossMonthly;
    var its = taxMonthly(taxBaseMonthly);
    var ortbLevy = broadcastLevy(month, taxBaseMonthly);
    var employeeCnssMonthly = grossMonthly * EMPLOYEE_CNSS_RATE;
    var employerRate = EMPLOYER_FAMILY_RATE + EMPLOYER_PENSION_RATE + riskRate;
    var employerCnssMonthly = grossMonthly * employerRate;
    var itsMonthly = its.tax + ortbLevy;
    var netMonthly = grossMonthly - employeeCnssMonthly - itsMonthly;
    var annualOrtb = grossMonthly > 0 ? 1000 : 0;
    if (grossMonthly > 60000) annualOrtb += 3000;
    var itsAnnual = its.tax * 12 + annualOrtb;
    return {
      ok: true,
      month: month,
      grossMonthly: grossMonthly,
      grossAnnual: grossMonthly * 12,
      taxBaseMonthly: taxBaseMonthly,
      employeeCnssMonthly: employeeCnssMonthly,
      employeeCnssAnnual: employeeCnssMonthly * 12,
      riskRate: riskRate,
      employerRate: employerRate,
      employerCnssMonthly: employerCnssMonthly,
      employerCnssAnnual: employerCnssMonthly * 12,
      baseItsMonthly: its.tax,
      ortbLevy: ortbLevy,
      itsMonthly: itsMonthly,
      itsAnnual: itsAnnual,
      annualOrtb: annualOrtb,
      bands: its.bands,
      netMonthly: netMonthly,
      netAnnual: grossMonthly * 12 - employeeCnssMonthly * 12 - itsAnnual,
      employerCostMonthly: grossMonthly + employerCnssMonthly,
      employerCostAnnual: (grossMonthly + employerCnssMonthly) * 12,
      effectiveDeductionRate: grossMonthly ? (employeeCnssMonthly + itsMonthly) / grossMonthly : 0
    };
  }

  function reverse(input) {
    input = input || {};
    var target = Number(input.netMonthly);
    if (!Number.isFinite(target) || target <= 0) return { ok: false, error: 'Enter a monthly net salary greater than zero.' };
    var low = target;
    var high = Math.max(target * 3, 1000000);
    var result;
    for (var index = 0; index < 80; index += 1) {
      var gross = (low + high) / 2;
      result = calculate({ grossMonthly: gross, month: input.month, riskRate: input.riskRate });
      if (Math.abs(result.netMonthly - target) < 0.01) return result;
      if (result.netMonthly < target) low = gross; else high = gross;
    }
    return result;
  }

  return {
    bands: BANDS,
    employeeCnssRate: EMPLOYEE_CNSS_RATE,
    employerFamilyRate: EMPLOYER_FAMILY_RATE,
    employerPensionRate: EMPLOYER_PENSION_RATE,
    minimumRiskRate: MIN_RISK_RATE,
    maximumRiskRate: MAX_RISK_RATE,
    sourceCheckedOn: '2026-07-22',
    formulaParameters: {
      method: 'monthly-gross-remuneration',
      employeeCnssRate: EMPLOYEE_CNSS_RATE,
      employerRates: { family: EMPLOYER_FAMILY_RATE, pension: EMPLOYER_PENSION_RATE, occupationalRiskRange: [MIN_RISK_RATE, MAX_RISK_RATE] },
      employeeCnssDeductibleFromItsBase: false,
      ortbLevy: { march: 1000, june: 3000, juneExemptionAtOrBelow: 60000 },
      bands: BANDS
    },
    roundingPolicy: { method: 'display-only', stages: ['retain exact statutory calculation values', 'round only for user-facing XOF display'] },
    calculate: calculate,
    reverse: reverse,
    taxMonthly: taxMonthly,
    broadcastLevy: broadcastLevy
  };
}));
