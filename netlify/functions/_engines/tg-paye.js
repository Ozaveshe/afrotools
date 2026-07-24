'use strict';

const engine = require('../../../assets/js/engines/tg-paye');

function round(value) { return Math.round(value); }

module.exports = {
  country: 'TG',
  countryName: 'Togo',
  currency: 'XOF',
  regimes: ['STANDARD'],
  lastUpdated: '2026-07-22',
  sourceCheckedOn: '2026-07-22',
  nextReviewDate: '2026-10-22',
  source: 'OTR Code general des impots et Livre des procedures fiscales, consolidated 2025, Articles 26 and 72-74; CNSS Togo contribution rules',
  formulaParameters: {
    method: 'annual-employment-income',
    employeeCnssRate: 0.04,
    employerCnssRate: 0.175,
    professionalDeduction: { rate: 0.28, cap: 10000000 },
    dependentReliefAnnual: 120000,
    maximumDependents: 6,
    taxableRounding: 'down-to-1000-XOF',
    taxRounding: 'down-to-10-XOF',
    bands: engine.bands
  },
  roundingPolicy: {
    method: 'statutory-stage-rounding',
    stages: ['annual taxable income down to XOF 1,000', 'annual tax down to XOF 10']
  },
  calculate(params) {
    params = params || {};
    const grossAnnual = Number(params.grossAnnual);
    const dependents = Number(params.dependents || 0);
    const result = engine.calculate({ grossAnnual, dependents });
    if (!result.ok) throw new Error(result.error);
    return {
      input: { country: 'TG', grossAnnual, dependents: result.dependents },
      deductions: {
        cnssEmployee: round(result.employeeCnssAnnual),
        professionalDeduction: round(result.professionalDeduction),
        dependentRelief: round(result.dependentRelief),
        totalDeductions: round(result.employeeCnssAnnual + result.payeAnnual)
      },
      tax: {
        taxableIncome: result.taxableIncome,
        bands: result.bands.map(band => ({ from: band.from, to: band.to, rate: band.rate, taxInBand: round(band.tax) })),
        grossTax: result.payeAnnual,
        reliefs: { dependents: round(result.dependentRelief) },
        netTax: result.payeAnnual
      },
      result: {
        netAnnual: round(result.netAnnual),
        netMonthly: round(result.netMonthly),
        effectiveRate: (result.effectiveTaxRate * 100).toFixed(2) + '%',
        effectiveDeductionRate: (result.effectiveDeductionRate * 100).toFixed(2) + '%'
      },
      employer: {
        cnssEmployer: round(result.employerCnssAnnual),
        totalCostAnnual: round(result.employerCostAnnual),
        totalCostMonthly: round(result.employerCostMonthly)
      },
      meta: {
        currency: 'XOF',
        lastUpdated: this.lastUpdated,
        sourceCheckedOn: this.sourceCheckedOn,
        nextReviewDate: this.nextReviewDate,
        source: this.source
      }
    };
  },
  reverseCalculate(params) {
    params = params || {};
    const result = engine.reverse({ netAnnual: Number(params.netAnnual), dependents: params.dependents });
    if (!result.ok) throw new Error(result.error);
    return this.calculate({ grossAnnual: result.grossAnnual, dependents: result.dependents });
  },
  getOptions() {
    return {
      regimes: [{ key: 'STANDARD', label: 'Employee', default: true }],
      deductions: [{ key: 'dependents', label: 'Qualifying dependents', min: 0, max: 6, default: 0 }]
    };
  }
};
