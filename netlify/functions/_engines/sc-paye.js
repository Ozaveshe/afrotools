// Seychelles PAYE — Source: Seychelles Revenue Commission (SRC)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'SC', countryName: 'Seychelles', currency: 'SCR',
  source: 'Seychelles Revenue Commission (SRC)',
  isMonthly: true,
  bands: [[8555.50,0],[Infinity,0.15]],
  socialSecurity: [],
  employerSS: [{ key: 'pension', label: 'Pension Fund (2%)', rate: 0.02 }]
});
