// Niger PAYE (IUTS) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'NE', countryName: 'Niger', currency: 'XOF',
  source: 'Direction Générale des Impôts (DGI)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-07-01',
  nextReviewDate: '2025-09-29',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[25000,0],[15000,0.02],[30000,0.10],[30000,0.15],[50000,0.20],[Infinity,0.35]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (5.25%)', rate: 0.0525 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (16.5%)', rate: 0.165 }]
});
