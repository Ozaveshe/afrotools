// Comoros PAYE (IRPP) — Source: Direction Générale des Impôts
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'KM', countryName: 'Comoros', currency: 'KMF',
  source: 'Direction Générale des Impôts',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-06',
  nextReviewDate: '2026-07-05',
  /* source-confidence-stamp:end */

  bands: [[500000,0],[500000,0.10],[1000000,0.20],[Infinity,0.30]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (2.5%)', rate: 0.025 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (12.5%)', rate: 0.125 }]
});
