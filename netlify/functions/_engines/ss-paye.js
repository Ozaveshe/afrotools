// South Sudan PAYE — Source: NRA, Financial Act 2023/2024, KPMG (unchanged for 2024/2025)
// Tax-exempt threshold raised from SSP 5,000 to SSP 20,000/month per Financial Act 2023/2024
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'SS', countryName: 'South Sudan', currency: 'SSP',
  source: 'National Revenue Authority (NRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-06',
  nextReviewDate: '2026-07-05',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[20000,0],[20000,0.10],[17000,0.15],[Infinity,0.20]],
  socialSecurity: [{ key: 'nsif', label: 'NSIF (8%)', rate: 0.08 }],
  employerSS: [{ key: 'nsif', label: 'NSIF (17%)', rate: 0.17 }]
});
