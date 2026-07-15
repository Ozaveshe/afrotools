// Zimbabwe PAYE — Source: Zimbabwe Revenue Authority (ZIMRA), 2025 Tax Tables
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'ZW', countryName: 'Zimbabwe', currency: 'USD',
  source: 'Zimbabwe Revenue Authority (ZIMRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-07-01',
  nextReviewDate: '2025-09-29',
  /* source-confidence-stamp:end */

  bands: [[6000,0],[6000,0.20],[24000,0.25],[24000,0.30],[60000,0.35],[Infinity,0.40]],
  socialSecurity: [{ key: 'nssa', label: 'NSSA (3.5%)', rate: 0.035 }],
  employerSS: [{ key: 'nssa', label: 'NSSA (3.5%)', rate: 0.035 }]
});
