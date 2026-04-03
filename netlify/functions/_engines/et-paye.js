// Ethiopia PAYE — Source: ERCA, Proclamation No. 1395/2025
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'ET', countryName: 'Ethiopia', currency: 'ETB',
  source: 'Ethiopian Revenues & Customs Authority (ERCA)',
  isMonthly: true,
  bands: [[2000,0],[2000,0.15],[3000,0.20],[3000,0.25],[4000,0.30],[Infinity,0.35]],
  socialSecurity: [{ key: 'pension', label: 'Pension (7%)', rate: 0.07 }],
  employerSS: [{ key: 'pension', label: 'Pension (11%)', rate: 0.11 }]
});
