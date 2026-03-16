// Libya PAYE — Source: Tax Authority of Libya
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'LY', countryName: 'Libya', currency: 'LYD',
  source: 'Tax Authority of Libya',
  bands: [[12000,0.05],[20000,0.10],[Infinity,0.15]],
  socialSecurity: [{ key: 'ssf', label: 'Social Security (3.75%)', rate: 0.0375 }],
  employerSS: [{ key: 'ssf', label: 'Social Security (11.25%)', rate: 0.1125 }]
});
