// Cameroon PAYE (IRPP) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'CM', countryName: 'Cameroon', currency: 'XAF',
  source: 'Direction Générale des Impôts (DGI)',
  bands: [[2000000,0.10],[3000000,0.15],[5000000,0.25],[Infinity,0.35]],
  socialSecurity: [{ key: 'cnps', label: 'CNPS (4.2%)', rate: 0.042 }],
  employerSS: [{ key: 'cnps', label: 'CNPS (11.2%)', rate: 0.112 }]
});
