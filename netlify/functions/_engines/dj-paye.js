// Djibouti PAYE (ITS) — Source: Direction des Impôts
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'DJ', countryName: 'Djibouti', currency: 'DJF',
  source: 'Direction des Impôts',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-06',
  nextReviewDate: '2026-07-05',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[30000,0.02],[20000,0.15],[45000,0.18],[Infinity,0.30]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (4%)', rate: 0.04 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (15.7%)', rate: 0.157 }]
});
