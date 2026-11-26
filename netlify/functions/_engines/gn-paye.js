// Guinea PAYE (ITS) — Source: Direction Nationale des Impôts (DNI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'GN', countryName: 'Guinea', currency: 'GNF',
  source: 'Direction Nationale des Impôts (DNI); CNSS employer contribution base and rates',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-11-26',
  sourceCheckedOn: '2026-04-01',
  nextReviewDate: '2026-06-30',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[1000000,0],[5000000,0.10],[10000000,0.15],[Infinity,0.25]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (5%)', rate: 0.05, baseFloor: 550000, baseCap: 2500000 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (18%)', rate: 0.18, baseFloor: 550000, baseCap: 2500000 }]
});
