// Namibia PAYE — Source: Namibia Revenue Agency (NamRA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'NA', countryName: 'Namibia', currency: 'NAD',
  source: 'Namibia Revenue Agency (NamRA)',
  bands: [[50000,0],[50000,0.18],[100000,0.25],[200000,0.28],[600000,0.30],[600000,0.32],[Infinity,0.37]],
  socialSecurity: [{ key: 'ssf', label: 'Social Security (0.9%)', rate: 0.009, cap: 81 * 12 }],
  employerSS: [{ key: 'ssf', label: 'Social Security (0.9%)', rate: 0.009, cap: 81 * 12 }]
});
