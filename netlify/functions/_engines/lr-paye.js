// Liberia PAYE — Source: Liberia Revenue Authority (LRA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'LR', countryName: 'Liberia', currency: 'LRD',
  source: 'Liberia Revenue Authority (LRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-01',
  nextReviewDate: '2026-06-30',
  /* source-confidence-stamp:end */

  bands: [[70000,0.02],[20000,0.05],[30000,0.10],[40000,0.15],[Infinity,0.25]],
  socialSecurity: [{ key: 'nassit', label: 'NASSIT (4%)', rate: 0.04 }],
  employerSS: [{ key: 'nassit', label: 'NASSIT (6%)', rate: 0.06 }]
});
