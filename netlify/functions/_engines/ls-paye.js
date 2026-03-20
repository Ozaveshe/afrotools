// Lesotho PAYE — Source: Lesotho Revenue Authority (LRA)
// Two bands: 20% on first M72,000 → 30% above
// Tax credit: M10,560/yr applied after tax calculation

const { createEngine, calcProgressiveBands } = require('./_factory');

const base = createEngine({
  country: 'LS', countryName: 'Lesotho', currency: 'LSL',
  source: 'Lesotho Revenue Authority (LRA)',
  bands: [[72000,0.20],[Infinity,0.30]],
  socialSecurity: [],
  employerSS: []
});

// Override calculate to apply M10,560 tax credit
const origCalc = base.calculate.bind(base);
base.calculate = function(params) {
  const result = origCalc(params);
  const TAX_CREDIT = 10560;
  const grossTax = result.tax.grossTax;
  const netTax = Math.max(0, grossTax - TAX_CREDIT);
  const diff = result.tax.netTax - netTax;

  result.tax.reliefs = { taxCredit: TAX_CREDIT };
  result.tax.netTax = netTax;
  result.deductions.totalDeductions = Math.round(result.deductions.totalDeductions - diff);
  result.result.netAnnual = Math.round(result.result.netAnnual + diff);
  result.result.netMonthly = Math.round(result.result.netAnnual / 12);
  result.result.effectiveRate = (netTax / params.grossAnnual * 100).toFixed(2) + '%';
  return result;
};

module.exports = base;
