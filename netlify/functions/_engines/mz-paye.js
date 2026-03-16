// Mozambique PAYE (IRPS) — Source: Autoridade Tributária (AT)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'MZ', countryName: 'Mozambique', currency: 'MZN',
  source: 'Autoridade Tributária de Moçambique (AT)',
  bands: [[42000,0],[42000,0.10],[168000,0.15],[588000,0.20],[Infinity,0.32]],
  socialSecurity: [{ key: 'inss', label: 'INSS (3%)', rate: 0.03 }],
  employerSS: [{ key: 'inss', label: 'INSS (4%)', rate: 0.04 }]
});
