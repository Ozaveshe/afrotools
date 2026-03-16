// Ethiopia PAYE — Source: Ethiopian Revenues & Customs Authority (ERCA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'ET', countryName: 'Ethiopia', currency: 'ETB',
  source: 'Ethiopian Revenues & Customs Authority (ERCA)',
  isMonthly: true,
  bands: [[600,0],[1650,0.10],[2700,0.15],[5000,0.20],[10000,0.25],[25000,0.30],[Infinity,0.35]],
  socialSecurity: [{ key: 'pension', label: 'Pension (7%)', rate: 0.07 }],
  employerSS: [{ key: 'pension', label: 'Pension (11%)', rate: 0.11 }]
});
