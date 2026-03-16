// Malawi PAYE — Source: Malawi Revenue Authority (MRA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'MW', countryName: 'Malawi', currency: 'MWK',
  source: 'Malawi Revenue Authority (MRA)',
  isMonthly: true,
  bands: [[100000,0],[150000,0.25],[2750000,0.30],[Infinity,0.35]],
  socialSecurity: [],
  employerSS: []
});
