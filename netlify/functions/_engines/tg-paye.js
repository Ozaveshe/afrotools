// Togo PAYE (IRPP) — Source: Office Togolais des Recettes (OTR)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'TG', countryName: 'Togo', currency: 'XOF',
  source: 'Office Togolais des Recettes (OTR)',
  bands: [[900000,0],[1500000,0.07],[2700000,0.15],[4200000,0.25],[Infinity,0.35]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (4%)', rate: 0.04 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (17.5%)', rate: 0.175 }]
});
