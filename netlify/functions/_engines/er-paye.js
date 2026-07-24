'use strict';
const engine = require('../../../assets/js/engines/er-paye');
function round(value) { return Math.round(value); }
module.exports = {
  country: 'ER', countryName: 'Eritrea', currency: 'ERN', regimes: ['ORDINARY', 'PUBLIC_SECTOR'],
  lastUpdated: '2026-07-22',
  sourceCheckedOn: '2026-07-22',
  nextReviewDate: '2026-10-22',
  source: 'Eritrea Income Tax Proclamation No. 62/1994 and Legal Notice No. 20/1995; Public Sector Pension Proclamation No. 146/2005',
  formulaParameters: engine.formulaParameters,
  roundingPolicy: engine.roundingPolicy,
  calculate(params) {
    params = params || {};
    const grossMonthly = Number.isFinite(Number(params.grossMonthly)) ? Number(params.grossMonthly) : Number(params.grossAnnual) / 12;
    const employmentType = params.employmentType === 'public-sector' ? 'public-sector' : 'ordinary';
    const pensionableBasic = employmentType === 'public-sector'
      ? (Number.isFinite(Number(params.pensionableBasic)) ? Number(params.pensionableBasic) : grossMonthly)
      : 0;
    const value = engine.calculate({ grossMonthly, employmentType, pensionableBasic });
    if (!value.ok) throw new Error(value.error);
    return {
      input: { country: 'ER', grossMonthly, grossAnnual: grossMonthly * 12, employmentType, pensionableBasic },
      deductions: { employeePension: round(value.employeePensionAnnual), incomeTax: round(value.incomeTaxAnnual), totalDeductions: round(value.employeePensionAnnual + value.incomeTaxAnnual) },
      tax: {
        taxableIncome: round(value.taxableIncome),
        bands: value.bands.map(band => ({
          from: band.from,
          // The browser engine represents the open-ended final band with
          // `null`. The API contract needs an ordered numeric range, so expose
          // the upper edge actually used for this calculation.
          to: band.to === null ? band.from + band.income : band.to,
          rate: band.rate,
          taxInBand: round(band.tax)
        })),
        grossTax: round(value.incomeTaxAnnual),
        netTax: round(value.incomeTaxAnnual)
      },
      result: { netAnnual: round(value.netAnnual), netMonthly: round(value.netMonthly), effectiveRate: (value.effectiveDeductionRate * 100).toFixed(2) + '%' },
      employer: { publicSectorPension: round(value.employerPensionAnnual), totalCostAnnual: round(value.employerCostAnnual), totalCostMonthly: round(value.employerCostMonthly) },
      meta: { currency: 'ERN', lastUpdated: this.lastUpdated, sourceCheckedOn: this.sourceCheckedOn, nextReviewDate: this.nextReviewDate, source: this.source }
    };
  },
  getOptions() {
    return { regimes: [
      { key: 'ORDINARY', value: 'ordinary', label: 'Tax-only reference estimate', default: true },
      { key: 'PUBLIC_SECTOR', value: 'public-sector', label: 'Regular public-sector employee pension scenario' }
    ] };
  }
};
