// DRC PAYE (IPR) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'CD', countryName: 'DR Congo', currency: 'CDF',
  source: 'Direction Générale des Impôts (DGI)',
  bands: [[524160,0.03],[1572480,0.05],[2620800,0.10],[5241600,0.20],[10483200,0.30],[17472000,0.35],[24460800,0.40],[Infinity,0.45]],
  socialSecurity: [{ key: 'inss', label: 'INSS (5%)', rate: 0.05 }],
  employerSS: [{ key: 'inss', label: 'INSS (9.5%)', rate: 0.095 }]
});
