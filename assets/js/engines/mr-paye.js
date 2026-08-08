(function (root) {
  'use strict';

  var BANDS = [
    { width: 9000, rate: 0.15 },
    { width: 12000, rate: 0.25 },
    { width: Infinity, rate: 0.40 }
  ];
  var MONTHLY_ALLOWANCE = 6000;
  var TAXABLE_ROUNDING_STEP = 10;
  var CNSS_RATE = 0.01;
  var CNSS_BASE_CAP = 15000;
  var EMPLOYER_CNSS_RATE = 0.13;
  var WORK_MEDICINE_RATE = 0.02;

  function progressiveTax(monthlyTaxable) {
    var remaining = Math.max(0, Number(monthlyTaxable) || 0);
    var tax = 0;
    var floor = 0;
    var detail = [];
    BANDS.forEach(function (band) {
      if (remaining <= 0) return;
      var slice = Math.min(remaining, band.width);
      var bandTax = slice * band.rate;
      detail.push({
        from: floor,
        to: band.width === Infinity ? null : floor + band.width,
        rate: band.rate,
        income: slice,
        tax: bandTax
      });
      tax += bandTax;
      remaining -= slice;
      if (band.width !== Infinity) floor += band.width;
    });
    return { tax: tax, bands: detail };
  }

  function calculate(input) {
    input = input || {};
    var grossAnnual = Number(input.grossAnnual);
    if (!Number.isFinite(grossAnnual) || grossAnnual < 0) {
      return { ok: false, error: 'Enter annual gross salary of zero or more.' };
    }
    var grossMonthly = grossAnnual / 12;
    var contributionBaseMonthly = Math.min(grossMonthly, CNSS_BASE_CAP);
    var includeCnss = input.cnss !== false;
    var cnssAnnualExact = includeCnss ? contributionBaseMonthly * CNSS_RATE * 12 : 0;
    var cnssAnnual = Math.round(cnssAnnualExact);
    var taxableMonthly = Math.floor(Math.max(0, (grossAnnual - cnssAnnualExact) / 12 - MONTHLY_ALLOWANCE) / TAXABLE_ROUNDING_STEP) * TAXABLE_ROUNDING_STEP;
    var tax = progressiveTax(taxableMonthly);
    var taxAnnual = Math.max(0, Math.round(tax.tax * 12));
    var netAnnualExact = grossAnnual - cnssAnnualExact - taxAnnual;
    var employerCnssAnnual = Math.round(contributionBaseMonthly * EMPLOYER_CNSS_RATE * 12);
    var workMedicineAnnual = Math.round(contributionBaseMonthly * WORK_MEDICINE_RATE * 12);
    var employerCostAnnual = Math.round(grossAnnual + contributionBaseMonthly * (EMPLOYER_CNSS_RATE + WORK_MEDICINE_RATE) * 12);

    return {
      ok: true,
      grossAnnual: grossAnnual,
      grossMonthly: grossMonthly,
      taxableAnnual: Math.round(taxableMonthly * 12),
      taxableMonthly: taxableMonthly,
      taxAnnual: taxAnnual,
      taxMonthly: taxAnnual / 12,
      cnssAnnual: cnssAnnual,
      cnssMonthly: cnssAnnual / 12,
      netAnnual: Math.round(netAnnualExact),
      netMonthly: Math.round(netAnnualExact / 12),
      employerCnssAnnual: employerCnssAnnual,
      workMedicineAnnual: workMedicineAnnual,
      employerChargeAnnual: employerCnssAnnual + workMedicineAnnual,
      employerChargeMonthly: (employerCnssAnnual + workMedicineAnnual) / 12,
      employerCostAnnual: employerCostAnnual,
      employerCostMonthly: Math.round(employerCostAnnual / 12),
      effectiveRate: grossAnnual ? taxAnnual / grossAnnual : 0,
      bands: tax.bands
    };
  }

  var engine = {
    bands: BANDS,
    sourceCheckedOn: '2026-07-21',
    nextReviewDate: '2026-10-31',
    formulaParameters: {
      currency: 'MRU',
      period: 'monthly',
      taxFreeAllowance: MONTHLY_ALLOWANCE,
      taxableRoundingStep: TAXABLE_ROUNDING_STEP,
      cnssRate: CNSS_RATE,
      cnssBaseCap: CNSS_BASE_CAP,
      employerCnssRate: EMPLOYER_CNSS_RATE,
      workMedicineRate: WORK_MEDICINE_RATE,
      bands: BANDS
    },
    roundingPolicy: {
      method: 'server-engine-parity',
      stages: ['annual statutory deductions', 'annual tax', 'annual and monthly net result', 'employer contribution totals']
    },
    progressiveTax: progressiveTax,
    calculate: calculate
  };

  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.mauritaniaPaye = engine;
  }
}(typeof window !== 'undefined' ? window : globalThis));
