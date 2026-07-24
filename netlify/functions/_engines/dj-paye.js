'use strict';
const engine = require('../../../assets/js/engines/dj-paye');
function round(value) { return Math.round(value); }
module.exports = {
  country: 'DJ', countryName: 'Djibouti', currency: 'DJF', regimes: ['PROFESSIONAL', 'DOMESTIC'],
  lastUpdated: '2026-07-22',
  sourceCheckedOn: '2026-07-22',
  nextReviewDate: '2026-10-22',
  source: 'Djibouti Finance Law 2022 Article 7; CGI Articles 6 and 14; CNSS official contribution rates',
  formulaParameters: engine.formulaParameters, roundingPolicy: engine.roundingPolicy,
  calculate(params) {
    params = params || {};
    const grossMonthly = Number.isFinite(Number(params.grossMonthly)) ? Number(params.grossMonthly) : Number(params.grossAnnual) / 12;
    const employmentType = params.employmentType || 'professional';
    const value = engine.calculate({ grossMonthly, employmentType });
    if (!value.ok) throw new Error(value.error);
    return {
      input: { country: 'DJ', grossMonthly, grossAnnual: grossMonthly * 12, employmentType: value.employmentType },
      deductions: { cnssEmployee: round(value.employeeCnssAnnual), its: round(value.itsAnnual), totalDeductions: round(value.employeeCnssAnnual + value.itsAnnual) },
      tax: { taxableIncome: round(value.taxableIncome), roundedTaxableIncome: round(value.roundedTaxableIncome), bands: value.bands.map(b => ({ from: b.from, to: b.to, rate: b.rate, taxInBand: round(b.tax) })), grossTax: round(value.itsAnnual), netTax: round(value.itsAnnual) },
      result: { netAnnual: round(value.netAnnual), netMonthly: round(value.netMonthly), effectiveRate: (value.effectiveDeductionRate * 100).toFixed(2) + '%' },
      employer: { cnssEmployer: round(value.employerCnssAnnual), contributionRate: engine.employerCnssRate, totalCostAnnual: round(value.employerCostAnnual), totalCostMonthly: round(value.employerCostMonthly) },
      meta: { currency: 'DJF', lastUpdated: this.lastUpdated, sourceCheckedOn: this.sourceCheckedOn, nextReviewDate: this.nextReviewDate, source: this.source }
    };
  },
  getOptions() { return { regimes: [{ key: 'PROFESSIONAL', value: 'professional', label: 'Professional employer', default: true }, { key: 'DOMESTIC', value: 'domestic', label: 'Domestic worker employer' }] }; }
};
