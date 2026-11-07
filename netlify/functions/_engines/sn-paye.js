// Senegal salaried income: DGID CGI 2025 articles 168, 173 and 182.
// https://www.dgid.sn/storage/docs/CGI-2025.pdf
const { createEngine } = require('./_factory');
// A static import keeps the browser/API family and TRIMF rules identical and bundled.
const { calculateHousehold, constants: householdConstants } = require('../../../assets/js/engines/sn-paye');
const config = {
  country: 'SN', countryName: 'Senegal', currency: 'XOF',
  source: 'DGID CGI January 2025 (articles 168, 173–179, 182, 275–282); CLEISS general IPRES parameters as of 2026-01-01; later implementing rates unconfirmed',
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
engine.formulaParameters.familyReduction = { annualTable: householdConstants.familyRelief, residentMaxParts: 5 };
engine.formulaParameters.trimf = { annualBands: householdConstants.trimfBands, grossBase: true, childrenCounted: false };
engine.roundingPolicy.stages.unshift('annual taxable salary rounded down to the nearest 1,000 XOF');
engine.calculate = function (params) {
  const gross = Number(params.grossAnnual);
  if (!['number', 'string'].includes(typeof params.grossAnnual) || params.grossAnnual === '' || !Number.isFinite(gross) || gross < 0) throw new RangeError('Salaire brut invalide');
  const salaryAllowance = Math.min(gross * 0.30, 900000);
  const result = createEngine({ ...config, taxFreeAllowance: salaryAllowance }).calculate({ ...params, grossAnnual: gross });
  // Internal PAYE-engine contract: zero income is a numeric no-employment result.
  // The visitor form and HTTP salary-input normalizer may still require a positive salary.
  if (gross === 0) {
    result.tax.salaryAllowance = 0;
    result.tax.familyParts = null;
    result.tax.reliefs.familyReduction = 0;
    result.tax.trimf = { annual: 0, perPersonAnnual: 0, liablePersons: 0 };
    result.deductions.trimf = 0;
    result.input.household = { noEmploymentIncome: true };
    result.meta.assumptions = ['No employment income supplied; no IR, IPRES or TRIMF is modeled.'];
    result.meta.limitations = { familyReductionIncluded: true, minimumFiscalTaxIncluded: true, cadresSupplementIncluded: false, cssEmployerIncluded: false };
    return result;
  }
  const household = calculateHousehold(gross, result.tax.grossTax, params);
  if (household.error) throw new RangeError(household.error);
  const reduction = household.familyReduction;
  result.tax.salaryAllowance = salaryAllowance;
  result.tax.familyParts = household.familyParts;
  result.tax.reliefs.familyReduction = reduction;
  result.tax.netTax = Math.round(household.annualPAYE);
  result.deductions.trimf = household.trimf;
  // Recompute from unrounded contribution base, then apply the existing API display rounding.
  const ipres = params.ipres === false ? 0 : Math.min(gross, 5184000) * .056;
  const net = gross - ipres - household.annualPAYE - household.trimf;
  result.deductions.totalDeductions = Math.round(gross - net);
  result.result.netAnnual = Math.round(net);
  result.result.netMonthly = Math.round(net / 12);
  result.result.effectiveRate = (household.annualPAYE / gross * 100).toFixed(2) + '%';
  result.tax.trimf = { annual: household.trimf, perPersonAnnual: household.trimfPerPerson, liablePersons: household.trimfPersons };
  result.input.household = household.assumptions;
  result.meta.assumptions = ['Resident employee; stable cash salary for twelve months; general IPRES only.'];
  result.meta.limitations = { familyReductionIncluded: true, minimumFiscalTaxIncluded: true, cadresSupplementIncluded: false, cssEmployerIncluded: false };
  return result;
};
const baseOptions = engine.getOptions;
engine.getOptions = function () {
  return { ...baseOptions(), household: {
    scope: 'Resident employee, stable cash salary over twelve months',
    familyStatus: ['single', 'married', 'divorced', 'widowed'], dependentChildren: 'nonnegative integer',
    soleTaxableEarner: 'required boolean when married; taxable income of spouses',
    spousesWithoutIncome: 'required nonnegative integer when married; any income counts',
    confirmedParts: 'optional 1 to 5 in steps of 0.5, confirmed by payroll',
    confirmedTrimfPersons: 'optional nonnegative integer, including employee; confirmed by payroll'
  } };
};
module.exports = engine;
