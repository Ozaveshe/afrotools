// Ordinary regular wages paid in Madagascar, general CNaPS regime.
const { createEngine } = require('./_factory');
const engine = createEngine({
  country: 'MG', countryName: 'Madagascar', currency: 'MGA',
  source: 'DGI CGI 2026 articles 01.03.16 and 01.03.19; CNaPS general regime',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-11-27', sourceCheckedOn: '2026-11-27', nextReviewDate: '2027-01-01',
  /* source-confidence-stamp:end */
  isMonthly: true, taxableRoundingStep: 100,
  bands: [[350000,0],[50000,.05],[100000,.10],[100000,.15],[3400000,.20],[Infinity,.25]],
  socialSecurity: [{ key: 'cnaps', label: 'CNaPS (1%)', rate: .01, baseCap: 2101440 }],
  employerSS: [{ key: 'cnaps', label: 'CNaPS (13%)', rate: .13, baseCap: 2101440 }]
});
const calculateBands = engine.calculate;
engine.calculate = function calculate(params) {
  const result = calculateBands.call(this, params);
  const gross = params.grossAnnual;
  const dependents = Number(params.dependents ?? 0);
  if (!Number.isSafeInteger(dependents) || dependents < 0) throw new RangeError('dependents must be a non-negative integer');
  const minimum = gross > 0 ? 36000 : 0;
  const grossTax = Math.max(minimum, result.tax.grossTax);
  const relief = result.tax.taxableIncome > 350000 * 12
    ? Math.min(dependents * 24000, grossTax - minimum) : 0;
  const tax = grossTax - relief;
  const cnaps = params.cnaps === false ? 0 : Math.min(gross, 2101440 * 12) * .01;
  result.tax.grossTax = grossTax;
  result.tax.netTax = tax;
  result.tax.reliefs = relief ? { dependentRelief: relief } : {};
  result.deductions.totalDeductions = Math.round(cnaps + tax);
  result.result.netAnnual = Math.round(gross - cnaps - tax);
  result.result.netMonthly = Math.round((gross - cnaps - tax) / 12);
  result.result.effectiveRate = (gross ? tax / gross * 100 : 0).toFixed(2) + '%';
  return result;
};
module.exports = engine;
