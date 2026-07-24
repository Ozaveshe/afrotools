'use strict';

const engine = require('../../../assets/js/engines/cv-paye');

function round(value) { return Math.round(value); }

module.exports = {
  country: 'CV',
  countryName: 'Cape Verde',
  currency: 'CVE',
  regimes: ['STANDARD', 'DOMESTIC'],
  lastUpdated: '2026-07-21',
  sourceCheckedOn: '2026-07-21',
  nextReviewDate: '2026-10-31',
  source: 'DNRE Category A monthly withholding formula; INPS contribution obligations',
  formulaParameters: {
    method: 'monthly-gross-formula',
    exemptionThreshold: 36607,
    formulas: [
      { upTo: 80000, rate: 0.14, subtract: 5125 },
      { upTo: 150000, rate: 0.21, subtract: 10725 },
      { upTo: Infinity, rate: 0.25, subtract: 16725 }
    ],
    minimumPositiveWithholding: 100,
    standardInps: { employeeRate: 0.085, employerRate: 0.16 },
    domesticInps: { employeeRate: 0.08, employerRate: 0.15 }
  },
  roundingPolicy: {
    method: 'nearest-integer',
    stages: ['monthly withholding tax', 'annual and monthly result', 'INPS contributions', 'employer cost']
  },
  calculate(params) {
    params = params || {};
    const grossAnnual = Number(params.grossAnnual);
    const regime = params.regime === 'DOMESTIC' ? 'DOMESTIC' : 'STANDARD';
    const result = engine.calculate({ grossMonthly: grossAnnual / 12, regime, includeInps: params.inps !== false });
    if (!result.ok) throw new Error(result.error);
    return {
      input: { country: 'CV', grossAnnual, regime },
      deductions: { inpsEmployee: round(result.employeeInpsAnnual), totalDeductions: round(result.employeeInpsAnnual + result.taxAnnual) },
      tax: {
        taxableIncome: round(grossAnnual),
        bands: [{ from: 0, to: grossAnnual, rate: result.marginalRate, taxInBand: round(result.taxAnnual) }],
        grossTax: round(result.taxAnnual),
        reliefs: {},
        netTax: round(result.taxAnnual)
      },
      result: {
        netAnnual: round(result.netAnnual),
        netMonthly: round(result.netMonthly),
        effectiveRate: (result.effectiveTaxRate * 100).toFixed(2) + '%',
        marginalRate: (result.marginalRate * 100) + '%'
      },
      employer: {
        inpsEmployer: round(result.employerInpsAnnual),
        totalCostAnnual: round(result.employerCostAnnual),
        totalCostMonthly: round(result.employerCostMonthly)
      },
      meta: { regime, currency: 'CVE', lastUpdated: this.lastUpdated, sourceCheckedOn: this.sourceCheckedOn, nextReviewDate: this.nextReviewDate, source: this.source }
    };
  },
  reverseCalculate(params) {
    params = params || {};
    const result = engine.reverse({ netMonthly: Number(params.netAnnual) / 12, regime: params.regime, includeInps: params.inps !== false });
    return this.calculate({ grossAnnual: result.grossAnnual, regime: result.regime, inps: params.inps });
  },
  getOptions() {
    return {
      regimes: [
        { key: 'STANDARD', label: 'Employee', default: true },
        { key: 'DOMESTIC', label: 'Domestic service', default: false }
      ],
      deductions: [{ key: 'inps', label: 'INPS', default: true }]
    };
  }
};
