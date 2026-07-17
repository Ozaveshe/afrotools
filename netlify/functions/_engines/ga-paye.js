// Gabon PAYE (IRPP) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'GA', countryName: 'Gabon', currency: 'XAF',
  source: 'Direction Générale des Impôts (DGI)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-01',
  nextReviewDate: '2026-06-30',
  /* source-confidence-stamp:end */

  bands: [[1500000,0],[1920000,0.05],[2500000,0.10],[3750000,0.15],[7500000,0.20],[Infinity,0.35]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (2.5%)', rate: 0.025 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (20.1%)', rate: 0.201 }]
});
