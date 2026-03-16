// São Tomé and Príncipe PAYE (IRS) — Source: Direcção dos Impostos
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'ST', countryName: 'São Tomé and Príncipe', currency: 'STN',
  source: 'Direcção dos Impostos',
  bands: [[18000000,0.10],[60000000,0.15],[Infinity,0.25]],
  socialSecurity: [{ key: 'inss', label: 'INSS (6%)', rate: 0.06 }],
  employerSS: [{ key: 'inss', label: 'INSS (10%)', rate: 0.10 }]
});
