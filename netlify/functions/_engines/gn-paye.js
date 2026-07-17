// Guinea PAYE (ITS) — Source: Direction Nationale des Impôts (DNI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'GN', countryName: 'Guinea', currency: 'GNF',
  source: 'Direction Nationale des Impôts (DNI)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-01',
  nextReviewDate: '2026-06-30',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[1000000,0],[5000000,0.10],[10000000,0.15],[Infinity,0.25]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (5%)', rate: 0.05 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (18%)', rate: 0.18 }]
});
