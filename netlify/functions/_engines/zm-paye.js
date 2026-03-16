// Zambia PAYE — Source: Zambia Revenue Authority (ZRA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'ZM', countryName: 'Zambia', currency: 'ZMW',
  source: 'Zambia Revenue Authority (ZRA)',
  isMonthly: true,
  bands: [[5100,0],[1200,0.20],[2700,0.30],[Infinity,0.37]],
  socialSecurity: [
    { key: 'napsa', label: 'NAPSA (5%)', rate: 0.05 },
    { key: 'nhima', label: 'NHIMA (1%)', rate: 0.01 }
  ],
  employerSS: [
    { key: 'napsa', label: 'NAPSA (5%)', rate: 0.05 },
    { key: 'nhima', label: 'NHIMA (1%)', rate: 0.01 }
  ]
});
