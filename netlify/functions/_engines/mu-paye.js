// Mauritius PAYE — Source: Mauritius Revenue Authority (MRA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'MU', countryName: 'Mauritius', currency: 'MUR',
  source: 'Mauritius Revenue Authority (MRA)',
  bands: [[390000,0],[260000,0.02],[340000,0.04],[375000,0.06],[475000,0.08],[1660000,0.12],[Infinity,0.20]],
  socialSecurity: [
    { key: 'nps', label: 'NPF/NSF (4%)', rate: 0.04 },
    { key: 'csg', label: 'CSG (3%)', rate: 0.03 }
  ],
  employerSS: [
    { key: 'nps', label: 'NPF/NSF (6%)', rate: 0.06 },
    { key: 'csg', label: 'CSG (6%)', rate: 0.06 }
  ]
});
