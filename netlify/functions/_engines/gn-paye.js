// Guinea PAYE (ITS) — Source: Direction Nationale des Impôts (DNI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'GN', countryName: 'Guinea', currency: 'GNF',
  source: 'Direction Nationale des Impôts (DNI)',
  isMonthly: true,
  bands: [[1000000,0],[5000000,0.10],[10000000,0.15],[Infinity,0.25]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (5%)', rate: 0.05 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (18%)', rate: 0.18 }]
});
