// Lesotho PAYE — Source: Lesotho Revenue Authority (LRA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'LS', countryName: 'Lesotho', currency: 'LSL',
  source: 'Lesotho Revenue Authority (LRA)',
  bands: [[78120,0.20],[Infinity,0.30]],
  socialSecurity: [],
  employerSS: []
});
