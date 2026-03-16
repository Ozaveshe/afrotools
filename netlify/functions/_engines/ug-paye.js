// Uganda PAYE — Source: Uganda Revenue Authority (URA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'UG', countryName: 'Uganda', currency: 'UGX',
  source: 'Uganda Revenue Authority (URA)',
  isMonthly: true,
  bands: [[235000,0],[100000,0.10],[250000,0.20],[Infinity,0.30]],
  personalRelief: 0,
  socialSecurity: [{ key: 'nssf', label: 'NSSF (5%)', rate: 0.05 }],
  employerSS: [{ key: 'nssf', label: 'NSSF (10%)', rate: 0.10 }]
});
