'use strict';

const salary = require('../../../engines/src/morocco-paye');
const source = 'Direction générale des impôts, CGI 2026, articles 59, 73 et 74';
const regime = 'STANDARD';
const round = Math.round;

module.exports = {
  country: 'MA', countryName: 'Morocco', currency: 'MAD', regimes: [regime],
  source: source,
  /* source-confidence-stamp:start */
  lastUpdated: '2026-01-01',
  sourceCheckedOn: '2026-11-19',
  nextReviewDate: '2027-02-17',
  /* source-confidence-stamp:end */

  calculate({ grossAnnual, ...options }) {
    const r = salary.calculate(grossAnnual, 'annual', options);
    const bands = r.bands.filter(b => b.income > 0).map(b => ({
      from: b.from, to: Math.min(b.to ?? r.taxable, r.taxable), rate: b.rate, taxInBand: round(b.tax)
    }));
    return {
      input: { country: 'MA', grossAnnual, regime },
      deductions: { cnss: round(r.cnss), amo: round(r.amo), totalDeductions: round(r.mandatory + r.incomeTax) },
      tax: { taxableIncome: round(r.taxable), professionalExpenses: round(r.professional), bands, grossTax: round(r.taxBeforeRelief),
        reliefs: { family: round(r.familyRelief) }, netTax: round(r.incomeTax) },
      result: { netAnnual: round(r.annualNet), netMonthly: round(r.annualNet / 12), effectiveRate: (grossAnnual ? r.incomeTax / grossAnnual * 100 : 0).toFixed(2) + '%',
        marginalRate: (bands.length ? bands[bands.length - 1].rate * 100 : 0) + '%' },
      employer: { cnss: round(r.employerCNSS), amo: round(r.employerAMO), family: round(r.employerFamily), training: round(r.employerTraining),
        totalCostAnnual: round(r.employerSubtotal), totalCostMonthly: round(r.employerSubtotal / 12) },
      meta: { regime, currency: 'MAD', source, lastUpdated: this.lastUpdated, sourceCheckedOn: this.sourceCheckedOn, nextReviewDate: this.nextReviewDate,
        assumptions: ['Ordinary private-sector salary, equal monthly earnings; no benefits or special-occupation allowances.', r.contributionEvidence] }
    };
  },
  reverseCalculate({ netAnnual, ...options }) {
    return this.calculate({ ...options, grossAnnual: salary.reverse(netAnnual, 'annual', options) });
  },
  getOptions() {
    return { deductions: [{ key: 'cnss', label: 'Employee CNSS (4.48%, capped salary base)', default: true },
      { key: 'amo', label: 'Employee AMO (2.26%)', default: true }], regimes: [{ key: regime, label: 'Ordinary private-sector salary, 2026', default: true }] };
  }
};
