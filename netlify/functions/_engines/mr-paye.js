// Mauritania PAYE (ITS) — Source: Direction Générale des Impôts
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'MR', countryName: 'Mauritania', currency: 'MRU',
  source: 'Direction Générale des Impôts',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-01',
  nextReviewDate: '2026-06-30',
  /* source-confidence-stamp:end */

  bands: [[60000,0.15],[90000,0.25],[Infinity,0.40]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (1%)', rate: 0.01 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (15%)', rate: 0.15 }]
});
