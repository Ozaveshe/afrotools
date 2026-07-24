'use strict';

const engine = require('../../../assets/js/engines/bj-paye');
function round(value) { return Math.round(value); }

module.exports = {
  country: 'BJ', countryName: 'Benin', currency: 'XOF', regimes: ['STANDARD'],
  lastUpdated: '2026-07-22',
  sourceCheckedOn: '2026-07-22',
  nextReviewDate: '2026-10-22',
  source: 'Benin Code general des impots 2026, Articles 119-129; CNSS Benin official contribution rates',
  formulaParameters: engine.formulaParameters,
  roundingPolicy: engine.roundingPolicy,
  calculate(params) {
    params = params || {};
    const grossMonthly = Number.isFinite(Number(params.grossMonthly)) ? Number(params.grossMonthly) : Number(params.grossAnnual) / 12;
    const month = params.month || 'standard';
    const riskRate = params.riskRate == null ? 0.01 : Number(params.riskRate);
    const value = engine.calculate({ grossMonthly, month, riskRate });
    if (!value.ok) throw new Error(value.error);
    return {
      input: { country: 'BJ', grossMonthly, grossAnnual: grossMonthly * 12, month: value.month, riskRate: value.riskRate },
      deductions: { cnssEmployee: round(value.employeeCnssAnnual), its: round(value.itsAnnual), totalDeductions: round(value.employeeCnssAnnual + value.itsAnnual) },
      tax: { taxableIncome: round(value.taxBaseMonthly), bands: value.bands.map(b => ({ from: b.from, to: b.to, rate: b.rate, taxInBand: round(b.tax) })), grossTax: round(value.baseItsMonthly * 12), ortbLevy: round(value.annualOrtb), netTax: round(value.itsAnnual) },
      result: { netAnnual: round(value.netAnnual), netMonthly: round(value.netMonthly), effectiveRate: (value.effectiveDeductionRate * 100).toFixed(2) + '%' },
      employer: { cnssEmployer: round(value.employerCnssAnnual), contributionRate: value.employerRate, totalCostAnnual: round(value.employerCostAnnual), totalCostMonthly: round(value.employerCostMonthly) },
      meta: { currency: 'XOF', lastUpdated: this.lastUpdated, sourceCheckedOn: this.sourceCheckedOn, nextReviewDate: this.nextReviewDate, source: this.source }
    };
  },
  reverseCalculate(params) {
    params = params || {};
    const netMonthly = Number.isFinite(Number(params.netMonthly)) ? Number(params.netMonthly) : Number(params.netAnnual) / 12;
    const result = engine.reverse({ netMonthly, month: params.month, riskRate: params.riskRate });
    if (!result.ok) throw new Error(result.error);
    return this.calculate({ grossMonthly: result.grossMonthly, month: result.month, riskRate: result.riskRate });
  },
  getOptions() {
    return { regimes: [{ key: 'STANDARD', label: 'Employee', default: true }], deductions: [{ key: 'month', label: 'Pay month', values: ['standard', 'march', 'june'], default: 'standard' }, { key: 'riskRate', label: 'Employer occupational risk rate', min: 0.01, max: 0.04, default: 0.01 }] };
  }
};
