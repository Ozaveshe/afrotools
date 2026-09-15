'use strict';

const engine = require('../../../assets/js/engines/ug-paye');
function round(value) { return Math.round(value); }

module.exports = {
  country: 'UG', countryName: 'Uganda', currency: 'UGX', regimes: engine.regimes,
  lastUpdated: '2026-09-16', sourceCheckedOn: '2026-09-16', nextReviewDate: '2026-12-16',
  source: 'URA notice of 7 September 2026: resident PAYE rates effective 1 July 2026, checked 16 September 2026 (https://ura.go.ug/en/changes-to-paye-return-form-following-the-income-tax-amendment-act-2026/); non-resident schedule, NSSF and KCCA Local Service Tax assessed from monthly gross salary and deducted before PAYE retain their 2 August 2026 review basis',
  formulaParameters: engine.formulaParameters, roundingPolicy: engine.roundingPolicy,
  calculate(params) {
    params = params || {};
    const grossMonthly = Number.isFinite(Number(params.grossMonthly)) ? Number(params.grossMonthly) : Number(params.grossAnnual) / 12;
    const value = engine.calculate({ grossMonthly, regime: params.regime, nssfEnabled: params.nssf !== false, lstEnabled: params.lst === true, lstPayrollDeduction: params.lstPayrollDeduction });
    if (!value.ok) throw new Error(value.error);
    return {
      input: { country: 'UG', grossMonthly, grossAnnual: grossMonthly * 12, regime: value.regime, lst: value.lstEnabled, nssf: params.nssf !== false },
      deductions: { nssfEmployee: round(value.employeeNssfAnnual), localServiceTax: round(value.lstAnnual), localServiceTaxCurrentPayroll: round(value.lstPayrollDeduction), localServiceTaxCollectionSchedule: value.lstCollectionSchedule.map(round), paye: round(value.annualPaye), totalDeductions: round(value.employeeNssfAnnual + value.lstAnnual + value.annualPaye) },
      tax: { taxableIncomeMonthly: round(value.taxableIncome), lstAssessmentGross: round(value.lstAssessmentGross), bands: value.bands.map((band) => ({ from: band.from, to: band.to, rate: band.rate, taxInBand: round(band.tax) })), grossTax: round(value.annualPaye), netTax: round(value.annualPaye) },
      result: { netAnnual: round(value.netAnnual), netMonthly: round(value.netMonthly), effectiveRate: (value.effectiveDeductionRate * 100).toFixed(2) + '%' },
      employer: { nssfEmployer: round(value.employerNssfAnnual), contributionRate: engine.employerNssfRate, totalCostAnnual: round(value.employerCostAnnual), totalCostMonthly: round(value.employerCostMonthly) },
      meta: { currency: 'UGX', lastUpdated: this.lastUpdated, sourceCheckedOn: this.sourceCheckedOn, nextReviewDate: this.nextReviewDate, source: this.source }
    };
  },
  getOptions() {
    return { regimes: [{ key: 'RESIDENT', label: 'Resident', default: true }, { key: 'NON_RESIDENT', label: 'Non-resident' }], deductions: [{ key: 'nssf', label: 'NSSF employee 5% and employer 10%', default: true }, { key: 'lst', label: 'Local Service Tax assessed from monthly gross salary and deducted before PAYE', default: false }] };
  }
};
