// Egypt PAYE — Source: Egyptian Tax Authority (ETA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'EG', countryName: 'Egypt', currency: 'EGP',
  source: 'Egyptian Tax Authority (ETA)',
  bands: [[40000,0],[55000,0.10],[45000,0.15],[200000,0.20],[600000,0.225],[Infinity,0.25]],
  socialSecurity: [{ key: 'socialIns', label: 'Social Insurance (11%)', rate: 0.11, cap: 12600 }],
  employerSS: [{ key: 'socialIns', label: 'Social Insurance (18.75%)', rate: 0.1875, cap: 12600 }]
});
