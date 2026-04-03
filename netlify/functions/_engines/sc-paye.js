// Seychelles PAYE — Source: Seychelles Revenue Commission (SRC), src.gov.sc
// 4 progressive monthly bands (citizens): 0%/15%/20%/30%, effective 1 Jun 2018
// SPF pension: 5% employee + 5% employer (since 1 Jan 2023)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'SC', countryName: 'Seychelles', currency: 'SCR',
  source: 'Seychelles Revenue Commission (SRC)',
  isMonthly: true,
  bands: [[8555.50,0],[1444.50,0.15],[73333,0.20],[Infinity,0.30]],
  socialSecurity: [{ key: 'spf', label: 'SPF Pension (5%)', rate: 0.05 }],
  employerSS: [{ key: 'spf', label: 'SPF Pension (5%)', rate: 0.05 }]
});
