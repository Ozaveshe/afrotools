// Senegal PAYE (IR) — Source: Direction Générale des Impôts et des Domaines (DGID)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'SN', countryName: 'Senegal', currency: 'XOF',
  source: 'Direction Générale des Impôts et des Domaines (DGID)',
  bands: [[630000,0],[1500000,0.20],[4000000,0.30],[8000000,0.35],[13500000,0.37],[Infinity,0.40]],
  socialSecurity: [{ key: 'ipres', label: 'IPRES (5.6%)', rate: 0.056 }],
  employerSS: [{ key: 'ipres', label: 'IPRES (8.4%)', rate: 0.084 }]
});
