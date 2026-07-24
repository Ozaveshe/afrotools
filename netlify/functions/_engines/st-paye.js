'use strict';

const engine = require('../../../assets/js/engines/st-paye');

module.exports = {
  country: 'ST',
  countryName: 'Sao Tome and Principe',
  currency: 'STN',
  regimes: ['STANDARD'],
  lastUpdated: '2026-07-22',
  sourceCheckedOn: '2026-07-22',
  nextReviewDate: '2026-08-22',
  source: 'INSS Decreto-Lei 19/2022, Articles 101-102; Direccao dos Impostos IRS legislation catalogue and 2026 State Budget review',
  formulaParameters: {
    method: 'verified-contributions-only',
    employeeInssRate: 0.04,
    employerInssRate: 0.06,
    irsStatus: 'CURRENT_SCHEDULE_UNCONFIRMED',
    irsCalculated: false
  },
  calculate(params) {
    params = params || {};
    const grossAnnual = Number(params.grossAnnual);
    const result = engine.calculate({ grossMonthly: grossAnnual / 12 });
    if (!result.ok) throw new Error(result.error);
    return {
      input: { country: 'ST', grossAnnual },
      deductions: {
        inssEmployee: result.employeeInssAnnual,
        totalDeductions: result.employeeInssAnnual,
        totalVerifiedDeductions: result.employeeInssAnnual
      },
      tax: {
        status: result.irsStatus,
        taxableIncome: null,
        grossTax: null,
        netTax: null
      },
      result: {
        afterEmployeeInssAnnual: result.afterEmployeeInssAnnual,
        afterEmployeeInssMonthly: result.afterEmployeeInssMonthly,
        netAnnual: null,
        netMonthly: null
      },
      employer: {
        inssEmployer: result.employerInssAnnual,
        totalCostAnnual: result.employerCostAnnual,
        totalCostMonthly: result.employerCostMonthly
      },
      meta: {
        currency: 'STN',
        lastUpdated: this.lastUpdated,
        sourceCheckedOn: this.sourceCheckedOn,
        nextReviewDate: this.nextReviewDate,
        source: this.source,
        warning: 'IRS is intentionally not calculated because the current official withholding schedule could not be confirmed.'
      }
    };
  },
  reverseCalculate() {
    throw new Error('Reverse calculation is unavailable while the current IRS schedule is unconfirmed.');
  },
  getOptions() {
    return { regimes: [{ key: 'STANDARD', label: 'Employee', default: true }], deductions: [] };
  }
};
