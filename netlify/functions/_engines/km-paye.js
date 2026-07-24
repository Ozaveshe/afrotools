'use strict';

const engine = require('../../../assets/js/engines/km-paye');

function round(value) { return Math.round(value); }

module.exports = {
  country: 'KM',
  countryName: 'Comoros',
  currency: 'KMF',
  regimes: ['STATUTORY_REFERENCE'],
  lastUpdated: '2026-07-22',
  sourceCheckedOn: '2026-07-22',
  nextReviewDate: '2026-10-22',
  source: engine.source.title,
  sourceUrl: engine.source.url,
  sourceCaveat: engine.source.caveat,
  formulaParameters: engine.formulaParameters,
  roundingPolicy: engine.roundingPolicy,

  calculate(params) {
    params = params || {};
    const grossMonthly = Number.isFinite(Number(params.grossMonthly))
      ? Number(params.grossMonthly)
      : Number(params.grossAnnual) / 12;
    const employeeContributionRate = params.employeeContributionRate == null
      ? 0
      : Number(params.employeeContributionRate);
    const value = engine.calculate({ grossMonthly, employeeContributionRate });
    if (!value.ok) throw new Error(value.error);

    return {
      input: {
        country: 'KM',
        grossMonthly: value.grossMonthly,
        grossAnnual: value.grossAnnual,
        employeeContributionRate: value.employeeContributionRate,
        regime: 'STATUTORY_REFERENCE'
      },
      deductions: {
        employeeContribution: round(value.employeeContributionAnnual),
        incomeTax: round(value.incomeTaxAnnual),
        totalDeductions: round(value.employeeContributionAnnual + value.incomeTaxAnnual)
      },
      tax: {
        incomeAfterContribution: round(value.incomeAfterContributionAnnual),
        professionalExpenseDeduction: round(value.professionalExpenseDeductionAnnual),
        taxableIncome: round(value.taxableAnnual),
        bands: value.bands.map(band => ({ from: band.from, to: band.to, rate: band.rate, taxInBand: round(band.tax) })),
        grossTax: round(value.incomeTaxAnnual),
        netTax: round(value.incomeTaxAnnual)
      },
      result: {
        netAnnual: round(value.netAnnual),
        netMonthly: round(value.netMonthly),
        effectiveRate: (value.effectiveDeductionRate * 100).toFixed(2) + '%'
      },
      meta: {
        currency: 'KMF',
        lastUpdated: this.lastUpdated,
        sourceCheckedOn: this.sourceCheckedOn,
        nextReviewDate: this.nextReviewDate,
        source: this.source,
        sourceUrl: this.sourceUrl,
        caveat: this.sourceCaveat
      }
    };
  },

  getOptions() {
    return {
      regimes: [{ key: 'STATUTORY_REFERENCE', label: 'CGI 2023 statutory-reference estimate', default: true }],
      inputs: [{ key: 'employeeContributionRate', label: 'Approved employee pension or social contribution rate', minimum: 0, maximum: 0.06, default: 0 }]
    };
  }
};
