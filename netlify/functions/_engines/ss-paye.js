'use strict';
const engine = require('../../../assets/js/engines/ss-paye');
function round(value) { return Math.round(value); }
module.exports = {
  country: 'SS', countryName: 'South Sudan', currency: 'SSP', regimes: ['STANDARD'],
  lastUpdated: '2026-07-22',
  sourceCheckedOn: '2026-07-22',
  nextReviewDate: '2026-10-22',
  source: 'South Sudan Taxation Act 2009; Taxation Amendment Act 2012; Financial Act FY 2023/24; National Social Insurance Fund Act 2023',
  formulaParameters: engine.formulaParameters, roundingPolicy: engine.roundingPolicy,
  calculate(params) {
    params = params || {};
    const gross = Number.isFinite(Number(params.gross)) ? Number(params.gross) : Number(params.grossAnnual) / 12;
    const includeNsif = params.includeNsif !== false && params.nsif !== false;
    const value = engine.calculate({ gross, includeNsif });
    if (!value.ok) throw new Error(value.error);
    return {
      input: { country: 'SS', grossMonthly: gross, grossAnnual: gross * 12, includeNsif },
      deductions: { nsif: round(value.annual.employeeNsif), pit: round(value.annual.pit), pitSurtax: round(value.annual.surtax), totalDeductions: round(value.annual.employeeNsif + value.annual.totalTax) },
      tax: { taxableIncome: round(value.annual.taxableIncome), bands: value.bands.map(b => ({ from: b.from, to: b.to, rate: b.rate, taxInBand: round(b.tax) })), grossTax: round(value.annual.pit), surtax: round(value.annual.surtax), netTax: round(value.annual.totalTax) },
      result: { netAnnual: round(value.annual.net), netMonthly: round(value.net), effectiveRate: (value.effectiveDeductionRate * 100).toFixed(2) + '%' },
      employer: { nsif: round(value.annual.employerNsif), totalCostAnnual: round(value.annual.employerCost), totalCostMonthly: round(value.employerCost) },
      meta: { currency: 'SSP', lastUpdated: this.lastUpdated, sourceCheckedOn: this.sourceCheckedOn, nextReviewDate: this.nextReviewDate, source: this.source }
    };
  },
  getOptions() { return { deductions: [{ key: 'nsif', label: 'National Social Insurance Fund (8%)', default: true }], regimes: [{ key: 'STANDARD', label: 'Standard employment', default: true }] }; }
};
