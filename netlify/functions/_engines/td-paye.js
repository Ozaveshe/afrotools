// Chad PAYE (IRPP) — Source: Direction Générale des Impôts
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'TD', countryName: 'Chad', currency: 'XAF',
  source: 'Direction Générale des Impôts',
  bands: [[300000,0],[500000,0.10],[1000000,0.15],[2000000,0.20],[5000000,0.25],[Infinity,0.35]],
  socialSecurity: [{ key: 'cnps', label: 'CNPS (3.5%)', rate: 0.035 }],
  employerSS: [{ key: 'cnps', label: 'CNPS (16.5%)', rate: 0.165 }]
});
