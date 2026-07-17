// Tanzania PAYE — Source: Tanzania Revenue Authority (TRA)
// Monthly bands: 0% first 270K → 8% to 520K → 20% to 760K → 25% to 1M → 30% above
// NSSF: 10% employee, 10% employer
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'TZ', countryName: 'Tanzania', currency: 'TZS',
  source: 'Tanzania Revenue Authority (TRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-07-01',
  nextReviewDate: '2025-09-29',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[270000,0],[250000,0.08],[240000,0.20],[240000,0.25],[Infinity,0.30]],
  socialSecurity: [{ key: 'nssf', label: 'NSSF (10%)', rate: 0.10 }],
  employerSS: [{ key: 'nssf', label: 'NSSF (10%)', rate: 0.10 }]
});
