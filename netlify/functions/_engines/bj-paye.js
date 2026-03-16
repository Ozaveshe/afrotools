// Benin PAYE (IPTS) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'BJ', countryName: 'Benin', currency: 'XOF',
  source: 'Direction Générale des Impôts (DGI)',
  bands: [[60000,0],[150000,0.10],[250000,0.15],[500000,0.19],[Infinity,0.30]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (3.6%)', rate: 0.036 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (15.4%)', rate: 0.154 }]
});
