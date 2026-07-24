// Liberia PAYE — Sources: Liberia Revenue Authority resident natural-person table
// and the NASSCORP employer guide. PIT is assessed on annual gross income, while
// NASSCORP remains a separate employee deduction and employer cost.
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'LR', countryName: 'Liberia', currency: 'LRD',
  source: 'Liberia Revenue Authority (LRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-07-21',
  nextReviewDate: '2026-10-31',
  /* source-confidence-stamp:end */

  bands: [[70000,0],[130000,0.05],[600000,0.15],[Infinity,0.25]],
  ssDeductibleFromTaxable: false,
  socialSecurity: [{ key: 'nasscorp', label: 'NASSCORP (4%)', rate: 0.04 }],
  employerSS: [{ key: 'nasscorp', label: 'NASSCORP (6%)', rate: 0.06 }]
});
