// Congo (Republic) PAYE (IRPP) — Source: Direction Générale des Impôts et des Domaines
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'CG', countryName: 'Republic of the Congo', currency: 'XAF',
  source: 'Direction Générale des Impôts et des Domaines',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-03-28',
  nextReviewDate: '2026-06-26',
  /* source-confidence-stamp:end */

  bands: [[464000,0],[1000000,0.01],[3000000,0.10],[8000000,0.25],[Infinity,0.40]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (4%)', rate: 0.04 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (20.29%)', rate: 0.2029 }]
});
