// Rwanda PAYE — Source: Rwanda Revenue Authority (RRA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'RW', countryName: 'Rwanda', currency: 'RWF',
  source: 'Rwanda Revenue Authority (RRA)',
  bands: [[720000,0],[4320000,0.20],[Infinity,0.30]],
  socialSecurity: [
    { key: 'pension', label: 'RSSB Pension (6%)', rate: 0.06 },
    { key: 'maternity', label: 'Maternity (0.3%)', rate: 0.003 }
  ],
  employerSS: [
    { key: 'pension', label: 'RSSB Pension (6%)', rate: 0.06 },
    { key: 'maternity', label: 'Maternity (0.3%)', rate: 0.003 }
  ]
});
