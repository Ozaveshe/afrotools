// Mauritius PAYE — Source: MRA, Budget 2025/26 (income year ending 30 Jun 2026)
// 2025/26 budget simplified from 7-band to 3-band system, threshold raised to Rs 500,000
// CSG tiered: 1.5% if salary ≤ Rs 50k/mo, 3% if > Rs 50k/mo — using 3% (most PAYE payers)
// NSF: 2.5% employee, 2.5% employer
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'MU', countryName: 'Mauritius', currency: 'MUR',
  source: 'Mauritius Revenue Authority (MRA)',
  bands: [[500000,0],[500000,0.10],[Infinity,0.20]],
  socialSecurity: [
    { key: 'csg', label: 'CSG (3%)', rate: 0.03 },
    { key: 'nsf', label: 'NSF (2.5%)', rate: 0.025 }
  ],
  employerSS: [
    { key: 'csg', label: 'CSG (6%)', rate: 0.06 },
    { key: 'nsf', label: 'NSF (2.5%)', rate: 0.025 }
  ]
});
