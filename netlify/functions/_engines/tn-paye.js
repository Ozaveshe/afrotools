// Tunisia PAYE (IRPP) — Source: Direction Générale des Impôts
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'TN', countryName: 'Tunisia', currency: 'TND',
  source: 'Direction Générale des Impôts',
  bands: [[5000,0],[15000,0.26],[15000,0.28],[15000,0.32],[Infinity,0.35]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (9.18%)', rate: 0.0918 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (16.57%)', rate: 0.1657 }]
});
