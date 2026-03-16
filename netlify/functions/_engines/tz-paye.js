// Tanzania PAYE — Source: Tanzania Revenue Authority (TRA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'TZ', countryName: 'Tanzania', currency: 'TZS',
  source: 'Tanzania Revenue Authority (TRA)',
  isMonthly: true,
  bands: [[270000,0],[240000,0.08],[360000,0.20],[360000,0.25],[Infinity,0.30]],
  socialSecurity: [{ key: 'nssf', label: 'NSSF (10%)', rate: 0.10 }],
  employerSS: [{ key: 'nssf', label: 'NSSF (10%)', rate: 0.10 }]
});
