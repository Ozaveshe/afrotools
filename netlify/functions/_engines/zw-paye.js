// Zimbabwe PAYE — Source: Zimbabwe Revenue Authority (ZIMRA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'ZW', countryName: 'Zimbabwe', currency: 'ZWL',
  source: 'Zimbabwe Revenue Authority (ZIMRA)',
  bands: [[1200000,0],[3600000,0.20],[6000000,0.25],[12000000,0.30],[Infinity,0.40]],
  socialSecurity: [
    { key: 'nssa', label: 'NSSA (4.5%)', rate: 0.045 },
    { key: 'aids', label: 'AIDS Levy (3%)', rate: 0.03 }
  ],
  employerSS: [{ key: 'nssa', label: 'NSSA (4.5%)', rate: 0.045 }]
});
