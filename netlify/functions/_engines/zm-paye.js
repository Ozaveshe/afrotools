// Zambia PAYE — Source: Zambia Revenue Authority (ZRA), 2025 charge year
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'ZM', countryName: 'Zambia', currency: 'ZMW',
  source: 'Zambia Revenue Authority (ZRA)',
  isMonthly: true,
  bands: [[5100,0],[2000,0.20],[2100,0.30],[Infinity,0.37]],
  socialSecurity: [
    { key: 'napsa', label: 'NAPSA (5%)', rate: 0.05, cap: 1708.20 },
    { key: 'nhima', label: 'NHIMA (1%)', rate: 0.01 }
  ],
  employerSS: [
    { key: 'napsa', label: 'NAPSA (5%)', rate: 0.05, cap: 1708.20 },
    { key: 'nhima', label: 'NHIMA (1%)', rate: 0.01 }
  ]
});
