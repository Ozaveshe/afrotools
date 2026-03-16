// Equatorial Guinea PAYE (IRPP) — Source: Ministerio de Hacienda y Presupuestos
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'GQ', countryName: 'Equatorial Guinea', currency: 'XAF',
  source: 'Ministerio de Hacienda y Presupuestos',
  bands: [[1000000,0],[5000000,0.10],[10000000,0.15],[15000000,0.20],[25000000,0.25],[Infinity,0.35]],
  socialSecurity: [{ key: 'inseso', label: 'INSESO (4.5%)', rate: 0.045 }],
  employerSS: [{ key: 'inseso', label: 'INSESO (21.5%)', rate: 0.215 }]
});
