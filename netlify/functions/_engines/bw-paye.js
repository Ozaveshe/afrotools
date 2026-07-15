// Botswana PAYE — Source: Botswana Unified Revenue Service (BURS)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'BW', countryName: 'Botswana', currency: 'BWP',
  source: 'Botswana Unified Revenue Service (BURS)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-07-01',
  nextReviewDate: '2025-09-29',
  /* source-confidence-stamp:end */

  bands: [[48000,0],[36000,0.05],[36000,0.125],[36000,0.1875],[Infinity,0.25]],
  socialSecurity: [],
  employerSS: []
});
