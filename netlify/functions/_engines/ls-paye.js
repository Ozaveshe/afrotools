// Lesotho PAYE — Source: Revenue Services Lesotho (RSL), 2026/27
// Two bands: 20% on first M77,760 -> 30% above
// Tax credit: M12,240/yr applied after tax calculation

const { createEngine, calcProgressiveBands } = require('./_factory');

const base = createEngine({
  country: 'LS', countryName: 'Lesotho', currency: 'LSL',
  source: 'Revenue Services Lesotho (RSL)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-11-18',
  sourceCheckedOn: '2026-11-18',
  nextReviewDate: '2027-02-16',
  /* source-confidence-stamp:end */

  bands: [[77760,0.20],[Infinity,0.30]],
  socialSecurity: [],
  employerSS: []
});

// Override calculate to apply M12,240 tax credit
const origCalc = base.calculate.bind(base);
base.calculate = function(params) {
  const result = origCalc(params);
  const TAX_CREDIT = 12240;
  const grossTax = result.tax.grossTax;
  const netTax = Math.max(0, grossTax - TAX_CREDIT);
  const diff = result.tax.netTax - netTax;

  result.tax.reliefs = { taxCredit: TAX_CREDIT };
  result.tax.netTax = netTax;
  result.deductions.totalDeductions = Math.round(result.deductions.totalDeductions - diff);
  result.result.netAnnual = Math.round(result.result.netAnnual + diff);
  result.result.netMonthly = Math.round(result.result.netAnnual / 12);
  result.result.effectiveRate = (params.grossAnnual > 0 ? netTax / params.grossAnnual * 100 : 0).toFixed(2) + '%';
  return result;
};

module.exports = base;
