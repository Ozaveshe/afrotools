// Cameroon PAYE (IRPP) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'CM', countryName: 'Cameroon', currency: 'XAF',
  source: 'Direction Générale des Impôts (DGI)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-01',
  nextReviewDate: '2026-06-30',
  /* source-confidence-stamp:end */

  bands: [[2000000,0.10],[3000000,0.15],[5000000,0.25],[Infinity,0.35]],
  socialSecurity: [{ key: 'cnps', label: 'CNPS (4.2%)', rate: 0.042 }],
  employerSS: [{ key: 'cnps', label: 'CNPS (11.2%)', rate: 0.112 }]
});
