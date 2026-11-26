// Burundi PAYE (IPR) — Source: Office Burundais des Recettes (OBR)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'BI', countryName: 'Burundi', currency: 'BIF',
  source: 'Office Burundais des Recettes (OBR)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-11-26',
  sourceCheckedOn: '2026-11-26',
  nextReviewDate: '2027-02-24',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[150000, 0], [150000, 0.20], [Infinity, 0.30]],
  socialSecurity: [{ key: 'inss', label: 'INSS (4%)', rate: 0.04, baseCap: 450000 }],
  employerSS: [
    { key: 'inss', label: 'INSS pension (6%)', rate: 0.06, baseCap: 450000 },
    { key: 'occupationalRisk', label: 'INSS occupational risk (3%)', rate: 0.03, baseCap: 80000 }
  ]
});
