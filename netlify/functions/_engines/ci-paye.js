// Ivory Coast PAYE (ITS) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'CI', countryName: 'Ivory Coast', currency: 'XOF',
  source: 'Direction Générale des Impôts (DGI)',
  bands: [[300000,0],[3884000,0.10],[7500000,0.15],[13750000,0.20],[24166667,0.25],[41666667,0.35],[Infinity,0.45]],
  socialSecurity: [{ key: 'cnps', label: 'CNPS (6.3%)', rate: 0.063 }],
  employerSS: [{ key: 'cnps', label: 'CNPS (15.75%)', rate: 0.1575 }]
});
