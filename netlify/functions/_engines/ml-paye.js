// Mali PAYE (ITS) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'ML', countryName: 'Mali', currency: 'XOF',
  source: 'Direction Générale des Impôts (DGI)',
  bands: [[300000,0],[600000,0.05],[1200000,0.13],[1800000,0.30],[Infinity,0.40]],
  socialSecurity: [{ key: 'inps', label: 'INPS (3.6%)', rate: 0.036 }],
  employerSS: [{ key: 'inps', label: 'INPS (20.4%)', rate: 0.204 }]
});
