// Zambia PAYE — ZRA 2026 bands and NAPSA 2026 contribution ceiling.
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'ZM', countryName: 'Zambia', currency: 'ZMW',
  source: 'Zambia Revenue Authority (ZRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-09-15',
  sourceCheckedOn: '2026-09-15',
  nextReviewDate: '2026-12-14',
  /* source-confidence-stamp:end */

  isMonthly: true,
  ssDeductibleFromTaxable: false,
  bands: [[5100,0],[2000,0.20],[2100,0.30],[Infinity,0.37]],
  socialSecurity: [
    { key: 'napsa', label: 'NAPSA (5%)', rate: 0.05, cap: 1861.80 },
    { key: 'nhima', label: 'NHIMA (1% of basic salary)', rate: 0.01, baseAnnualKey: 'basicAnnual' }
  ],
  employerSS: [
    { key: 'napsa', label: 'NAPSA (5%)', rate: 0.05, cap: 1861.80 },
    { key: 'nhima', label: 'NHIMA (1% of basic salary)', rate: 0.01, baseAnnualKey: 'basicAnnual' }
  ]
});
