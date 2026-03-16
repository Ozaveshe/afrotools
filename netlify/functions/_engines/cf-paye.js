// Central African Republic PAYE (IRPP) — Source: Direction Générale des Impôts et des Domaines
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'CF', countryName: 'Central African Republic', currency: 'XAF',
  source: 'Direction Générale des Impôts et des Domaines',
  bands: [[300000,0],[1200000,0.08],[3000000,0.15],[5000000,0.25],[8000000,0.35],[Infinity,0.50]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (3%)', rate: 0.03 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (17%)', rate: 0.17 }]
});
