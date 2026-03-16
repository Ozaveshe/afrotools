// Eritrea PAYE — Source: Inland Revenue Department
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'ER', countryName: 'Eritrea', currency: 'ERN',
  source: 'Inland Revenue Department',
  isMonthly: true,
  bands: [[600,0.02],[1200,0.10],[4800,0.15],[7200,0.20],[21600,0.25],[Infinity,0.30]],
  socialSecurity: [],
  employerSS: []
});
