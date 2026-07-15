// Eritrea PAYE — Source: Inland Revenue Department
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'ER', countryName: 'Eritrea', currency: 'ERN',
  source: 'Inland Revenue Department',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-03-28',
  nextReviewDate: '2026-06-26',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[600,0.02],[1200,0.10],[4800,0.15],[7200,0.20],[21600,0.25],[Infinity,0.30]],
  socialSecurity: [],
  employerSS: []
});
