// Madagascar PAYE (IRSA) — Source: Direction Générale des Impôts
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'MG', countryName: 'Madagascar', currency: 'MGA',
  source: 'Direction Générale des Impôts',
  bands: [[350000,0],[250000,0.05],[250000,0.10],[7150000,0.15],[Infinity,0.20]],
  socialSecurity: [{ key: 'cnaps', label: 'CNaPS (1%)', rate: 0.01 }],
  employerSS: [{ key: 'cnaps', label: 'CNaPS (13%)', rate: 0.13 }]
});
