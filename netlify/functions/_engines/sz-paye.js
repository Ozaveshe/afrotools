// Eswatini PAYE — Source: Eswatini Revenue Authority (ERA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'SZ', countryName: 'Eswatini', currency: 'SZL',
  source: 'Eswatini Revenue Authority (ERA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-11-26',
  sourceCheckedOn: '2026-11-26',
  nextReviewDate: '2027-02-24',
  /* source-confidence-stamp:end */

  personalRelief: 8200,
  bands: [[100000,0.20],[50000,0.25],[50000,0.30],[Infinity,0.33]],
  socialSecurity: [{ key: 'enpf', label: 'ENPF (5%)', rate: 0.05, cap: 215 }],
  employerSS: [{ key: 'enpf', label: 'ENPF (5%)', rate: 0.05, cap: 215 }]
});
