// Malawi PAYE — Source: Malawi Revenue Authority (MRA), effective Jan 2026
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'MW', countryName: 'Malawi', currency: 'MWK',
  source: 'Malawi Revenue Authority (MRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-01-01',
  nextReviewDate: '2026-04-01',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[170000,0],[1400000,0.30],[8430000,0.35],[Infinity,0.40]],
  socialSecurity: [],
  employerSS: []
});
