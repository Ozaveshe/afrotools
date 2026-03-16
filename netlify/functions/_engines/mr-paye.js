// Mauritania PAYE (ITS) — Source: Direction Générale des Impôts
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'MR', countryName: 'Mauritania', currency: 'MRU',
  source: 'Direction Générale des Impôts',
  bands: [[60000,0.15],[90000,0.25],[Infinity,0.40]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (1%)', rate: 0.01 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (15%)', rate: 0.15 }]
});
