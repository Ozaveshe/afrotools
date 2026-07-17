// Angola PAYE (IRT) — Source: Administração Geral Tributária (AGT)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'AO', countryName: 'Angola', currency: 'AOA',
  source: 'Administração Geral Tributária (AGT)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-03-26',
  nextReviewDate: '2026-06-24',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[70000,0],[30000,0.10],[50000,0.13],[100000,0.16],[250000,0.18],[2500000,0.19],[5000000,0.20],[10000000,0.21],[Infinity,0.22]],
  socialSecurity: [{ key: 'inss', label: 'INSS (3%)', rate: 0.03 }],
  employerSS: [{ key: 'inss', label: 'INSS (8%)', rate: 0.08 }]
});
