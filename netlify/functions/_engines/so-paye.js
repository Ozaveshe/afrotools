'use strict';
const engine = require('../../../assets/js/engines/so-paye');
function cents(value) { return Math.round(value * 100) / 100; }
module.exports = {
  country: 'SO', countryName: 'Somalia', currency: 'USD', regimes: ['RESIDENT_ADULT', 'NONRESIDENT', 'RESIDENT_UNDER_18'],
  lastUpdated: '2026-07-22',
  sourceCheckedOn: '2026-07-22',
  nextReviewDate: '2026-10-22',
  source: 'Federal Republic of Somalia Income Tax Law 2025, Income Tax Regulations 2025 and Ministry of Finance Income Tax Manual (November 2025)',
  formulaParameters: engine.formulaParameters, roundingPolicy: engine.roundingPolicy,
  calculate(params) {
    params = params || {};
    const grossMonthly = Number.isFinite(Number(params.grossMonthly)) ? Number(params.grossMonthly) : Number(params.grossAnnual) / 12;
    const category = params.category || 'resident-adult';
    const value = engine.calculate({ grossMonthly, category });
    if (!value.ok) throw new Error(value.error);
    return {
      input: { country: 'SO', grossMonthly, grossAnnual: grossMonthly * 12, category: value.category },
      deductions: { incomeTax: cents(value.taxAnnual), totalDeductions: cents(value.taxAnnual) },
      tax: { taxableIncome: cents(value.grossMonthly), bands: value.bands.map(b => ({ from: b.from, to: b.to, rate: b.rate, taxInBand: cents(b.tax) })), grossTax: cents(value.taxAnnual), netTax: cents(value.taxAnnual) },
      result: { netAnnual: cents(value.netAnnual), netMonthly: cents(value.netMonthly), effectiveRate: (value.effectiveRate * 100).toFixed(2) + '%' },
      employer: { totalCostAnnual: cents(value.grossAnnual), totalCostMonthly: cents(value.grossMonthly), note: 'No employer payroll contribution is modeled.' },
      meta: { currency: 'USD', scope: 'Federal Republic of Somalia income tax only', lastUpdated: this.lastUpdated, sourceCheckedOn: this.sourceCheckedOn, nextReviewDate: this.nextReviewDate, source: this.source }
    };
  },
  getOptions() { return { regimes: [{ key: 'RESIDENT_ADULT', value: 'resident-adult', label: 'Resident adult', default: true }, { key: 'NONRESIDENT', value: 'nonresident', label: 'Non-resident' }, { key: 'RESIDENT_UNDER_18', value: 'resident-under-18', label: 'Resident under 18' }] }; }
};
