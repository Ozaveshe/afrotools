// Burkina Faso PAYE (IUTS) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'BF', countryName: 'Burkina Faso', currency: 'XOF',
  source: 'Direction Générale des Impôts (DGI)',
  isMonthly: true,
  bands: [[30000,0],[20000,0.1225],[15000,0.15],[50000,0.20],[Infinity,0.25]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (5.5%)', rate: 0.055 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (16%)', rate: 0.16 }]
});
