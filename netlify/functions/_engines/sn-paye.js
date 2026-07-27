// Senegal PAYE (IR) — sources reviewed for French product Wave 1.
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'SN', countryName: 'Senegal', currency: 'XOF',
  source: 'Ministère des Finances du Sénégal (2025) and DGTSS (2024)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-07-27',
  sourceCheckedOn: '2026-07-27',
  nextReviewDate: '2026-10-27',
  /* source-confidence-stamp:end */

  // Progressive widths representing thresholds at 630k, 1.5m, 4m, 8m,
  // 13.5m and 25m XOF. The final band is 43%.
  bands: [[630000,0],[870000,0.20],[2500000,0.30],[4000000,0.35],[5500000,0.37],[11500000,0.40],[Infinity,0.43]],
  socialSecurity: [{ key: 'ipres', label: 'IPRES (5.6%)', rate: 0.056, baseCap: 432000 }],
  employerSS: [{ key: 'ipres', label: 'IPRES (8.4%)', rate: 0.084, baseCap: 432000 }]
});
