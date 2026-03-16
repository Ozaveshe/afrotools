// Somalia — No formal PAYE system in place
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'SO', countryName: 'Somalia', currency: 'SOS',
  source: 'Federal Government of Somalia',
  bands: [[Infinity, 0]], // No income tax
  socialSecurity: [],
  employerSS: []
});
