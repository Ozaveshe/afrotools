// Sudan PAYE — Source: Taxation Chamber
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'SD', countryName: 'Sudan', currency: 'SDG',
  source: 'Taxation Chamber',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-01-01',
  nextReviewDate: '2026-04-01',
  /* source-confidence-stamp:end */

  bands: [[Infinity,0.15]],  // Flat 15% rate
  socialSecurity: [{ key: 'nssf', label: 'Social Insurance (8%)', rate: 0.08 }],
  employerSS: [{ key: 'nssf', label: 'Social Insurance (17%)', rate: 0.17 }]
});
