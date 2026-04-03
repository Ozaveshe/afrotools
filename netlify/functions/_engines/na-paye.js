// Namibia PAYE — Source: Namibia Revenue Agency (NamRA), Mar 2025–Feb 2026
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'NA', countryName: 'Namibia', currency: 'NAD',
  source: 'Namibia Revenue Agency (NamRA)',
  bands: [[100000,0],[50000,0.18],[200000,0.25],[200000,0.28],[300000,0.30],[700000,0.32],[Infinity,0.37]],
  socialSecurity: [{ key: 'ssc', label: 'SSC (0.9%)', rate: 0.009, cap: 99 }],
  employerSS: [{ key: 'ssc', label: 'SSC (0.9%)', rate: 0.009, cap: 99 }]
});
