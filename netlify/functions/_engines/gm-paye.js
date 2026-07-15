// Gambia PAYE — Source: Gambia Revenue Authority (GRA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'GM', countryName: 'Gambia', currency: 'GMD',
  source: 'Gambia Revenue Authority (GRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-01',
  nextReviewDate: '2026-06-30',
  /* source-confidence-stamp:end */

  bands: [[24000,0],[4000,0.05],[10000,0.10],[10000,0.15],[Infinity,0.20]],
  socialSecurity: [{ key: 'sshfc', label: 'SSHFC (5%)', rate: 0.05 }],
  employerSS: [{ key: 'sshfc', label: 'SSHFC (10%)', rate: 0.10 }]
});
