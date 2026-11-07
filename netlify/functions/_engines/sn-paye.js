// Senegal salaried income: DGID CGI 2025 articles 168, 173 and 182.
// https://www.dgid.sn/storage/docs/CGI-2025.pdf
const { createEngine } = require('./_factory');
const config = {
  country: 'SN', countryName: 'Senegal', currency: 'XOF',
  source: 'DGID CGI 2025 (articles 168, 173, 182); DGTSS/IPRES report 2024',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-11-07',
  sourceCheckedOn: '2026-11-07',
  nextReviewDate: '2027-02-07',
  /* source-confidence-stamp:end */
  bands: [[630000,0],[870000,0.20],[2500000,0.30],[4000000,0.35],[5500000,0.37],[36500000,0.40],[Infinity,0.43]],
  // The salary allowance already represents compulsory pension contributions.
  ssDeductibleFromTaxable: false,
  taxableRoundingStep: 1000,
  socialSecurity: [{ key: 'ipres', label: 'IPRES (5.6%)', rate: 0.056, baseCap: 432000 }],
  employerSS: [{ key: 'ipres', label: 'IPRES (8.4%)', rate: 0.084, baseCap: 432000 }]
};
const engine = createEngine(config);
engine.formulaParameters.salaryAllowance = { rate: 0.30, annualCap: 900000, includesCompulsoryPension: true };
engine.roundingPolicy.stages.unshift('annual taxable salary rounded down to the nearest 1,000 XOF');
engine.calculate = function (params) {
  const gross = Number(params.grossAnnual);
  if (!Number.isFinite(gross) || gross <= 0) throw new RangeError('Salaire brut invalide');
  const salaryAllowance = Math.min(gross * 0.30, 900000);
  const result = createEngine({ ...config, taxFreeAllowance: salaryAllowance }).calculate({ ...params, grossAnnual: gross });
  result.tax.salaryAllowance = salaryAllowance;
  result.meta.limitations = { familyReductionIncluded: false, minimumFiscalTaxIncluded: false, cadresSupplementIncluded: false, cssEmployerIncluded: false };
  return result;
};
module.exports = engine;
