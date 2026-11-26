// Sierra Leone PAYE — Source: National Revenue Authority (NRA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'SL', countryName: 'Sierra Leone', currency: 'SLE',
  source: 'National Revenue Authority (NRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-11-26',
  sourceCheckedOn: '2026-11-26',
  nextReviewDate: '2027-02-24',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[600, 0], [600, 0.15], [600, 0.20], [600, 0.25], [Infinity, 0.30]],
  socialSecurity: [{ key: 'nassit', label: 'NASSIT (5%)', rate: 0.05 }],
  employerSS: [{ key: 'nassit', label: 'NASSIT (10%)', rate: 0.10 }]
});
