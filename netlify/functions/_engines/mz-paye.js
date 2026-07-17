// Mozambique PAYE (IRPS) — Source: Autoridade Tributaria (AT), CIRPS Art. 54
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'MZ', countryName: 'Mozambique', currency: 'MZN',
  source: 'Autoridade Tributaria de Mocambique (AT)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-06',
  nextReviewDate: '2026-07-05',
  /* source-confidence-stamp:end */

  bands: [[42000,0.10],[126000,0.15],[336000,0.20],[1008000,0.25],[Infinity,0.32]],
  socialSecurity: [{ key: 'inss', label: 'INSS (3%)', rate: 0.03 }],
  employerSS: [{ key: 'inss', label: 'INSS (4%)', rate: 0.04 }]
});
