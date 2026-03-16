// Morocco PAYE (IR) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'MA', countryName: 'Morocco', currency: 'MAD',
  source: 'Direction Générale des Impôts (DGI)',
  bands: [[30000,0],[20000,0.10],[20000,0.20],[20000,0.30],[40000,0.34],[Infinity,0.38]],
  socialSecurity: [
    { key: 'cnss', label: 'CNSS (4.48%)', rate: 0.0448, cap: 6000 * 12 },
    { key: 'amo', label: 'AMO Health (2.26%)', rate: 0.0226 }
  ],
  employerSS: [
    { key: 'cnss', label: 'CNSS (8.98%)', rate: 0.0898, cap: 6000 * 12 },
    { key: 'amo', label: 'AMO Health (4.11%)', rate: 0.0411 }
  ]
});
