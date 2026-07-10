// Uganda PAYE — Source: Uganda Revenue Authority (URA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'UG', countryName: 'Uganda', currency: 'UGX',
  source: 'Uganda Revenue Authority (URA)',
  isMonthly: true,
  bands: [[335000,0],[75000,0.20],[75000,0.25],[9515000,0.30],[Infinity,0.40]], // FY 2026/27, effective 1 Jul 2026
  personalRelief: 0,
  socialSecurity: [{ key: 'nssf', label: 'NSSF (5%)', rate: 0.05 }],
  employerSS: [{ key: 'nssf', label: 'NSSF (10%)', rate: 0.10 }]
});
