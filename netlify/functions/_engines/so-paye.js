// Somalia — No formal PAYE system in place
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'SO', countryName: 'Somalia', currency: 'SOS',
  source: 'Federal Government of Somalia',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-06',
  nextReviewDate: '2026-07-05',
  /* source-confidence-stamp:end */

  bands: [[Infinity, 0]], // No income tax
  socialSecurity: [],
  employerSS: []
});
