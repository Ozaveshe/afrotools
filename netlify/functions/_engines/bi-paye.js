// Burundi PAYE (IPR) — Source: Office Burundais des Recettes (OBR)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'BI', countryName: 'Burundi', currency: 'BIF',
  source: 'Office Burundais des Recettes (OBR)',
  bands: [[150000,0],[150000,0.20],[1800000,0.30],[Infinity,0.35]],
  socialSecurity: [{ key: 'inss', label: 'INSS (4%)', rate: 0.04 }],
  employerSS: [{ key: 'inss', label: 'INSS (6%)', rate: 0.06 }]
});
