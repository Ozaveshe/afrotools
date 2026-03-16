// South Sudan PAYE — Source: National Revenue Authority (NRA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'SS', countryName: 'South Sudan', currency: 'SSP',
  source: 'National Revenue Authority (NRA)',
  isMonthly: true,
  bands: [[30000,0.10],[Infinity,0.15]],
  socialSecurity: [{ key: 'nssf', label: 'NSSF (8%)', rate: 0.08 }],
  employerSS: [{ key: 'nssf', label: 'NSSF (17%)', rate: 0.17 }]
});
