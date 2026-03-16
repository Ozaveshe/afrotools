// Gabon PAYE (IRPP) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'GA', countryName: 'Gabon', currency: 'XAF',
  source: 'Direction Générale des Impôts (DGI)',
  bands: [[1500000,0],[1920000,0.05],[2500000,0.10],[3750000,0.15],[7500000,0.20],[Infinity,0.35]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (2.5%)', rate: 0.025 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (20.1%)', rate: 0.201 }]
});
