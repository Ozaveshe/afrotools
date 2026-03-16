// Sudan PAYE — Source: Taxation Chamber
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'SD', countryName: 'Sudan', currency: 'SDG',
  source: 'Taxation Chamber',
  bands: [[Infinity,0.15]],  // Flat 15% rate
  socialSecurity: [{ key: 'nssf', label: 'Social Insurance (8%)', rate: 0.08 }],
  employerSS: [{ key: 'nssf', label: 'Social Insurance (17%)', rate: 0.17 }]
});
