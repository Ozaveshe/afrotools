// Egypt PAYE — Source: Egyptian Tax Authority (ETA)
// Bands: 0% first 40K → 10% to 55K → 15% to 70K → 20% to 200K → 22.5% to 400K → 25% to 800K → 27.5% above
// Social insurance: 11% employee on insurable salary (capped ~EGP 12,600/mo = 151,200/yr)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'EG', countryName: 'Egypt', currency: 'EGP',
  source: 'Egyptian Tax Authority (ETA)',
  bands: [[40000,0],[15000,0.10],[15000,0.15],[130000,0.20],[200000,0.225],[400000,0.25],[Infinity,0.275]],
  socialSecurity: [{ key: 'socialIns', label: 'Social Insurance (11%)', rate: 0.11, cap: 12600 }],
  employerSS: [{ key: 'socialIns', label: 'Social Insurance (18.75%)', rate: 0.1875, cap: 12600 }]
});
