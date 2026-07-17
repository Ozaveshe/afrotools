// Sierra Leone PAYE — Source: National Revenue Authority (NRA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'SL', countryName: 'Sierra Leone', currency: 'SLE',
  source: 'National Revenue Authority (NRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-01',
  nextReviewDate: '2026-06-30',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[600000,0],[500000,0.15],[500000,0.20],[500000,0.25],[Infinity,0.30]],
  socialSecurity: [{ key: 'nassit', label: 'NASSIT (5%)', rate: 0.05 }],
  employerSS: [{ key: 'nassit', label: 'NASSIT (10%)', rate: 0.10 }]
});
