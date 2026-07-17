// Burkina Faso PAYE (IUTS) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'BF', countryName: 'Burkina Faso', currency: 'XOF',
  source: 'Direction Générale des Impôts (DGI)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-07-01',
  nextReviewDate: '2025-09-29',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[30000,0],[20000,0.1225],[15000,0.15],[50000,0.20],[Infinity,0.25]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (5.5%)', rate: 0.055 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (16%)', rate: 0.16 }]
});
