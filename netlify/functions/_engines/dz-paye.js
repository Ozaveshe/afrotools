// Algeria PAYE (IRG) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'DZ', countryName: 'Algeria', currency: 'DZD',
  source: 'Direction Générale des Impôts (DGI)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-06',
  nextReviewDate: '2026-07-05',
  /* source-confidence-stamp:end */

  bands: [[240000,0],[240000,0.20],[480000,0.30],[Infinity,0.35]],
  socialSecurity: [{ key: 'cnas', label: 'CNAS (9%)', rate: 0.09 }],
  employerSS: [{ key: 'cnas', label: 'CNAS (26%)', rate: 0.26 }]
});
