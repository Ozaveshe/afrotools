// Libya PAYE — Source: PwC Tax Summaries (Dec 2025), Tax Authority of Libya
// Jihad Tax abolished Feb/Jul 2025 (Law 44 of 1970 declared unconstitutional)
// SS rates updated Jun 2022 per Mercans statutory alert
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'LY', countryName: 'Libya', currency: 'LYD',
  source: 'Tax Authority of Libya / PwC',
  bands: [[12000,0.05],[Infinity,0.10]],
  socialSecurity: [
    { key: 'ssf', label: 'Social Security (5.125%)', rate: 0.05125 },
    { key: 'suf', label: 'Social Unity Fund (1%)', rate: 0.01 }
  ],
  employerSS: [{ key: 'ssf', label: 'Social Security (14.35%)', rate: 0.1435 }]
});
