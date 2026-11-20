// Rwanda PAYE — Source: Rwanda Revenue Authority (RRA), Law No. 027/2022 as amended
const { createEngine } = require('./_factory');
const engine = createEngine({
  country: 'RW', countryName: 'Rwanda', currency: 'RWF',
  source: 'Rwanda Revenue Authority (RRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-11-20',
  sourceCheckedOn: '2026-11-20',
  nextReviewDate: '2027-01-01',
  /* source-confidence-stamp:end */

  isMonthly: true,
  ssDeductibleFromTaxable: false,
  bands: [[60000,0],[40000,0.10],[100000,0.20],[Infinity,0.30]],
  socialSecurity: [
    { key: 'pension', label: 'RSSB Pension (6%)', rate: 0.06 },
    { key: 'maternity', label: 'Maternity (0.3%)', rate: 0.003 }
  ],
  employerSS: [
    { key: 'pension', label: 'RSSB Pension (6%)', rate: 0.06 },
    { key: 'maternity', label: 'Maternity (0.3%)', rate: 0.003 },
    { key: 'occupationalHazard', label: 'Occupational hazard (2%)', rate: 0.02 }
  ]
});

const baseCalculate = engine.calculate;
engine.formulaParameters.roundMonthlyTaxUp = true;
engine.formulaParameters.cbhiRateOnNet = 0.005;
engine.roundingPolicy.calculationNote = 'Round monthly PAYE upward; estimate CBHI at 0.5% of net salary rounded to the nearest franc. Annualize the monthly payroll.';

engine.calculate = function calculate(params) {
  const payroll = baseCalculate(params);
  const gross = params.grossAnnual / 12;
  const monthlyTax = Math.ceil((Math.min(Math.max(gross - 60000, 0), 40000) +
    2 * Math.min(Math.max(gross - 100000, 0), 100000) + 3 * Math.max(gross - 200000, 0)) / 10);
  const annualTax = monthlyTax * 12;
  const pension = params.pension === false ? 0 : gross * 0.06;
  const maternity = params.maternity === false ? 0 : gross * 0.003;
  const beforeCbhi = Math.max(0, gross - pension - maternity - monthlyTax);
  const cbhi = Math.round(beforeCbhi * 0.005 / 1.005);
  const net = beforeCbhi - cbhi;
  const bands = payroll.tax.bands;
  if (bands.length) {
    const priorBandTax = bands.slice(0, -1).reduce((sum, band) => sum + band.taxInBand, 0);
    bands[bands.length - 1].taxInBand = monthlyTax - priorBandTax;
  }
  payroll.tax.grossTax = annualTax;
  payroll.tax.netTax = annualTax;
  payroll.deductions.cbhi = cbhi * 12;
  payroll.deductions.totalDeductions = Math.round((gross - net) * 12);
  payroll.result.netMonthly = Math.round(net);
  payroll.result.netAnnual = Math.round(net * 12);
  payroll.result.effectiveRate = (gross ? monthlyTax / gross * 100 : 0).toFixed(2) + '%';
  const highestTaxed = bands.filter(band => band.taxInBand > 0).pop();
  payroll.result.marginalRate = (highestTaxed ? highestTaxed.rate * 100 : 0) + '%';
  return payroll;
};

module.exports = engine;
