'use strict';

const engine = require('../../../assets/js/engines/gm-paye');

function round(value) { return Math.round(value); }

module.exports = {
  country: 'GM',
  countryName: 'Gambia',
  currency: 'GMD',
  regimes: ['NPF', 'FPS'],
  lastUpdated: '2026-07-21',
  sourceCheckedOn: '2026-07-21',
  nextReviewDate: '2026-10-31',
  source: 'Gambia Revenue Authority PAYE calculator and brochure; SSHFC NPF, FPS and IICF guidance',
  formulaParameters: {
    bandType: 'progressive',
    bands: engine.bands.map((band) => [band.width, band.rate]),
    payeBase: 'gross employment income; no deductions',
    npf: { employeeRate: 0.05, employerRate: 0.10, base: 'basic salary' },
    fps: { employeeRate: 0, employerRate: 0.15, base: 'gross salary' },
    iicf: { employerRate: 0.01, monthlyCap: 15 }
  },
  roundingPolicy: {
    method: 'nearest-integer',
    stages: ['annual PAYE', 'annual pension contributions', 'annual and monthly result', 'employer cost']
  },
  calculate(params) {
    params = params || {};
    const grossAnnual = Number(params.grossAnnual);
    const scheme = params.scheme === 'FPS' ? 'FPS' : 'NPF';
    const basicAnnual = params.basicAnnual == null ? grossAnnual : Number(params.basicAnnual);
    const result = engine.calculate({ grossAnnual, basicAnnual, scheme, includeIicf: params.iicf !== false });
    if (!result.ok) throw new Error(result.error);
    const employeeKey = scheme === 'NPF' ? 'npfEmployee' : 'fpsEmployee';
    const employerKey = scheme === 'NPF' ? 'npfEmployer' : 'fpsEmployer';
    return {
      input: { country: 'GM', grossAnnual, regime: scheme, basicAnnual: result.basicAnnual },
      deductions: { [employeeKey]: round(result.employeePensionAnnual), totalDeductions: round(result.employeePensionAnnual + result.payeAnnual) },
      tax: {
        taxableIncome: round(grossAnnual),
        bands: result.bands.map((band) => ({ from: band.from, to: band.to, rate: band.rate, taxInBand: round(band.tax) })),
        grossTax: round(result.payeAnnual),
        reliefs: {},
        netTax: round(result.payeAnnual)
      },
      result: {
        netAnnual: round(result.netAnnual),
        netMonthly: round(result.netMonthly),
        effectiveRate: (result.effectiveTaxRate * 100).toFixed(2) + '%',
        marginalRate: ((result.bands.filter((band) => band.tax > 0).pop() || { rate: 0 }).rate * 100) + '%'
      },
      employer: {
        [employerKey]: round(result.employerPensionAnnual),
        iicf: round(result.iicfAnnual),
        totalCostAnnual: round(result.employerCostAnnual),
        totalCostMonthly: round(result.employerCostMonthly)
      },
      meta: { regime: scheme, currency: 'GMD', lastUpdated: this.lastUpdated, sourceCheckedOn: this.sourceCheckedOn, nextReviewDate: this.nextReviewDate, source: this.source }
    };
  },
  reverseCalculate(params) {
    params = params || {};
    const result = engine.reverse({ netAnnual: params.netAnnual, scheme: params.scheme, basicRatio: params.basicRatio, includeIicf: params.iicf !== false });
    return this.calculate({ grossAnnual: result.grossAnnual, basicAnnual: result.basicAnnual, scheme: result.scheme, iicf: params.iicf });
  },
  getOptions() {
    return { regimes: [{ key: 'NPF', label: 'National Provident Fund', default: true }, { key: 'FPS', label: 'Federated Pension Scheme', default: false }], deductions: [{ key: 'iicf', label: 'Industrial Injuries Compensation Fund', default: true }] };
  }
};
