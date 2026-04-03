// Botswana PAYE — Source: Botswana Unified Revenue Service (BURS)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'BW', countryName: 'Botswana', currency: 'BWP',
  source: 'Botswana Unified Revenue Service (BURS)',
  bands: [[48000,0],[36000,0.05],[36000,0.125],[36000,0.1875],[Infinity,0.25]],
  socialSecurity: [],
  employerSS: []
});
