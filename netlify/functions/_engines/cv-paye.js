// Cape Verde PAYE (IUR) — Source: Direcção Nacional de Receitas do Estado (DNRE)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'CV', countryName: 'Cape Verde', currency: 'CVE',
  source: 'Direcção Nacional de Receitas do Estado (DNRE)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-07-01',
  nextReviewDate: '2025-09-29',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[65000,0],[15000,0.165],[20000,0.235],[Infinity,0.35]],
  socialSecurity: [{ key: 'inps', label: 'INPS (8.5%)', rate: 0.085 }],
  employerSS: [{ key: 'inps', label: 'INPS (16%)', rate: 0.16 }]
});
