// Mauritania PAYE (ITS) — Source: Ministry of Finance CGI, arts. 110, 113 and 114.
// ITS is monthly: deduct worker CNSS, exempt MRU 6,000, round RI down to MRU 10,
// then apply 15% / 25% / 40% progressive bands.
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'MR', countryName: 'Mauritania', currency: 'MRU',
  source: 'Mauritania Ministry of Finance — Code général des impôts 2023',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-07-21',
  nextReviewDate: '2026-10-31',
  /* source-confidence-stamp:end */

  isMonthly: true,
  taxFreeAllowance: 6000,
  taxableRoundingStep: 10,
  bands: [[9000,0.15],[12000,0.25],[Infinity,0.40]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (1%, MRU 15,000 base cap)', rate: 0.01, baseCap: 15000 }],
  employerSS: [
    { key: 'cnssEmployer', label: 'Employer CNSS (13%, MRU 15,000 base cap)', rate: 0.13, baseCap: 15000 },
    { key: 'workMedicine', label: 'Work medicine (2%, MRU 15,000 base cap)', rate: 0.02, baseCap: 15000 }
  ]
});
