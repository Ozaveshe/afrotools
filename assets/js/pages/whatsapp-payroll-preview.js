(function(root){'use strict';
var definitions={"netlify/functions/_engines/ao-paye.js":function(module,exports,require){
// Angola PAYE (IRT) — Source: Administração Geral Tributária (AGT)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'AO', countryName: 'Angola', currency: 'AOA',
  source: 'Administração Geral Tributária (AGT)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-03-26',
  nextReviewDate: '2026-06-24',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[70000,0],[30000,0.10],[50000,0.13],[100000,0.16],[250000,0.18],[2500000,0.19],[5000000,0.20],[10000000,0.21],[Infinity,0.22]],
  socialSecurity: [{ key: 'inss', label: 'INSS (3%)', rate: 0.03 }],
  employerSS: [{ key: 'inss', label: 'INSS (8%)', rate: 0.08 }]
});

},
"netlify/functions/_engines/bf-paye.js":function(module,exports,require){
// Burkina Faso PAYE (IUTS) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'BF', countryName: 'Burkina Faso', currency: 'XOF',
  source: 'Direction Générale des Impôts (DGI)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-07-01',
  nextReviewDate: '2025-09-29',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[30000,0],[20000,0.1225],[15000,0.15],[50000,0.20],[Infinity,0.25]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (5.5%)', rate: 0.055 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (16%)', rate: 0.16 }]
});

},
"netlify/functions/_engines/bi-paye.js":function(module,exports,require){
// Burundi PAYE (IPR) — Source: Office Burundais des Recettes (OBR)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'BI', countryName: 'Burundi', currency: 'BIF',
  source: 'Office Burundais des Recettes (OBR)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-01',
  nextReviewDate: '2026-06-30',
  /* source-confidence-stamp:end */

  bands: [[150000,0],[150000,0.20],[1800000,0.30],[Infinity,0.35]],
  socialSecurity: [{ key: 'inss', label: 'INSS (4%)', rate: 0.04 }],
  employerSS: [{ key: 'inss', label: 'INSS (6%)', rate: 0.06 }]
});

},
"netlify/functions/_engines/bj-paye.js":function(module,exports,require){
'use strict';

const engine = require('../../../assets/js/engines/bj-paye');
function round(value) { return Math.round(value); }

module.exports = {
  country: 'BJ', countryName: 'Benin', currency: 'XOF', regimes: ['STANDARD'],
  lastUpdated: '2026-07-22',
  sourceCheckedOn: '2026-07-22',
  nextReviewDate: '2026-10-22',
  source: 'Benin Code general des impots 2026, Articles 119-129; CNSS Benin official contribution rates',
  formulaParameters: engine.formulaParameters,
  roundingPolicy: engine.roundingPolicy,
  calculate(params) {
    params = params || {};
    const grossMonthly = Number.isFinite(Number(params.grossMonthly)) ? Number(params.grossMonthly) : Number(params.grossAnnual) / 12;
    const month = params.month || 'standard';
    const riskRate = params.riskRate == null ? 0.01 : Number(params.riskRate);
    const value = engine.calculate({ grossMonthly, month, riskRate });
    if (!value.ok) throw new Error(value.error);
    return {
      input: { country: 'BJ', grossMonthly, grossAnnual: grossMonthly * 12, month: value.month, riskRate: value.riskRate },
      deductions: { cnssEmployee: round(value.employeeCnssAnnual), its: round(value.itsAnnual), totalDeductions: round(value.employeeCnssAnnual + value.itsAnnual) },
      tax: { taxableIncome: round(value.taxBaseMonthly), bands: value.bands.map(b => ({ from: b.from, to: b.to, rate: b.rate, taxInBand: round(b.tax) })), grossTax: round(value.baseItsMonthly * 12), ortbLevy: round(value.annualOrtb), netTax: round(value.itsAnnual) },
      result: { netAnnual: round(value.netAnnual), netMonthly: round(value.netMonthly), effectiveRate: (value.effectiveDeductionRate * 100).toFixed(2) + '%' },
      employer: { cnssEmployer: round(value.employerCnssAnnual), contributionRate: value.employerRate, totalCostAnnual: round(value.employerCostAnnual), totalCostMonthly: round(value.employerCostMonthly) },
      meta: { currency: 'XOF', lastUpdated: this.lastUpdated, sourceCheckedOn: this.sourceCheckedOn, nextReviewDate: this.nextReviewDate, source: this.source }
    };
  },
  reverseCalculate(params) {
    params = params || {};
    const netMonthly = Number.isFinite(Number(params.netMonthly)) ? Number(params.netMonthly) : Number(params.netAnnual) / 12;
    const result = engine.reverse({ netMonthly, month: params.month, riskRate: params.riskRate });
    if (!result.ok) throw new Error(result.error);
    return this.calculate({ grossMonthly: result.grossMonthly, month: result.month, riskRate: result.riskRate });
  },
  getOptions() {
    return { regimes: [{ key: 'STANDARD', label: 'Employee', default: true }], deductions: [{ key: 'month', label: 'Pay month', values: ['standard', 'march', 'june'], default: 'standard' }, { key: 'riskRate', label: 'Employer occupational risk rate', min: 0.01, max: 0.04, default: 0.01 }] };
  }
};

},
"netlify/functions/_engines/bw-paye.js":function(module,exports,require){
// Botswana PAYE — Source: Botswana Unified Revenue Service (BURS)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'BW', countryName: 'Botswana', currency: 'BWP',
  source: 'Botswana Unified Revenue Service (BURS)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-07-01',
  nextReviewDate: '2025-09-29',
  /* source-confidence-stamp:end */

  bands: [[48000,0],[36000,0.05],[36000,0.125],[36000,0.1875],[Infinity,0.25]],
  socialSecurity: [],
  employerSS: []
});

},
"netlify/functions/_engines/cd-paye.js":function(module,exports,require){
// DRC PAYE (IPR) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'CD', countryName: 'DR Congo', currency: 'CDF',
  source: 'Direction Générale des Impôts (DGI)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-06',
  nextReviewDate: '2026-07-05',
  /* source-confidence-stamp:end */

  bands: [[524160,0.03],[1572480,0.05],[2620800,0.10],[5241600,0.20],[10483200,0.30],[17472000,0.35],[24460800,0.40],[Infinity,0.45]],
  socialSecurity: [{ key: 'inss', label: 'INSS (5%)', rate: 0.05 }],
  employerSS: [{ key: 'inss', label: 'INSS (9.5%)', rate: 0.095 }]
});

},
"netlify/functions/_engines/cf-paye.js":function(module,exports,require){
// Central African Republic PAYE (IRPP) — Source: Direction Générale des Impôts et des Domaines
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'CF', countryName: 'Central African Republic', currency: 'XAF',
  source: 'Direction Générale des Impôts et des Domaines',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-03-28',
  nextReviewDate: '2026-06-26',
  /* source-confidence-stamp:end */

  bands: [[300000,0],[1200000,0.08],[3000000,0.15],[5000000,0.25],[8000000,0.35],[Infinity,0.50]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (3%)', rate: 0.03 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (17%)', rate: 0.17 }]
});

},
"netlify/functions/_engines/cg-paye.js":function(module,exports,require){
// Congo (Republic) PAYE (IRPP) — Source: Direction Générale des Impôts et des Domaines
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'CG', countryName: 'Republic of the Congo', currency: 'XAF',
  source: 'Direction Générale des Impôts et des Domaines',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-03-28',
  nextReviewDate: '2026-06-26',
  /* source-confidence-stamp:end */

  bands: [[464000,0],[1000000,0.01],[3000000,0.10],[8000000,0.25],[Infinity,0.40]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (4%)', rate: 0.04 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (20.29%)', rate: 0.2029 }]
});

},
"netlify/functions/_engines/ci-paye.js":function(module,exports,require){
// Ivory Coast PAYE (ITS) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'CI', countryName: 'Ivory Coast', currency: 'XOF',
  source: 'Direction Générale des Impôts (DGI)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-01',
  nextReviewDate: '2026-06-30',
  /* source-confidence-stamp:end */

  bands: [[300000,0],[3884000,0.10],[7500000,0.15],[13750000,0.20],[24166667,0.25],[41666667,0.35],[Infinity,0.45]],
  socialSecurity: [{ key: 'cnps', label: 'CNPS (6.3%)', rate: 0.063 }],
  employerSS: [{ key: 'cnps', label: 'CNPS (15.75%)', rate: 0.1575 }]
});

},
"netlify/functions/_engines/cm-paye.js":function(module,exports,require){
// Cameroon PAYE (IRPP) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'CM', countryName: 'Cameroon', currency: 'XAF',
  source: 'Direction Générale des Impôts (DGI)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-01',
  nextReviewDate: '2026-06-30',
  /* source-confidence-stamp:end */

  bands: [[2000000,0.10],[3000000,0.15],[5000000,0.25],[Infinity,0.35]],
  socialSecurity: [{ key: 'cnps', label: 'CNPS (4.2%)', rate: 0.042 }],
  employerSS: [{ key: 'cnps', label: 'CNPS (11.2%)', rate: 0.112 }]
});

},
"netlify/functions/_engines/cv-paye.js":function(module,exports,require){
'use strict';

const engine = require('../../../assets/js/engines/cv-paye');

function round(value) { return Math.round(value); }

module.exports = {
  country: 'CV',
  countryName: 'Cape Verde',
  currency: 'CVE',
  regimes: ['STANDARD', 'DOMESTIC'],
  lastUpdated: '2026-07-21',
  sourceCheckedOn: '2026-07-21',
  nextReviewDate: '2026-10-31',
  source: 'DNRE Category A monthly withholding formula; INPS contribution obligations',
  formulaParameters: {
    method: 'monthly-gross-formula',
    exemptionThreshold: 36607,
    formulas: [
      { upTo: 80000, rate: 0.14, subtract: 5125 },
      { upTo: 150000, rate: 0.21, subtract: 10725 },
      { upTo: Infinity, rate: 0.25, subtract: 16725 }
    ],
    minimumPositiveWithholding: 100,
    standardInps: { employeeRate: 0.085, employerRate: 0.16 },
    domesticInps: { employeeRate: 0.08, employerRate: 0.15 }
  },
  roundingPolicy: {
    method: 'nearest-integer',
    stages: ['monthly withholding tax', 'annual and monthly result', 'INPS contributions', 'employer cost']
  },
  calculate(params) {
    params = params || {};
    const grossAnnual = Number(params.grossAnnual);
    const regime = params.regime === 'DOMESTIC' ? 'DOMESTIC' : 'STANDARD';
    const result = engine.calculate({ grossMonthly: grossAnnual / 12, regime, includeInps: params.inps !== false });
    if (!result.ok) throw new Error(result.error);
    return {
      input: { country: 'CV', grossAnnual, regime },
      deductions: { inpsEmployee: round(result.employeeInpsAnnual), totalDeductions: round(result.employeeInpsAnnual + result.taxAnnual) },
      tax: {
        taxableIncome: round(grossAnnual),
        bands: [{ from: 0, to: grossAnnual, rate: result.marginalRate, taxInBand: round(result.taxAnnual) }],
        grossTax: round(result.taxAnnual),
        reliefs: {},
        netTax: round(result.taxAnnual)
      },
      result: {
        netAnnual: round(result.netAnnual),
        netMonthly: round(result.netMonthly),
        effectiveRate: (result.effectiveTaxRate * 100).toFixed(2) + '%',
        marginalRate: (result.marginalRate * 100) + '%'
      },
      employer: {
        inpsEmployer: round(result.employerInpsAnnual),
        totalCostAnnual: round(result.employerCostAnnual),
        totalCostMonthly: round(result.employerCostMonthly)
      },
      meta: { regime, currency: 'CVE', lastUpdated: this.lastUpdated, sourceCheckedOn: this.sourceCheckedOn, nextReviewDate: this.nextReviewDate, source: this.source }
    };
  },
  reverseCalculate(params) {
    params = params || {};
    const result = engine.reverse({ netMonthly: Number(params.netAnnual) / 12, regime: params.regime, includeInps: params.inps !== false });
    return this.calculate({ grossAnnual: result.grossAnnual, regime: result.regime, inps: params.inps });
  },
  getOptions() {
    return {
      regimes: [
        { key: 'STANDARD', label: 'Employee', default: true },
        { key: 'DOMESTIC', label: 'Domestic service', default: false }
      ],
      deductions: [{ key: 'inps', label: 'INPS', default: true }]
    };
  }
};

},
"netlify/functions/_engines/dj-paye.js":function(module,exports,require){
'use strict';
const engine = require('../../../assets/js/engines/dj-paye');
function round(value) { return Math.round(value); }
module.exports = {
  country: 'DJ', countryName: 'Djibouti', currency: 'DJF', regimes: ['PROFESSIONAL', 'DOMESTIC'],
  lastUpdated: '2026-07-22',
  sourceCheckedOn: '2026-07-22',
  nextReviewDate: '2026-10-22',
  source: 'Djibouti Finance Law 2022 Article 7; CGI Articles 6 and 14; CNSS official contribution rates',
  formulaParameters: engine.formulaParameters, roundingPolicy: engine.roundingPolicy,
  calculate(params) {
    params = params || {};
    const grossMonthly = Number.isFinite(Number(params.grossMonthly)) ? Number(params.grossMonthly) : Number(params.grossAnnual) / 12;
    const employmentType = params.employmentType || 'professional';
    const value = engine.calculate({ grossMonthly, employmentType });
    if (!value.ok) throw new Error(value.error);
    return {
      input: { country: 'DJ', grossMonthly, grossAnnual: grossMonthly * 12, employmentType: value.employmentType },
      deductions: { cnssEmployee: round(value.employeeCnssAnnual), its: round(value.itsAnnual), totalDeductions: round(value.employeeCnssAnnual + value.itsAnnual) },
      tax: { taxableIncome: round(value.taxableIncome), roundedTaxableIncome: round(value.roundedTaxableIncome), bands: value.bands.map(b => ({ from: b.from, to: b.to, rate: b.rate, taxInBand: round(b.tax) })), grossTax: round(value.itsAnnual), netTax: round(value.itsAnnual) },
      result: { netAnnual: round(value.netAnnual), netMonthly: round(value.netMonthly), effectiveRate: (value.effectiveDeductionRate * 100).toFixed(2) + '%' },
      employer: { cnssEmployer: round(value.employerCnssAnnual), contributionRate: engine.employerCnssRate, totalCostAnnual: round(value.employerCostAnnual), totalCostMonthly: round(value.employerCostMonthly) },
      meta: { currency: 'DJF', lastUpdated: this.lastUpdated, sourceCheckedOn: this.sourceCheckedOn, nextReviewDate: this.nextReviewDate, source: this.source }
    };
  },
  getOptions() { return { regimes: [{ key: 'PROFESSIONAL', value: 'professional', label: 'Professional employer', default: true }, { key: 'DOMESTIC', value: 'domestic', label: 'Domestic worker employer' }] }; }
};

},
"netlify/functions/_engines/dz-paye.js":function(module,exports,require){
// Algeria PAYE (IRG) for regular monthly salary.
// Sources: DGI Article 104 guidance and CNAS general-case contribution rates.
const browserEngine = require('../../../assets/js/engines/dz-paye.js');

const metadata = {
  country: 'DZ',
  countryName: 'Algeria',
  currency: 'DZD',
  regimes: ['STANDARD'],
  lastUpdated: '2026-08-17',
  sourceCheckedOn: '2026-08-17',
  nextReviewDate: '2026-11-17',
  source: 'Direction Générale des Impôts (IRG salaires) and CNAS (general contribution rates)'
};

function toServerResult(grossAnnual, includeCnas) {
  const result = browserEngine.calculate(grossAnnual, { includeCnas });
  if (result.error) return result;
  const bands = result.bandBreakdown.map((band, index) => {
    const sourceBand = browserEngine.constants.irgBands[index];
    return {
      from: sourceBand.min,
      to: Number.isFinite(sourceBand.max) ? sourceBand.max : null,
      rate: band.rate,
      taxInBand: Math.round(band.tax),
      taxableInBand: Math.round(band.income)
    };
  });
  return {
    input: { country: metadata.country, grossAnnual, regime: 'STANDARD' },
    deductions: {
      cnas: Math.round(result.cnas),
      totalDeductions: Math.round(result.totalEmployeeDeductions)
    },
    tax: {
      taxableIncome: Math.round(result.taxableAnnual),
      bands,
      grossTax: Math.round(result.grossAnnualPAYE),
      reliefs: { salaryAbatements: Math.round(result.irgAbatementAnnual) },
      netTax: Math.round(result.annualPAYE)
    },
    result: {
      netAnnual: Math.round(result.netAnnual),
      netMonthly: Math.round(result.netAnnual / 12),
      effectiveRate: (result.effectiveRate * 100).toFixed(2) + '%',
      marginalRate: (result.marginalRate * 100) + '%'
    },
    employer: {
      cnas: Math.round(result.empCNAS),
      socialWorks: Math.round(result.socialWorks),
      totalCostAnnual: Math.round(result.totalEmployerCostAnnual),
      totalCostMonthly: Math.round(result.totalEmployerCostAnnual / 12)
    },
    meta: { ...metadata },
    limitations: { ...result.limitations }
  };
}

module.exports = {
  ...metadata,
  formulaParameters: {
    bandType: 'progressive-with-monthly-salary-abatements',
    isMonthly: true,
    bands: browserEngine.constants.irgBands,
    socialSecurity: [{ key: 'cnas', label: 'CNAS (9%)', rate: 0.09 }],
    employerSS: [
      { key: 'cnas', label: 'CNAS employer (25%)', rate: 0.25 },
      { key: 'socialWorks', label: 'Social works (0.5%)', rate: 0.005 }
    ],
    monthlyExemption: 30000,
    monthlyLowIncomeLimit: 35000
  },
  calculate(params) {
    return toServerResult(params.grossAnnual, params.cnas !== false);
  },
  reverseCalculate(params) {
    let lo = params.netAnnual;
    let hi = params.netAnnual * 3;
    for (let i = 0; i < 60; i += 1) {
      const mid = (lo + hi) / 2;
      const result = toServerResult(mid, params.cnas !== false);
      if (Math.abs(result.result.netAnnual - params.netAnnual) < 1) return result;
      if (result.result.netAnnual < params.netAnnual) lo = mid;
      else hi = mid;
    }
    return toServerResult((lo + hi) / 2, params.cnas !== false);
  },
  getOptions() {
    return {
      deductions: [{ key: 'cnas', label: 'CNAS (9%)', default: true }],
      regimes: [{ key: 'STANDARD', label: 'STANDARD', default: true }]
    };
  }
};

},
"netlify/functions/_engines/eg-paye.js":function(module,exports,require){
// Egypt PAYE Engine
// Source: Egyptian Tax Authority (ETA)
// Updated: Apr 2026

const ETA_BANDS = [
  [40000, 0.00],
  [15000, 0.10],
  [15000, 0.15],
  [130000, 0.20],
  [200000, 0.225],
  [800000, 0.25],
  [Infinity, 0.275]
];

const EXCLUSION_RULES = [
  { threshold: 600000, extraTax: 0, excludedBand: 0 },
  { threshold: 700000, extraTax: 1500, excludedBand: 1 },
  { threshold: 800000, extraTax: 2250, excludedBand: 2 },
  { threshold: 900000, extraTax: 26000, excludedBand: 3 },
  { threshold: 1000000, extraTax: 45000, excludedBand: 4 },
  { threshold: 1200000, extraTax: 274750, excludedBand: 5 }
];

const PERSONAL_EXEMPTION = 20000;
const DISABLED_PERSONAL_EXEMPTION = 30000;
const NOSI_CAP = 174000;
const NOSI_RATE = 0.11;
const EMPLOYER_NOSI_RATE = 0.1875;

function calcStandardTax(nati) {
  let tax = 0;
  let remaining = Math.max(0, nati);
  let detail = [];
  let bandStart = 0;

  for (const [width, rate] of ETA_BANDS) {
    const bandIncome = Math.min(remaining, width === Infinity ? remaining : width);
    const bandTax = bandIncome * rate;
    const bandEnd = width === Infinity ? bandStart + bandIncome : bandStart + width;

    if (bandIncome > 0) {
      detail.push({
        from: bandStart,
        to: bandEnd,
        rate,
        taxInBand: Math.round(bandTax * 100) / 100
      });
    }

    tax += bandTax;
    remaining -= bandIncome;
    bandStart = bandEnd;

    if (remaining <= 0) break;
  }

  return { tax, bands: detail };
}

function calcExclusion(nati) {
  let exclusionExtra = 0;
  let excludedBands = [];

  for (const rule of EXCLUSION_RULES) {
    if (nati > rule.threshold) {
      exclusionExtra = rule.extraTax;
      excludedBands.push(rule.excludedBand);
    }
  }

  return { exclusionExtra, excludedBands };
}

function getMarginalRate(nati) {
  let remaining = Math.max(0, nati);

  for (const [width, rate] of ETA_BANDS) {
    const bandWidth = width === Infinity ? remaining : width;
    if (remaining <= bandWidth) return rate * 100;
    remaining -= bandWidth;
  }

  return 27.5;
}

module.exports = {
  country: 'EG',
  countryName: 'Egypt',
  currency: 'EGP',
  regimes: ['STANDARD'],
  lastUpdated: '2026-04-06',
  /* source-confidence-stamp:start */
  sourceCheckedOn: '2025-03-01',
  nextReviewDate: '2025-05-30',
  /* source-confidence-stamp:end */

  source: 'Egyptian Tax Authority (ETA)',

  calculate(params) {
    const {
      grossAnnual,
      nosi: inclNosi = true,
      disabled = false
    } = params;

    const personalExemption = disabled ? DISABLED_PERSONAL_EXEMPTION : PERSONAL_EXEMPTION;
    const nosiBase = inclNosi ? Math.min(grossAnnual, NOSI_CAP) : 0;
    const nosi = nosiBase * NOSI_RATE;
    const nati = Math.max(0, grossAnnual - personalExemption - nosi);
    const standard = calcStandardTax(nati);
    const exclusion = calcExclusion(nati);
    const totalTax = standard.tax + exclusion.exclusionExtra;
    const employerNosi = nosiBase * EMPLOYER_NOSI_RATE;
    const totalDeductions = nosi + totalTax;
    const netAnnual = grossAnnual - totalDeductions;

    return {
      input: { country: 'EG', grossAnnual, regime: 'STANDARD' },
      deductions: {
        nosi: Math.round(nosi * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100
      },
      tax: {
        taxableIncome: Math.round(nati * 100) / 100,
        bands: standard.bands,
        grossTax: Math.round(standard.tax * 100) / 100,
        reliefs: { personalExemption },
        netTax: Math.round(totalTax * 100) / 100,
        exclusionExtra: exclusion.exclusionExtra,
        excludedBands: exclusion.excludedBands
      },
      result: {
        netAnnual: Math.round(netAnnual * 100) / 100,
        netMonthly: Math.round((netAnnual / 12) * 100) / 100,
        effectiveRate: (totalTax / grossAnnual * 100).toFixed(2) + '%',
        marginalRate: getMarginalRate(nati) + '%'
      },
      employer: {
        nosi: Math.round(employerNosi * 100) / 100,
        totalCostAnnual: Math.round((grossAnnual + employerNosi) * 100) / 100,
        totalCostMonthly: Math.round(((grossAnnual + employerNosi) / 12) * 100) / 100
      },
      meta: { regime: 'STANDARD', currency: 'EGP', lastUpdated: this.lastUpdated, source: this.source }
    };
  },

  reverseCalculate(params) {
    const { netAnnual, ...opts } = params;
    let low = netAnnual;
    let high = netAnnual * 3;

    for (let i = 0; i < 60; i++) {
      const guess = (low + high) / 2;
      const result = this.calculate({ grossAnnual: guess, ...opts });
      if (Math.abs(result.result.netAnnual - netAnnual) < 1) return result;
      if (result.result.netAnnual < netAnnual) low = guess;
      else high = guess;
    }

    return this.calculate({ grossAnnual: (low + high) / 2, ...opts });
  },

  getOptions() {
    return {
      deductions: [
        { key: 'nosi', label: 'Social Insurance (11% capped)', default: true }
      ],
      regimes: [{ key: 'STANDARD', label: 'Standard PAYE', default: true }]
    };
  }
};

},
"netlify/functions/_engines/er-paye.js":function(module,exports,require){
'use strict';
const engine = require('../../../assets/js/engines/er-paye');
function round(value) { return Math.round(value); }
module.exports = {
  country: 'ER', countryName: 'Eritrea', currency: 'ERN', regimes: ['ORDINARY', 'PUBLIC_SECTOR'],
  lastUpdated: '2026-07-22',
  sourceCheckedOn: '2026-07-22',
  nextReviewDate: '2026-10-22',
  source: 'Eritrea Income Tax Proclamation No. 62/1994 and Legal Notice No. 20/1995; Public Sector Pension Proclamation No. 146/2005',
  formulaParameters: engine.formulaParameters,
  roundingPolicy: engine.roundingPolicy,
  calculate(params) {
    params = params || {};
    const grossMonthly = Number.isFinite(Number(params.grossMonthly)) ? Number(params.grossMonthly) : Number(params.grossAnnual) / 12;
    const employmentType = params.employmentType === 'public-sector' ? 'public-sector' : 'ordinary';
    const pensionableBasic = employmentType === 'public-sector'
      ? (Number.isFinite(Number(params.pensionableBasic)) ? Number(params.pensionableBasic) : grossMonthly)
      : 0;
    const value = engine.calculate({ grossMonthly, employmentType, pensionableBasic });
    if (!value.ok) throw new Error(value.error);
    return {
      input: { country: 'ER', grossMonthly, grossAnnual: grossMonthly * 12, employmentType, pensionableBasic },
      deductions: { employeePension: round(value.employeePensionAnnual), incomeTax: round(value.incomeTaxAnnual), totalDeductions: round(value.employeePensionAnnual + value.incomeTaxAnnual) },
      tax: {
        taxableIncome: round(value.taxableIncome),
        bands: value.bands.map(band => ({
          from: band.from,
          // The browser engine represents the open-ended final band with
          // `null`. The API contract needs an ordered numeric range, so expose
          // the upper edge actually used for this calculation.
          to: band.to === null ? band.from + band.income : band.to,
          rate: band.rate,
          taxInBand: round(band.tax)
        })),
        grossTax: round(value.incomeTaxAnnual),
        netTax: round(value.incomeTaxAnnual)
      },
      result: { netAnnual: round(value.netAnnual), netMonthly: round(value.netMonthly), effectiveRate: (value.effectiveDeductionRate * 100).toFixed(2) + '%' },
      employer: { publicSectorPension: round(value.employerPensionAnnual), totalCostAnnual: round(value.employerCostAnnual), totalCostMonthly: round(value.employerCostMonthly) },
      meta: { currency: 'ERN', lastUpdated: this.lastUpdated, sourceCheckedOn: this.sourceCheckedOn, nextReviewDate: this.nextReviewDate, source: this.source }
    };
  },
  getOptions() {
    return { regimes: [
      { key: 'ORDINARY', value: 'ordinary', label: 'Tax-only reference estimate', default: true },
      { key: 'PUBLIC_SECTOR', value: 'public-sector', label: 'Regular public-sector employee pension scenario' }
    ] };
  }
};

},
"netlify/functions/_engines/et-paye.js":function(module,exports,require){
// Ethiopia PAYE — Source: ERCA, Proclamation No. 1395/2025
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'ET', countryName: 'Ethiopia', currency: 'ETB',
  source: 'Ethiopian Revenues & Customs Authority (ERCA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-01',
  nextReviewDate: '2026-06-30',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[2000,0],[2000,0.15],[3000,0.20],[3000,0.25],[4000,0.30],[Infinity,0.35]],
  socialSecurity: [{ key: 'pension', label: 'Pension (7%)', rate: 0.07 }],
  employerSS: [{ key: 'pension', label: 'Pension (11%)', rate: 0.11 }]
});

},
"netlify/functions/_engines/ga-paye.js":function(module,exports,require){
// Gabon PAYE (IRPP) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'GA', countryName: 'Gabon', currency: 'XAF',
  source: 'Direction Générale des Impôts (DGI)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-01',
  nextReviewDate: '2026-06-30',
  /* source-confidence-stamp:end */

  bands: [[1500000,0],[1920000,0.05],[2500000,0.10],[3750000,0.15],[7500000,0.20],[Infinity,0.35]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (2.5%)', rate: 0.025 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (20.1%)', rate: 0.201 }]
});

},
"netlify/functions/_engines/gh-paye.js":function(module,exports,require){
// Ghana PAYE Engine
// Source: Ghana Revenue Authority (GRA)
// Reviewed: 27 Sep 2026. GRA Act 1178 took effect 1 Sep 2026.

const GH_BANDS = [
  [7056, 0.00],
  [960, 0.05],
  [1200, 0.10],
  [34800, 0.175],
  [192000, 0.25],
  [363984, 0.30],
  [Infinity, 0.35]
];

// SSNIT's GHS 69,000 cap is a monthly insurable earning (13.5% = GHS 9,315).
// This engine accepts annual pay, so convert the cap to an annual base.
const SSNIT_CAP = 69000 * 12;
const SSNIT_EMPLOYEE_RATE = 0.055;
const SSNIT_EMPLOYER_RATE = 0.13;
const TIER3_CAP_RATE = 0.165;
const MARRIAGE_RELIEF = 1200;
const CHILD_RELIEF = 600;
const MAX_CHILDREN = 3;
const OLD_AGE_RELIEF = 1500;
const DEPENDENT_RELIEF = 1000;

function calcBands(chargeableIncome) {
  let tax = 0;
  let remaining = Math.max(0, chargeableIncome);
  let detail = [];
  let bandStart = 0;

  for (const [width, rate] of GH_BANDS) {
    const bandIncome = Math.min(remaining, width === Infinity ? remaining : width);
    const bandTax = bandIncome * rate;
    const bandEnd = width === Infinity ? bandStart + bandIncome : bandStart + width;

    if (bandIncome > 0) {
      detail.push({
        from: bandStart,
        to: bandEnd,
        rate,
        taxInBand: Math.round(bandTax * 100) / 100
      });
    }

    tax += bandTax;
    remaining -= bandIncome;
    bandStart = bandEnd;

    if (remaining <= 0) break;
  }

  return { tax, bands: detail };
}

function getMarginalRate(chargeableIncome) {
  let remaining = Math.max(0, chargeableIncome);

  for (const [width, rate] of GH_BANDS) {
    const bandWidth = width === Infinity ? remaining : width;
    if (remaining <= bandWidth) return rate * 100;
    remaining -= bandWidth;
  }

  return 35;
}

module.exports = {
  country: 'GH',
  countryName: 'Ghana',
  currency: 'GHS',
  regimes: ['STANDARD'],
  lastUpdated: '2026-09-27',
  /* source-confidence-stamp:start */
  sourceCheckedOn: '2026-09-27',
  nextReviewDate: '2026-10-27',
  /* source-confidence-stamp:end */

  source: 'GRA Income Tax (Amendment) Act 2026 (Act 1178); SSNIT 2026 public notice',

  calculate(params) {
    const {
      grossAnnual,
      basicSalary = grossAnnual,
      ssnit: inclSsnit = true,
      tier3 = false,
      tier3Amount = 0,
      marriage = false,
      children = 0,
      disabled = false,
      oldAge = false,
      dependent = false
    } = params;

    const pensionableBase = Math.min(basicSalary, grossAnnual);
    const ssnitBase = Math.min(pensionableBase, SSNIT_CAP);
    const ssnit = inclSsnit ? ssnitBase * SSNIT_EMPLOYEE_RATE : 0;
    const maxTier3 = pensionableBase * TIER3_CAP_RATE;
    const tier3Contribution = tier3 ? Math.min(tier3Amount, maxTier3) : 0;

    const marriageRelief = marriage ? MARRIAGE_RELIEF : 0;
    const childRelief = CHILD_RELIEF * Math.min(children, MAX_CHILDREN);
    const disabilityRelief = disabled ? grossAnnual * 0.25 : 0;
    const oldAgeRelief = oldAge ? OLD_AGE_RELIEF : 0;
    const dependentRelief = dependent ? DEPENDENT_RELIEF : 0;
    const totalRelief = marriageRelief + childRelief + disabilityRelief + oldAgeRelief + dependentRelief;

    const chargeableIncome = Math.max(0, grossAnnual - ssnit - tier3Contribution - totalRelief);
    const bandResult = calcBands(chargeableIncome);
    const employerSsnit = inclSsnit ? ssnitBase * SSNIT_EMPLOYER_RATE : 0;
    const totalDeductions = ssnit + tier3Contribution + bandResult.tax;
    const netAnnual = grossAnnual - totalDeductions;

    return {
      input: { country: 'GH', grossAnnual, regime: 'STANDARD' },
      deductions: {
        ssnit: Math.round(ssnit * 100) / 100,
        tier3: Math.round(tier3Contribution * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100
      },
      tax: {
        taxableIncome: Math.round(chargeableIncome * 100) / 100,
        bands: bandResult.bands,
        grossTax: Math.round(bandResult.tax * 100) / 100,
        reliefs: {
          marriage: marriageRelief,
          childRelief: childRelief,
          disability: disabilityRelief,
          oldAge: oldAgeRelief,
          dependent: dependentRelief
        },
        netTax: Math.round(bandResult.tax * 100) / 100
      },
      result: {
        netAnnual: Math.round(netAnnual * 100) / 100,
        netMonthly: Math.round((netAnnual / 12) * 100) / 100,
        effectiveRate: (bandResult.tax / grossAnnual * 100).toFixed(2) + '%',
        marginalRate: getMarginalRate(chargeableIncome) + '%'
      },
      employer: {
        ssnit: Math.round(employerSsnit * 100) / 100,
        totalCostAnnual: Math.round((grossAnnual + employerSsnit) * 100) / 100,
        totalCostMonthly: Math.round(((grossAnnual + employerSsnit) / 12) * 100) / 100
      },
      meta: { regime: 'STANDARD', currency: 'GHS', lastUpdated: this.lastUpdated, source: this.source }
    };
  },

  reverseCalculate(params) {
    const { netAnnual, ...opts } = params;
    let low = netAnnual;
    let high = netAnnual * 3;

    for (let i = 0; i < 60; i++) {
      const guess = (low + high) / 2;
      const result = this.calculate({ grossAnnual: guess, ...opts });
      if (Math.abs(result.result.netAnnual - netAnnual) < 1) return result;
      if (result.result.netAnnual < netAnnual) low = guess;
      else high = guess;
    }

    return this.calculate({ grossAnnual: (low + high) / 2, ...opts });
  },

  getOptions() {
    return {
      deductions: [
        { key: 'ssnit', label: 'SSNIT employee contribution (5.5% capped)', default: true },
        { key: 'tier3', label: 'Tier III voluntary pension', default: false }
      ],
      regimes: [{ key: 'STANDARD', label: 'Standard PAYE', default: true }]
    };
  }
};

},
"netlify/functions/_engines/gm-paye.js":function(module,exports,require){
'use strict';

const engine = require('../../../assets/js/engines/gm-paye');

function round(value) { return Math.round(value); }

module.exports = {
  country: 'GM',
  countryName: 'Gambia',
  currency: 'GMD',
  regimes: ['NPF', 'FPS'],
  lastUpdated: '2026-07-21',
  sourceCheckedOn: '2026-07-21',
  nextReviewDate: '2026-10-31',
  source: 'Gambia Revenue Authority PAYE calculator and brochure; SSHFC NPF, FPS and IICF guidance',
  formulaParameters: {
    bandType: 'progressive',
    bands: engine.bands.map((band) => [band.width, band.rate]),
    payeBase: 'gross employment income; no deductions',
    npf: { employeeRate: 0.05, employerRate: 0.10, base: 'basic salary' },
    fps: { employeeRate: 0, employerRate: 0.15, base: 'gross salary' },
    iicf: { employerRate: 0.01, monthlyCap: 15 }
  },
  roundingPolicy: {
    method: 'nearest-integer',
    stages: ['annual PAYE', 'annual pension contributions', 'annual and monthly result', 'employer cost']
  },
  calculate(params) {
    params = params || {};
    const grossAnnual = Number(params.grossAnnual);
    const scheme = params.scheme === 'FPS' ? 'FPS' : 'NPF';
    const basicAnnual = params.basicAnnual == null ? grossAnnual : Number(params.basicAnnual);
    const result = engine.calculate({ grossAnnual, basicAnnual, scheme, includeIicf: params.iicf !== false });
    if (!result.ok) throw new Error(result.error);
    const employeeKey = scheme === 'NPF' ? 'npfEmployee' : 'fpsEmployee';
    const employerKey = scheme === 'NPF' ? 'npfEmployer' : 'fpsEmployer';
    return {
      input: { country: 'GM', grossAnnual, regime: scheme, basicAnnual: result.basicAnnual },
      deductions: { [employeeKey]: round(result.employeePensionAnnual), totalDeductions: round(result.employeePensionAnnual + result.payeAnnual) },
      tax: {
        taxableIncome: round(grossAnnual),
        bands: result.bands.map((band) => ({ from: band.from, to: band.to, rate: band.rate, taxInBand: round(band.tax) })),
        grossTax: round(result.payeAnnual),
        reliefs: {},
        netTax: round(result.payeAnnual)
      },
      result: {
        netAnnual: round(result.netAnnual),
        netMonthly: round(result.netMonthly),
        effectiveRate: (result.effectiveTaxRate * 100).toFixed(2) + '%',
        marginalRate: ((result.bands.filter((band) => band.tax > 0).pop() || { rate: 0 }).rate * 100) + '%'
      },
      employer: {
        [employerKey]: round(result.employerPensionAnnual),
        iicf: round(result.iicfAnnual),
        totalCostAnnual: round(result.employerCostAnnual),
        totalCostMonthly: round(result.employerCostMonthly)
      },
      meta: { regime: scheme, currency: 'GMD', lastUpdated: this.lastUpdated, sourceCheckedOn: this.sourceCheckedOn, nextReviewDate: this.nextReviewDate, source: this.source }
    };
  },
  reverseCalculate(params) {
    params = params || {};
    const result = engine.reverse({ netAnnual: params.netAnnual, scheme: params.scheme, basicRatio: params.basicRatio, includeIicf: params.iicf !== false });
    return this.calculate({ grossAnnual: result.grossAnnual, basicAnnual: result.basicAnnual, scheme: result.scheme, iicf: params.iicf });
  },
  getOptions() {
    return { regimes: [{ key: 'NPF', label: 'National Provident Fund', default: true }, { key: 'FPS', label: 'Federated Pension Scheme', default: false }], deductions: [{ key: 'iicf', label: 'Industrial Injuries Compensation Fund', default: true }] };
  }
};

},
"netlify/functions/_engines/gn-paye.js":function(module,exports,require){
// Guinea PAYE (ITS) — Source: Direction Nationale des Impôts (DNI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'GN', countryName: 'Guinea', currency: 'GNF',
  source: 'Direction Nationale des Impôts (DNI)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-01',
  nextReviewDate: '2026-06-30',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[1000000,0],[5000000,0.10],[10000000,0.15],[Infinity,0.25]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (5%)', rate: 0.05 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (18%)', rate: 0.18 }]
});

},
"netlify/functions/_engines/gq-paye.js":function(module,exports,require){
// Equatorial Guinea PAYE (IRPP) — Source: Ministerio de Hacienda y Presupuestos
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'GQ', countryName: 'Equatorial Guinea', currency: 'XAF',
  source: 'Ministerio de Hacienda y Presupuestos',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-03-28',
  nextReviewDate: '2026-06-26',
  /* source-confidence-stamp:end */

  bands: [[1000000,0],[5000000,0.10],[10000000,0.15],[15000000,0.20],[25000000,0.25],[Infinity,0.35]],
  socialSecurity: [{ key: 'inseso', label: 'INSESO (4.5%)', rate: 0.045 }],
  employerSS: [{ key: 'inseso', label: 'INSESO (21.5%)', rate: 0.215 }]
});

},
"netlify/functions/_engines/index.js":function(module,exports,require){
// Engine Registry — maps ISO country codes to PAYE calculation engines
const engines = {};
const formulasByCountry = {};

try {
  // Keep this a static require so Netlify's function bundler includes the
  // registry in the deployed artifact instead of relying on the repo layout.
  const registry = require('../../../data/calculation-quality/formula-registry.json');
  for (const formula of registry.formulas || []) {
    if (formula.formulaFamily !== 'paye-server' || formula.jurisdictions.length !== 1) continue;
    formulasByCountry[formula.jurisdictions[0]] = formula;
  }
} catch (error) {
  console.error('[engines] Formula registry unavailable: ' + error.message);
}

const engineFiles = [
  'ng-paye', 'ke-paye', 'za-paye', 'gh-paye', 'eg-paye', 'tz-paye',
  'rw-paye', 'ug-paye', 'et-paye', 'ma-paye', 'dz-paye', 'tn-paye',
  'cm-paye', 'sn-paye', 'ci-paye', 'ao-paye', 'cd-paye', 'zm-paye',
  'zw-paye', 'bw-paye', 'na-paye', 'mz-paye', 'mw-paye', 'mu-paye',
  'mg-paye', 'dj-paye', 'sc-paye', 'sz-paye', 'ls-paye', 'cv-paye',
  'lr-paye', 'sl-paye', 'gm-paye', 'mr-paye', 'bj-paye', 'bf-paye',
  'ml-paye', 'ne-paye', 'tg-paye', 'gn-paye', 'td-paye', 'ga-paye',
  'cg-paye', 'gq-paye', 'cf-paye', 'st-paye', 'sd-paye', 'ss-paye',
  'bi-paye', 'km-paye', 'so-paye', 'er-paye', 'ly-paye'
];

for (const file of engineFiles) {
  try {
    const engine = require(`./${file}`);
    const formula = formulasByCountry[engine.country] || null;
    if (formula) {
      const calculate = engine.calculate.bind(engine);
      engine.formulaMetadata = {
        formulaId: formula.id,
        formulaVersion: formula.formulaVersion,
        effectiveFrom: formula.effectiveFrom,
        effectiveTo: formula.effectiveTo,
        effectiveDateStatus: formula.effectiveDateStatus,
        sourceReferences: formula.sources
      };
      engine.calculate = function calculateWithTrace(params) {
        const result = calculate(params);
        result.meta = Object.assign({}, result.meta || {}, engine.formulaMetadata);
        return result;
      };
    }
    engines[engine.country] = engine;
  } catch (err) {
    console.error(`[engines] Failed to load ${file}: ${err.message}`);
  }
}

module.exports = {
  get(code) { return engines[(code || '').toUpperCase()] || null; },
  getFormula(code) {
    const engine = engines[(code || '').toUpperCase()] || null;
    return engine && engine.formulaMetadata ? engine.formulaMetadata : null;
  },
  resolve(code, effectiveOn) {
    const upper = String(code || '').toUpperCase();
    const engine = engines[upper] || null;
    if (!engine) return { ok: false, error: 'UNSUPPORTED_JURISDICTION', jurisdiction: upper, effectiveOn: effectiveOn || null };
    const formula = engine.formulaMetadata;
    if (!formula) return { ok: false, error: 'FORMULA_METADATA_UNAVAILABLE', jurisdiction: upper, effectiveOn: effectiveOn || null };
    if (effectiveOn) {
      const supported = formula.effectiveDateStatus === 'not-applicable' || (
        formula.effectiveDateStatus === 'declared' &&
        effectiveOn >= formula.effectiveFrom &&
        (!formula.effectiveTo || effectiveOn <= formula.effectiveTo)
      );
      if (!supported) return { ok: false, error: 'UNSUPPORTED_DATE', jurisdiction: upper, effectiveOn };
    }
    return { ok: true, engine, formula };
  },
  listCountries() {
    return Object.values(engines).map(e => ({
      code: e.country, name: e.countryName, currency: e.currency,
      regimes: e.regimes, lastUpdated: e.lastUpdated,
      formulaId: e.formulaMetadata ? e.formulaMetadata.formulaId : null,
      formulaVersion: e.formulaMetadata ? e.formulaMetadata.formulaVersion : null
    }));
  },
  listCountryCodes() { return Object.keys(engines).sort(); },
  count() { return Object.keys(engines).length; }
};

},
"netlify/functions/_engines/ke-paye.js":function(module,exports,require){
// Kenya PAYE Engine
// Source: Kenya Revenue Authority (KRA)
// Updated: Apr 2026

const kePayroll = require("../../../assets/js/lib/ke-payroll.js");

function buildBandRanges(monthlyTaxable) {
  let remaining = Math.max(0, monthlyTaxable);
  let ranges = [];
  let bandStart = 0;

  for (const band of kePayroll.MONTHLY_BANDS) {
    const width = band.width === Infinity ? remaining : band.width;
    const bandIncome = Math.min(remaining, width);
    const bandEnd = band.width === Infinity ? bandStart + bandIncome : bandStart + band.width;

    ranges.push({
      from: bandStart,
      to: bandEnd,
      rate: band.rate,
      taxInBand: Math.round(bandIncome * band.rate * 100) / 100
    });

    remaining -= bandIncome;
    bandStart = bandEnd;

    if (remaining <= 0) {
      break;
    }
  }

  return ranges;
}

module.exports = {
  country: 'KE',
  countryName: 'Kenya',
  currency: 'KES',
  regimes: ['STANDARD'],
  lastUpdated: '2026-04-06',
  /* source-confidence-stamp:start */
  sourceCheckedOn: '2026-07-01',
  nextReviewDate: '2026-06-30',
  /* source-confidence-stamp:end */

  source: 'Kenya Revenue Authority (KRA)',

  calculate(params) {
    const {
      grossAnnual,
      nssf: inclNssf = true,
      shif: inclShif = true,
      ahl: inclAhl = false,
      personalRelief: inclPersonalRelief = true,
      insurancePremium = 0,
      voluntaryPension = 0,
      prmf = 0,
      mortgageInterest = 0,
      disability = false
    } = params;

    const monthlyGross = grossAnnual / 12;
    const monthly = kePayroll.calculateMonthlyPayroll(monthlyGross, {
      nssf: inclNssf,
      shif: inclShif,
      ahl: inclAhl,
      personalRelief: inclPersonalRelief,
      insurancePremium: insurancePremium / 12 || 0,
      voluntaryPension: voluntaryPension / 12 || 0,
      prmf: prmf / 12 || 0,
      mortgageInterest: mortgageInterest / 12 || 0,
      disability: disability
    });

    const annualNssf = monthly.nssf * 12;
    const annualShif = monthly.shif * 12;
    const annualAhl = monthly.ahl * 12;
    const annualVoluntaryPension = monthly.voluntaryPension * 12;
    const annualPrmf = monthly.prmf * 12;
    const annualGrossTax = monthly.grossTax * 12;
    const annualPaye = monthly.paye * 12;
    const annualEmployerNssf = monthly.employerNSSF * 12;
    const annualEmployerAhl = monthly.employerAHL * 12;

    const totalDeductions = annualNssf + annualShif + annualAhl + annualVoluntaryPension + annualPrmf + annualPaye;
    const netAnnual = grossAnnual - totalDeductions;

    return {
      input: { country: 'KE', grossAnnual, regime: 'STANDARD' },
      deductions: {
        nssf: Math.round(annualNssf),
        shif: Math.round(annualShif),
        ahl: Math.round(annualAhl),
        voluntaryPension: Math.round(annualVoluntaryPension),
        prmf: Math.round(annualPrmf),
        totalDeductions: Math.round(totalDeductions)
      },
      tax: {
        taxableIncome: Math.round(monthly.taxable * 12),
        bands: buildBandRanges(monthly.taxable),
        grossTax: Math.round(annualGrossTax * 100) / 100,
        reliefs: {
          personalRelief: Math.round(monthly.personalRelief * 12),
          insuranceRelief: Math.round(monthly.insuranceRelief * 12)
        },
        netTax: Math.round(annualPaye * 100) / 100
      },
      result: {
        netAnnual: Math.round(netAnnual * 100) / 100,
        netMonthly: Math.round((netAnnual / 12) * 100) / 100,
        effectiveRate: (annualPaye / grossAnnual * 100).toFixed(2) + '%',
        marginalRate: monthly.marginalRate + '%'
      },
      employer: {
        nssf: Math.round(annualEmployerNssf),
        ahl: Math.round(annualEmployerAhl),
        totalCostAnnual: Math.round(grossAnnual + annualEmployerNssf + annualEmployerAhl),
        totalCostMonthly: Math.round((grossAnnual + annualEmployerNssf + annualEmployerAhl) / 12)
      },
      meta: { regime: 'STANDARD', currency: 'KES', lastUpdated: this.lastUpdated, source: this.source }
    };
  },

  reverseCalculate(params) {
    const { netAnnual, ...opts } = params;
    let low = netAnnual;
    let high = netAnnual * 3;

    for (let i = 0; i < 60; i++) {
      const guess = (low + high) / 2;
      const result = this.calculate({ grossAnnual: guess, ...opts });
      if (Math.abs(result.result.netAnnual - netAnnual) < 1) return result;
      if (result.result.netAnnual < netAnnual) low = guess;
      else high = guess;
    }

    return this.calculate({ grossAnnual: (low + high) / 2, ...opts });
  },

  getOptions() {
    return {
      deductions: [
        { key: 'nssf', label: 'NSSF (6% up to KES 72,000/month)', default: true },
        { key: 'shif', label: 'SHIF (2.75%, min KES 300/month)', default: true },
        { key: 'ahl', label: 'Housing Levy (1.5% of gross, net-pay only)', default: false }
      ],
      regimes: [{ key: 'STANDARD', label: 'Standard PAYE', default: true }]
    };
  }
};

},
"netlify/functions/_engines/km-paye.js":function(module,exports,require){
'use strict';

const engine = require('../../../assets/js/engines/km-paye');

function round(value) { return Math.round(value); }

module.exports = {
  country: 'KM',
  countryName: 'Comoros',
  currency: 'KMF',
  regimes: ['STATUTORY_REFERENCE'],
  lastUpdated: '2026-07-22',
  sourceCheckedOn: '2026-07-22',
  nextReviewDate: '2026-10-22',
  source: engine.source.title,
  sourceUrl: engine.source.url,
  sourceCaveat: engine.source.caveat,
  formulaParameters: engine.formulaParameters,
  roundingPolicy: engine.roundingPolicy,

  calculate(params) {
    params = params || {};
    const grossMonthly = Number.isFinite(Number(params.grossMonthly))
      ? Number(params.grossMonthly)
      : Number(params.grossAnnual) / 12;
    const employeeContributionRate = params.employeeContributionRate == null
      ? 0
      : Number(params.employeeContributionRate);
    const value = engine.calculate({ grossMonthly, employeeContributionRate });
    if (!value.ok) throw new Error(value.error);

    return {
      input: {
        country: 'KM',
        grossMonthly: value.grossMonthly,
        grossAnnual: value.grossAnnual,
        employeeContributionRate: value.employeeContributionRate,
        regime: 'STATUTORY_REFERENCE'
      },
      deductions: {
        employeeContribution: round(value.employeeContributionAnnual),
        incomeTax: round(value.incomeTaxAnnual),
        totalDeductions: round(value.employeeContributionAnnual + value.incomeTaxAnnual)
      },
      tax: {
        incomeAfterContribution: round(value.incomeAfterContributionAnnual),
        professionalExpenseDeduction: round(value.professionalExpenseDeductionAnnual),
        taxableIncome: round(value.taxableAnnual),
        bands: value.bands.map(band => ({ from: band.from, to: band.to, rate: band.rate, taxInBand: round(band.tax) })),
        grossTax: round(value.incomeTaxAnnual),
        netTax: round(value.incomeTaxAnnual)
      },
      result: {
        netAnnual: round(value.netAnnual),
        netMonthly: round(value.netMonthly),
        effectiveRate: (value.effectiveDeductionRate * 100).toFixed(2) + '%'
      },
      meta: {
        currency: 'KMF',
        lastUpdated: this.lastUpdated,
        sourceCheckedOn: this.sourceCheckedOn,
        nextReviewDate: this.nextReviewDate,
        source: this.source,
        sourceUrl: this.sourceUrl,
        caveat: this.sourceCaveat
      }
    };
  },

  getOptions() {
    return {
      regimes: [{ key: 'STATUTORY_REFERENCE', label: 'CGI 2023 statutory-reference estimate', default: true }],
      inputs: [{ key: 'employeeContributionRate', label: 'Approved employee pension or social contribution rate', minimum: 0, maximum: 0.06, default: 0 }]
    };
  }
};

},
"netlify/functions/_engines/lr-paye.js":function(module,exports,require){
// Liberia PAYE — Sources: Liberia Revenue Authority resident natural-person table
// and the NASSCORP employer guide. PIT is assessed on annual gross income, while
// NASSCORP remains a separate employee deduction and employer cost.
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'LR', countryName: 'Liberia', currency: 'LRD',
  source: 'Liberia Revenue Authority (LRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-07-21',
  nextReviewDate: '2026-10-31',
  /* source-confidence-stamp:end */

  bands: [[70000,0],[130000,0.05],[600000,0.15],[Infinity,0.25]],
  ssDeductibleFromTaxable: false,
  socialSecurity: [{ key: 'nasscorp', label: 'NASSCORP (4%)', rate: 0.04 }],
  employerSS: [{ key: 'nasscorp', label: 'NASSCORP (6%)', rate: 0.06 }]
});

},
"netlify/functions/_engines/ls-paye.js":function(module,exports,require){
// Lesotho PAYE — Source: Revenue Services Lesotho (RSL), 2025/26
// Two bands: 20% on first M74,040 -> 30% above
// Tax credit: M11,640/yr applied after tax calculation

const { createEngine, calcProgressiveBands } = require('./_factory');

const base = createEngine({
  country: 'LS', countryName: 'Lesotho', currency: 'LSL',
  source: 'Revenue Services Lesotho (RSL)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-07-01',
  nextReviewDate: '2025-09-29',
  /* source-confidence-stamp:end */

  bands: [[74040,0.20],[Infinity,0.30]],
  socialSecurity: [],
  employerSS: []
});

// Override calculate to apply M11,640 tax credit
const origCalc = base.calculate.bind(base);
base.calculate = function(params) {
  const result = origCalc(params);
  const TAX_CREDIT = 11640;
  const grossTax = result.tax.grossTax;
  const netTax = Math.max(0, grossTax - TAX_CREDIT);
  const diff = result.tax.netTax - netTax;

  result.tax.reliefs = { taxCredit: TAX_CREDIT };
  result.tax.netTax = netTax;
  result.deductions.totalDeductions = Math.round(result.deductions.totalDeductions - diff);
  result.result.netAnnual = Math.round(result.result.netAnnual + diff);
  result.result.netMonthly = Math.round(result.result.netAnnual / 12);
  result.result.effectiveRate = (netTax / params.grossAnnual * 100).toFixed(2) + '%';
  return result;
};

module.exports = base;

},
"netlify/functions/_engines/ly-paye.js":function(module,exports,require){
// Libya PAYE — Source: PwC Tax Summaries (Dec 2025), Tax Authority of Libya
// Jihad Tax abolished Feb/Jul 2025 (Law 44 of 1970 declared unconstitutional)
// SS rates updated Jun 2022 per Mercans statutory alert
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'LY', countryName: 'Libya', currency: 'LYD',
  source: 'Tax Authority of Libya / PwC',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-01-01',
  nextReviewDate: '2025-04-01',
  /* source-confidence-stamp:end */

  bands: [[12000,0.05],[Infinity,0.10]],
  socialSecurity: [
    { key: 'ssf', label: 'Social Security (5.125%)', rate: 0.05125 },
    { key: 'suf', label: 'Social Unity Fund (1%)', rate: 0.01 }
  ],
  employerSS: [{ key: 'ssf', label: 'Social Security (14.35%)', rate: 0.1435 }]
});

},
"netlify/functions/_engines/ma-paye.js":function(module,exports,require){
// Morocco PAYE (IR) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'MA', countryName: 'Morocco', currency: 'MAD',
  source: 'Direction Générale des Impôts (DGI)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-01-01',
  nextReviewDate: '2025-04-01',
  /* source-confidence-stamp:end */

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

},
"netlify/functions/_engines/mg-paye.js":function(module,exports,require){
// Madagascar PAYE (IRSA) — Source: Direction Générale des Impôts
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'MG', countryName: 'Madagascar', currency: 'MGA',
  source: 'Direction Générale des Impôts',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-03-28',
  nextReviewDate: '2026-06-26',
  /* source-confidence-stamp:end */

  bands: [[350000,0],[250000,0.05],[250000,0.10],[7150000,0.15],[Infinity,0.20]],
  socialSecurity: [{ key: 'cnaps', label: 'CNaPS (1%)', rate: 0.01 }],
  employerSS: [{ key: 'cnaps', label: 'CNaPS (13%)', rate: 0.13 }]
});

},
"netlify/functions/_engines/ml-paye.js":function(module,exports,require){
// Mali PAYE (ITS) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'ML', countryName: 'Mali', currency: 'XOF',
  source: 'Direction Générale des Impôts (DGI)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-07-01',
  nextReviewDate: '2025-09-29',
  /* source-confidence-stamp:end */

  bands: [[300000,0],[600000,0.05],[1200000,0.13],[1800000,0.30],[Infinity,0.40]],
  socialSecurity: [{ key: 'inps', label: 'INPS (3.6%)', rate: 0.036 }],
  employerSS: [{ key: 'inps', label: 'INPS (20.4%)', rate: 0.204 }]
});

},
"netlify/functions/_engines/mr-paye.js":function(module,exports,require){
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

},
"netlify/functions/_engines/mu-paye.js":function(module,exports,require){
// Mauritius PAYE — Source: MRA, Budget 2025/26 (income year ending 30 Jun 2026)
// 2025/26 budget simplified from 7-band to 3-band system, threshold raised to Rs 500,000
// CSG tiered: 1.5% if salary ≤ Rs 50k/mo, 3% if > Rs 50k/mo — using 3% (most PAYE payers)
// NSF: 2.5% employee, 2.5% employer
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'MU', countryName: 'Mauritius', currency: 'MUR',
  source: 'Mauritius Revenue Authority (MRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-07-01',
  nextReviewDate: '2025-09-29',
  /* source-confidence-stamp:end */

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

},
"netlify/functions/_engines/mw-paye.js":function(module,exports,require){
// Malawi PAYE — Source: Malawi Revenue Authority (MRA), effective Jan 2026
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'MW', countryName: 'Malawi', currency: 'MWK',
  source: 'Malawi Revenue Authority (MRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-01-01',
  nextReviewDate: '2026-04-01',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[170000,0],[1400000,0.30],[8430000,0.35],[Infinity,0.40]],
  socialSecurity: [],
  employerSS: []
});

},
"netlify/functions/_engines/mz-paye.js":function(module,exports,require){
// Mozambique PAYE (IRPS) — Source: Autoridade Tributaria (AT), CIRPS Art. 54
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'MZ', countryName: 'Mozambique', currency: 'MZN',
  source: 'Autoridade Tributaria de Mocambique (AT)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-06',
  nextReviewDate: '2026-07-05',
  /* source-confidence-stamp:end */

  bands: [[42000,0.10],[126000,0.15],[336000,0.20],[1008000,0.25],[Infinity,0.32]],
  socialSecurity: [{ key: 'inss', label: 'INSS (3%)', rate: 0.03 }],
  employerSS: [{ key: 'inss', label: 'INSS (4%)', rate: 0.04 }]
});

},
"netlify/functions/_engines/na-paye.js":function(module,exports,require){
// Namibia PAYE — Source: Namibia Revenue Agency (NamRA), Mar 2025–Feb 2026
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'NA', countryName: 'Namibia', currency: 'NAD',
  source: 'Namibia Revenue Agency (NamRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-07-01',
  nextReviewDate: '2025-09-29',
  /* source-confidence-stamp:end */

  bands: [[100000,0],[50000,0.18],[200000,0.25],[200000,0.28],[300000,0.30],[700000,0.32],[Infinity,0.37]],
  socialSecurity: [{ key: 'ssc', label: 'SSC (0.9%)', rate: 0.009, cap: 99 }],
  employerSS: [{ key: 'ssc', label: 'SSC (0.9%)', rate: 0.009, cap: 99 }]
});

},
"netlify/functions/_engines/ne-paye.js":function(module,exports,require){
// Niger PAYE (IUTS) — Source: Direction Générale des Impôts (DGI)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'NE', countryName: 'Niger', currency: 'XOF',
  source: 'Direction Générale des Impôts (DGI)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-07-01',
  nextReviewDate: '2025-09-29',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[25000,0],[15000,0.02],[30000,0.10],[30000,0.15],[50000,0.20],[Infinity,0.35]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (5.25%)', rate: 0.0525 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (16.5%)', rate: 0.165 }]
});

},
"netlify/functions/_engines/ng-paye.js":function(module,exports,require){
// Nigeria PAYE Engine — extracted from AfroTools payslip generator
// Source: Federal Inland Revenue Service (FIRS)
// Supports PITA 2025 (old law) and NTA 2026 (new law)

// PITA 2025 bands (width-based progressive)
const BANDS_PITA = [[300000,0.07],[300000,0.11],[500000,0.15],[500000,0.19],[1600000,0.21],[Infinity,0.24]];

// NTA 2026 bands: 0% first 800K → 15% to 3M → 18% to 12M → 21% to 25M → 23% to 50M → 25% above
const BANDS_NTA = [[800000,0],[2200000,0.15],[9000000,0.18],[13000000,0.21],[25000000,0.23],[Infinity,0.25]];

function calcBands(taxable, bands) {
  let tax = 0, rem = taxable, detail = [], cumFrom = 0;
  for (const [width, rate] of bands) {
    const t = Math.min(rem, width);
    const inBand = t * rate;
    tax += inBand;
    detail.push({ from: cumFrom, to: cumFrom + (width === Infinity ? rem : width), rate, taxInBand: Math.round(inBand) });
    cumFrom += width === Infinity ? rem : width;
    rem -= t;
    if (rem <= 0) break;
  }
  return { tax, bands: detail };
}

function normalizeRegime(regime) {
  const normalized = String(regime || 'NTA_2026').trim().toLowerCase();
  if (['nta', 'nta_2026', 'nta2026', 'new'].includes(normalized)) return 'NTA_2026';
  if (['pita', 'pita_2025', 'pita2025', 'old'].includes(normalized)) return 'PITA_2025';
  return 'NTA_2026';
}

function explicitOrCalculated(value, calculated, label) {
  if (value === undefined || value === null || value === '') return calculated;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`${label} must be a non-negative number`);
  }
  return amount;
}

module.exports = {
  country: 'NG',
  countryName: 'Nigeria',
  currency: 'NGN',
  regimes: ['PITA_2025', 'NTA_2026'],
  lastUpdated: '2026-03-01',
  /* source-confidence-stamp:start */
  sourceCheckedOn: '2026-03-01',
  nextReviewDate: '2026-05-30',
  /* source-confidence-stamp:end */

  source: 'Federal Inland Revenue Service (FIRS)',

  calculate(params) {
    const {
      grossAnnual,
      regime = 'NTA_2026',
      pension: inclPension = true,
      nhf: inclNhf = true,
      nhis: inclNhis = false,
      pensionableEmoluments,
      pensionAmount,
      nhfAmount,
      nhisAmount,
      minimumWageExempt = false,
      annualRent = 0,
      lifeAssurance = 0,
      mortgageInterest = 0
    } = params;

    const normalizedRegime = normalizeRegime(regime);
    const bands = normalizedRegime === 'NTA_2026' ? BANDS_NTA : BANDS_PITA;
    let taxableIncome, cra = 0, rentRelief = 0;

    if (normalizedRegime === 'NTA_2026') {
      // NTA 2026: CRA abolished. Pension on pensionable emoluments (Basic+Housing+Transport), not total gross
      const pensionBase = pensionableEmoluments || grossAnnual;
      const pensionAmt = explicitOrCalculated(
        pensionAmount,
        inclPension ? pensionBase * 0.08 : 0,
        'pensionAmount'
      );
      const nhfAmt = explicitOrCalculated(
        nhfAmount,
        inclNhf ? grossAnnual * 0.025 : 0,
        'nhfAmount'
      );
      const nhisAmt = explicitOrCalculated(
        nhisAmount,
        inclNhis ? grossAnnual * 0.0175 : 0,
        'nhisAmount'
      );
      const mortgageRelief = explicitOrCalculated(
        mortgageInterest,
        0,
        'mortgageInterest'
      );
      const lifeAssuranceRelief = explicitOrCalculated(
        lifeAssurance,
        0,
        'lifeAssurance'
      );

      // Rent relief: lower of 20% of annual rent or ₦500,000
      if (annualRent > 0) {
        rentRelief = Math.min(annualRent * 0.20, 500000);
      }

      taxableIncome = Math.max(
        0,
        grossAnnual - pensionAmt - nhfAmt - nhisAmt - rentRelief -
          mortgageRelief - lifeAssuranceRelief
      );

      const { tax: grossTax, bands: bandDetail } = calcBands(taxableIncome, bands);
      const netTax = minimumWageExempt ? 0 : Math.round(grossTax);
      const totalDeductions = pensionAmt + nhfAmt + nhisAmt + netTax;
      const netAnnual = grossAnnual - totalDeductions;
      const empPension = pensionBase * 0.10;
      const empNhf = 0;

      return {
        input: { country: 'NG', grossAnnual, regime: normalizedRegime },
        deductions: {
          pension: Math.round(pensionAmt),
          nhf: Math.round(nhfAmt),
          nhis: Math.round(nhisAmt),
          rentRelief: Math.round(rentRelief),
          mortgageInterest: Math.round(mortgageRelief),
          lifeAssurance: Math.round(lifeAssuranceRelief),
          totalDeductions: Math.round(totalDeductions)
        },
        tax: { taxableIncome: Math.round(taxableIncome), bands: bandDetail, grossTax: Math.round(grossTax), reliefs: {}, netTax },
        result: {
          netAnnual: Math.round(netAnnual),
          netMonthly: Math.round(netAnnual / 12),
          effectiveRate: (netTax / grossAnnual * 100).toFixed(2) + '%',
          marginalRate: (bandDetail.filter(b => b.taxInBand > 0).pop()?.rate * 100 || 0) + '%'
        },
        employer: { pension: Math.round(empPension), nhf: Math.round(empNhf), totalCostAnnual: Math.round(grossAnnual + empPension), totalCostMonthly: Math.round((grossAnnual + empPension) / 12) },
        meta: { regime: normalizedRegime, currency: 'NGN', lastUpdated: this.lastUpdated, source: this.source }
      };
    } else {
      // PITA 2025: CRA = higher of ₦200,000 or 1% of gross, PLUS 20% of gross
      const pensionAmt = explicitOrCalculated(
        pensionAmount,
        inclPension ? grossAnnual * 0.08 : 0,
        'pensionAmount'
      );
      const nhfAmt = explicitOrCalculated(
        nhfAmount,
        inclNhf ? grossAnnual * 0.025 : 0,
        'nhfAmount'
      );
      const nhisAmt = explicitOrCalculated(
        nhisAmount,
        inclNhis ? grossAnnual * 0.0175 : 0,
        'nhisAmount'
      );

      cra = Math.max(200000, grossAnnual * 0.01) + grossAnnual * 0.20;
      taxableIncome = Math.max(0, grossAnnual - cra - pensionAmt);

      // Minimum tax: 1% of gross income
      const { tax: grossTax, bands: bandDetail } = calcBands(taxableIncome, bands);
      const minTax = grossAnnual * 0.01;
      const actualTax = Math.max(grossTax, minTax);
      const netTax = Math.round(actualTax);
      const totalDeductions = pensionAmt + nhfAmt + nhisAmt + netTax;
      const netAnnual = grossAnnual - totalDeductions;
      const empPension = grossAnnual * 0.10;
      const empNhf = 0;

      return {
        input: { country: 'NG', grossAnnual, regime: normalizedRegime },
        deductions: {
          pension: Math.round(pensionAmt),
          nhf: Math.round(nhfAmt),
          nhis: Math.round(nhisAmt),
          cra: Math.round(cra),
          totalDeductions: Math.round(totalDeductions)
        },
        tax: { taxableIncome: Math.round(taxableIncome), bands: bandDetail, grossTax: Math.round(grossTax), reliefs: { cra: Math.round(cra) }, netTax },
        result: {
          netAnnual: Math.round(netAnnual),
          netMonthly: Math.round(netAnnual / 12),
          effectiveRate: (netTax / grossAnnual * 100).toFixed(2) + '%',
          marginalRate: (bandDetail.filter(b => b.taxInBand > 0).pop()?.rate * 100 || 0) + '%'
        },
        employer: { pension: Math.round(empPension), nhf: Math.round(empNhf), totalCostAnnual: Math.round(grossAnnual + empPension), totalCostMonthly: Math.round((grossAnnual + empPension) / 12) },
        meta: { regime: normalizedRegime, currency: 'NGN', lastUpdated: this.lastUpdated, source: this.source }
      };
    }
  },

  reverseCalculate(params) {
    const { netAnnual, ...opts } = params;
    let lo = netAnnual, hi = netAnnual * 3;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      const r = this.calculate({ grossAnnual: mid, ...opts });
      if (Math.abs(r.result.netAnnual - netAnnual) < 1) return r;
      if (r.result.netAnnual < netAnnual) lo = mid; else hi = mid;
    }
    return this.calculate({ grossAnnual: (lo + hi) / 2, ...opts });
  },

  getOptions() {
    return {
      deductions: [
        { key: 'pension', label: 'Pension (8%)', default: true },
        { key: 'nhf', label: 'NHF (2.5%)', default: true },
        { key: 'nhis', label: 'NHIS (1.75%)', default: false }
      ],
      regimes: [
        { key: 'PITA_2025', label: 'PITA 2025 (Old Law)' },
        { key: 'NTA_2026', label: 'NTA 2026 (New Law)', default: true }
      ]
    };
  }
};

},
"netlify/functions/_engines/rw-paye.js":function(module,exports,require){
// Rwanda PAYE — Source: Rwanda Revenue Authority (RRA), Law No. 027/2019 as amended
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'RW', countryName: 'Rwanda', currency: 'RWF',
  source: 'Rwanda Revenue Authority (RRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-03-01',
  nextReviewDate: '2025-05-30',
  /* source-confidence-stamp:end */

  bands: [[720000,0],[480000,0.10],[1200000,0.20],[Infinity,0.30]],
  socialSecurity: [
    { key: 'pension', label: 'RSSB Pension (6%)', rate: 0.06 },
    { key: 'maternity', label: 'Maternity (0.3%)', rate: 0.003 }
  ],
  employerSS: [
    { key: 'pension', label: 'RSSB Pension (6%)', rate: 0.06 },
    { key: 'maternity', label: 'Maternity (0.3%)', rate: 0.003 }
  ]
});

},
"netlify/functions/_engines/sc-paye.js":function(module,exports,require){
// Seychelles PAYE — Source: Seychelles Revenue Commission (SRC), src.gov.sc
// 4 progressive monthly bands (citizens): 0%/15%/20%/30%, effective 1 Jun 2018
// SPF pension: 5% employee + 5% employer (since 1 Jan 2023)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'SC', countryName: 'Seychelles', currency: 'SCR',
  source: 'Seychelles Revenue Commission (SRC)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-07-01',
  nextReviewDate: '2025-09-29',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[8555.50,0],[1444.50,0.15],[73333,0.20],[Infinity,0.30]],
  socialSecurity: [{ key: 'spf', label: 'SPF Pension (5%)', rate: 0.05 }],
  employerSS: [{ key: 'spf', label: 'SPF Pension (5%)', rate: 0.05 }]
});

},
"netlify/functions/_engines/sd-paye.js":function(module,exports,require){
// Sudan PAYE — Source: Taxation Chamber
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'SD', countryName: 'Sudan', currency: 'SDG',
  source: 'Taxation Chamber',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-01-01',
  nextReviewDate: '2026-04-01',
  /* source-confidence-stamp:end */

  bands: [[Infinity,0.15]],  // Flat 15% rate
  socialSecurity: [{ key: 'nssf', label: 'Social Insurance (8%)', rate: 0.08 }],
  employerSS: [{ key: 'nssf', label: 'Social Insurance (17%)', rate: 0.17 }]
});

},
"netlify/functions/_engines/sl-paye.js":function(module,exports,require){
// Sierra Leone PAYE — Source: National Revenue Authority (NRA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'SL', countryName: 'Sierra Leone', currency: 'SLE',
  source: 'National Revenue Authority (NRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-01',
  nextReviewDate: '2026-06-30',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[600000,0],[500000,0.15],[500000,0.20],[500000,0.25],[Infinity,0.30]],
  socialSecurity: [{ key: 'nassit', label: 'NASSIT (5%)', rate: 0.05 }],
  employerSS: [{ key: 'nassit', label: 'NASSIT (10%)', rate: 0.10 }]
});

},
"netlify/functions/_engines/sn-paye.js":function(module,exports,require){
// Senegal PAYE (IR) — Source: Direction Générale des Impôts et des Domaines (DGID)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'SN', countryName: 'Senegal', currency: 'XOF',
  source: 'Ministère des Finances du Sénégal (IRPP) and DGTSS/IPRES (2024)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-07-28',
  sourceCheckedOn: '2026-07-28',
  nextReviewDate: '2026-10-28',
  /* source-confidence-stamp:end */

  // Progressive widths representing thresholds at 630k, 1.5m, 4m, 8m,
  // 13.5m and 25m XOF. The final band is 43%.
  bands: [[630000,0],[870000,0.20],[2500000,0.30],[4000000,0.35],[5500000,0.37],[11500000,0.40],[Infinity,0.43]],
  socialSecurity: [{ key: 'ipres', label: 'IPRES (5.6%)', rate: 0.056, baseCap: 432000 }],
  employerSS: [{ key: 'ipres', label: 'IPRES (8.4%)', rate: 0.084, baseCap: 432000 }]
});

},
"netlify/functions/_engines/so-paye.js":function(module,exports,require){
'use strict';
const engine = require('../../../assets/js/engines/so-paye');
function cents(value) { return Math.round(value * 100) / 100; }
module.exports = {
  country: 'SO', countryName: 'Somalia', currency: 'USD', regimes: ['RESIDENT_ADULT', 'NONRESIDENT', 'RESIDENT_UNDER_18'],
  lastUpdated: '2026-07-22',
  sourceCheckedOn: '2026-07-22',
  nextReviewDate: '2026-10-22',
  source: 'Federal Republic of Somalia Income Tax Law 2025, Income Tax Regulations 2025 and Ministry of Finance Income Tax Manual (November 2025)',
  formulaParameters: engine.formulaParameters, roundingPolicy: engine.roundingPolicy,
  calculate(params) {
    params = params || {};
    const grossMonthly = Number.isFinite(Number(params.grossMonthly)) ? Number(params.grossMonthly) : Number(params.grossAnnual) / 12;
    const category = params.category || 'resident-adult';
    const value = engine.calculate({ grossMonthly, category });
    if (!value.ok) throw new Error(value.error);
    return {
      input: { country: 'SO', grossMonthly, grossAnnual: grossMonthly * 12, category: value.category },
      deductions: { incomeTax: cents(value.taxAnnual), totalDeductions: cents(value.taxAnnual) },
      tax: { taxableIncome: cents(value.grossMonthly), bands: value.bands.map(b => ({ from: b.from, to: b.to, rate: b.rate, taxInBand: cents(b.tax) })), grossTax: cents(value.taxAnnual), netTax: cents(value.taxAnnual) },
      result: { netAnnual: cents(value.netAnnual), netMonthly: cents(value.netMonthly), effectiveRate: (value.effectiveRate * 100).toFixed(2) + '%' },
      employer: { totalCostAnnual: cents(value.grossAnnual), totalCostMonthly: cents(value.grossMonthly), note: 'No employer payroll contribution is modeled.' },
      meta: { currency: 'USD', scope: 'Federal Republic of Somalia income tax only', lastUpdated: this.lastUpdated, sourceCheckedOn: this.sourceCheckedOn, nextReviewDate: this.nextReviewDate, source: this.source }
    };
  },
  getOptions() { return { regimes: [{ key: 'RESIDENT_ADULT', value: 'resident-adult', label: 'Resident adult', default: true }, { key: 'NONRESIDENT', value: 'nonresident', label: 'Non-resident' }, { key: 'RESIDENT_UNDER_18', value: 'resident-under-18', label: 'Resident under 18' }] }; }
};

},
"netlify/functions/_engines/ss-paye.js":function(module,exports,require){
'use strict';
const engine = require('../../../assets/js/engines/ss-paye');
function round(value) { return Math.round(value); }
module.exports = {
  country: 'SS', countryName: 'South Sudan', currency: 'SSP', regimes: ['STANDARD'],
  lastUpdated: '2026-07-22',
  sourceCheckedOn: '2026-07-22',
  nextReviewDate: '2026-10-22',
  source: 'South Sudan Taxation Act 2009; Taxation Amendment Act 2012; Financial Act FY 2023/24; National Social Insurance Fund Act 2023',
  formulaParameters: engine.formulaParameters, roundingPolicy: engine.roundingPolicy,
  calculate(params) {
    params = params || {};
    const gross = Number.isFinite(Number(params.gross)) ? Number(params.gross) : Number(params.grossAnnual) / 12;
    const includeNsif = params.includeNsif !== false && params.nsif !== false;
    const value = engine.calculate({ gross, includeNsif });
    if (!value.ok) throw new Error(value.error);
    return {
      input: { country: 'SS', grossMonthly: gross, grossAnnual: gross * 12, includeNsif },
      deductions: { nsif: round(value.annual.employeeNsif), pit: round(value.annual.pit), pitSurtax: round(value.annual.surtax), totalDeductions: round(value.annual.employeeNsif + value.annual.totalTax) },
      tax: { taxableIncome: round(value.annual.taxableIncome), bands: value.bands.map(b => ({ from: b.from, to: b.to, rate: b.rate, taxInBand: round(b.tax) })), grossTax: round(value.annual.pit), surtax: round(value.annual.surtax), netTax: round(value.annual.totalTax) },
      result: { netAnnual: round(value.annual.net), netMonthly: round(value.net), effectiveRate: (value.effectiveDeductionRate * 100).toFixed(2) + '%' },
      employer: { nsif: round(value.annual.employerNsif), totalCostAnnual: round(value.annual.employerCost), totalCostMonthly: round(value.employerCost) },
      meta: { currency: 'SSP', lastUpdated: this.lastUpdated, sourceCheckedOn: this.sourceCheckedOn, nextReviewDate: this.nextReviewDate, source: this.source }
    };
  },
  getOptions() { return { deductions: [{ key: 'nsif', label: 'National Social Insurance Fund (8%)', default: true }], regimes: [{ key: 'STANDARD', label: 'Standard employment', default: true }] }; }
};

},
"netlify/functions/_engines/st-paye.js":function(module,exports,require){
'use strict';

const engine = require('../../../assets/js/engines/st-paye');

module.exports = {
  country: 'ST',
  countryName: 'Sao Tome and Principe',
  currency: 'STN',
  regimes: ['STANDARD'],
  lastUpdated: '2026-07-22',
  sourceCheckedOn: '2026-07-22',
  nextReviewDate: '2026-08-22',
  source: 'INSS Decreto-Lei 19/2022, Articles 101-102; Direccao dos Impostos IRS legislation catalogue and 2026 State Budget review',
  formulaParameters: {
    method: 'verified-contributions-only',
    employeeInssRate: 0.04,
    employerInssRate: 0.06,
    irsStatus: 'CURRENT_SCHEDULE_UNCONFIRMED',
    irsCalculated: false
  },
  calculate(params) {
    params = params || {};
    const grossAnnual = Number(params.grossAnnual);
    const result = engine.calculate({ grossMonthly: grossAnnual / 12 });
    if (!result.ok) throw new Error(result.error);
    return {
      input: { country: 'ST', grossAnnual },
      deductions: {
        inssEmployee: result.employeeInssAnnual,
        totalDeductions: result.employeeInssAnnual,
        totalVerifiedDeductions: result.employeeInssAnnual
      },
      tax: {
        status: result.irsStatus,
        taxableIncome: null,
        grossTax: null,
        netTax: null
      },
      result: {
        afterEmployeeInssAnnual: result.afterEmployeeInssAnnual,
        afterEmployeeInssMonthly: result.afterEmployeeInssMonthly,
        netAnnual: null,
        netMonthly: null
      },
      employer: {
        inssEmployer: result.employerInssAnnual,
        totalCostAnnual: result.employerCostAnnual,
        totalCostMonthly: result.employerCostMonthly
      },
      meta: {
        currency: 'STN',
        lastUpdated: this.lastUpdated,
        sourceCheckedOn: this.sourceCheckedOn,
        nextReviewDate: this.nextReviewDate,
        source: this.source,
        warning: 'IRS is intentionally not calculated because the current official withholding schedule could not be confirmed.'
      }
    };
  },
  reverseCalculate() {
    throw new Error('Reverse calculation is unavailable while the current IRS schedule is unconfirmed.');
  },
  getOptions() {
    return { regimes: [{ key: 'STANDARD', label: 'Employee', default: true }], deductions: [] };
  }
};

},
"netlify/functions/_engines/sz-paye.js":function(module,exports,require){
// Eswatini PAYE — Source: Eswatini Revenue Authority (ERA)
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'SZ', countryName: 'Eswatini', currency: 'SZL',
  source: 'Eswatini Revenue Authority (ERA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-07-01',
  nextReviewDate: '2025-09-29',
  /* source-confidence-stamp:end */

  bands: [[100000,0.20],[50000,0.25],[50000,0.30],[Infinity,0.33]],
  socialSecurity: [{ key: 'enpf', label: 'ENPF (5%)', rate: 0.05, cap: 215 }],
  employerSS: [{ key: 'enpf', label: 'ENPF (5%)', rate: 0.05, cap: 215 }]
});

},
"netlify/functions/_engines/td-paye.js":function(module,exports,require){
// Chad PAYE (IRPP) — Source: Direction Générale des Impôts
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'TD', countryName: 'Chad', currency: 'XAF',
  source: 'Direction Générale des Impôts',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-04-06',
  nextReviewDate: '2026-07-05',
  /* source-confidence-stamp:end */

  bands: [[300000,0],[500000,0.10],[1000000,0.15],[2000000,0.20],[5000000,0.25],[Infinity,0.35]],
  socialSecurity: [{ key: 'cnps', label: 'CNPS (3.5%)', rate: 0.035 }],
  employerSS: [{ key: 'cnps', label: 'CNPS (16.5%)', rate: 0.165 }]
});

},
"netlify/functions/_engines/tg-paye.js":function(module,exports,require){
'use strict';

const engine = require('../../../assets/js/engines/tg-paye');

function round(value) { return Math.round(value); }

module.exports = {
  country: 'TG',
  countryName: 'Togo',
  currency: 'XOF',
  regimes: ['STANDARD'],
  lastUpdated: '2026-07-22',
  sourceCheckedOn: '2026-07-22',
  nextReviewDate: '2026-10-22',
  source: 'OTR Code general des impots et Livre des procedures fiscales, consolidated 2025, Articles 26 and 72-74; CNSS Togo contribution rules',
  formulaParameters: {
    method: 'annual-employment-income',
    employeeCnssRate: 0.04,
    employerCnssRate: 0.175,
    professionalDeduction: { rate: 0.28, cap: 10000000 },
    dependentReliefAnnual: 120000,
    maximumDependents: 6,
    taxableRounding: 'down-to-1000-XOF',
    taxRounding: 'down-to-10-XOF',
    bands: engine.bands
  },
  roundingPolicy: {
    method: 'statutory-stage-rounding',
    stages: ['annual taxable income down to XOF 1,000', 'annual tax down to XOF 10']
  },
  calculate(params) {
    params = params || {};
    const grossAnnual = Number(params.grossAnnual);
    const dependents = Number(params.dependents || 0);
    const result = engine.calculate({ grossAnnual, dependents });
    if (!result.ok) throw new Error(result.error);
    return {
      input: { country: 'TG', grossAnnual, dependents: result.dependents },
      deductions: {
        cnssEmployee: round(result.employeeCnssAnnual),
        professionalDeduction: round(result.professionalDeduction),
        dependentRelief: round(result.dependentRelief),
        totalDeductions: round(result.employeeCnssAnnual + result.payeAnnual)
      },
      tax: {
        taxableIncome: result.taxableIncome,
        bands: result.bands.map(band => ({ from: band.from, to: band.to, rate: band.rate, taxInBand: round(band.tax) })),
        grossTax: result.payeAnnual,
        reliefs: { dependents: round(result.dependentRelief) },
        netTax: result.payeAnnual
      },
      result: {
        netAnnual: round(result.netAnnual),
        netMonthly: round(result.netMonthly),
        effectiveRate: (result.effectiveTaxRate * 100).toFixed(2) + '%',
        effectiveDeductionRate: (result.effectiveDeductionRate * 100).toFixed(2) + '%'
      },
      employer: {
        cnssEmployer: round(result.employerCnssAnnual),
        totalCostAnnual: round(result.employerCostAnnual),
        totalCostMonthly: round(result.employerCostMonthly)
      },
      meta: {
        currency: 'XOF',
        lastUpdated: this.lastUpdated,
        sourceCheckedOn: this.sourceCheckedOn,
        nextReviewDate: this.nextReviewDate,
        source: this.source
      }
    };
  },
  reverseCalculate(params) {
    params = params || {};
    const result = engine.reverse({ netAnnual: Number(params.netAnnual), dependents: params.dependents });
    if (!result.ok) throw new Error(result.error);
    return this.calculate({ grossAnnual: result.grossAnnual, dependents: result.dependents });
  },
  getOptions() {
    return {
      regimes: [{ key: 'STANDARD', label: 'Employee', default: true }],
      deductions: [{ key: 'dependents', label: 'Qualifying dependents', min: 0, max: 6, default: 0 }]
    };
  }
};

},
"netlify/functions/_engines/tn-paye.js":function(module,exports,require){
// Tunisia PAYE (IRPP) — Source: Direction Générale des Impôts
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'TN', countryName: 'Tunisia', currency: 'TND',
  source: 'Direction Générale des Impôts',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2026-03-28',
  nextReviewDate: '2026-06-26',
  /* source-confidence-stamp:end */

  bands: [[5000,0],[15000,0.26],[15000,0.28],[15000,0.32],[Infinity,0.35]],
  socialSecurity: [{ key: 'cnss', label: 'CNSS (9.18%)', rate: 0.0918 }],
  employerSS: [{ key: 'cnss', label: 'CNSS (16.57%)', rate: 0.1657 }]
});

},
"netlify/functions/_engines/tz-paye.js":function(module,exports,require){
// Tanzania PAYE — Source: Tanzania Revenue Authority (TRA)
// Monthly bands: 0% first 270K → 8% to 520K → 20% to 760K → 25% to 1M → 30% above
// NSSF: 10% employee, 10% employer
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'TZ', countryName: 'Tanzania', currency: 'TZS',
  source: 'Tanzania Revenue Authority (TRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-07-01',
  nextReviewDate: '2025-09-29',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bands: [[270000,0],[250000,0.08],[240000,0.20],[240000,0.25],[Infinity,0.30]],
  socialSecurity: [{ key: 'nssf', label: 'NSSF (10%)', rate: 0.10 }],
  employerSS: [{ key: 'nssf', label: 'NSSF (10%)', rate: 0.10 }]
});

},
"netlify/functions/_engines/ug-paye.js":function(module,exports,require){
'use strict';

const engine = require('../../../assets/js/engines/ug-paye');
function round(value) { return Math.round(value); }

module.exports = {
  country: 'UG', countryName: 'Uganda', currency: 'UGX', regimes: engine.regimes,
  lastUpdated: '2026-09-16', sourceCheckedOn: '2026-09-16', nextReviewDate: '2026-12-16',
  source: 'URA notice of 7 September 2026: resident PAYE rates effective 1 July 2026, checked 16 September 2026 (https://ura.go.ug/en/changes-to-paye-return-form-following-the-income-tax-amendment-act-2026/); non-resident schedule, NSSF and KCCA Local Service Tax assessed from monthly gross salary and deducted before PAYE retain their 2 August 2026 review basis',
  formulaParameters: engine.formulaParameters, roundingPolicy: engine.roundingPolicy,
  calculate(params) {
    params = params || {};
    const grossMonthly = Number.isFinite(Number(params.grossMonthly)) ? Number(params.grossMonthly) : Number(params.grossAnnual) / 12;
    const value = engine.calculate({ grossMonthly, regime: params.regime, nssfEnabled: params.nssf !== false, lstEnabled: params.lst === true, lstPayrollDeduction: params.lstPayrollDeduction });
    if (!value.ok) throw new Error(value.error);
    return {
      input: { country: 'UG', grossMonthly, grossAnnual: grossMonthly * 12, regime: value.regime, lst: value.lstEnabled, nssf: params.nssf !== false },
      deductions: { nssfEmployee: round(value.employeeNssfAnnual), localServiceTax: round(value.lstAnnual), localServiceTaxCurrentPayroll: round(value.lstPayrollDeduction), localServiceTaxCollectionSchedule: value.lstCollectionSchedule.map(round), paye: round(value.annualPaye), totalDeductions: round(value.employeeNssfAnnual + value.lstAnnual + value.annualPaye) },
      tax: { taxableIncomeMonthly: round(value.taxableIncome), lstAssessmentGross: round(value.lstAssessmentGross), bands: value.bands.map((band) => ({ from: band.from, to: band.to, rate: band.rate, taxInBand: round(band.tax) })), grossTax: round(value.annualPaye), netTax: round(value.annualPaye) },
      result: { netAnnual: round(value.netAnnual), netMonthly: round(value.netMonthly), effectiveRate: (value.effectiveDeductionRate * 100).toFixed(2) + '%' },
      employer: { nssfEmployer: round(value.employerNssfAnnual), contributionRate: engine.employerNssfRate, totalCostAnnual: round(value.employerCostAnnual), totalCostMonthly: round(value.employerCostMonthly) },
      meta: { currency: 'UGX', lastUpdated: this.lastUpdated, sourceCheckedOn: this.sourceCheckedOn, nextReviewDate: this.nextReviewDate, source: this.source }
    };
  },
  getOptions() {
    return { regimes: [{ key: 'RESIDENT', label: 'Resident', default: true }, { key: 'NON_RESIDENT', label: 'Non-resident' }], deductions: [{ key: 'nssf', label: 'NSSF employee 5% and employer 10%', default: true }, { key: 'lst', label: 'Local Service Tax assessed from monthly gross salary and deducted before PAYE', default: false }] };
  }
};

},
"netlify/functions/_engines/za-paye.js":function(module,exports,require){
// South Africa PAYE Engine — extracted from AfroTools payslip generator
// Source: South African Revenue Service (SARS) 2025/2026

const ANNUAL_BRACKETS = [[237100,0.18],[370500,0.26],[512800,0.31],[673000,0.36],[857900,0.39],[1817000,0.41],[Infinity,0.45]];

// Rebates by age
const REBATES = { primary: 17235, secondary: 9444, tertiary: 3145 };
// Tax thresholds by age (income below threshold = no tax)
const THRESHOLDS = { under65: 95750, age65to74: 148217, age75plus: 165689 };

const UIF_RATE = 0.01;
const UIF_MONTHLY_CAP = 177.12;

function calcBands(annual, brackets) {
  let tax = 0, prev = 0, detail = [];
  for (const [threshold, rate] of brackets) {
    const t = Math.min(annual, threshold) - prev;
    if (t > 0) {
      const inBand = t * rate;
      tax += inBand;
      detail.push({ from: prev, to: Math.min(annual, threshold), rate, taxInBand: Math.round(inBand) });
    }
    prev = threshold;
    if (annual <= threshold) break;
  }
  return { tax, bands: detail };
}

module.exports = {
  country: 'ZA',
  countryName: 'South Africa',
  currency: 'ZAR',
  regimes: ['STANDARD'],
  lastUpdated: '2026-03-01',
  /* source-confidence-stamp:start */
  sourceCheckedOn: '2025-03-01',
  nextReviewDate: '2025-05-30',
  /* source-confidence-stamp:end */

  source: 'South African Revenue Service (SARS)',

  calculate(params) {
    const { grossAnnual, uif: inclUif = true, age = 35, retirement = 0 } = params;
    const monthly = grossAnnual / 12;

    // Determine rebate and threshold based on age
    let rebate = REBATES.primary;
    let threshold = THRESHOLDS.under65;
    if (age >= 75) {
      rebate = REBATES.primary + REBATES.secondary + REBATES.tertiary;
      threshold = THRESHOLDS.age75plus;
    } else if (age >= 65) {
      rebate = REBATES.primary + REBATES.secondary;
      threshold = THRESHOLDS.age65to74;
    }

    // If income is below threshold, no tax
    const uifAmt = inclUif ? Math.min(monthly * UIF_RATE, UIF_MONTHLY_CAP) * 12 : 0;

    // Retirement fund deduction (limited to 27.5% of taxable income, capped at R350,000/yr)
    const retirementDeduction = Math.min(retirement, grossAnnual * 0.275, 350000);
    const taxableIncome = Math.max(0, grossAnnual - retirementDeduction);

    const { tax: grossTax, bands: bandDetail } = calcBands(taxableIncome, ANNUAL_BRACKETS);

    let netTax = 0;
    if (grossAnnual > threshold) {
      netTax = Math.max(0, Math.round(grossTax - rebate));
    }

    const totalDeductions = uifAmt + netTax;
    const netAnnual = grossAnnual - totalDeductions;
    const empUif = inclUif ? Math.min(monthly * UIF_RATE, UIF_MONTHLY_CAP) * 12 : 0;

    const reliefs = { primaryRebate: REBATES.primary };
    if (age >= 65) reliefs.secondaryRebate = REBATES.secondary;
    if (age >= 75) reliefs.tertiaryRebate = REBATES.tertiary;

    return {
      input: { country: 'ZA', grossAnnual, regime: 'STANDARD', age },
      deductions: { uif: Math.round(uifAmt), totalDeductions: Math.round(totalDeductions) },
      tax: { taxableIncome: Math.round(taxableIncome), bands: bandDetail, grossTax: Math.round(grossTax), reliefs, netTax },
      result: {
        netAnnual: Math.round(netAnnual),
        netMonthly: Math.round(netAnnual / 12),
        effectiveRate: (netTax / grossAnnual * 100).toFixed(2) + '%',
        marginalRate: (bandDetail.filter(b => b.taxInBand > 0).pop()?.rate * 100 || 0) + '%'
      },
      employer: { uif: Math.round(empUif), sdl: Math.round(grossAnnual * 0.01), totalCostAnnual: Math.round(grossAnnual + empUif + grossAnnual * 0.01), totalCostMonthly: Math.round((grossAnnual + empUif + grossAnnual * 0.01) / 12) },
      meta: { regime: 'STANDARD', currency: 'ZAR', lastUpdated: this.lastUpdated, source: this.source }
    };
  },

  reverseCalculate(params) {
    const { netAnnual, ...opts } = params;
    let lo = netAnnual, hi = netAnnual * 3;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      const r = this.calculate({ grossAnnual: mid, ...opts });
      if (Math.abs(r.result.netAnnual - netAnnual) < 1) return r;
      if (r.result.netAnnual < netAnnual) lo = mid; else hi = mid;
    }
    return this.calculate({ grossAnnual: (lo + hi) / 2, ...opts });
  },

  getOptions() {
    return {
      deductions: [
        { key: 'uif', label: 'UIF (1%, cap R177.12/mo)', default: true }
      ],
      regimes: [{ key: 'STANDARD', label: 'SARS 2025/26', default: true }]
    };
  }
};

},
"netlify/functions/_engines/zm-paye.js":function(module,exports,require){
// Zambia PAYE — ZRA 2026 bands and NAPSA 2026 contribution ceiling.
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'ZM', countryName: 'Zambia', currency: 'ZMW',
  source: 'Zambia Revenue Authority (ZRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-09-15',
  sourceCheckedOn: '2026-09-15',
  nextReviewDate: '2026-12-14',
  /* source-confidence-stamp:end */

  isMonthly: true,
  ssDeductibleFromTaxable: false,
  bands: [[5100,0],[2000,0.20],[2100,0.30],[Infinity,0.37]],
  socialSecurity: [
    { key: 'napsa', label: 'NAPSA (5%)', rate: 0.05, cap: 1861.80 },
    { key: 'nhima', label: 'NHIMA (1% of basic salary)', rate: 0.01, baseAnnualKey: 'basicAnnual' }
  ],
  employerSS: [
    { key: 'napsa', label: 'NAPSA (5%)', rate: 0.05, cap: 1861.80 },
    { key: 'nhima', label: 'NHIMA (1% of basic salary)', rate: 0.01, baseAnnualKey: 'basicAnnual' }
  ]
});

},
"netlify/functions/_engines/zw-paye.js":function(module,exports,require){
// Zimbabwe PAYE — Source: Zimbabwe Revenue Authority (ZIMRA), 2025 Tax Tables
const { createEngine } = require('./_factory');
module.exports = createEngine({
  country: 'ZW', countryName: 'Zimbabwe', currency: 'USD',
  source: 'Zimbabwe Revenue Authority (ZIMRA)',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-03-01',
  sourceCheckedOn: '2025-07-01',
  nextReviewDate: '2025-09-29',
  /* source-confidence-stamp:end */

  bands: [[6000,0],[6000,0.20],[24000,0.25],[24000,0.30],[60000,0.35],[Infinity,0.40]],
  socialSecurity: [{ key: 'nssa', label: 'NSSA (3.5%)', rate: 0.035 }],
  employerSS: [{ key: 'nssa', label: 'NSSA (3.5%)', rate: 0.035 }]
});

},
"netlify/functions/_engines/_factory.js":function(module,exports,require){
// Shared factory for creating PAYE engines with standard progressive band structure
// Used by countries where we apply a standard progressive tax calculation

function calcProgressiveBands(amount, bands) {
  let tax = 0, rem = amount, detail = [], cumFrom = 0;
  for (const [width, rate] of bands) {
    const t = Math.min(rem, width);
    const inBand = t * rate;
    tax += inBand;
    detail.push({ from: cumFrom, to: cumFrom + (width === Infinity ? rem : width), rate, taxInBand: Math.round(inBand) });
    cumFrom += width === Infinity ? rem : width;
    rem -= t;
    if (rem <= 0) break;
  }
  return { tax, bands: detail };
}

function calcCumulativeBands(amount, brackets) {
  let tax = 0, prev = 0, detail = [];
  for (const [threshold, rate] of brackets) {
    const t = Math.min(amount, threshold) - prev;
    if (t > 0) {
      const inBand = t * rate;
      tax += inBand;
      detail.push({ from: prev, to: Math.min(amount, threshold), rate, taxInBand: Math.round(inBand) });
    }
    prev = threshold;
    if (amount <= threshold) break;
  }
  return { tax, bands: detail };
}

function createEngine(config) {
  const {
    country, countryName, currency, source,
    lastUpdated = '2026-03-01', sourceCheckedOn = null, nextReviewDate = null,
    bands, bandType = 'progressive', // 'progressive' (width-based) or 'cumulative' (threshold-based)
    isMonthly = false, // if bands are monthly, multiply result by 12
    ssDeductibleFromTaxable = true,
    taxFreeAllowance = 0, // in the same period as the bands
    taxableRoundingStep = null, // optional statutory round-down step
    socialSecurity = [], // [{key, label, rate, cap, default}]
    employerSS = [], // [{key, label, rate, cap}]
    personalRelief = 0,
    regimes = ['STANDARD']
  } = config;

  return {
    country,
    countryName,
    currency,
    regimes,
    lastUpdated,
    sourceCheckedOn,
    nextReviewDate,
    source,
    formulaParameters: {
      bandType,
      isMonthly,
      ...(ssDeductibleFromTaxable ? {} : { ssDeductibleFromTaxable }),
      ...(taxFreeAllowance ? { taxFreeAllowance } : {}),
      ...(taxableRoundingStep ? { taxableRoundingStep } : {}),
      bands,
      socialSecurity,
      employerSS,
      personalRelief,
      regimes
    },
    roundingPolicy: {
      method: 'nearest-integer',
      stages: [
        'individual statutory deductions',
        'tax per band in the result breakdown',
        'annual net tax after relief',
        'annual and monthly net result',
        'employer contribution totals'
      ],
      calculationNote: 'Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.'
    },

    calculate(params) {
      const { grossAnnual, ...opts } = params;
      const contributionAssumptions = [];
      function contributionBase(rule) {
        let annualBase = grossAnnual;
        if (rule.baseAnnualKey) {
          const supplied = params[rule.baseAnnualKey];
          if (supplied == null || supplied === '') {
            const assumption = `${rule.baseAnnualKey} not supplied; gross annual salary is used as the contribution base.`;
            if (!contributionAssumptions.includes(assumption)) contributionAssumptions.push(assumption);
          } else {
            annualBase = Number(supplied);
            if (!Number.isFinite(annualBase) || annualBase < 0 || annualBase > grossAnnual) {
              throw new RangeError(`${rule.baseAnnualKey} must be between zero and grossAnnual.`);
            }
          }
        }
        const periodBase = isMonthly ? annualBase / 12 : annualBase;
        return rule.baseCap ? Math.min(periodBase, rule.baseCap * (isMonthly ? 1 : 12)) : periodBase;
      }

      // Calculate social security deductions
      let totalSS = 0;
      const deductions = {};
      for (const ss of socialSecurity) {
        if (opts[ss.key] === false) { deductions[ss.key] = 0; continue; }
        const base = contributionBase(ss);
        let amt = base * ss.rate;
        if (ss.cap) amt = Math.min(amt, ss.cap * (isMonthly ? 1 : 12));
        if (isMonthly) amt *= 12;
        deductions[ss.key] = Math.round(amt);
        totalSS += amt;
      }

      // Calculate taxable income
      const taxable = Math.max(0, ssDeductibleFromTaxable ? grossAnnual - totalSS : grossAnnual);
      const periodTaxable = Math.max(0, (isMonthly ? taxable / 12 : taxable) - taxFreeAllowance);
      const calcAmount = taxableRoundingStep
        ? Math.floor(periodTaxable / taxableRoundingStep) * taxableRoundingStep
        : periodTaxable;

      // Calculate tax
      const calcFn = bandType === 'cumulative' ? calcCumulativeBands : calcProgressiveBands;
      const { tax: rawTax, bands: bandDetail } = calcFn(calcAmount, bands);
      const annualTax = isMonthly ? rawTax * 12 : rawTax;
      const relief = isMonthly ? personalRelief * 12 : personalRelief;
      const netTax = Math.max(0, Math.round(annualTax - relief));

      const totalDeductions = totalSS + netTax;
      deductions.totalDeductions = Math.round(totalDeductions);
      const netAnnual = grossAnnual - totalDeductions;

      // Employer costs
      let empTotal = 0;
      const employer = {};
      for (const es of employerSS) {
        const base = contributionBase(es);
        let amt = base * es.rate;
        if (es.cap) amt = Math.min(amt, es.cap * (isMonthly ? 1 : 12));
        if (isMonthly) amt *= 12;
        employer[es.key] = Math.round(amt);
        empTotal += amt;
      }
      employer.totalCostAnnual = Math.round(grossAnnual + empTotal);
      employer.totalCostMonthly = Math.round((grossAnnual + empTotal) / 12);

      const lastBand = bandDetail.filter(b => b.taxInBand > 0).pop();

      return {
        input: { country, grossAnnual, regime: regimes[0] },
        deductions,
        tax: {
          taxableIncome: Math.round(isMonthly ? calcAmount * 12 : calcAmount),
          bands: bandDetail,
          grossTax: Math.round(annualTax),
          reliefs: relief > 0 ? { personalRelief: relief } : {},
          netTax
        },
        result: {
          netAnnual: Math.round(netAnnual),
          netMonthly: Math.round(netAnnual / 12),
          effectiveRate: (netTax / grossAnnual * 100).toFixed(2) + '%',
          marginalRate: lastBand ? (lastBand.rate * 100) + '%' : '0%'
        },
        employer,
        meta: { regime: regimes[0], currency, lastUpdated, sourceCheckedOn, nextReviewDate, source,
          ...(contributionAssumptions.length ? { assumptions: contributionAssumptions } : {}) }
      };
    },

    reverseCalculate(params) {
      const { netAnnual, ...opts } = params;
      let lo = netAnnual, hi = netAnnual * 3;
      for (const rule of [...socialSecurity, ...employerSS]) {
        if (rule.baseAnnualKey && opts[rule.baseAnnualKey] != null && opts[rule.baseAnnualKey] !== '') {
          const base = Number(opts[rule.baseAnnualKey]);
          if (!Number.isFinite(base) || base < 0) throw new RangeError(`${rule.baseAnnualKey} must be non-negative.`);
          lo = Math.max(lo, base);
        }
      }
      if (lo > netAnnual) {
        if (this.calculate({ grossAnnual: lo, ...opts }).result.netAnnual > netAnnual) {
          throw new RangeError('The supplied basic salary is too high for the requested net salary.');
        }
        hi = Math.max(hi, lo * 2);
      }
      for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2;
        const r = this.calculate({ grossAnnual: mid, ...opts });
        if (Math.abs(r.result.netAnnual - netAnnual) < 1) return r;
        if (r.result.netAnnual < netAnnual) lo = mid; else hi = mid;
      }
      return this.calculate({ grossAnnual: (lo + hi) / 2, ...opts });
    },

    getOptions() {
      return {
        deductions: socialSecurity.map(s => ({ key: s.key, label: s.label, default: s.default !== false })),
        regimes: regimes.map((r, i) => ({ key: r, label: r.replace(/_/g, ' '), default: i === 0 }))
      };
    }
  };
}

module.exports = { createEngine, calcProgressiveBands, calcCumulativeBands };

},
"assets/js/engines/bj-paye.js":function(module,exports,require){
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.beninPaye = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var EMPLOYEE_CNSS_RATE = 0.036;
  var EMPLOYER_FAMILY_RATE = 0.09;
  var EMPLOYER_PENSION_RATE = 0.064;
  var MIN_RISK_RATE = 0.01;
  var MAX_RISK_RATE = 0.04;
  var BANDS = [
    { width: 60000, rate: 0 },
    { width: 90000, rate: 0.10 },
    { width: 100000, rate: 0.15 },
    { width: 250000, rate: 0.19 },
    { width: Infinity, rate: 0.30 }
  ];

  function normalizeMonth(value) {
    return value === 'march' || value === 'june' ? value : 'standard';
  }

  function normalizeRiskRate(value) {
    var rate = Number(value);
    if (!Number.isFinite(rate)) rate = MIN_RISK_RATE;
    return Math.min(MAX_RISK_RATE, Math.max(MIN_RISK_RATE, rate));
  }

  function taxMonthly(taxableIncome) {
    var remaining = Math.max(0, Number(taxableIncome) || 0);
    var tax = 0;
    var from = 0;
    var bands = [];
    BANDS.forEach(function (band) {
      if (remaining <= 0) return;
      var income = Math.min(remaining, band.width);
      var bandTax = income * band.rate;
      bands.push({ from: from, to: band.width === Infinity ? null : from + band.width, rate: band.rate, income: income, tax: bandTax });
      tax += bandTax;
      remaining -= income;
      if (band.width !== Infinity) from += band.width;
    });
    return { tax: tax, bands: bands };
  }

  function broadcastLevy(month, taxableIncome) {
    if (month === 'march') return taxableIncome > 0 ? 1000 : 0;
    if (month === 'june') return taxableIncome > 60000 ? 3000 : 0;
    return 0;
  }

  function calculate(input) {
    input = input || {};
    var grossMonthly = Number(input.grossMonthly);
    if (!Number.isFinite(grossMonthly) || grossMonthly < 0) return { ok: false, error: 'Enter a monthly gross salary of zero or more.' };
    var month = normalizeMonth(input.month);
    var riskRate = normalizeRiskRate(input.riskRate);
    var taxBaseMonthly = grossMonthly;
    var its = taxMonthly(taxBaseMonthly);
    var ortbLevy = broadcastLevy(month, taxBaseMonthly);
    var employeeCnssMonthly = grossMonthly * EMPLOYEE_CNSS_RATE;
    var employerRate = EMPLOYER_FAMILY_RATE + EMPLOYER_PENSION_RATE + riskRate;
    var employerCnssMonthly = grossMonthly * employerRate;
    var itsMonthly = its.tax + ortbLevy;
    var netMonthly = grossMonthly - employeeCnssMonthly - itsMonthly;
    var annualOrtb = grossMonthly > 0 ? 1000 : 0;
    if (grossMonthly > 60000) annualOrtb += 3000;
    var itsAnnual = its.tax * 12 + annualOrtb;
    return {
      ok: true,
      month: month,
      grossMonthly: grossMonthly,
      grossAnnual: grossMonthly * 12,
      taxBaseMonthly: taxBaseMonthly,
      employeeCnssMonthly: employeeCnssMonthly,
      employeeCnssAnnual: employeeCnssMonthly * 12,
      riskRate: riskRate,
      employerRate: employerRate,
      employerCnssMonthly: employerCnssMonthly,
      employerCnssAnnual: employerCnssMonthly * 12,
      baseItsMonthly: its.tax,
      ortbLevy: ortbLevy,
      itsMonthly: itsMonthly,
      itsAnnual: itsAnnual,
      annualOrtb: annualOrtb,
      bands: its.bands,
      netMonthly: netMonthly,
      netAnnual: grossMonthly * 12 - employeeCnssMonthly * 12 - itsAnnual,
      employerCostMonthly: grossMonthly + employerCnssMonthly,
      employerCostAnnual: (grossMonthly + employerCnssMonthly) * 12,
      effectiveDeductionRate: grossMonthly ? (employeeCnssMonthly + itsMonthly) / grossMonthly : 0
    };
  }

  function reverse(input) {
    input = input || {};
    var target = Number(input.netMonthly);
    if (!Number.isFinite(target) || target <= 0) return { ok: false, error: 'Enter a monthly net salary greater than zero.' };
    var low = target;
    var high = Math.max(target * 3, 1000000);
    var result;
    for (var index = 0; index < 80; index += 1) {
      var gross = (low + high) / 2;
      result = calculate({ grossMonthly: gross, month: input.month, riskRate: input.riskRate });
      if (Math.abs(result.netMonthly - target) < 0.01) return result;
      if (result.netMonthly < target) low = gross; else high = gross;
    }
    return result;
  }

  return {
    bands: BANDS,
    employeeCnssRate: EMPLOYEE_CNSS_RATE,
    employerFamilyRate: EMPLOYER_FAMILY_RATE,
    employerPensionRate: EMPLOYER_PENSION_RATE,
    minimumRiskRate: MIN_RISK_RATE,
    maximumRiskRate: MAX_RISK_RATE,
    sourceCheckedOn: '2026-07-22',
    formulaParameters: {
      method: 'monthly-gross-remuneration',
      employeeCnssRate: EMPLOYEE_CNSS_RATE,
      employerRates: { family: EMPLOYER_FAMILY_RATE, pension: EMPLOYER_PENSION_RATE, occupationalRiskRange: [MIN_RISK_RATE, MAX_RISK_RATE] },
      employeeCnssDeductibleFromItsBase: false,
      ortbLevy: { march: 1000, june: 3000, juneExemptionAtOrBelow: 60000 },
      bands: BANDS
    },
    roundingPolicy: { method: 'display-only', stages: ['retain exact statutory calculation values', 'round only for user-facing XOF display'] },
    calculate: calculate,
    reverse: reverse,
    taxMonthly: taxMonthly,
    broadcastLevy: broadcastLevy
  };
}));

},
"assets/js/engines/cv-paye.js":function(module,exports,require){
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.capeVerdePaye = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var THRESHOLD = 36607;

  function taxMonthly(grossMonthly) {
    var gross = Number(grossMonthly);
    if (!Number.isFinite(gross) || gross < THRESHOLD) {
      return { tax: 0, rawTax: 0, marginalRate: 0, constant: 0 };
    }
    var marginalRate;
    var constant;
    if (gross <= 80000) {
      marginalRate = 0.14;
      constant = 5125;
    } else if (gross <= 150000) {
      marginalRate = 0.21;
      constant = 10725;
    } else {
      marginalRate = 0.25;
      constant = 16725;
    }
    var rawTax = gross * marginalRate - constant;
    var tax = rawTax < 100 ? 100 : Math.round(rawTax);
    return { tax: tax, rawTax: rawTax, marginalRate: marginalRate, constant: constant };
  }

  function calculate(input) {
    input = input || {};
    var grossMonthly = Number(input.grossMonthly);
    if (!Number.isFinite(grossMonthly) || grossMonthly < 0) {
      return { ok: false, error: 'Enter a monthly gross salary of zero or more.' };
    }
    var regime = input.regime === 'DOMESTIC' ? 'DOMESTIC' : 'STANDARD';
    var includeInps = input.includeInps !== false;
    var employeeRate = regime === 'DOMESTIC' ? 0.08 : 0.085;
    var employerRate = regime === 'DOMESTIC' ? 0.15 : 0.16;
    var employeeInpsMonthly = includeInps ? Math.round(grossMonthly * employeeRate) : 0;
    var employerInpsMonthly = includeInps ? Math.round(grossMonthly * employerRate) : 0;
    var withholding = taxMonthly(grossMonthly);
    return {
      ok: true,
      regime: regime,
      grossMonthly: grossMonthly,
      grossAnnual: grossMonthly * 12,
      taxMonthly: withholding.tax,
      taxAnnual: withholding.tax * 12,
      rawTaxMonthly: withholding.rawTax,
      marginalRate: withholding.marginalRate,
      formulaConstant: withholding.constant,
      employeeRate: includeInps ? employeeRate : 0,
      employerRate: includeInps ? employerRate : 0,
      employeeInpsMonthly: employeeInpsMonthly,
      employeeInpsAnnual: employeeInpsMonthly * 12,
      employerInpsMonthly: employerInpsMonthly,
      employerInpsAnnual: employerInpsMonthly * 12,
      netMonthly: grossMonthly - withholding.tax - employeeInpsMonthly,
      netAnnual: (grossMonthly - withholding.tax - employeeInpsMonthly) * 12,
      employerCostMonthly: grossMonthly + employerInpsMonthly,
      employerCostAnnual: (grossMonthly + employerInpsMonthly) * 12,
      effectiveTaxRate: grossMonthly ? withholding.tax / grossMonthly : 0
    };
  }

  function reverse(input) {
    input = input || {};
    var target = Number(input.netMonthly);
    if (!Number.isFinite(target) || target <= 0) return { ok: false, error: 'Enter a net salary greater than zero.' };
    var low = target;
    var high = Math.max(target * 3, THRESHOLD + 1);
    var result;
    for (var index = 0; index < 80; index += 1) {
      var gross = (low + high) / 2;
      result = calculate({ grossMonthly: gross, regime: input.regime, includeInps: input.includeInps });
      if (Math.abs(result.netMonthly - target) < 0.01) return result;
      if (result.netMonthly < target) low = gross; else high = gross;
    }
    return result;
  }

  return {
    thresholdMonthly: THRESHOLD,
    sourceCheckedOn: '2026-07-21',
    taxMonthly: taxMonthly,
    calculate: calculate,
    reverse: reverse
  };
}));

},
"assets/js/engines/dj-paye.js":function(module,exports,require){
(function (root) {
  'use strict';
  var EMPLOYEE_CNSS_RATE = 0.06;
  var EMPLOYER_CNSS_RATE = 0.157;
  var EXEMPTION = 50000;
  var BANDS = [
    { width: 30000, rate: 0.02 },
    { width: 20000, rate: 0.12 },
    { width: 100000, rate: 0.15 },
    { width: 150000, rate: 0.22 },
    { width: 300000, rate: 0.25 },
    { width: 400000, rate: 0.30 },
    { width: 1000000, rate: 0.35 },
    { width: Infinity, rate: 0.45 }
  ];
  var CONTRIBUTION_FLOORS = { professional: 20000, domestic: 15850 };

  function normalizeEmploymentType(value) { return value === 'domestic' ? 'domestic' : 'professional'; }
  function taxMonthly(taxableIncome) {
    var taxable = Math.max(0, Number(taxableIncome) || 0);
    if (taxable <= EXEMPTION) return { tax: 0, bands: [], exempt: true };
    var roundedTaxable = Math.floor(taxable / 5000) * 5000;
    var remaining = roundedTaxable;
    var floor = 0;
    var tax = 0;
    var detail = [];
    BANDS.forEach(function (band) {
      if (remaining <= 0) return;
      var slice = Math.min(remaining, band.width);
      var bandTax = slice * band.rate;
      detail.push({ from: floor, to: band.width === Infinity ? null : floor + band.width, rate: band.rate, income: slice, tax: bandTax });
      tax += bandTax;
      remaining -= slice;
      if (band.width !== Infinity) floor += band.width;
    });
    return { tax: tax, bands: detail, exempt: false, roundedTaxable: roundedTaxable };
  }
  function calculate(input) {
    input = input || {};
    var grossMonthly = Number(input.grossMonthly);
    if (!Number.isFinite(grossMonthly) || grossMonthly < 0) return { ok: false, error: 'Enter a monthly gross salary of zero or more.' };
    var employmentType = normalizeEmploymentType(input.employmentType);
    var contributionFloor = CONTRIBUTION_FLOORS[employmentType];
    var contributionBase = grossMonthly > 0 ? Math.max(grossMonthly, contributionFloor) : 0;
    var employeeCnssMonthly = contributionBase * EMPLOYEE_CNSS_RATE;
    var employerCnssMonthly = contributionBase * EMPLOYER_CNSS_RATE;
    var taxableIncome = Math.max(0, grossMonthly - employeeCnssMonthly);
    var tax = taxMonthly(taxableIncome);
    var netMonthly = grossMonthly - employeeCnssMonthly - tax.tax;
    return {
      ok: true, employmentType: employmentType, contributionFloor: contributionFloor, contributionBase: contributionBase,
      grossMonthly: grossMonthly, grossAnnual: grossMonthly * 12,
      employeeCnssMonthly: employeeCnssMonthly, employeeCnssAnnual: employeeCnssMonthly * 12,
      employerCnssMonthly: employerCnssMonthly, employerCnssAnnual: employerCnssMonthly * 12,
      taxableIncome: taxableIncome, roundedTaxableIncome: tax.roundedTaxable == null ? taxableIncome : tax.roundedTaxable, itsMonthly: tax.tax, itsAnnual: tax.tax * 12, exempt: tax.exempt, bands: tax.bands,
      netMonthly: netMonthly, netAnnual: netMonthly * 12,
      employerCostMonthly: grossMonthly + employerCnssMonthly, employerCostAnnual: (grossMonthly + employerCnssMonthly) * 12,
      effectiveDeductionRate: grossMonthly ? (employeeCnssMonthly + tax.tax) / grossMonthly : 0
    };
  }
  var engine = {
    bands: BANDS, exemption: EXEMPTION, employeeCnssRate: EMPLOYEE_CNSS_RATE, employerCnssRate: EMPLOYER_CNSS_RATE,
    contributionFloors: CONTRIBUTION_FLOORS, sourceCheckedOn: '2026-07-22',
    formulaParameters: { period: 'monthly', currency: 'DJF', taxableIncomeExemptionAtOrBelow: EXEMPTION, taxableIncomeStep: 5000, bands: BANDS, employeeCnssRate: EMPLOYEE_CNSS_RATE, employerCnssRate: EMPLOYER_CNSS_RATE, cnssDeductibleFromItsBase: true, contributionFloors: CONTRIBUTION_FLOORS },
    roundingPolicy: { method: 'statutory-floor-then-display', stages: ['floor monthly taxable income to DJF 5,000 under CGI Article 14', 'apply progressive bands', 'round only final user-facing DJF values'] },
    taxMonthly: taxMonthly, calculate: calculate
  };
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.djiboutiPaye = engine; }
}(typeof window !== 'undefined' ? window : globalThis));

},
"assets/js/engines/dz-paye.js":function(module,exports,require){
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AlgeriaPayeEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var IRG_BANDS = [
    { min: 0, max: 240000, rate: 0 },
    { min: 240000, max: 480000, rate: 0.23 },
    { min: 480000, max: 960000, rate: 0.27 },
    { min: 960000, max: 1920000, rate: 0.30 },
    { min: 1920000, max: 3840000, rate: 0.33 },
    { min: 3840000, max: Infinity, rate: 0.35 }
  ];
  var EMPLOYEE_CNAS_RATE = 0.09;
  var EMPLOYER_CNAS_RATE = 0.25;
  var SOCIAL_WORKS_RATE = 0.005;
  var MONTHLY_EXEMPTION = 30000;
  var MONTHLY_LOW_INCOME_LIMIT = 35000;

  function finiteNonNegative(value) {
    var number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function calculateProgressiveAnnual(annualTaxable) {
    var income = finiteNonNegative(annualTaxable);
    if (income === null) return { error: 'Revenu imposable invalide' };
    var tax = 0;
    var bandBreakdown = [];
    IRG_BANDS.forEach(function (band) {
      var amount = Math.max(0, Math.min(income, band.max) - band.min);
      if (!amount && band.min !== 0) return;
      var bandTax = amount * band.rate;
      tax += bandTax;
      bandBreakdown.push({ rate: band.rate, income: amount, tax: bandTax });
    });
    return { tax: tax, bandBreakdown: bandBreakdown };
  }

  function calculateMonthlyIrg(monthlyTaxable) {
    var taxable = finiteNonNegative(monthlyTaxable);
    if (taxable === null) return { error: 'Revenu imposable mensuel invalide' };
    var progressive = calculateProgressiveAnnual(taxable * 12);
    var grossTax = progressive.tax / 12;
    if (taxable <= MONTHLY_EXEMPTION) {
      return {
        tax: 0,
        grossTax: grossTax,
        firstAbatement: grossTax,
        lowIncomeAbatement: 0,
        totalAbatement: grossTax,
        bandBreakdown: progressive.bandBreakdown
      };
    }

    var firstAbatement = Math.min(grossTax, Math.min(1500, Math.max(1000, grossTax * 0.40)));
    var afterFirstAbatement = Math.max(0, grossTax - firstAbatement);
    var finalTax = afterFirstAbatement;
    if (taxable <= MONTHLY_LOW_INCOME_LIMIT) {
      finalTax = Math.max(0, afterFirstAbatement * (137 / 51) - (27925 / 8));
    }
    var lowIncomeAbatement = Math.max(0, afterFirstAbatement - finalTax);
    return {
      tax: finalTax,
      grossTax: grossTax,
      firstAbatement: firstAbatement,
      lowIncomeAbatement: lowIncomeAbatement,
      totalAbatement: grossTax - finalTax,
      bandBreakdown: progressive.bandBreakdown
    };
  }

  function calculate(grossAnnual, options) {
    var gross = finiteNonNegative(grossAnnual);
    if (gross === null) return { error: 'Salaire brut invalide' };
    var includeCnas = !options || options.includeCnas !== false;
    var cnas = includeCnas ? gross * EMPLOYEE_CNAS_RATE : 0;
    var taxableAnnual = Math.max(0, gross - cnas);
    var irg = calculateMonthlyIrg(taxableAnnual / 12);
    var annualTax = irg.tax * 12;
    var grossAnnualTax = irg.grossTax * 12;
    var deductions = cnas + annualTax;
    var employerCnas = gross * EMPLOYER_CNAS_RATE;
    var socialWorks = gross * SOCIAL_WORKS_RATE;
    var marginalBand = irg.bandBreakdown.filter(function (band) { return band.income > 0; }).pop();

    return {
      gross: gross,
      annual: gross,
      annualGross: gross,
      monthly: false,
      cnas: cnas,
      cnasRate: includeCnas ? EMPLOYEE_CNAS_RATE : 0,
      totalSocialContrib: cnas,
      taxableAnnual: taxableAnnual,
      monthlyTaxable: taxableAnnual / 12,
      grossAnnualPAYE: grossAnnualTax,
      irgAbatementAnnual: irg.totalAbatement * 12,
      lowIncomeAbatementAnnual: irg.lowIncomeAbatement * 12,
      annualPAYE: annualTax,
      bandBreakdown: irg.bandBreakdown,
      totalEmployeeDeductions: deductions,
      netAnnual: gross - deductions,
      annualNet: gross - deductions,
      effectiveRate: gross ? annualTax / gross : 0,
      marginalRate: marginalBand ? marginalBand.rate : 0,
      empCNAS: employerCnas,
      socialWorks: socialWorks,
      totalEmployerCostAnnual: gross + employerCnas + socialWorks,
      limitations: {
        regularMonthlySalaryOnly: true,
        nonMonthlyPaymentsIncluded: false,
        disabilityAndPensionRegimeIncluded: false,
        employerReductionsIncluded: false
      }
    };
  }

  return {
    calculate: calculate,
    calculateMonthlyIrg: calculateMonthlyIrg,
    calculateProgressiveAnnual: calculateProgressiveAnnual,
    constants: {
      irgBands: IRG_BANDS,
      employeeCnasRate: EMPLOYEE_CNAS_RATE,
      employerCnasRate: EMPLOYER_CNAS_RATE,
      socialWorksRate: SOCIAL_WORKS_RATE,
      monthlyExemption: MONTHLY_EXEMPTION,
      monthlyLowIncomeLimit: MONTHLY_LOW_INCOME_LIMIT,
      sourceUrls: [
        'https://www.mfdgi.gov.dz/fr/particuliers/irg-traitements-et-salaires',
        'https://cnas.dz/fr/employeur/'
      ]
    }
  };
});

},
"assets/js/engines/er-paye.js":function(module,exports,require){
(function (root) {
  'use strict';

  var BANDS = [
    { width: 200, rate: 0.02 },
    { width: 300, rate: 0.07 },
    { width: 700, rate: 0.12 },
    { width: 800, rate: 0.17 },
    { width: 1500, rate: 0.24 },
    { width: 2000, rate: 0.29 },
    { width: 2500, rate: 0.34 },
    { width: Infinity, rate: 0.38 }
  ];
  var PUBLIC_EMPLOYEE_RATE = 0.05;
  var PUBLIC_EMPLOYER_RATE = 0.07;

  function taxMonthly(taxableIncome) {
    var remaining = Math.max(0, Number(taxableIncome) || 0);
    var lower = 0;
    var tax = 0;
    var detail = [];
    BANDS.forEach(function (band) {
      if (remaining <= 0) return;
      var slice = Math.min(remaining, band.width);
      var bandTax = slice * band.rate;
      detail.push({ from: lower, to: band.width === Infinity ? null : lower + band.width, rate: band.rate, income: slice, tax: bandTax });
      tax += bandTax;
      remaining -= slice;
      if (band.width !== Infinity) lower += band.width;
    });
    return { tax: tax, bands: detail };
  }

  function calculate(input) {
    input = input || {};
    var grossMonthly = Number(input.grossMonthly);
    if (!Number.isFinite(grossMonthly) || grossMonthly < 0) return { ok: false, error: 'Enter monthly taxable employment income of zero or more.' };
    var publicSector = input.employmentType === 'public-sector';
    var pensionableBasic = publicSector ? Number(input.pensionableBasic) : 0;
    if (publicSector && (!Number.isFinite(pensionableBasic) || pensionableBasic < 0 || pensionableBasic > grossMonthly)) {
      return { ok: false, error: 'Public-sector pensionable basic salary must be between zero and monthly taxable employment income.' };
    }
    var tax = taxMonthly(grossMonthly);
    var employeePensionMonthly = publicSector ? pensionableBasic * PUBLIC_EMPLOYEE_RATE : 0;
    var employerPensionMonthly = publicSector ? pensionableBasic * PUBLIC_EMPLOYER_RATE : 0;
    var netMonthly = grossMonthly - tax.tax - employeePensionMonthly;
    return {
      ok: true,
      employmentType: publicSector ? 'public-sector' : 'ordinary',
      grossMonthly: grossMonthly,
      grossAnnual: grossMonthly * 12,
      taxableIncome: grossMonthly,
      incomeTaxMonthly: tax.tax,
      incomeTaxAnnual: tax.tax * 12,
      bands: tax.bands,
      pensionableBasic: pensionableBasic,
      employeePensionMonthly: employeePensionMonthly,
      employeePensionAnnual: employeePensionMonthly * 12,
      employerPensionMonthly: employerPensionMonthly,
      employerPensionAnnual: employerPensionMonthly * 12,
      netMonthly: netMonthly,
      netAnnual: netMonthly * 12,
      employerCostMonthly: grossMonthly + employerPensionMonthly,
      employerCostAnnual: (grossMonthly + employerPensionMonthly) * 12,
      effectiveDeductionRate: grossMonthly ? (tax.tax + employeePensionMonthly) / grossMonthly : 0
    };
  }

  var engine = {
    bands: BANDS,
    publicEmployeePensionRate: PUBLIC_EMPLOYEE_RATE,
    publicEmployerPensionRate: PUBLIC_EMPLOYER_RATE,
    sourceCheckedOn: '2026-07-22',
    formulaParameters: {
      period: 'monthly', currency: 'ERN', bands: BANDS,
      publicSectorPension: { employeeRate: PUBLIC_EMPLOYEE_RATE, employerRate: PUBLIC_EMPLOYER_RATE, base: 'user-entered monthly pensionable basic salary' },
      pensionDeductibleFromTaxBase: false
    },
    roundingPolicy: { method: 'exact-then-display', stages: ['apply marginal monthly bands to taxable employment income', 'calculate any public-sector pension separately', 'round user-facing ERN totals only'] },
    taxMonthly: taxMonthly,
    calculate: calculate
  };

  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.eritreaPaye = engine; }
}(typeof window !== 'undefined' ? window : globalThis));

},
"assets/js/engines/gm-paye.js":function(module,exports,require){
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.gambiaPaye = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var BANDS = [
    { width: 36000, rate: 0 },
    { width: 10000, rate: 0.05 },
    { width: 10000, rate: 0.10 },
    { width: 10000, rate: 0.15 },
    { width: 10000, rate: 0.20 },
    { width: Infinity, rate: 0.25 }
  ];

  function taxAnnual(annualIncome) {
    var remaining = Math.max(0, Number(annualIncome) || 0);
    var from = 0;
    var tax = 0;
    var bands = [];
    BANDS.forEach(function (band) {
      if (remaining <= 0) return;
      var amount = Math.min(remaining, band.width);
      var bandTax = amount * band.rate;
      bands.push({ from: from, to: band.width === Infinity ? from + amount : from + band.width, rate: band.rate, income: amount, tax: bandTax });
      tax += bandTax;
      remaining -= amount;
      if (band.width !== Infinity) from += band.width;
    });
    return { tax: tax, bands: bands };
  }

  function calculate(input) {
    input = input || {};
    var grossAnnual = Number(input.grossAnnual);
    if (!Number.isFinite(grossAnnual) || grossAnnual < 0) {
      return { ok: false, error: 'Enter a gross salary of zero or more.' };
    }
    var scheme = input.scheme === 'FPS' ? 'FPS' : 'NPF';
    var basicAnnual = scheme === 'NPF'
      ? Math.min(grossAnnual, Math.max(0, Number(input.basicAnnual == null ? grossAnnual : input.basicAnnual) || 0))
      : grossAnnual;
    var includeIicf = input.includeIicf !== false;
    var paye = taxAnnual(grossAnnual);
    var employeePension = scheme === 'NPF' ? basicAnnual * 0.05 : 0;
    var employerPension = scheme === 'NPF' ? basicAnnual * 0.10 : grossAnnual * 0.15;
    var iicf = includeIicf ? Math.min(grossAnnual * 0.01, 180) : 0;
    var netAnnual = grossAnnual - employeePension - paye.tax;
    return {
      ok: true,
      scheme: scheme,
      grossAnnual: grossAnnual,
      grossMonthly: grossAnnual / 12,
      basicAnnual: basicAnnual,
      basicMonthly: basicAnnual / 12,
      payeAnnual: paye.tax,
      payeMonthly: paye.tax / 12,
      employeePensionAnnual: employeePension,
      employeePensionMonthly: employeePension / 12,
      employerPensionAnnual: employerPension,
      employerPensionMonthly: employerPension / 12,
      iicfAnnual: iicf,
      iicfMonthly: iicf / 12,
      netAnnual: netAnnual,
      netMonthly: netAnnual / 12,
      employerCostAnnual: grossAnnual + employerPension + iicf,
      employerCostMonthly: (grossAnnual + employerPension + iicf) / 12,
      effectiveTaxRate: paye.tax / grossAnnual,
      bands: paye.bands
    };
  }

  function reverse(input) {
    input = input || {};
    var target = Number(input.netAnnual);
    if (!Number.isFinite(target) || target <= 0) return { ok: false, error: 'Enter a net salary greater than zero.' };
    var low = target;
    var high = target * 3;
    var result;
    for (var index = 0; index < 70; index += 1) {
      var gross = (low + high) / 2;
      var basicRatio = Number.isFinite(Number(input.basicRatio)) ? Math.max(0, Math.min(1, Number(input.basicRatio))) : 1;
      result = calculate({ grossAnnual: gross, basicAnnual: gross * basicRatio, scheme: input.scheme, includeIicf: input.includeIicf });
      if (Math.abs(result.netAnnual - target) < 0.01) return result;
      if (result.netAnnual < target) low = gross; else high = gross;
    }
    return result;
  }

  return {
    bands: BANDS,
    sourceCheckedOn: '2026-07-21',
    calculate: calculate,
    reverse: reverse,
    taxAnnual: taxAnnual
  };
}));

},
"assets/js/lib/ke-payroll.js":function(module,exports,require){
!function(e){"use strict";var t=function(){var e=[{width:24e3,rate:.1,label:"First KES 24,000"},{width:8333,rate:.25,label:"KES 24,001-32,333"},{width:467667,rate:.3,label:"KES 32,334-500,000"},{width:3e5,rate:.325,label:"KES 500,001-800,000"},{width:1/0,rate:.35,label:"Above KES 800,000"}],t=9e3,a=108e3,r=.06,l=.0275,o=15e4,n=200;function i(e){return Math.round(100*e)/100}function s(e){var t=Number(e)||0;return t>0?t:0}function u(t){for(var a=Math.max(0,t),r=0,l=[],o=0;o<e.length;o++){var n=e[o],s=n.width===1/0?a:n.width,u=Math.min(a,s),m=u*n.rate;if(u>0&&l.push({label:n.label,rate:100*n.rate,income:u,tax:i(m),cumulative:i(r+m)}),r+=m,(a-=u)<=0)break}return{tax:r,detail:l}}function m(t){for(var a=Math.max(0,t),r=0;r<e.length;r++){var l=e[r],o=l.width===1/0?a:l.width;if(a<=o)return 100*l.rate;a-=o}return 35}function f(e,l){var o=s(e),i=l||"new";if("new"!==i)return{regime:i,pensionablePay:o,empTier1:n,empTier2:0,erTier1:n,erTier2:0,totalEmployee:n,totalEmployer:n,totalMonthly:400,totalAnnual:4800};var u=Math.min(o,a),m=Math.min(u,t),f=Math.max(0,u-t),h=m*r,p=f*r,E=m*r,y=f*r,M=h+p,c=E+y;return{regime:i,pensionablePay:u,empTier1:h,empTier2:p,erTier1:E,erTier2:y,totalEmployee:M,totalEmployer:c,totalMonthly:M+c,totalAnnual:12*(M+c)}}function h(e){var t=s(e);return t>0?Math.max(t*l,300):0}function p(e){return.015*s(e)}return{MONTHLY_BANDS:e,PERSONAL_RELIEF:2400,NSSF_LOWER_LIMIT:t,NSSF_UPPER_LIMIT:a,NSSF_RATE:r,SHIF_RATE:l,SHIF_MINIMUM:300,AHL_RATE:.015,LEGACY_NSSF_FLAT:n,DISABILITY_EXEMPTION:o,MAX_VOLUNTARY_PENSION:3e4,MAX_PRMF:15e3,MAX_MORTGAGE_INTEREST:3e4,MAX_INSURANCE_RELIEF:5e3,calculateNssf:f,calculateShif:h,calculateAhl:p,calculateMonthlyPayroll:function(e,t){t=t||{};var a=s(e),r=f(a,t.nssfRegime||"new"),l=!1===t.nssf?0:r.totalEmployee,n=!1===t.nssf?0:r.totalEmployer,i=!1===t.shif?0:h(a),E=t.ahl?p(a):0,y=Math.min(3e4,Number(t.voluntaryPension)||0),M=Math.min(15e3,Number(t.prmf)||0),c=Math.min(3e4,Number(t.mortgageInterest)||0),T=t.disability?o:0,A=Number(t.insurancePremium)||0,d=!1===t.personalRelief?0:2400,S=A>0?Math.min(5e3,.15*A):0,b=Math.max(0,a-l-i-E-y-M-c-T),N=u(b),R=Math.max(0,N.tax-d-S),_=l+i+E+y+M+R,I=p(a),g=a+n+I;return{gross:a,nssf:l,nssfBreakdown:r,shif:i,ahl:E,voluntaryPension:y,prmf:M,disabilityExempt:T,mortgageInterest:c,taxable:b,grossTax:N.tax,personalRelief:d,insuranceRelief:S,paye:R,totalDeductions:_,net:a-_,netAnnual:12*(a-_),effectiveRate:a>0?R/a*100:0,marginalRate:m(b),bandDetail:N.detail,employerNSSF:n,employerAHL:I,totalEmployerCost:g}},calculateStatutoryBurden:function(e,t){var a=s(e),r=f(a,t||"new"),l=h(a),o=p(a);return{gross:a,nssf:r,employee:{nssf:r.totalEmployee,shif:l,ahl:o,total:r.totalEmployee+l+o},employer:{nssf:r.totalEmployer,shif:0,ahl:o,total:r.totalEmployer+o}}},calcProgressiveTax:u,getMarginalRate:m}}();"undefined"!=typeof module&&module.exports&&(module.exports=t),e.AfroTools=e.AfroTools||{},e.AfroTools.payroll=e.AfroTools.payroll||{},e.AfroTools.payroll.ke=t}("undefined"!=typeof globalThis?globalThis:this);
},
"assets/js/engines/km-paye.js":function(module,exports,require){
(function (root) {
  'use strict';

  var TAX_BANDS = [
    { width: 150000, rate: 0 },
    { width: 350000, rate: 0.05 },
    { width: 500000, rate: 0.10 },
    { width: 500000, rate: 0.15 },
    { width: 1000000, rate: 0.20 },
    { width: 1000000, rate: 0.25 },
    { width: Infinity, rate: 0.30 }
  ];
  var STANDARD_PROFESSIONAL_EXPENSE_RATE = 0.30;
  var MAX_APPROVED_EMPLOYEE_CONTRIBUTION_RATE = 0.06;

  function calculateAnnualTax(taxableAnnual) {
    var income = Number(taxableAnnual);
    if (!Number.isFinite(income) || income <= 0) return { tax: 0, bands: [] };

    var remaining = income;
    var lower = 0;
    var tax = 0;
    var detail = [];
    TAX_BANDS.forEach(function (band) {
      if (remaining <= 0) return;
      var slice = Math.min(remaining, band.width);
      var bandTax = slice * band.rate;
      detail.push({
        from: lower,
        to: band.width === Infinity ? null : lower + band.width,
        rate: band.rate,
        income: slice,
        tax: bandTax
      });
      tax += bandTax;
      remaining -= slice;
      if (band.width !== Infinity) lower += band.width;
    });
    return { tax: tax, bands: detail };
  }

  function calculate(input) {
    input = input || {};
    var grossMonthly = Number(input.grossMonthly);
    if (!Number.isFinite(grossMonthly) || grossMonthly < 0) {
      return { ok: false, error: 'Enter monthly gross employment income of zero or more.' };
    }

    var employeeContributionRate = input.employeeContributionRate == null
      ? 0
      : Number(input.employeeContributionRate);
    if (!Number.isFinite(employeeContributionRate) || employeeContributionRate < 0 || employeeContributionRate > MAX_APPROVED_EMPLOYEE_CONTRIBUTION_RATE) {
      return { ok: false, error: 'Enter an approved employee pension or social contribution rate from 0% to 6%.' };
    }

    var grossAnnual = grossMonthly * 12;
    var employeeContributionAnnual = grossAnnual * employeeContributionRate;
    var incomeAfterContribution = grossAnnual - employeeContributionAnnual;
    var professionalExpenseDeductionAnnual = incomeAfterContribution * STANDARD_PROFESSIONAL_EXPENSE_RATE;
    var taxableAnnual = Math.max(0, incomeAfterContribution - professionalExpenseDeductionAnnual);
    var tax = calculateAnnualTax(taxableAnnual);
    var netAnnual = grossAnnual - employeeContributionAnnual - tax.tax;

    return {
      ok: true,
      grossMonthly: grossMonthly,
      grossAnnual: grossAnnual,
      employeeContributionRate: employeeContributionRate,
      employeeContributionMonthly: employeeContributionAnnual / 12,
      employeeContributionAnnual: employeeContributionAnnual,
      incomeAfterContributionAnnual: incomeAfterContribution,
      professionalExpenseRate: STANDARD_PROFESSIONAL_EXPENSE_RATE,
      professionalExpenseDeductionAnnual: professionalExpenseDeductionAnnual,
      taxableAnnual: taxableAnnual,
      taxableMonthlyEquivalent: taxableAnnual / 12,
      incomeTaxAnnual: tax.tax,
      incomeTaxMonthlyEquivalent: tax.tax / 12,
      bands: tax.bands,
      netAnnual: netAnnual,
      netMonthly: netAnnual / 12,
      effectiveDeductionRate: grossAnnual ? (employeeContributionAnnual + tax.tax) / grossAnnual : 0
    };
  }

  var engine = {
    id: 'km-paye',
    country: 'KM',
    currency: 'KMF',
    taxBands: TAX_BANDS,
    standardProfessionalExpenseRate: STANDARD_PROFESSIONAL_EXPENSE_RATE,
    maxApprovedEmployeeContributionRate: MAX_APPROVED_EMPLOYEE_CONTRIBUTION_RATE,
    sourceCheckedOn: '2026-07-22',
    source: {
      title: 'Union of the Comoros Code general des impots 2023',
      url: 'https://www.dgi.gouv.km/file/actes_officiels/Comores-CGI-2023.pdf',
      articles: ['47', '55-60', '97', '104-106'],
      caveat: 'Statutory-reference estimate based on the official 2023 consolidated code. Confirm later amendments and the employee contribution rate applicable to the payslip before relying on the result.'
    },
    formulaParameters: {
      period: 'annual with monthly equivalents',
      currency: 'KMF',
      bands: TAX_BANDS,
      employeeContributionRate: { default: 0, minimum: 0, maximum: MAX_APPROVED_EMPLOYEE_CONTRIBUTION_RATE, source: 'user-supplied approved payslip rate' },
      professionalExpenseDeduction: { rate: STANDARD_PROFESSIONAL_EXPENSE_RATE, base: 'gross employment income after approved pension or social contributions' },
      employerContribution: 'not modeled'
    },
    roundingPolicy: {
      method: 'exact-then-display',
      stages: ['calculate annual employee contribution', 'apply the 30% standard professional-expense deduction', 'apply marginal annual IRPP bands', 'round user-facing KMF totals only']
    },
    calculateAnnualTax: calculateAnnualTax,
    calculate: calculate
  };

  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.comorosPaye = engine;
  }
}(typeof window !== 'undefined' ? window : globalThis));

},
"assets/js/engines/so-paye.js":function(module,exports,require){
(function (root) {
  'use strict';

  var BANDS = [
    { width: 100, rate: 0 },
    { width: 400, rate: 0.06 },
    { width: 1000, rate: 0.12 },
    { width: Infinity, rate: 0.18 }
  ];

  function progressiveTax(income) {
    var remaining = Math.max(0, Number(income) || 0);
    var tax = 0;
    var floor = 0;
    var detail = [];
    BANDS.forEach(function (band) {
      if (remaining <= 0) return;
      var slice = Math.min(remaining, band.width);
      var bandTax = slice * band.rate;
      detail.push({ from: floor, to: band.width === Infinity ? null : floor + band.width, rate: band.rate, income: slice, tax: bandTax });
      tax += bandTax;
      remaining -= slice;
      if (band.width !== Infinity) floor += band.width;
    });
    return { tax: tax, bands: detail };
  }

  function normalizeCategory(value) {
    return value === 'nonresident' || value === 'resident-under-18' ? value : 'resident-adult';
  }

  function calculate(input) {
    input = input || {};
    var grossMonthly = Number(input.grossMonthly);
    if (!Number.isFinite(grossMonthly) || grossMonthly < 0) {
      return { ok: false, error: 'Enter monthly chargeable employment income of zero or more.' };
    }
    var category = normalizeCategory(input.category);
    var progressive = progressiveTax(grossMonthly);
    var taxMonthly = category === 'nonresident'
      ? grossMonthly * 0.18
      : category === 'resident-under-18'
        ? grossMonthly * 0.20
        : progressive.tax;
    var netMonthly = grossMonthly - taxMonthly;
    return {
      ok: true,
      category: category,
      grossMonthly: grossMonthly,
      grossAnnual: grossMonthly * 12,
      taxMonthly: taxMonthly,
      taxAnnual: taxMonthly * 12,
      netMonthly: netMonthly,
      netAnnual: netMonthly * 12,
      effectiveRate: grossMonthly ? taxMonthly / grossMonthly : 0,
      bands: category === 'resident-adult' ? progressive.bands : []
    };
  }

  var engine = {
    bands: BANDS,
    sourceCheckedOn: '2026-07-22',
    lawEffectiveOn: '2025-05-11',
    formulaParameters: {
      currency: 'USD',
      period: 'monthly',
      residentAdultBands: BANDS,
      nonresidentRate: 0.18,
      residentUnder18Rate: 0.20,
      employmentDeductionsAllowed: false,
      scope: 'Federal Republic of Somalia income tax only'
    },
    roundingPolicy: { method: 'display-only', stages: ['retain exact calculation values', 'round to cents for display'] },
    progressiveTax: progressiveTax,
    calculate: calculate
  };

  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.somaliaPaye = engine;
  }
}(typeof window !== 'undefined' ? window : globalThis));

},
"assets/js/engines/ss-paye.js":function(module,exports,require){
(function (root) {
  'use strict';
  var EMPLOYEE_NSIF_RATE = 0.08;
  var EMPLOYER_NSIF_RATE = 0.17;
  var PIT_SURTAX_RATE = 0.30;
  var BANDS = [
    { width: 20000, rate: 0 }, { width: 20000, rate: 0.05 },
    { width: 17000, rate: 0.10 }, { width: 33000, rate: 0.15 },
    { width: Infinity, rate: 0.20 }
  ];
  function pitMonthly(taxableIncome) {
    var remaining = Math.max(0, Number(taxableIncome) || 0), lower = 0, pit = 0, detail = [];
    BANDS.forEach(function (band) {
      if (remaining <= 0) return;
      var slice = Math.min(remaining, band.width), bandTax = slice * band.rate;
      detail.push({ from: lower, to: band.width === Infinity ? null : lower + band.width, rate: band.rate, income: slice, tax: bandTax });
      pit += bandTax; remaining -= slice; if (band.width !== Infinity) lower += band.width;
    });
    return { pit: pit, bands: detail };
  }
  function calculate(input) {
    input = input || {};
    var gross = Number(input.gross);
    if (!Number.isFinite(gross) || gross < 0) return { ok: false, error: 'Enter a monthly gross salary of zero or more.' };
    var includeNsif = input.includeNsif !== false;
    var employeeNsif = includeNsif ? gross * EMPLOYEE_NSIF_RATE : 0;
    var employerNsif = includeNsif ? gross * EMPLOYER_NSIF_RATE : 0;
    var taxableIncome = Math.max(0, gross - employeeNsif);
    var tax = pitMonthly(taxableIncome);
    var surtax = tax.pit * PIT_SURTAX_RATE;
    var totalTax = tax.pit + surtax;
    var net = gross - employeeNsif - totalTax;
    var employerCost = gross + employerNsif;
    return {
      ok: true, gross: gross, employeeNsif: employeeNsif, taxableIncome: taxableIncome,
      pit: tax.pit, surtax: surtax, totalTax: totalTax, net: net,
      employerNsif: employerNsif, employerCost: employerCost,
      effectiveDeductionRate: gross ? (employeeNsif + totalTax) / gross : 0,
      bands: tax.bands,
      annual: { gross: gross * 12, employeeNsif: employeeNsif * 12, taxableIncome: taxableIncome * 12,
        pit: tax.pit * 12, surtax: surtax * 12, totalTax: totalTax * 12, net: net * 12,
        employerNsif: employerNsif * 12, employerCost: employerCost * 12 }
    };
  }
  var engine = {
    bands: BANDS, employeeNsifRate: EMPLOYEE_NSIF_RATE, employerNsifRate: EMPLOYER_NSIF_RATE,
    pitSurtaxRate: PIT_SURTAX_RATE, sourceCheckedOn: '2026-07-22',
    formulaParameters: { period: 'monthly', currency: 'SSP', bands: BANDS,
      employeeNsifRate: EMPLOYEE_NSIF_RATE, employerNsifRate: EMPLOYER_NSIF_RATE,
      employeeNsifDeductibleFromPitBase: true, pitSurtaxRate: PIT_SURTAX_RATE, pitSurtaxBase: 'computed monthly PIT' },
    roundingPolicy: { method: 'exact-then-display', stages: [
      'calculate employee NSIF at 8% of monthly gross wages', 'deduct approved employee contribution from the PIT base',
      'apply progressive monthly PIT bands', 'calculate surtax at 30% of computed PIT', 'round user-facing SSP totals only' ] },
    pitMonthly: pitMonthly, calculate: calculate
  };
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.engines = root.AfroTools.engines || {}; root.AfroTools.engines.southSudanPaye = engine; }
}(typeof window !== 'undefined' ? window : globalThis));

},
"assets/js/engines/st-paye.js":function(module,exports,require){
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.saoTomePayroll = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var EMPLOYEE_INSS_RATE = 0.04;
  var EMPLOYER_INSS_RATE = 0.06;
  var SOURCE_CHECKED_ON = '2026-07-22';
  var IRS_STATUS = 'CURRENT_SCHEDULE_UNCONFIRMED';

  function roundCurrency(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function calculate(input) {
    input = input || {};
    var grossMonthly = Number(input.grossMonthly);
    if (!Number.isFinite(grossMonthly) || grossMonthly < 0) {
      return { ok: false, error: 'Enter a monthly gross salary of zero or more.' };
    }

    var employeeInssMonthly = roundCurrency(grossMonthly * EMPLOYEE_INSS_RATE);
    var employerInssMonthly = roundCurrency(grossMonthly * EMPLOYER_INSS_RATE);
    var afterEmployeeInssMonthly = roundCurrency(grossMonthly - employeeInssMonthly);
    var employerCostMonthly = roundCurrency(grossMonthly + employerInssMonthly);

    return {
      ok: true,
      grossMonthly: grossMonthly,
      grossAnnual: roundCurrency(grossMonthly * 12),
      employeeInssRate: EMPLOYEE_INSS_RATE,
      employeeInssMonthly: employeeInssMonthly,
      employeeInssAnnual: roundCurrency(employeeInssMonthly * 12),
      employerInssRate: EMPLOYER_INSS_RATE,
      employerInssMonthly: employerInssMonthly,
      employerInssAnnual: roundCurrency(employerInssMonthly * 12),
      afterEmployeeInssMonthly: afterEmployeeInssMonthly,
      afterEmployeeInssAnnual: roundCurrency(afterEmployeeInssMonthly * 12),
      employerCostMonthly: employerCostMonthly,
      employerCostAnnual: roundCurrency(employerCostMonthly * 12),
      irsMonthly: null,
      irsAnnual: null,
      netMonthly: null,
      netAnnual: null,
      irsStatus: IRS_STATUS,
      sourceCheckedOn: SOURCE_CHECKED_ON
    };
  }

  return {
    employeeInssRate: EMPLOYEE_INSS_RATE,
    employerInssRate: EMPLOYER_INSS_RATE,
    irsStatus: IRS_STATUS,
    lastUpdated: SOURCE_CHECKED_ON,
    sourceCheckedOn: SOURCE_CHECKED_ON,
    calculate: calculate
  };
}));

},
"assets/js/engines/tg-paye.js":function(module,exports,require){
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.togoPaye = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var EMPLOYEE_CNSS_RATE = 0.04;
  var EMPLOYER_CNSS_RATE = 0.175;
  var PROFESSIONAL_DEDUCTION_RATE = 0.28;
  var PROFESSIONAL_DEDUCTION_CAP = 10000000;
  var DEPENDENT_RELIEF_ANNUAL = 120000;
  var MAX_DEPENDENTS = 6;
  var BANDS = [
    { width: 900000, rate: 0 },
    { width: 2100000, rate: 0.03 },
    { width: 3000000, rate: 0.10 },
    { width: 3000000, rate: 0.15 },
    { width: 3000000, rate: 0.20 },
    { width: 3000000, rate: 0.25 },
    { width: 5000000, rate: 0.30 },
    { width: Infinity, rate: 0.35 }
  ];

  function clampDependents(value) {
    var parsed = Math.floor(Number(value) || 0);
    return Math.max(0, Math.min(MAX_DEPENDENTS, parsed));
  }

  function roundDown(value, increment) {
    return Math.floor(Math.max(0, value) / increment) * increment;
  }

  function taxAnnual(taxableIncome) {
    var remaining = Math.max(0, Number(taxableIncome) || 0);
    var from = 0;
    var rawTax = 0;
    var bands = [];
    BANDS.forEach(function (band) {
      if (remaining <= 0) return;
      var income = Math.min(remaining, band.width);
      var taxInBand = income * band.rate;
      bands.push({
        from: from,
        to: band.width === Infinity ? null : from + band.width,
        rate: band.rate,
        income: income,
        tax: taxInBand
      });
      rawTax += taxInBand;
      remaining -= income;
      if (band.width !== Infinity) from += band.width;
    });
    return { rawTax: rawTax, tax: roundDown(rawTax, 10), bands: bands };
  }

  function calculate(input) {
    input = input || {};
    var grossAnnual = Number(input.grossAnnual);
    if (!Number.isFinite(grossAnnual) || grossAnnual < 0) {
      return { ok: false, error: 'Enter an annual gross salary of zero or more.' };
    }
    var dependents = clampDependents(input.dependents);
    var employeeCnssAnnual = grossAnnual * EMPLOYEE_CNSS_RATE;
    var employerCnssAnnual = grossAnnual * EMPLOYER_CNSS_RATE;
    var incomeAfterCnss = Math.max(0, grossAnnual - employeeCnssAnnual);
    var professionalDeduction = Math.min(incomeAfterCnss, PROFESSIONAL_DEDUCTION_CAP) * PROFESSIONAL_DEDUCTION_RATE;
    var dependentRelief = dependents * DEPENDENT_RELIEF_ANNUAL;
    var taxableBeforeRounding = Math.max(0, incomeAfterCnss - professionalDeduction - dependentRelief);
    var taxableIncome = roundDown(taxableBeforeRounding, 1000);
    var paye = taxAnnual(taxableIncome);
    var netAnnual = grossAnnual - employeeCnssAnnual - paye.tax;
    return {
      ok: true,
      grossAnnual: grossAnnual,
      grossMonthly: grossAnnual / 12,
      dependents: dependents,
      employeeCnssAnnual: employeeCnssAnnual,
      employeeCnssMonthly: employeeCnssAnnual / 12,
      employerCnssAnnual: employerCnssAnnual,
      employerCnssMonthly: employerCnssAnnual / 12,
      incomeAfterCnss: incomeAfterCnss,
      professionalDeduction: professionalDeduction,
      dependentRelief: dependentRelief,
      taxableBeforeRounding: taxableBeforeRounding,
      taxableIncome: taxableIncome,
      payeAnnual: paye.tax,
      payeMonthly: paye.tax / 12,
      rawPayeAnnual: paye.rawTax,
      bands: paye.bands,
      netAnnual: netAnnual,
      netMonthly: netAnnual / 12,
      employerCostAnnual: grossAnnual + employerCnssAnnual,
      employerCostMonthly: (grossAnnual + employerCnssAnnual) / 12,
      effectiveTaxRate: grossAnnual ? paye.tax / grossAnnual : 0,
      effectiveDeductionRate: grossAnnual ? (paye.tax + employeeCnssAnnual) / grossAnnual : 0
    };
  }

  function reverse(input) {
    input = input || {};
    var target = Number(input.netAnnual);
    if (!Number.isFinite(target) || target <= 0) return { ok: false, error: 'Enter a net salary greater than zero.' };
    var low = target;
    var high = Math.max(target * 3, 1200000);
    var result;
    for (var index = 0; index < 80; index += 1) {
      var gross = (low + high) / 2;
      result = calculate({ grossAnnual: gross, dependents: input.dependents });
      if (Math.abs(result.netAnnual - target) < 0.01) return result;
      if (result.netAnnual < target) low = gross; else high = gross;
    }
    return result;
  }

  return {
    bands: BANDS,
    employeeCnssRate: EMPLOYEE_CNSS_RATE,
    employerCnssRate: EMPLOYER_CNSS_RATE,
    professionalDeductionRate: PROFESSIONAL_DEDUCTION_RATE,
    professionalDeductionCap: PROFESSIONAL_DEDUCTION_CAP,
    dependentReliefAnnual: DEPENDENT_RELIEF_ANNUAL,
    maxDependents: MAX_DEPENDENTS,
    sourceCheckedOn: '2026-07-22',
    formulaParameters: {
      method: 'annual-employment-income',
      employeeCnssRate: EMPLOYEE_CNSS_RATE,
      employerCnssRate: EMPLOYER_CNSS_RATE,
      professionalDeduction: { rate: PROFESSIONAL_DEDUCTION_RATE, cap: PROFESSIONAL_DEDUCTION_CAP },
      dependentReliefAnnual: DEPENDENT_RELIEF_ANNUAL,
      maximumDependents: MAX_DEPENDENTS,
      taxableRounding: 'down-to-1000-XOF',
      taxRounding: 'down-to-10-XOF',
      bands: BANDS
    },
    roundingPolicy: {
      method: 'statutory-stage-rounding',
      stages: ['annual taxable income down to XOF 1,000', 'annual tax down to XOF 10']
    },
    calculate: calculate,
    reverse: reverse,
    taxAnnual: taxAnnual
  };
}));

},
"assets/js/engines/ug-paye.js":function(module,exports,require){
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.ugandaPaye = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var EMPLOYEE_NSSF_RATE = 0.05;
  var EMPLOYER_NSSF_RATE = 0.10;
  var HIGH_INCOME_THRESHOLD = 10000000;
  var HIGH_INCOME_SUPPLEMENT_RATE = 0.10;
  var RESIDENT = 'RESIDENT';
  var NON_RESIDENT = 'NON_RESIDENT';
  var LST_BANDS = [
    { upTo: 100000, annual: 0 }, { upTo: 200000, annual: 5000 },
    { upTo: 300000, annual: 10000 }, { upTo: 400000, annual: 20000 },
    { upTo: 500000, annual: 30000 }, { upTo: 600000, annual: 40000 },
    { upTo: 700000, annual: 60000 }, { upTo: 800000, annual: 70000 },
    { upTo: 900000, annual: 80000 }, { upTo: 1000000, annual: 90000 },
    { upTo: Infinity, annual: 100000 }
  ];

  function finiteNonNegative(value, label) {
    var number = Number(value);
    return Number.isFinite(number) && number >= 0
      ? { ok: true, value: number }
      : { ok: false, error: 'Enter a valid ' + label + ' of zero or more.' };
  }
  function normalizeRegime(value) {
    return String(value || '').toUpperCase().replace(/[-\s]/g, '_') === NON_RESIDENT ? NON_RESIDENT : RESIDENT;
  }
  function residentTax(value) {
    var income = Math.max(0, Number(value) || 0);
    // URA notice of 7 September 2026: resident rates effective 1 July 2026.
    var tax = income > 485000 ? 33750 + (income - 485000) * 0.30
      : income > 410000 ? 15000 + (income - 410000) * 0.25
        : income > 335000 ? (income - 335000) * 0.20 : 0;
    if (income > HIGH_INCOME_THRESHOLD) tax += (income - HIGH_INCOME_THRESHOLD) * HIGH_INCOME_SUPPLEMENT_RATE;
    return tax;
  }
  function nonResidentTax(value) {
    var income = Math.max(0, Number(value) || 0);
    var tax = income > 410000 ? 48500 + (income - 410000) * 0.30
      : income > 335000 ? 33500 + (income - 335000) * 0.20 : income * 0.10;
    if (income > HIGH_INCOME_THRESHOLD) tax += (income - HIGH_INCOME_THRESHOLD) * HIGH_INCOME_SUPPLEMENT_RATE;
    return tax;
  }
  function bandBreakdown(value, regime) {
    var income = Math.max(0, Number(value) || 0);
    var bands = normalizeRegime(regime) === NON_RESIDENT
      ? [{ from: 0, to: 335000, rate: 0.10 }, { from: 335000, to: 410000, rate: 0.20 }, { from: 410000, to: HIGH_INCOME_THRESHOLD, rate: 0.30 }, { from: HIGH_INCOME_THRESHOLD, to: null, rate: 0.40 }]
      : [{ from: 0, to: 335000, rate: 0 }, { from: 335000, to: 410000, rate: 0.20 }, { from: 410000, to: 485000, rate: 0.25 }, { from: 485000, to: HIGH_INCOME_THRESHOLD, rate: 0.30 }, { from: HIGH_INCOME_THRESHOLD, to: null, rate: 0.40 }];
    return bands.map(function (band) {
      var upper = band.to == null ? income : Math.min(income, band.to);
      var bandIncome = Math.max(0, upper - band.from);
      return { from: band.from, to: band.to, rate: band.rate, income: bandIncome, tax: bandIncome * band.rate };
    }).filter(function (band) { return band.income > 0 || (income === 0 && band.from === 0); });
  }
  function taxMonthly(taxableIncome, regime) {
    var checked = finiteNonNegative(taxableIncome, 'monthly taxable income');
    if (!checked.ok) return checked;
    var normalized = normalizeRegime(regime);
    return { ok: true, regime: normalized, taxableIncome: checked.value, tax: normalized === NON_RESIDENT ? nonResidentTax(checked.value) : residentTax(checked.value), bands: bandBreakdown(checked.value, normalized) };
  }
  function lstFromGross(monthlyGross) {
    var gross = Math.max(0, Number(monthlyGross) || 0);
    for (var index = 0; index < LST_BANDS.length; index += 1) if (gross <= LST_BANDS[index].upTo) return LST_BANDS[index].annual;
    return 0;
  }
  function resolveLst(monthlyGross, regime) {
    var checked = finiteNonNegative(monthlyGross, 'monthly gross salary');
    if (!checked.ok) return checked;
    var gross = checked.value;
    var normalized = normalizeRegime(regime);
    var annual = lstFromGross(gross);
    var paye = taxMonthly(Math.max(0, gross - annual), normalized).tax;
    return { ok: true, annual: annual, assessmentGross: gross, payeAfterFullLstDeduction: paye };
  }
  function annualLst(monthlyGross, regime) {
    var resolved = resolveLst(monthlyGross, regime);
    return resolved.ok ? resolved.annual : NaN;
  }
  function collectionSchedule(annual, currentDeduction) {
    if (annual <= 0) return [];
    if (currentDeduction >= annual) return [annual];
    if (currentDeduction <= 0) return [0, annual];
    return [currentDeduction, annual - currentDeduction];
  }
  function calculate(input) {
    input = input || {};
    var checked = finiteNonNegative(input.grossMonthly, 'monthly gross salary');
    if (!checked.ok) return checked;
    var grossMonthly = checked.value;
    var regime = normalizeRegime(input.regime);
    var hasLst = input.lstEnabled === true;
    var hasNssf = input.nssfEnabled !== false;
    var resolvedLst = hasLst ? resolveLst(grossMonthly, regime) : { ok: true, annual: 0, assessmentGross: grossMonthly, payeAfterFullLstDeduction: taxMonthly(grossMonthly, regime).tax };
    if (!resolvedLst.ok) return resolvedLst;
    var lstAnnual = resolvedLst.annual;
    var requestedLst = input.lstPayrollDeduction == null ? lstAnnual : Number(input.lstPayrollDeduction);
    if (!Number.isFinite(requestedLst) || requestedLst < 0 || requestedLst > grossMonthly || requestedLst > lstAnnual) return { ok: false, error: 'LST payroll deduction must be between zero and the annual LST amount and cannot exceed gross salary.' };
    var lstPayrollDeduction = hasLst ? requestedLst : 0;
    var taxableIncome = grossMonthly - lstPayrollDeduction;
    var paye = taxMonthly(taxableIncome, regime);
    var regularPaye = taxMonthly(grossMonthly, regime);
    var employeeNssfMonthly = hasNssf ? grossMonthly * EMPLOYEE_NSSF_RATE : 0;
    var employerNssfMonthly = hasNssf ? grossMonthly * EMPLOYER_NSSF_RATE : 0;
    var lstCollectionSchedule = hasLst ? collectionSchedule(lstAnnual, lstPayrollDeduction) : [];
    var annualPaye = hasLst
      ? lstCollectionSchedule.reduce(function (total, deduction) { return total + taxMonthly(grossMonthly - deduction, regime).tax; }, 0)
        + regularPaye.tax * (12 - lstCollectionSchedule.length)
      : paye.tax * 12;
    return {
      ok: true, regime: regime, grossMonthly: grossMonthly, grossAnnual: grossMonthly * 12,
      taxableIncome: taxableIncome, lstEnabled: hasLst, lstAnnual: lstAnnual, lstPayrollDeduction: lstPayrollDeduction,
      lstCollectionSchedule: lstCollectionSchedule, lstAssessmentGross: resolvedLst.assessmentGross,
      employeeNssfMonthly: employeeNssfMonthly, employeeNssfAnnual: employeeNssfMonthly * 12,
      employerNssfMonthly: employerNssfMonthly, employerNssfAnnual: employerNssfMonthly * 12,
      monthlyPaye: paye.tax, annualPaye: annualPaye, bands: paye.bands,
      netMonthly: grossMonthly - lstPayrollDeduction - paye.tax - employeeNssfMonthly,
      netAnnual: grossMonthly * 12 - annualPaye - employeeNssfMonthly * 12 - lstAnnual,
      employerCostMonthly: grossMonthly + employerNssfMonthly,
      employerCostAnnual: (grossMonthly + employerNssfMonthly) * 12,
      effectiveTaxRate: grossMonthly ? paye.tax / grossMonthly : 0,
      effectiveDeductionRate: grossMonthly ? (paye.tax + employeeNssfMonthly + lstPayrollDeduction) / grossMonthly : 0
    };
  }
  return {
    country: 'UG', currency: 'UGX', lastUpdated: '2026-09-16',
    regimes: [RESIDENT, NON_RESIDENT], residentRegime: RESIDENT, nonResidentRegime: NON_RESIDENT,
    employeeNssfRate: EMPLOYEE_NSSF_RATE, employerNssfRate: EMPLOYER_NSSF_RATE,
    highIncomeThreshold: HIGH_INCOME_THRESHOLD, highIncomeSupplementRate: HIGH_INCOME_SUPPLEMENT_RATE,
    lstBands: LST_BANDS, sourceCheckedOn: '2026-09-16', residentRatesEffectiveFrom: '2026-07-01', residentRatesSource: 'https://ura.go.ug/en/changes-to-paye-return-form-following-the-income-tax-amendment-act-2026/', otherParametersCheckedOn: '2026-08-02', effectiveDateStatus: 'current-law-confirmed',
    formulaParameters: { method: 'monthly-employment-income-with-gross-salary-lst-assessment-before-paye-and-before-nssf', regimes: [RESIDENT, NON_RESIDENT], residentThresholds: [335000, 410000, 485000, HIGH_INCOME_THRESHOLD], nonResidentThresholds: [335000, 410000, HIGH_INCOME_THRESHOLD], highIncomeSupplementRate: HIGH_INCOME_SUPPLEMENT_RATE, employeeNssfRate: EMPLOYEE_NSSF_RATE, employerNssfRate: EMPLOYER_NSSF_RATE, nssfDeductibleFromPayeBase: false, lstAssessmentBase: 'monthly gross salary as defined by the KCCA guidance', lstDeductedBeforePaye: true, lstCollectionInstallmentsMaximum: 4, lstBands: LST_BANDS },
    roundingPolicy: { method: 'display-only', stages: ['retain exact statutory calculation values', 'round only for displayed UGX and exported rows'] },
    normalizeRegime: normalizeRegime, taxMonthly: taxMonthly, lstFromGross: lstFromGross,
    resolveLst: resolveLst, annualLst: annualLst, calculate: calculate
  };
}));

},
"data/calculation-quality/formula-registry.json":function(module){module.exports={"$schema":"./calculation-quality.schema.json#/$defs/FormulaRegistry","formulas":[{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:c25e2e8661b8b84beebd0cb0103567bcf49d8be4bd3ae4ee3007d42b104487b6","artifactPath":"netlify/functions/_engines/ao-paye.js","currency":"AOA","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.c25e2e8661b8","id":"paye-server-ao","jurisdictions":["AO"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-03-26","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[70000,0],[30000,0.1],[50000,0.13],[100000,0.16],[250000,0.18],[2500000,0.19],[5000000,0.2],[10000000,0.21],["Infinity",0.22]],"employerSS":[{"key":"inss","label":"INSS (8%)","rate":0.08}],"isMonthly":true,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"inss","label":"INSS (3%)","rate":0.03}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["AO"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"agt.minfin.gov.ao","url":"https://www.agt.minfin.gov.ao"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"agt.minfin.gov.ao","url":"https://agt.minfin.gov.ao"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"AGT · current tax portal","url":"https://agt.minfin.gov.ao/"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:4eb8169c824366364df0de180cd1ef37b3bbd76e94f56308c6a84ac669f6c773","artifactPath":"netlify/functions/_engines/bf-paye.js","currency":"XOF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.4eb8169c8243","id":"paye-server-bf","jurisdictions":["BF"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2025-07-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[30000,0],[20000,0.1225],[15000,0.15],[50000,0.2],["Infinity",0.25]],"employerSS":[{"key":"cnss","label":"CNSS (16%)","rate":0.16}],"isMonthly":true,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"cnss","label":"CNSS (5.5%)","rate":0.055}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["BF"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Direction generale des impots - Burkina Faso","url":"https://dgi.bf/"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:794c21abd3b18ffef2ebe61ea8200e801712f759a63410fa0841790461c96fb7","artifactPath":"netlify/functions/_engines/bi-paye.js","currency":"BIF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.794c21abd3b1","id":"paye-server-bi","jurisdictions":["BI"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-04-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[150000,0],[150000,0.2],[1800000,0.3],["Infinity",0.35]],"employerSS":[{"key":"inss","label":"INSS (6%)","rate":0.06}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"inss","label":"INSS (4%)","rate":0.04}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["BI"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"obr.gov.bi","url":"https://obr.gov.bi"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"OBR VAT Law 2020 guide","url":"https://www.obr.bi/images/PDF/VULGARISATION_DES_LOIS_FISCALES_final.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"OBR BIF 25 million registration communique","url":"https://www.obr.bi/index.php/communiques/2528-communique-aux-contribuables-ayant-un-chiffre-d-affaires-de-25-millions-de-fbu"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:17df7386c5f36cc0b90a6e6133420aa7efaf62e1ba0ea53351e73f8a9c3b4617","artifactPath":"netlify/functions/_engines/bj-paye.js","currency":"XOF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-07-22+sha256.17df7386c5f3","id":"paye-server-bj","jurisdictions":["BJ"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-07-22","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bands":[{"rate":0,"width":60000},{"rate":0.1,"width":90000},{"rate":0.15,"width":100000},{"rate":0.19,"width":250000},{"rate":0.3,"width":"Infinity"}],"employeeCnssDeductibleFromItsBase":false,"employeeCnssRate":0.036,"employerRates":{"family":0.09,"occupationalRiskRange":[0.01,0.04],"pension":0.064},"method":"monthly-gross-remuneration","ortbLevy":{"june":3000,"juneExemptionAtOrBelow":60000,"march":1000}}},"protectedDuplicates":["assets/js/engines/bj-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"method":"display-only","stages":["retain exact statutory calculation values","round only for user-facing XOF display"]},"sourceJurisdictions":["BJ"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Benin CGI 2026, Articles 119–129","url":"https://api.impots.bj/media/6984ebbbb7bc0_B%C3%A9nin-Code%20G%C3%A9n%C3%A9ral%20des%20Imp%C3%B4ts%202026.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"CNSS Benin contribution base and rates","url":"https://cnss.bj/procedure-de-recouvrement-des-cotisations/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"DGI Benin official General Tax Code 2023","url":"https://api.impots.bj/media/63c7b8d3eef3c_Benin-CGI-2023-officiel.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"DGI Benin official VAT guide","url":"https://api.impots.bj/media/619276da1364b_CE%20QUE%20VOUS%20DEVEZ%20SAVOIR%20SUR%20LA%20TVA.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Benin official 2026 Finance Act page","url":"https://budgetbenin.bj/loi-de-finances-gestion-2026/"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:29dcb6c3825ca256d0d26abed3d250bc0e3238d48d1c2452f2140ff6a62df162","artifactPath":"netlify/functions/_engines/bw-paye.js","currency":"BWP","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.29dcb6c3825c","id":"paye-server-bw","jurisdictions":["BW"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-01-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[48000,0],[36000,0.05],[36000,0.125],[36000,0.1875],["Infinity",0.25]],"employerSS":[],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["BW"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"burs.org.bw","url":"https://www.burs.org.bw"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"burs.org.bw","url":"https://burs.org.bw"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"BURS VAT brochure","url":"https://www.burs.org.bw/index.php/brochure?download=815%3Aburs-vat-brochures"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:95ef917ee4b283f503586bb25e7531a608e417ec4c1fd8a9bb4035db488ecb24","artifactPath":"netlify/functions/_engines/cd-paye.js","currency":"CDF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.95ef917ee4b2","id":"paye-server-cd","jurisdictions":["CD"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-04-06","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[524160,0.03],[1572480,0.05],[2620800,0.1],[5241600,0.2],[10483200,0.3],[17472000,0.35],[24460800,0.4],["Infinity",0.45]],"employerSS":[{"key":"inss","label":"INSS (9.5%)","rate":0.095}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"inss","label":"INSS (5%)","rate":0.05}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["CD"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"dgi.gouv.cd","url":"https://dgi.gouv.cd"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"DGI: current TVA scope and CDF 80m registration screen","url":"https://dgi.gouv.cd/taxe-sur-la-valeur-ajoutee-tva/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"DGI: current 16% rate and exporters at 0%","url":"https://dgi.gouv.cd/teledeclaration/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ministry of Budget: 2026 instructions confirm 16% and reduced 8% lanes","url":"https://www.budget.gouv.cd/wp-content/uploads/budget2026/circulaire_elabo_budget2026.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"DGI official notices: 2026 filing and normalized invoices","url":"https://dgi.gouv.cd/communiques-officiels/"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:cd8321633e3f9c14b089cc929ab9d38fe5b6bc57753049b2aa41f9cb084538a5","artifactPath":"netlify/functions/_engines/cf-paye.js","currency":"XAF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.cd8321633e3f","id":"paye-server-cf","jurisdictions":["CF"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-03-28","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[300000,0],[1200000,0.08],[3000000,0.15],[5000000,0.25],[8000000,0.35],["Infinity",0.5]],"employerSS":[{"key":"cnss","label":"CNSS (17%)","rate":0.17}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"cnss","label":"CNSS (3%)","rate":0.03}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["CF"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ministere des Finances et du Budget - Central African Republic","url":"https://www.finances.gouv.cf/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"DGID official CGI, updated 2023 — Articles 257, 268, 275","url":"https://www.finances.gouv.cf/sites/default/files/2023-05/CGI%20RCA%202017%20mise%20%C3%A0%20jour%202023.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ministry publication of the 2026 Finance Law","url":"https://www.finances.gouv.cf/documentations"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ministry 2025 price structure showing 19% VAT","url":"https://www.finances.gouv.cf/sites/default/files/2025-03/STRUCTURE%20DES%20PRIX%20DES%20PRODUITS%20PETROLIERS%20MARS%202025.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ministry of Finance 2026 information note","url":"https://finances.gouv.cf/sites/default/files/2026-02/RCA%20NOTE_D%27INFORMATION_2026.pdf"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:857e85a46784d57e647775efc4e0882d714971608816ab68d8df36eea03bcadb","artifactPath":"netlify/functions/_engines/cg-paye.js","currency":"XAF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.857e85a46784","id":"paye-server-cg","jurisdictions":["CG"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-03-28","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[464000,0],[1000000,0.01],[3000000,0.1],[8000000,0.25],["Infinity",0.4]],"employerSS":[{"key":"cnss","label":"CNSS (20.29%)","rate":0.2029}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"cnss","label":"CNSS (4%)","rate":0.04}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["CG"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Portail fiscal officiel - Republique du Congo","url":"https://impots.gouv.cg/portail-client-web/public/accueil.xhtml"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"2023 Official Journal: VAT Articles 21, 22 and 38 A","url":"https://www.sgg.cg/JO/2023/congo-jo-2023-06-sp.pdf"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:2b45f5f05b45fcf37ffc90a8bd0221a8ecf533061b213edd65d7b00e2213fe05","artifactPath":"netlify/functions/_engines/ci-paye.js","currency":"XOF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.2b45f5f05b45","id":"paye-server-ci","jurisdictions":["CI"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-04-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[300000,0],[3884000,0.1],[7500000,0.15],[13750000,0.2],[24166667,0.25],[41666667,0.35],["Infinity",0.45]],"employerSS":[{"key":"cnps","label":"CNPS (15.75%)","rate":0.1575}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"cnps","label":"CNPS (6.3%)","rate":0.063}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["CI"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"dgi.gouv.ci","url":"https://www.dgi.gouv.ci"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"cnps.ci","url":"https://www.cnps.ci"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"dgi.gouv.ci","url":"https://dgi.gouv.ci"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"cnps.ci","url":"https://www.cnps.ci/"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:efab0620b0e3615d04864759e3903ecb85dbfccbf97e2604004aa8c7276a5237","artifactPath":"netlify/functions/_engines/cm-paye.js","currency":"XAF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.efab0620b0e3","id":"paye-server-cm","jurisdictions":["CM"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-04-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[2000000,0.1],[3000000,0.15],[5000000,0.25],["Infinity",0.35]],"employerSS":[{"key":"cnps","label":"CNPS (11.2%)","rate":0.112}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"cnps","label":"CNPS (4.2%)","rate":0.042}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["CM"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"impots.cm","url":"https://www.impots.cm"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"DGI 2026 VAT-withholding order","url":"https://www.impots.cm/sites/default/files/documents/arr%C3%AAt%C3%A9%20RTS%202026%20VF.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"MINFI 2026 measures","url":"https://minfi.gov.cm/loi-de-finances-2026-comprendre-les-nouvelles-mesures/"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:18374e33b45ebf257cb6a10b273017f347390deba4b101c5d1bb8736ff455338","artifactPath":"netlify/functions/_engines/cv-paye.js","currency":"CVE","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-07-21+sha256.18374e33b45e","id":"paye-server-cv","jurisdictions":["CV"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-07-21","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"domesticInps":{"employeeRate":0.08,"employerRate":0.15},"exemptionThreshold":36607,"formulas":[{"rate":0.14,"subtract":5125,"upTo":80000},{"rate":0.21,"subtract":10725,"upTo":150000},{"rate":0.25,"subtract":16725,"upTo":"Infinity"}],"method":"monthly-gross-formula","minimumPositiveWithholding":100,"standardInps":{"employeeRate":0.085,"employerRate":0.16}}},"protectedDuplicates":["assets/js/engines/cv-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"method":"nearest-integer","stages":["monthly withholding tax","annual and monthly result","INPS contributions","employer cost"]},"sourceJurisdictions":["CV"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"DNRE employee withholding guidance","url":"https://www.mf.gov.cv/web/dnre/dire%C3%A7%C3%A3o-geral-das-contribui%C3%A7%C3%B5es-e-impostos"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Official 2018 formula publication","url":"https://www.mf.gov.cv/documents/54571/227418/0E%2B2018_Principais%2BMedidas%2BFiscais.pdf/c18e0d23-28ee-4d81-e03f-bfd3f0168e54?download=true"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"2021 consolidated IRPS amendment","url":"https://boe.incv.cv/Bulletins/Download/3596"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"INPS contribution obligations","url":"https://inps.cv/obrigacoes/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Lei n.º 69/X/2025 — OE 2026","url":"https://boe.incv.cv/Bulletins/View?id=89137"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:c92b98a4ef8c6b36448aec0c57b170cddf6e0504e3e44ea6c55c98cab433ad55","artifactPath":"netlify/functions/_engines/dj-paye.js","currency":"DJF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-07-22+sha256.c92b98a4ef8c","id":"paye-server-dj","jurisdictions":["DJ"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-07-22","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bands":[{"rate":0.02,"width":30000},{"rate":0.12,"width":20000},{"rate":0.15,"width":100000},{"rate":0.22,"width":150000},{"rate":0.25,"width":300000},{"rate":0.3,"width":400000},{"rate":0.35,"width":1000000},{"rate":0.45,"width":"Infinity"}],"cnssDeductibleFromItsBase":true,"contributionFloors":{"domestic":15850,"professional":20000},"currency":"DJF","employeeCnssRate":0.06,"employerCnssRate":0.157,"period":"monthly","taxableIncomeExemptionAtOrBelow":50000,"taxableIncomeStep":5000}},"protectedDuplicates":["assets/js/engines/dj-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"method":"statutory-floor-then-display","stages":["floor monthly taxable income to DJF 5,000 under CGI Article 14","apply progressive bands","round only final user-facing DJF values"]},"sourceJurisdictions":["DJ"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Finance Law 2022, Article 7 ITS bands","url":"https://www.journalofficiel.dj/texte-juridique/loi-de-finances-n142-an-21-8eme-l-portant-budget-initial-de-letat-pour-lexercice-2022/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Djibouti Finance Law 2016 salary exemption","url":"https://www.journalofficiel.dj/texte-juridique/loi-de-finances-n120-an-15-7eme-l-portant-budget-initial-de-letat-pour-lexercice-2016/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"General Tax Code, taxable base and rounding","url":"https://www.journalofficiel.dj/texte-juridique/loi-n42-an-08-6emel-portant-refonte-du-code-generale-des-impots/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"CNSS contribution rates and floors","url":"https://cnss.dj/declaration-et-versement-des-cotisations/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Official Journal: VAT scope, thresholds, exemptions, 0%, rounding and filing","url":"https://www.journalofficiel.dj/texte-juridique/loi-n43-an-08-6eme-l-portant-creation-de-la-taxe-sur-la-valeur-ajoutee-et-definissant-les-dispositifs-dapplication/"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:af9e22bc7d5149e7ff4d0ede00f16b27808d4bcc5d0d5d993dc0198fc8c398e8","artifactPath":"netlify/functions/_engines/dz-paye.js","currency":"DZD","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-08-17+sha256.af9e22bc7d51","id":"paye-server-dz","jurisdictions":["DZ"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-08-17","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive-with-monthly-salary-abatements","bands":[{"max":240000,"min":0,"rate":0},{"max":480000,"min":240000,"rate":0.23},{"max":960000,"min":480000,"rate":0.27},{"max":1920000,"min":960000,"rate":0.3},{"max":3840000,"min":1920000,"rate":0.33},{"max":"Infinity","min":3840000,"rate":0.35}],"employerSS":[{"key":"cnas","label":"CNAS employer (25%)","rate":0.25},{"key":"socialWorks","label":"Social works (0.5%)","rate":0.005}],"isMonthly":true,"monthlyExemption":30000,"monthlyLowIncomeLimit":35000,"socialSecurity":[{"key":"cnas","label":"CNAS (9%)","rate":0.09}]}},"protectedDuplicates":["assets/js/engines/dz-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"method":"runtime-defined","precision":"Preserve current executable behavior.","stages":["Formula artifact controls intermediate and final rounding; focused unit or golden-fixture assertions protect observed stages."]},"sourceJurisdictions":["DZ"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"DGI IRG traitements et salaires","url":"https://www.mfdgi.gov.dz/fr/particuliers/irg-traitements-et-salaires"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"CNAS taux de cotisation du cas général","url":"https://cnas.dz/fr/employeur/"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:f50d013296a5937d982731c2aff515f866027c342edd86e585286129e38962ec","artifactPath":"netlify/functions/_engines/eg-paye.js","currency":"EGP","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-04-06+sha256.f50d013296a5","id":"paye-server-eg","jurisdictions":["EG"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-01-01","owner":"AfroTools formula review owners","parameters":{"artifactDigest":"sha256:f50d013296a5937d982731c2aff515f866027c342edd86e585286129e38962ec","artifactPath":"netlify/functions/_engines/eg-paye.js","mode":"protected-legacy-parameter-reference","note":"Constants remain in the legacy runtime; the digest gate prevents silent drift until a behavior-preserving migration is available."},"protectedDuplicates":["assets/js/engines/eg-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"method":"runtime-defined","precision":"Preserve current executable behavior.","stages":["Formula artifact controls intermediate and final rounding; focused unit or golden-fixture assertions protect observed stages."]},"sourceJurisdictions":["EG"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"eta.gov.eg","url":"https://eta.gov.eg"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"ETA · VAT Law No. 67 of 2016","url":"https://www.eta.gov.eg/sites/default/files/2024-02/Law-english-no.67-2016.pdf.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"ETA · Executive Regulations","url":"https://www.eta.gov.eg/sites/default/files/2024-02/VAT-Executive-Regulations-English.pdf"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:00586ca13e001124603b275fa79cf0611aa4d7a874f83f1d5d7139a3359c93e5","artifactPath":"netlify/functions/_engines/er-paye.js","currency":"ERN","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-07-22+sha256.00586ca13e00","id":"paye-server-er","jurisdictions":["ER"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-07-22","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bands":[{"rate":0.02,"width":200},{"rate":0.07,"width":300},{"rate":0.12,"width":700},{"rate":0.17,"width":800},{"rate":0.24,"width":1500},{"rate":0.29,"width":2000},{"rate":0.34,"width":2500},{"rate":0.38,"width":"Infinity"}],"currency":"ERN","pensionDeductibleFromTaxBase":false,"period":"monthly","publicSectorPension":{"base":"user-entered monthly pensionable basic salary","employeeRate":0.05,"employerRate":0.07}}},"protectedDuplicates":["assets/js/engines/er-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"method":"exact-then-display","stages":["apply marginal monthly bands to taxable employment income","calculate any public-sector pension separately","round user-facing ERN totals only"]},"sourceJurisdictions":["ER"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Proclamation relative à l'impôt sur le revenu 62/1994","url":"https://tile.loc.gov/storage-services/service/ll/lleritrea/eritrean-proc-62-1994/eritrean-proc-62-1994.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Avis juridique 20/1995 — règlement relatif à l'impôt sur le revenu","url":"https://faolex.fao.org/docs/pdf/eri203352.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Proclamation 146/2005 relative aux pensions du secteur public","url":"https://rodra.co.za/images/countries/eritrea/legislation/Eritrea-PensionProclamation2005.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Présentation contemporaine du système fiscal","url":"https://www.elibrary.imf.org/view/journals/002/2000/055/article-A001-en.xml"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"IMF 2003 Article IV staff report","url":"https://www.elibrary.imf.org/view/journals/002/2003/165/article-A001-en.xml"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:cbcccb4c45c429bde648670d1678731f4be07cc4c7d74435d3a8220b9f46a0a0","artifactPath":"netlify/functions/_engines/et-paye.js","currency":"ETB","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.cbcccb4c45c4","id":"paye-server-et","jurisdictions":["ET"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-04-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[2000,0],[2000,0.15],[3000,0.2],[3000,0.25],[4000,0.3],["Infinity",0.35]],"employerSS":[{"key":"pension","label":"Pension (11%)","rate":0.11}],"isMonthly":true,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"pension","label":"Pension (7%)","rate":0.07}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["ET"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"erca.gov.et","url":"https://erca.gov.et"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ethiopia Ministry of Finance: VAT Proclamation 1341/2024 with schedules","url":"https://www.mofed.gov.et/media/filer_public/af/45/af45af2f-7959-4e8b-b736-9494dda9f017/vat_proclamation_no_1341-2016_with_annex.pdf"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:2584bc4385c82b9ad9a270392913b0687c609405fba026e93bef8ee735cc5fc3","artifactPath":"netlify/functions/_engines/ga-paye.js","currency":"XAF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.2584bc4385c8","id":"paye-server-ga","jurisdictions":["GA"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-04-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[1500000,0],[1920000,0.05],[2500000,0.1],[3750000,0.15],[7500000,0.2],["Infinity",0.35]],"employerSS":[{"key":"cnss","label":"CNSS (20.1%)","rate":0.201}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"cnss","label":"CNSS (2.5%)","rate":0.025}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["GA"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Direction generale des impots - Gabon","url":"https://dgi.ga/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Official Journal: Finance Law 2026","url":"https://journal-officiel.ga/22265-041-2025-/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"DGI: General Tax Code 2025","url":"https://dgi.ga/wp-content/uploads/2025/12/Gabon-CGI-2025.pdf"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:a3b06a228be14395a8b15367c6ed5cc20e1133b3f1f32e9e55c90eb9d7e98e33","artifactPath":"netlify/functions/_engines/gh-paye.js","currency":"GHS","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-09-27+sha256.a3b06a228be1","id":"paye-server-gh","jurisdictions":["GH"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-09-27","owner":"AfroTools formula review owners","parameters":{"artifactDigest":"sha256:a3b06a228be14395a8b15367c6ed5cc20e1133b3f1f32e9e55c90eb9d7e98e33","artifactPath":"netlify/functions/_engines/gh-paye.js","mode":"protected-legacy-parameter-reference","note":"Constants remain in the legacy runtime; the digest gate prevents silent drift until a behavior-preserving migration is available."},"protectedDuplicates":["assets/js/engines/gh-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"method":"runtime-defined","precision":"Preserve current executable behavior.","stages":["Formula artifact controls intermediate and final rounding; focused unit or golden-fixture assertions protect observed stages."]},"sourceJurisdictions":["GH"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"GRA Act 1178: PAYE bands effective September 1, 2026","url":"https://gra.gov.gh/news/portfolio/amendments-income-tax-act-2026-act-1178/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"SSNIT: 2026 monthly maximum insurable earning","url":"https://www.ssnit.org.gh/wp-content/uploads/2026/01/Public-Notice-Min-Max-Insurable.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"GRA (gra.gov.gh)","url":"https://gra.gov.gh/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"GRA PAYE page Official PAYE overview, schedule context, and employer forms.","url":"https://gra.gov.gh/domestic-tax/tax-types/paye/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"GRA tax calendar Official deadlines for PAYE and other tax obligations.","url":"https://gra.gov.gh/online-tools/tax-calendar/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"gra.gov.gh","url":"https://gra.gov.gh"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"GRA · Guide TVA","url":"https://gra.gov.gh/domestic-tax/tax-types/vat/"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:31dc78b7dd62a6ad9680ed2b76f62c0682b1dbc4d8d6905b979dc8991e1d26e7","artifactPath":"netlify/functions/_engines/gm-paye.js","currency":"GMD","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-07-21+sha256.31dc78b7dd62","id":"paye-server-gm","jurisdictions":["GM"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-07-21","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[36000,0],[10000,0.05],[10000,0.1],[10000,0.15],[10000,0.2],["Infinity",0.25]],"fps":{"base":"gross salary","employeeRate":0,"employerRate":0.15},"iicf":{"employerRate":0.01,"monthlyCap":15},"npf":{"base":"basic salary","employeeRate":0.05,"employerRate":0.1},"payeBase":"gross employment income; no deductions"}},"protectedDuplicates":["assets/js/engines/gm-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"method":"nearest-integer","stages":["annual PAYE","annual pension contributions","annual and monthly result","employer cost"]},"sourceJurisdictions":["GM"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"GRA PAYE calculator","url":"https://www.gra.gm/calculators/pay-as-you-earn-paye-"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"GRA employment-income brochure","url":"https://www.gra.gm/download-file/8d0ccc58-d217-11ed-9b31-029254d29bb1"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"SSHFC National Provident Fund","url":"https://www.sshfc.gm/national-provident-fund"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"SSHFC IICF guidance","url":"https://www.sshfc.gm/industrial-injury-compensation-fund"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"SSHFC scheme overview","url":"https://www.sshfc.gm/overview"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:64b0554bf1afa17e227a07e839a3826bf4359b093039e717316436e7590e6d41","artifactPath":"netlify/functions/_engines/gn-paye.js","currency":"GNF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.64b0554bf1af","id":"paye-server-gn","jurisdictions":["GN"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-04-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[1000000,0],[5000000,0.1],[10000000,0.15],["Infinity",0.25]],"employerSS":[{"key":"cnss","label":"CNSS (18%)","rate":0.18}],"isMonthly":true,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"cnss","label":"CNSS (5%)","rate":0.05}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["GN"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"mf.gov.gn","url":"https://mf.gov.gn"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"DGI: Code general des impots","url":"https://dgi.gov.gn/code-general-des-impots/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ministry of Budget: finance laws","url":"https://mbudget.gov.gn/lois-de-finances/"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:caf26eaa8b10121e8a633f6886fe872cf605d8f0fb83f765170efbaab4fb3a6c","artifactPath":"netlify/functions/_engines/gq-paye.js","currency":"XAF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.caf26eaa8b10","id":"paye-server-gq","jurisdictions":["GQ"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-03-28","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[1000000,0],[5000000,0.1],[10000000,0.15],[15000000,0.2],[25000000,0.25],["Infinity",0.35]],"employerSS":[{"key":"inseso","label":"INSESO (21.5%)","rate":0.215}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"inseso","label":"INSESO (4.5%)","rate":0.045}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["GQ"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ministerio de Hacienda y Presupuestos - Guinea Ecuatorial","url":"https://minhacienda-gob.com/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Government presentation of Law 1/2024: 15% general, 5% reduced","url":"https://www.guineaecuatorialpress.com/noticias/presentacion_oficial_de_la_nueva_ley_general_tributaria_de_guinea_ecuatorial"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ministry 2026 State Budget, Article 13: exact 0% and 5% import tables","url":"https://minhacienda-gob.com/wp-content/uploads/2026/01/Libro_LPGE-2026.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ministerial Order 04/2025: IVA on invoices","url":"https://www.guineaecuatorialpress.com/noticias/orden_ministerial_relativa_al_iva"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:f006ff0bb251d18faef35dac62fcfbd0dd395c7e1a77325e9b2c0c0a90c2c7f9","artifactPath":"netlify/functions/_engines/ke-paye.js","currency":"KES","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-04-06+sha256.f006ff0bb251","id":"paye-server-ke","jurisdictions":["KE"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-07-01","owner":"AfroTools formula review owners","parameters":{"artifactDigest":"sha256:f006ff0bb251d18faef35dac62fcfbd0dd395c7e1a77325e9b2c0c0a90c2c7f9","artifactPath":"netlify/functions/_engines/ke-paye.js","mode":"protected-legacy-parameter-reference","note":"Constants remain in the legacy runtime; the digest gate prevents silent drift until a behavior-preserving migration is available."},"protectedDuplicates":["assets/js/engines/ke-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"method":"runtime-defined","precision":"Preserve current executable behavior.","stages":["Formula artifact controls intermediate and final rounding; focused unit or golden-fixture assertions protect observed stages."]},"sourceJurisdictions":["KE"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"KRA","url":"https://www.kra.go.ke/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"NSSF Kenya","url":"https://www.nssf.or.ke/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"KRA PAYE page Official PAYE bands, remittance context, and employer filing notes.","url":"https://www.kra.go.ke/individual/filing-paying/types-of-taxes/paye"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"KRA iTax portal Official portal for returns, PIN services, and taxpayer account access.","url":"https://itax.kra.go.ke/KRA-Portal/forwardOnly.htm?viewName=homePage"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"KRA eTIMS guide Official eTIMS guidance for electronic tax invoice compliance.","url":"https://www.kra.go.ke/helping-tax-payers/faqs/learn-about-etims"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:2a0d1283f369a73ca9139570c0a2bf220c818549880ceab87622da84dcf0505c","artifactPath":"netlify/functions/_engines/km-paye.js","currency":"KMF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-07-22+sha256.2a0d1283f369","id":"paye-server-km","jurisdictions":["KM"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-07-22","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bands":[{"rate":0,"width":150000},{"rate":0.05,"width":350000},{"rate":0.1,"width":500000},{"rate":0.15,"width":500000},{"rate":0.2,"width":1000000},{"rate":0.25,"width":1000000},{"rate":0.3,"width":"Infinity"}],"currency":"KMF","employeeContributionRate":{"default":0,"maximum":0.06,"minimum":0,"source":"user-supplied approved payslip rate"},"employerContribution":"not modeled","period":"annual with monthly equivalents","professionalExpenseDeduction":{"base":"gross employment income after approved pension or social contributions","rate":0.3}}},"protectedDuplicates":["assets/js/engines/km-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"method":"exact-then-display","stages":["calculate annual employee contribution","apply the 30% standard professional-expense deduction","apply marginal annual IRPP bands","round user-facing KMF totals only"]},"sourceJurisdictions":["KM"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Union of the Comoros General Tax Code 2023","url":"https://www.dgi.gouv.km/file/actes_officiels/Comores-CGI-2023.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"DGI Comores fiscal agenda","url":"https://dgi.gouv.km/fr/agenda_fiscal.php"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ministry fiscal-expenditure report for 2024 — 10% reference TC","url":"https://finances.gouv.km/wp-content/uploads/2026/02/Rapport-sur-les-Depenses-Fiscales-2024-1-1-5.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ministry publication — 2026 Finance Law promulgation","url":"https://finances.gouv.km/post-et-donnee/la-loi-n25-020-au-portant-loi-de-finances/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Direction generale des impots - Comoros","url":"https://dgi.gouv.km/"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:a01adc0ac2d805fa7404cbd8e357a71ca6f93381328a90b9d90e2199b712d57a","artifactPath":"netlify/functions/_engines/lr-paye.js","currency":"LRD","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.a01adc0ac2d8","id":"paye-server-lr","jurisdictions":["LR"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-07-21","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[70000,0],[130000,0.05],[600000,0.15],["Infinity",0.25]],"employerSS":[{"key":"nasscorp","label":"NASSCORP (6%)","rate":0.06}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"nasscorp","label":"NASSCORP (4%)","rate":0.04}],"ssDeductibleFromTaxable":false}},"protectedDuplicates":["assets/js/engines/lr-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["LR"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Liberia Revenue Authority tax education","url":"https://revenue.lra.gov.lr/domestic-tax/tax-education/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"NASSCORP revised employer guide","url":"https://www.nasscorp.org.lr/wp-content/uploads/2024/06/Revised-Employers-Guide-Mar-20-24.pdf"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:98c1f842e488c039fb66fabe2fd7ab7c7a9a03662a86ac35fd3a258d44c7b58b","artifactPath":"netlify/functions/_engines/ls-paye.js","currency":"LSL","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.98c1f842e488","id":"paye-server-ls","jurisdictions":["LS"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-01-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[74040,0.2],["Infinity",0.3]],"employerSS":[],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["LS"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"lra.org.ls","url":"https://www.lra.org.ls"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"RSL PAYE page Official PAYE rates, tax credit, and employer remittance context.","url":"https://www.rsl.org.ls/pay-you-earn"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"RSL pay your tax bills Official payment timing and payment-method guidance.","url":"https://www.rsl.org.ls/pay-your-tax-bills"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"RSL eTax Official e-filing route linked by Revenue Services Lesotho.","url":"https://efiling.rsl.org.ls"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"lra.org.ls","url":"https://lra.org.ls"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:cea5ab74ffedb15e6fd1c52b166248cbc4fe2b140d76600eb4b24e9235862272","artifactPath":"netlify/functions/_engines/ly-paye.js","currency":"LYD","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.cea5ab74ffed","id":"paye-server-ly","jurisdictions":["LY"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-01-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[12000,0.05],["Infinity",0.1]],"employerSS":[{"key":"ssf","label":"Social Security (14.35%)","rate":0.1435}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"ssf","label":"Social Security (5.125%)","rate":0.05125},{"key":"suf","label":"Social Unity Fund (1%)","rate":0.01}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["LY"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"financialministry.gov.sd","url":"https://financialministry.gov.sd"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:8ef32f5256c881ff43d63320f24caacbbca27666f13e5251cea3ecfdb88b76aa","artifactPath":"netlify/functions/_engines/ma-paye.js","currency":"MAD","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.8ef32f5256c8","id":"paye-server-ma","jurisdictions":["MA"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2025-01-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[30000,0],[20000,0.1],[20000,0.2],[20000,0.3],[40000,0.34],["Infinity",0.38]],"employerSS":[{"cap":72000,"key":"cnss","label":"CNSS (8.98%)","rate":0.0898},{"key":"amo","label":"AMO Health (4.11%)","rate":0.0411}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"cap":72000,"key":"cnss","label":"CNSS (4.48%)","rate":0.0448},{"key":"amo","label":"AMO Health (2.26%)","rate":0.0226}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["MA"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"dgi.gov.ma","url":"https://dgi.gov.ma"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"tax.gov.ma","url":"https://tax.gov.ma"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Code général des impôts 2026","url":"https://www.finances.gov.ma/Publication/dgi/2025/CGI-2026-FR.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Note circulaire 735 — réforme TVA","url":"https://www.finances.gov.ma/Publication/dgi/2024/Note-Circulaire735LF2024.pdf"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:e35f8263b06e8485acc443249291003bdcd05311af2384a51d1fc82212cf39b3","artifactPath":"netlify/functions/_engines/mg-paye.js","currency":"MGA","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.e35f8263b06e","id":"paye-server-mg","jurisdictions":["MG"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-03-28","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[350000,0],[250000,0.05],[250000,0.1],[7150000,0.15],["Infinity",0.2]],"employerSS":[{"key":"cnaps","label":"CNaPS (13%)","rate":0.13}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"cnaps","label":"CNaPS (1%)","rate":0.01}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["MG"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"mef.gov.mg","url":"https://mef.gov.mg"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"DGI Code des impôts 2026","url":"https://www.impots.mg/explorer?path=/legislation/Codes%20et%20Manuels/CDI-LFI%202026.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"DGI official legislation catalogue","url":"https://www.impots.mg/explorer?path=%2Flegislation%2FCodes+et+Manuels"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:8bd6d3fc9c5d6b7f44d885bc864cccdbabfa9d7d42b48dff21ae549d054ccfba","artifactPath":"netlify/functions/_engines/ml-paye.js","currency":"XOF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.8bd6d3fc9c5d","id":"paye-server-ml","jurisdictions":["ML"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2025-07-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[300000,0],[600000,0.05],[1200000,0.13],[1800000,0.3],["Infinity",0.4]],"employerSS":[{"key":"inps","label":"INPS (20.4%)","rate":0.204}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"inps","label":"INPS (3.6%)","rate":0.036}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["ML"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"impots.gouv.ml","url":"https://impots.gouv.ml"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"ts.gouv.ml","url":"https://ts.gouv.ml"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:8b5b900b2aac913e4461f0bc5aacac1f4e5495ea512b2470803cfefa6741fe5c","artifactPath":"netlify/functions/_engines/mr-paye.js","currency":"MRU","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.8b5b900b2aac","id":"paye-server-mr","jurisdictions":["MR"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-07-21","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[9000,0.15],[12000,0.25],["Infinity",0.4]],"employerSS":[{"baseCap":15000,"key":"cnssEmployer","label":"Employer CNSS (13%, MRU 15,000 base cap)","rate":0.13},{"baseCap":15000,"key":"workMedicine","label":"Work medicine (2%, MRU 15,000 base cap)","rate":0.02}],"isMonthly":true,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"baseCap":15000,"key":"cnss","label":"CNSS (1%, MRU 15,000 base cap)","rate":0.01}],"taxFreeAllowance":6000,"taxableRoundingStep":10}},"protectedDuplicates":["assets/js/engines/mr-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["MR"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Mauritania Ministry of Finance - General Tax Code 2023","url":"https://finances.gov.mr/fr/node/317"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Mauritania DGI - payment obligations","url":"https://impots.gov.mr/DGI/particuliers/calendrier_obligations_paiement.html"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ministry of Labour - CNSS rates and MRU 15,000 ceiling","url":"https://www.fonctionpublique.gov.mr/fr/node/47"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"CNSS quarterly declaration form","url":"https://cnss.mr/wp-content/uploads/2025/01/DEC-CNSS-_der_version.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"dgi.gov.mr","url":"https://dgi.gov.mr"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:41a5460f3349e85e0ce3e7fb935cedb9a95953b9f065f400534bf3d2b3c76c8a","artifactPath":"netlify/functions/_engines/mu-paye.js","currency":"MUR","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.41a5460f3349","id":"paye-server-mu","jurisdictions":["MU"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-01-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[500000,0],[500000,0.1],["Infinity",0.2]],"employerSS":[{"key":"csg","label":"CSG (6%)","rate":0.06},{"key":"nsf","label":"NSF (2.5%)","rate":0.025}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"csg","label":"CSG (3%)","rate":0.03},{"key":"nsf","label":"NSF (2.5%)","rate":0.025}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["MU"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"mra.mu","url":"https://www.mra.mu"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Guide TVA MRA","url":"https://mra.mu/index.php/taxes-duties/26-vat"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Mauritius Value Added Tax Act","url":"https://attorneygeneral.govmu.org/Documents/Laws%20of%20Mauritius/A-Z%20Acts/V/ValueAddedTaxActI9.pdf"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:3fd58095dad0da66fb96d71541655d4e098a94c33c6e501bae02a01ca9c507c5","artifactPath":"netlify/functions/_engines/mw-paye.js","currency":"MWK","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"declared","effectiveFrom":"2026-01-01","effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.3fd58095dad0","id":"paye-server-mw","jurisdictions":["MW"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-07-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[170000,0],[1400000,0.3],[8430000,0.35],["Infinity",0.4]],"employerSS":[],"isMonthly":true,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["MW"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"mra.mw","url":"https://www.mra.mw"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"MRA PAYE calculator Official MRA calculator surface where available.","url":"https://www.mra.mw/news/pages/48?cat=PAYE+Calculator"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"MRA Taxation (Amendment) (No. 2) Act, 2025 — employment-income rates, Appendix B","url":"https://www.mra.mw/admin/storage/download_files/1767960355_Taxation%20%28Amendment%29%20ACT.pdf"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:d1b85c7934753c0341e529d1601921b581aabf4bc56d00b9eab91146dfd32732","artifactPath":"netlify/functions/_engines/mz-paye.js","currency":"MZN","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.d1b85c793475","id":"paye-server-mz","jurisdictions":["MZ"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-04-06","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[42000,0.1],[126000,0.15],[336000,0.2],[1008000,0.25],["Infinity",0.32]],"employerSS":[{"key":"inss","label":"INSS (4%)","rate":0.04}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"inss","label":"INSS (3%)","rate":0.03}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["MZ"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"minfin.gov.mz","url":"https://minfin.gov.mz"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"at.gov.mz","url":"https://at.gov.mz"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Autoridade Tributária Taxas IRPS Official IRPS rate table reference used for the progressive monthly tax bands.","url":"https://www.at.gov.mz/por/Comercio-Internacional/Procedimento-Fiscais/Taxas-IRPS"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Autoridade Tributária IRPS FAQ Administrative guidance on withholding and employment-income handling.","url":"https://www.at.gov.mz/por/Perguntas-Frequentes2/IRPS"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"INSS Taxa Contributiva Official 3% employee and 4% employer contribution split used in this calculator.","url":"https://www.inss.gov.mz/taxa-contributiva-contribuinte/"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:098247aeed3f92d1a43bfb151bfb43f1ab3be1ea4dd6d312aca7031858e307ee","artifactPath":"netlify/functions/_engines/na-paye.js","currency":"NAD","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.098247aeed3f","id":"paye-server-na","jurisdictions":["NA"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-01-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[100000,0],[50000,0.18],[200000,0.25],[200000,0.28],[300000,0.3],[700000,0.32],["Infinity",0.37]],"employerSS":[{"cap":99,"key":"ssc","label":"SSC (0.9%)","rate":0.009}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"cap":99,"key":"ssc","label":"SSC (0.9%)","rate":0.009}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["NA"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"namra.org.na","url":"https://www.namra.org.na"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"namra.org.na","url":"https://namra.org.na"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"NamRA consolidated Value-Added Tax Act","url":"https://www.namra.org.na/documents/cms/uploaded/valueadded-tax-act-10-of-2000-0d8c7ed7fc.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Value-Added Tax Amendment Act 5 of 2024","url":"https://namiblii.org/akn/na/act/2024/5/eng%402024-09-16/publication"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"NamRA ITAS portal","url":"https://www.itas.namra.org.na/"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:8f45055f78006aaaedf099b9f56edd327ffdbed1508fe9ac6f98dd2851ae0d3b","artifactPath":"netlify/functions/_engines/ne-paye.js","currency":"XOF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.8f45055f7800","id":"paye-server-ne","jurisdictions":["NE"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2025-07-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[25000,0],[15000,0.02],[30000,0.1],[30000,0.15],[50000,0.2],["Infinity",0.35]],"employerSS":[{"key":"cnss","label":"CNSS (16.5%)","rate":0.165}],"isMonthly":true,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"cnss","label":"CNSS (5.25%)","rate":0.0525}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["NE"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Direction generale des impots - Niger","url":"https://www.impots.gouv.ne/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"DGI Niger Code general des impots 2025","url":"https://www.impots.gouv.ne/media/telech/LIVRE%201%20ET%202%20ENTIER%20CGI%202025.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ordinance 2025-44 - Finance Law 2026","url":"https://www.finances.gouv.ne/index.php/lois-de-finances/file/1303-ordonnance-n-2025-44"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:287ca7c278d8bdc2411fb66d1777b853359d0320524821b44055a5025765a789","artifactPath":"netlify/functions/_engines/ng-paye.js","currency":"NGN","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.287ca7c278d8","id":"paye-server-ng","jurisdictions":["NG"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-03-01","owner":"AfroTools formula review owners","parameters":{"artifactDigest":"sha256:287ca7c278d8bdc2411fb66d1777b853359d0320524821b44055a5025765a789","artifactPath":"netlify/functions/_engines/ng-paye.js","mode":"protected-legacy-parameter-reference","note":"Constants remain in the legacy runtime; the digest gate prevents silent drift until a behavior-preserving migration is available."},"protectedDuplicates":["assets/js/engines/ng-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"method":"runtime-defined","precision":"Preserve current executable behavior.","stages":["Formula artifact controls intermediate and final rounding; focused unit or golden-fixture assertions protect observed stages."]},"sourceJurisdictions":["NG"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"FIRS","url":"https://www.firs.gov.ng/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"firs.gov.ng","url":"https://firs.gov.ng"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"taxes.firs.gov.ng","url":"https://taxes.firs.gov.ng"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Nigeria Tax Act 2025","url":"https://nass.gov.ng/documents/download/11249"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Nigeria Tax Administration Act 2025","url":"https://www.nrs.gov.ng/uploads/NIGERIA_TAX_ADMINISTRATION_ACT_2025_8c945071a7.pdf"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:dd9433a36b68800a4a2cd92b8768917858814e76b7b2dbeced3cffcc944a7dd9","artifactPath":"netlify/functions/_engines/rw-paye.js","currency":"RWF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.dd9433a36b68","id":"paye-server-rw","jurisdictions":["RW"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2025-03-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[720000,0],[480000,0.1],[1200000,0.2],["Infinity",0.3]],"employerSS":[{"key":"pension","label":"RSSB Pension (6%)","rate":0.06},{"key":"maternity","label":"Maternity (0.3%)","rate":0.003}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"pension","label":"RSSB Pension (6%)","rate":0.06},{"key":"maternity","label":"Maternity (0.3%)","rate":0.003}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["RW"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"rra.gov.rw","url":"https://rra.gov.rw"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"rssb.gov.rw","url":"https://rssb.gov.rw"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:6bb14725c134690bc6d53deb5abb31e04d68b773176691e701fbc9c2820fe079","artifactPath":"netlify/functions/_engines/sc-paye.js","currency":"SCR","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"declared","effectiveFrom":"2018-06-01","effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.6bb14725c134","id":"paye-server-sc","jurisdictions":["SC"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-01-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[8555.5,0],[1444.5,0.15],[73333,0.2],["Infinity",0.3]],"employerSS":[{"key":"spf","label":"SPF Pension (5%)","rate":0.05}],"isMonthly":true,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"spf","label":"SPF Pension (5%)","rate":0.05}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["SC"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"src.gov.sc","url":"https://src.gov.sc"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"SRC VAT legislation hub","url":"https://src.gov.sc/legislation/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Value Added Tax Amendment Act 2024","url":"https://src.gov.sc/wp-content/uploads/2025/10/Act-16-2024-Value-Added-Tax-Amendment-Act-2024.pdf"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:58cf8206e3b514e33245ac620c332aad5bb7318760d7ecbae89b7feea255282c","artifactPath":"netlify/functions/_engines/sd-paye.js","currency":"SDG","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.58cf8206e3b5","id":"paye-server-sd","jurisdictions":["SD"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-01-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[["Infinity",0.15]],"employerSS":[{"key":"nssf","label":"Social Insurance (17%)","rate":0.17}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"nssf","label":"Social Insurance (8%)","rate":0.08}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["SD"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"financialministry.gov.sd","url":"https://financialministry.gov.sd"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Clarification de l'Autorité fiscale, 28 mars 2026","url":"https://tax.gov.sd/en/newsen/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Champ et procédures officielles de TVA","url":"https://tax.gov.sd/en/value-added-tax-vat/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Lois et règlements officiels de TVA","url":"https://tax.gov.sd/en/tax-laws/"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:7a53aa29bd05de5ba25f6df3b284900ce8e2fea3d6bfd609ec21b1b1e99a6e7c","artifactPath":"netlify/functions/_engines/sl-paye.js","currency":"SLE","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.7a53aa29bd05","id":"paye-server-sl","jurisdictions":["SL"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-04-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[600000,0],[500000,0.15],[500000,0.2],[500000,0.25],["Infinity",0.3]],"employerSS":[{"key":"nassit","label":"NASSIT (10%)","rate":0.1}],"isMonthly":true,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"nassit","label":"NASSIT (5%)","rate":0.05}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["SL"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"nra.gov.sl","url":"https://nra.gov.sl"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"NRA Goods and Services Tax","url":"https://nra.gov.sl/dtd/1"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:4c4d1a17b538dfe51c5e2d2a45e04e9ac9e71d9d45cd688462f50a63fe0a8b85","artifactPath":"netlify/functions/_engines/sn-paye.js","currency":"XOF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-07-28+sha256.4c4d1a17b538","id":"paye-server-sn","jurisdictions":["SN"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-07-28","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[630000,0],[870000,0.2],[2500000,0.3],[4000000,0.35],[5500000,0.37],[11500000,0.4],["Infinity",0.43]],"employerSS":[{"baseCap":432000,"key":"ipres","label":"IPRES (8.4%)","rate":0.084}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"baseCap":432000,"key":"ipres","label":"IPRES (5.6%)","rate":0.056}]}},"protectedDuplicates":["assets/js/engines/sn-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["SN"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ministère des Finances — rapport d’exécution budgétaire T4 2025","url":"https://www.vie-publique.sn/docs/3bba2f1b-0ee5-41e5-92be-19f4ba06353f/rapport-trimestriel-dexecution-budgetaire-quatrieme-trimestre-2025.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"DGTSS — Rapport annuel des statistiques du travail 2024","url":"https://dgtss.gouv.sn/wp-content/uploads/simple-file-list/Publications/Rapports-statistiques/Rapport-annuel-des-statistiques-du-travail-2024.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"DGID laws and regulations hub","url":"https://www.dgid.sn/loi-et-reglement/"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:5f1d21c678bdcc1f01b5931ec9948fd1599fb5b1dcbea3056c3cd94428496400","artifactPath":"netlify/functions/_engines/so-paye.js","currency":"USD","currencyAssumption":"Explicit runtime currency override; formula remains review-required and is never silently relabeled.","currencyOverride":{"canonicalCurrency":"SOS","reason":"Runtime explicitly uses a currency different from the canonical country record; no automatic substitution is allowed.","runtimeCurrency":"USD","status":"review-required"},"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-07-22+sha256.5f1d21c678bd","id":"paye-server-so","jurisdictions":["SO"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-07-22","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"currency":"USD","employmentDeductionsAllowed":false,"nonresidentRate":0.18,"period":"monthly","residentAdultBands":[{"rate":0,"width":100},{"rate":0.06,"width":400},{"rate":0.12,"width":1000},{"rate":0.18,"width":"Infinity"}],"residentUnder18Rate":0.2,"scope":"Federal Republic of Somalia income tax only"}},"protectedDuplicates":["assets/js/engines/so-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"method":"display-only","stages":["retain exact calculation values","round to cents for display"]},"sourceJurisdictions":["SO"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Federal Republic of Somalia Income Tax Law No. 37 of 2025","url":"https://www.mof.gov.so/sites/default/files/Publications/Sh.Lr_.37%20-SHARCIGA%20CASHUURTA%20DAKHLIGA%20.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Income Tax Regulations 2025","url":"https://mof.gov.so/sites/default/files/Publications/Income%20Tax%20Regulation_%200141%2C%202025.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ministry of Finance Income Tax Manual, November 2025","url":"https://mof.gov.so/sites/default/files/Publications/Somalia%20Income%20Tax%20Manual_English%20Version.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ministère fédéral · cadre budgétaire 2026","url":"https://mof.gov.so/publications/fiscal-year-2026-budget-policy-framework-paper"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ministère fédéral · politique 2023","url":"https://mof.gov.so/publications/xeer-nidaamiyaha-canshuurta-gedis-layda-turnover-tax"}],"supportStatus":"review-required","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:b552f9003fdb315a5062c7f3a4b774ee9ce69d50468125f657ede754b8ba4f27","artifactPath":"netlify/functions/_engines/ss-paye.js","currency":"SSP","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-07-22+sha256.b552f9003fdb","id":"paye-server-ss","jurisdictions":["SS"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-01-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bands":[{"rate":0,"width":20000},{"rate":0.05,"width":20000},{"rate":0.1,"width":17000},{"rate":0.15,"width":33000},{"rate":0.2,"width":"Infinity"}],"currency":"SSP","employeeNsifDeductibleFromPitBase":true,"employeeNsifRate":0.08,"employerNsifRate":0.17,"period":"monthly","pitSurtaxBase":"computed monthly PIT","pitSurtaxRate":0.3}},"protectedDuplicates":["assets/js/engines/ss-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"method":"exact-then-display","stages":["calculate employee NSIF at 8% of monthly gross wages","deduct approved employee contribution from the PIT base","apply progressive monthly PIT bands","calculate surtax at 30% of computed PIT","round user-facing SSP totals only"]},"sourceJurisdictions":["SS"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Taxation Act 2009","url":"https://cms.nra.gov.ss/uploads/South_Sudan_Taxation_Act_2009_fc9418fd5d.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Financial Act FY 2023/24","url":"https://cms.nra.gov.ss/uploads/FINANCIAL_Act_FY_2023_2024_MAIL_97b32cab38.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Taxation Amendment Act 2012","url":"https://docs.southsudanngoforum.org/sites/default/files/2016-06/01.A.1.3.%20Taxation%20Amendment%20Act%202012%20-%20South%20Sudan.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"National Social Insurance Fund Act 2023","url":"https://dr.211check.org/wp-content/uploads/2024/02/NATIONAL-SOCIAL-INSURANCE-FUND-ACT-2023.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"2024 PIT administration circular","url":"https://docs.southsudanngoforum.org/sites/default/files/2024-09/CIRCULAR%20ON%20THE%20ADMINISTRATION%20OF%20PIT%20%281%29.pdf"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:6fd4a8fd254eae936fb819e6a2946e86111c11dfdc5117362ced3f838ca8c43a","artifactPath":"netlify/functions/_engines/st-paye.js","currency":"STN","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-07-22+sha256.6fd4a8fd254e","id":"paye-server-st","jurisdictions":["ST"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-07-22","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"employeeInssRate":0.04,"employerInssRate":0.06,"irsCalculated":false,"irsStatus":"CURRENT_SCHEDULE_UNCONFIRMED","method":"verified-contributions-only"}},"protectedDuplicates":["assets/js/engines/st-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"method":"runtime-defined","precision":"Preserve current executable behavior.","stages":["Formula artifact controls intermediate and final rounding; focused unit or golden-fixture assertions protect observed stages."]},"sourceJurisdictions":["ST"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"INSS Decreto-Lei 19/2022, Articles 101-102","url":"https://inss.gov.st/assets/Leis/Lei_n_19_2022.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"INSS employee guidance","url":"https://inss.gov.st/trabalhador-outrem.html"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Direccao dos Impostos IRS legislation catalog","url":"https://impostos.financas.gov.st/index.php/legislacao/leg-tributaria/category/26-irs"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"2026 State Budget, Law 3/2026","url":"https://cipstp.st/wp-content/uploads/2026/05/Lei-OGE-2026_23-marco-2026.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"National Assembly 2023 CIVA amendment record","url":"https://www2.camara.leg.br/saotomeeprincipe/diarios-da-an/xii-legislatura-8-11-22-a-8-11-26/i-serie/2.a-sessao/DAN04-IS.pdf/at_download/file"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:f9544ce8f9a288ff444592cdee66140151762055cdfb33c056a4af5bed4a94b0","artifactPath":"netlify/functions/_engines/sz-paye.js","currency":"SZL","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.f9544ce8f9a2","id":"paye-server-sz","jurisdictions":["SZ"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-09-16","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[100000,0.2],[50000,0.25],[50000,0.3],["Infinity",0.33]],"employerSS":[{"cap":215,"key":"enpf","label":"ENPF (5%)","rate":0.05}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"cap":215,"key":"enpf","label":"ENPF (5%)","rate":0.05}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["SZ"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"ERS: individual rates and rebates","url":"https://ers.org.sz/IncomeTax/RatesandThres"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"ERS: official PAYE computation workbook","url":"https://ers.org.sz/IncomeForms"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Eswatini National Provident Fund","url":"https://enpf.co.sz/"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:087e0605893ea2e7930e261b63098c6f553fc6e3a42183da1f48c6fdcb5ba668","artifactPath":"netlify/functions/_engines/td-paye.js","currency":"XAF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.087e0605893e","id":"paye-server-td","jurisdictions":["TD"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-04-06","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[300000,0],[500000,0.1],[1000000,0.15],[2000000,0.2],[5000000,0.25],["Infinity",0.35]],"employerSS":[{"key":"cnps","label":"CNPS (16.5%)","rate":0.165}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"cnps","label":"CNPS (3.5%)","rate":0.035}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["TD"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Direction generale des impots - Chad","url":"https://www.dgi.td/docs/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Official 2024 application circular — paragraphs 31–36","url":"https://www.finances.gouv.td/index.php/le-ministere/le-ministre/item/download/404_2503d5c174528169afd3a9cd827c3cb0"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Official CGI 2025 — Articles 229, 230, 235, 238","url":"https://www.finances.gouv.td/index.php/le-ministere/le-ministre/item/download/438_afa372566d4acca63cb857e846d67eef"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:cb5460d5053ff291236ad9f61624eb1cac7763a3711f197d41b92a33ac4db786","artifactPath":"netlify/functions/_engines/tg-paye.js","currency":"XOF","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-07-22+sha256.cb5460d5053f","id":"paye-server-tg","jurisdictions":["TG"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-07-22","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bands":[{"rate":0,"width":900000},{"rate":0.03,"width":2100000},{"rate":0.1,"width":3000000},{"rate":0.15,"width":3000000},{"rate":0.2,"width":3000000},{"rate":0.25,"width":3000000},{"rate":0.3,"width":5000000},{"rate":0.35,"width":"Infinity"}],"dependentReliefAnnual":120000,"employeeCnssRate":0.04,"employerCnssRate":0.175,"maximumDependents":6,"method":"annual-employment-income","professionalDeduction":{"cap":10000000,"rate":0.28},"taxRounding":"down-to-10-XOF","taxableRounding":"down-to-1000-XOF"}},"protectedDuplicates":["assets/js/engines/tg-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"method":"statutory-stage-rounding","stages":["annual taxable income down to XOF 1,000","annual tax down to XOF 10"]},"sourceJurisdictions":["TG"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"OTR consolidated CGI/LPF, Articles 26 and 72–74","url":"https://www.otr.tg/index.php/fr/documentation/sur-les-impots/code-general-des-impots/600-code-general-des-impots-livre-des-procedures-fiscales-mis-a-jour-2025/file.html"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"CNSS Togo contribution rates","url":"https://cnss.tg/terme/taux-de-cotisations/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"CNSS contribution base and collection rules","url":"https://cnss.tg/prestations/recouvrement/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"2026 Finance Law publication","url":"https://finances.gouv.tg/loi-n2025-002-portant-loi-de-finances-exercice-2026/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"OTR Fiscal Handbook 2026","url":"https://www.otr.tg/index.php/fr/documentation/sur-les-impots/code-general-des-impots/628-cahier-fiscal-2026/file.html"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:4dfce78edd45cdee4d52ec22a383efe6da9c03e21f3724dcb37f4a63a0d61025","artifactPath":"netlify/functions/_engines/tn-paye.js","currency":"TND","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.4dfce78edd45","id":"paye-server-tn","jurisdictions":["TN"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-03-28","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[5000,0],[15000,0.26],[15000,0.28],[15000,0.32],["Infinity",0.35]],"employerSS":[{"key":"cnss","label":"CNSS (16.57%)","rate":0.1657}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"cnss","label":"CNSS (9.18%)","rate":0.0918}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["TN"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"finances.gov.tn","url":"https://www.finances.gov.tn"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"finances.gov.tn","url":"https://finances.gov.tn"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:23880f54cf756773b0dcdca2dc81516c4b76e857b6ba41bac92ad5dd43ed4164","artifactPath":"netlify/functions/_engines/tz-paye.js","currency":"TZS","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"declared","effectiveFrom":"2025-07-01","effectiveTo":"2026-06-30","formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.23880f54cf75","id":"paye-server-tz","jurisdictions":["TZ"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-01-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[270000,0],[250000,0.08],[240000,0.2],[240000,0.25],["Infinity",0.3]],"employerSS":[{"key":"nssf","label":"NSSF (10%)","rate":0.1}],"isMonthly":true,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"nssf","label":"NSSF (10%)","rate":0.1}]}},"protectedDuplicates":["assets/js/engines/tz-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["TZ"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"TRA PAYE calculator Official TRA calculator for monthly income tax payable.","url":"https://paymentregistration.tra.go.tz/payecalculator/paye.htm"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"TRA taxpayer portal Official portal for taxpayer account actions.","url":"https://taxpayersportal.tra.go.tz/ept/main"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"tra.go.tz","url":"https://tra.go.tz"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ministère · Loi TVA Cap. 148","url":"https://repository.mof.go.tz/items/47310f34-17e4-4aeb-b25a-5484c2d5fb3a"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Ministère · Loi de finances 2025","url":"https://repository.mof.go.tz/items/70e59251-afff-49ee-9b52-d5c85bfd03e8"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:6a296f528bc6c63f331a63847f9a325ceb9f69011057fee3f72e4c011a7a302d","artifactPath":"netlify/functions/_engines/ug-paye.js","currency":"UGX","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"declared","effectiveFrom":"2026-07-01","effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-09-16+sha256.6a296f528bc6","id":"paye-server-ug","jurisdictions":["UG"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-09-16","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"employeeNssfRate":0.05,"employerNssfRate":0.1,"highIncomeSupplementRate":0.1,"lstAssessmentBase":"monthly gross salary as defined by the KCCA guidance","lstBands":[{"annual":0,"upTo":100000},{"annual":5000,"upTo":200000},{"annual":10000,"upTo":300000},{"annual":20000,"upTo":400000},{"annual":30000,"upTo":500000},{"annual":40000,"upTo":600000},{"annual":60000,"upTo":700000},{"annual":70000,"upTo":800000},{"annual":80000,"upTo":900000},{"annual":90000,"upTo":1000000},{"annual":100000,"upTo":"Infinity"}],"lstCollectionInstallmentsMaximum":4,"lstDeductedBeforePaye":true,"method":"monthly-employment-income-with-gross-salary-lst-assessment-before-paye-and-before-nssf","nonResidentThresholds":[335000,410000,10000000],"nssfDeductibleFromPayeBase":false,"regimes":["RESIDENT","NON_RESIDENT"],"residentThresholds":[335000,410000,485000,10000000]}},"protectedDuplicates":["assets/js/engines/ug-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"method":"display-only","stages":["retain exact statutory calculation values","round only for displayed UGX and exported rows"]},"sourceJurisdictions":["UG"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"URA: resident PAYE notice, 7 September 2026","url":"https://ura.go.ug/en/changes-to-paye-return-form-following-the-income-tax-amendment-act-2026/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"URA: non-resident PAYE schedule (prior review basis)","url":"https://ura.go.ug/en/domestic-taxes/paye-rates/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"KCCA: Local Service Tax guidance (prior review basis)","url":"https://kcca.go.ug/uDocs/Local_Service_Tax_FAQs.pdf"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"NSSF Uganda: membership contributions (prior review basis)","url":"https://www.nssfug.org/about-us/membership/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"ura.go.ug","url":"https://ura.go.ug"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:90b15089d1f6a086cc6202a645880a3e9264e3b4834eaee77031d24b5871278b","artifactPath":"netlify/functions/_engines/za-paye.js","currency":"ZAR","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"declared","effectiveFrom":"2025-03-01","effectiveTo":"2026-02-28","formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.90b15089d1f6","id":"paye-server-za","jurisdictions":["ZA"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-01-01","owner":"AfroTools formula review owners","parameters":{"artifactDigest":"sha256:90b15089d1f6a086cc6202a645880a3e9264e3b4834eaee77031d24b5871278b","artifactPath":"netlify/functions/_engines/za-paye.js","mode":"protected-legacy-parameter-reference","note":"Constants remain in the legacy runtime; the digest gate prevents silent drift until a behavior-preserving migration is available."},"protectedDuplicates":["assets/js/engines/za-paye.js"],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"method":"runtime-defined","precision":"Preserve current executable behavior.","stages":["Formula artifact controls intermediate and final rounding; focused unit or golden-fixture assertions protect observed stages."]},"sourceJurisdictions":["ZA"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"SARS (sars.gov.za)","url":"https://www.sars.gov.za/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"sars.gov.za","url":"https://sars.gov.za"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"SARS · TVA","url":"https://www.sars.gov.za/types-of-tax/value-added-tax/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"SARS · Taux et seuils 2026","url":"https://www.sars.gov.za/tax-rates/other-taxes/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"SARS · Guides TVA","url":"https://www.sars.gov.za/legal-counsel/legal-counsel-publications/find-a-guide/value-added-tax-vat/"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:eef3de7a681c44706d3ae1268c2ab1cd47efbb4a10fc678708f5241565dd32b3","artifactPath":"netlify/functions/_engines/zm-paye.js","currency":"ZMW","currencyAssumption":"Currency follows the declared runtime or canonical country data.","currencyOverride":null,"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-09-15+sha256.eef3de7a681c","id":"paye-server-zm","jurisdictions":["ZM"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-09-15","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[5100,0],[2000,0.2],[2100,0.3],["Infinity",0.37]],"employerSS":[{"cap":1861.8,"key":"napsa","label":"NAPSA (5%)","rate":0.05},{"baseAnnualKey":"basicAnnual","key":"nhima","label":"NHIMA (1% of basic salary)","rate":0.01}],"isMonthly":true,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"cap":1861.8,"key":"napsa","label":"NAPSA (5%)","rate":0.05},{"baseAnnualKey":"basicAnnual","key":"nhima","label":"NHIMA (1% of basic salary)","rate":0.01}],"ssDeductibleFromTaxable":false}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["ZM"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"ZRA tax information and 2026 PAYE example","url":"https://www.zra.org.zm/tax-information/"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"NAPSA official 2026 contribution ceiling notice","url":"https://www.linkedin.com/posts/national-pension-scheme-authority_public-notice-revision-in-contribution-ceiling-activity-7417941633180090368-y4Dr"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"National Health Insurance Regulations 2019, Third Schedule","url":"https://media.zambialii.org/media/legislation/41897/source_file/e1932f4e1b7838ef/zm-act-si-2019-63-publication-document.pdf"}],"supportStatus":"registered","units":["currency"],"verificationBasis":"AfroTools source audit"},{"applicablePopulation":"Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.","artifactDigest":"sha256:dcb7172cbfd96a1fafa7a16e03a228b59fc5143f8a91e2ac0b24999b9d92af16","artifactPath":"netlify/functions/_engines/zw-paye.js","currency":"USD","currencyAssumption":"Explicit runtime currency override; formula remains review-required and is never silently relabeled.","currencyOverride":{"canonicalCurrency":"ZWG","reason":"Runtime explicitly uses a currency different from the canonical country record; no automatic substitution is allowed.","runtimeCurrency":"USD","status":"review-required"},"disclaimer":"Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.","effectiveDateStatus":"review-required","effectiveFrom":null,"effectiveTo":null,"formulaFamily":"paye-server","formulaVersion":"2026-03-01+sha256.dcb7172cbfd9","id":"paye-server-zw","jurisdictions":["ZW"],"knownExclusions":["Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled."],"lastVerified":"2026-01-01","owner":"AfroTools formula review owners","parameters":{"mode":"schema-exposed-runtime-parameters","values":{"bandType":"progressive","bands":[[6000,0],[6000,0.2],[24000,0.25],[24000,0.3],[60000,0.35],["Infinity",0.4]],"employerSS":[{"key":"nssa","label":"NSSA (3.5%)","rate":0.035}],"isMonthly":false,"personalRelief":0,"regimes":["STANDARD"],"socialSecurity":[{"key":"nssa","label":"NSSA (3.5%)","rate":0.035}]}},"protectedDuplicates":[],"riskDomain":"tax_payroll","riskLevel":"high","rounding":{"calculationNote":"Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.","method":"nearest-integer","stages":["individual statutory deductions","tax per band in the result breakdown","annual net tax after relief","annual and monthly net result","employer contribution totals"]},"sourceJurisdictions":["ZW"],"sources":[{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"zimra.co.zw","url":"https://www.zimra.co.zw"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"zimra.co.zw","url":"https://zimra.co.zw"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Avis ZIMRA 07 de 2026","url":"https://www.zimra.co.zw/public-notices?download=4441%3Apublic-notice-07-of-2026-change-of-vat-rate-on-submission-of-return-category-a"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Mécanique de la TVA ZIMRA","url":"https://zimra.co.zw/domestic-taxes/vat/mechanics-of-vat"},{"authorityStatus":"source-reviewed","kind":"authority-link","registryId":null,"title":"Loi de finances 7 de 2025, article 34","url":"https://zimlii.org/akn/zw/act/2025/7/eng%402025-12-29"}],"supportStatus":"review-required","units":["currency"],"verificationBasis":"AfroTools source audit"}],"routeMappings":[{"formulaId":"route-ao-paye","routes":["/angola/ao-paye","/fr/angola/ao-paye"],"sourceUrls":["https://www.agt.minfin.gov.ao","https://agt.minfin.gov.ao","https://agt.minfin.gov.ao/"],"toolId":"ao-paye"},{"formulaId":"route-ao-vat","routes":["/angola/ao-vat","/fr/angola/ao-vat","/sw/angola/kikokotoo-vat/"],"sourceUrls":["https://agt.minfin.gov.ao/","https://lex.ao/docs/assembleia-nacional/2023/lei-n-o-14-23-de-28-de-dezembro/","https://lex.ao/docs/presidente-da-republica/2025/decreto-presidencial-n-o-71-25-de-20-de-marco/","https://www.agt.minfin.gov.ao","https://agt.minfin.gov.ao"],"toolId":"ao-vat"},{"formulaId":"route-bf-paye","routes":["/burkina-faso/bf-paye","/fr/burkina-faso/bf-paye"],"sourceUrls":["https://dgi.bf/"],"toolId":"bf-paye"},{"formulaId":"route-bf-paye-fr","routes":["/fr/burkina-faso/bf-paye"],"sourceUrls":["https://dgi.bf/"],"toolId":"bf-paye-fr"},{"formulaId":"route-bf-vat","routes":["/burkina-faso/bf-vat","/fr/burkina-faso/bf-vat","/fr/burkina-faso/calculateur-tva","/sw/burkina-faso/kikokotoo-vat/"],"sourceUrls":["https://dgi.bf/verification/CGI","https://dgi.bf/wp-content/uploads/2023/10/DECLARATION-DE-LA-TAXE-SUR-LA-VALEUR-AJOUTEE.pdf","https://dgi.bf/%F0%9D%90%8B%F0%9D%90%A8%F0%9D%90%A2-%F0%9D%90%9D%F0%9D%90%9E-%F0%9D%90%9F%F0%9D%90%A2%F0%9D%90%A7%F0%9D%90%9A%F0%9D%90%A7%F0%9D%90%9C%F0%9D%90%9E%F0%9D%90%AC-%F0%9D%9F%90%F0%9D%9F%8E%F0%9D%9F%90-2/"],"toolId":"bf-vat"},{"formulaId":"route-bi-paye","routes":["/burundi/bi-paye","/fr/burundi/bi-paye"],"sourceUrls":["https://obr.gov.bi","https://www.obr.bi/images/PDF/VULGARISATION_DES_LOIS_FISCALES_final.pdf","https://www.obr.bi/index.php/communiques/2528-communique-aux-contribuables-ayant-un-chiffre-d-affaires-de-25-millions-de-fbu"],"toolId":"bi-paye"},{"formulaId":"route-bi-vat","routes":["/burundi/bi-vat","/fr/burundi/bi-vat","/fr/burundi/calculateur-tva","/sw/burundi/kikokotoo-vat/"],"sourceUrls":["https://www.obr.bi/images/PDF/VULGARISATION_DES_LOIS_FISCALES_final.pdf","https://www.obr.bi/index.php/communiques/2528-communique-aux-contribuables-ayant-un-chiffre-d-affaires-de-25-millions-de-fbu","https://obr.bi/index.php/systeme-de-facturation-electronique-ebms","https://obr.gov.bi"],"toolId":"bi-vat"},{"formulaId":"route-bj-paye","routes":["/benin/bj-paye","/fr/benin/bj-paye","/fr/benin/calculateur-salaire-net","/sw/benin/kikokotoo-kodi-mshahara","/widgets/iframe/financial-benin-paye"],"sourceUrls":["https://api.impots.bj/media/6984ebbbb7bc0_B%C3%A9nin-Code%20G%C3%A9n%C3%A9ral%20des%20Imp%C3%B4ts%202026.pdf","https://cnss.bj/procedure-de-recouvrement-des-cotisations/","https://api.impots.bj/media/63c7b8d3eef3c_Benin-CGI-2023-officiel.pdf","https://api.impots.bj/media/619276da1364b_CE%20QUE%20VOUS%20DEVEZ%20SAVOIR%20SUR%20LA%20TVA.pdf","https://budgetbenin.bj/loi-de-finances-gestion-2026/"],"toolId":"bj-paye"},{"formulaId":"route-bj-paye-fr","routes":["/fr/benin/bj-paye"],"sourceUrls":["https://impots.finances.gouv.bj"],"toolId":"bj-paye-fr"},{"formulaId":"route-bj-vat","routes":["/benin/bj-vat","/fr/benin/bj-vat","/fr/benin/calculateur-tva","/sw/benin/kikokotoo-vat/"],"sourceUrls":["https://api.impots.bj/media/63c7b8d3eef3c_Benin-CGI-2023-officiel.pdf","https://api.impots.bj/media/619276da1364b_CE%20QUE%20VOUS%20DEVEZ%20SAVOIR%20SUR%20LA%20TVA.pdf","https://budgetbenin.bj/loi-de-finances-gestion-2026/","https://api.impots.bj/media/6984ebbbb7bc0_B%C3%A9nin-Code%20G%C3%A9n%C3%A9ral%20des%20Imp%C3%B4ts%202026.pdf","https://cnss.bj/procedure-de-recouvrement-des-cotisations/"],"toolId":"bj-vat"},{"formulaId":"route-bw-paye","routes":["/botswana/bw-paye","/fr/botswana/bw-paye"],"sourceUrls":["https://www.burs.org.bw","https://burs.org.bw","https://www.burs.org.bw/index.php/brochure?download=815%3Aburs-vat-brochures"],"toolId":"bw-paye"},{"formulaId":"route-bw-vat","routes":["/botswana/bw-vat","/fr/botswana/bw-vat","/sw/botswana/kikokotoo-vat/"],"sourceUrls":["https://www.burs.org.bw/index.php/brochure?download=815%3Aburs-vat-brochures","https://www.burs.org.bw/index.php/tax/tax-amendment-bills","https://www.botswanaspeaks.gov.bw/media/BILLS/2026%20BILLS/Bill39%2019_12_2025%20VALUE%20ADDED%20TAX.pdf","https://dailynews.gov.bw/news-detail/91645","https://burs.org.bw"],"toolId":"bw-vat"},{"formulaId":"route-cbk-rates","routes":["/fr/tools/taux-de-change-de-la-cbk/","/sw/zana/viwango-vya-cbk/","/tools/cbk-rates/"],"sourceUrls":["https://www.centralbank.go.ke/rates/forex-exchange-rates/"],"toolId":"cbk-rates"},{"formulaId":"route-cd-paye","routes":["/dr-congo/cd-paye","/fr/dr-congo/cd-paye"],"sourceUrls":["https://dgi.gouv.cd","https://dgi.gouv.cd/taxe-sur-la-valeur-ajoutee-tva/","https://dgi.gouv.cd/teledeclaration/","https://www.budget.gouv.cd/wp-content/uploads/budget2026/circulaire_elabo_budget2026.pdf","https://dgi.gouv.cd/communiques-officiels/"],"toolId":"cd-paye"},{"formulaId":"route-cd-vat","routes":["/dr-congo/cd-vat","/fr/dr-congo/cd-vat","/fr/rdc/calculateur-tva","/sw/dr-congo/kikokotoo-vat/"],"sourceUrls":["https://dgi.gouv.cd/taxe-sur-la-valeur-ajoutee-tva/","https://dgi.gouv.cd/teledeclaration/","https://www.budget.gouv.cd/wp-content/uploads/budget2026/circulaire_elabo_budget2026.pdf","https://dgi.gouv.cd/communiques-officiels/"],"toolId":"cd-vat"},{"formulaId":"route-cf-paye","routes":["/car/cf-paye","/fr/car/cf-paye"],"sourceUrls":["https://www.finances.gouv.cf/","https://www.finances.gouv.cf/sites/default/files/2023-05/CGI%20RCA%202017%20mise%20%C3%A0%20jour%202023.pdf","https://www.finances.gouv.cf/documentations","https://www.finances.gouv.cf/sites/default/files/2025-03/STRUCTURE%20DES%20PRIX%20DES%20PRODUITS%20PETROLIERS%20MARS%202025.pdf","https://finances.gouv.cf/sites/default/files/2026-02/RCA%20NOTE_D%27INFORMATION_2026.pdf"],"toolId":"cf-paye"},{"formulaId":"route-cf-vat","routes":["/car/cf-vat","/fr/car/cf-vat","/fr/centrafrique/calculateur-tva","/sw/central-african-republic/kikokotoo-vat/"],"sourceUrls":["https://www.finances.gouv.cf/sites/default/files/2023-05/CGI%20RCA%202017%20mise%20%C3%A0%20jour%202023.pdf","https://www.finances.gouv.cf/documentations","https://www.finances.gouv.cf/sites/default/files/2025-03/STRUCTURE%20DES%20PRIX%20DES%20PRODUITS%20PETROLIERS%20MARS%202025.pdf","https://finances.gouv.cf/sites/default/files/2026-02/RCA%20NOTE_D%27INFORMATION_2026.pdf","https://www.finances.gouv.cf/"],"toolId":"cf-vat"},{"formulaId":"route-cg-paye","routes":["/congo/cg-paye","/fr/congo/cg-paye"],"sourceUrls":["https://impots.gouv.cg/portail-client-web/public/accueil.xhtml","https://www.sgg.cg/JO/2023/congo-jo-2023-06-sp.pdf"],"toolId":"cg-paye"},{"formulaId":"route-cg-vat","routes":["/congo/cg-vat","/fr/congo/calculateur-tva","/fr/congo/cg-vat","/sw/congo/kikokotoo-vat"],"sourceUrls":["https://www.sgg.cg/JO/2023/congo-jo-2023-06-sp.pdf","https://sgg.cg/JO/2026/congo-jo-2026-3-3.pdf","https://impots.gouv.cg/portail-client-web/public/accueil.xhtml"],"toolId":"cg-vat"},{"formulaId":"route-ci-paye","routes":["/cote-divoire/ci-paye","/fr/cote-divoire/ci-paye"],"sourceUrls":["https://www.dgi.gouv.ci","https://www.cnps.ci","https://dgi.gouv.ci","https://www.cnps.ci/"],"toolId":"ci-paye"},{"formulaId":"route-ci-paye-fr","routes":["/fr/cote-divoire/ci-paye"],"sourceUrls":["https://www.dgi.gouv.ci","https://www.cnps.ci","https://dgi.gouv.ci","https://www.cnps.ci/"],"toolId":"ci-paye-fr"},{"formulaId":"route-ci-vat","routes":["/cote-divoire/ci-vat","/fr/cote-divoire/calculateur-tva","/fr/cote-divoire/ci-vat","/sw/cote-divoire/kikokotoo-vat/"],"sourceUrls":["https://dgi.gouv.ci/","https://www.fne.dgi.gouv.ci/uploads/communiques/pdf_696e12da46ae5_COMMUNIQUE_TAUX_REDUIT.pdf","https://www.dgi.gouv.ci/assets/documents/LE%20SYSTEME%20FISCAL%20IVOIRIEN.pdf","https://www.dgi.gouv.ci","https://www.cnps.ci"],"toolId":"ci-vat"},{"formulaId":"route-cm-paye","routes":["/cameroon/cm-paye","/fr/cameroon/cm-paye"],"sourceUrls":["https://www.impots.cm","https://www.impots.cm/sites/default/files/documents/arr%C3%AAt%C3%A9%20RTS%202026%20VF.pdf","https://minfi.gov.cm/loi-de-finances-2026-comprendre-les-nouvelles-mesures/"],"toolId":"cm-paye"},{"formulaId":"route-cm-paye-fr","routes":["/fr/cameroon/cm-paye"],"sourceUrls":["https://www.impots.cm","https://www.impots.cm/sites/default/files/documents/arr%C3%AAt%C3%A9%20RTS%202026%20VF.pdf"],"toolId":"cm-paye-fr"},{"formulaId":"route-cm-vat","routes":["/cameroon/cm-vat","/fr/cameroon/cm-vat","/fr/cameroun/calculateur-tva/","/sw/cameroon/kikokotoo-vat/"],"sourceUrls":["https://www.impots.cm/sites/default/files/documents/arr%C3%AAt%C3%A9%20RTS%202026%20VF.pdf","https://minfi.gov.cm/loi-de-finances-2026-comprendre-les-nouvelles-mesures/","https://minfi.gov.cm/wp-content/uploads/2026/01/BUDGET_CITOYEN_2026_VERSION_FRANCAISE.pdf","https://www.impots.cm/fr/document/tout-savoir-sur-lirpp","https://www.impots.cm/index.php/fr/documents/39"],"toolId":"cm-vat"},{"formulaId":"route-cnps-guide","routes":["/fr/tools/guide-de-la-cnps-en-cote-d-ivoire/","/sw/zana/mwongozo-wa-cnps/","/tools/cnps-guide/"],"sourceUrls":["https://www.cnps.ci/employeur/","https://www.cnps.ci/wp-content/uploads/2023/01/NOUVEAU-PLAFOND-DES-COTISATIONS-SOCIALES-DE-LA-CNPS.pdf","https://www.cnps.ci/services-en-ligne/formulaires-telechargeables/","https://www.cnps.ci/services-en-ligne/e-disa/","https://www.cnps.ci/services-en-ligne/textes-legaux-et-reglementaires/","https://www.cnps.ci/independant/","https://e.cnps.ci/connexion","https://www.cnps.ci/nos-guides/"],"toolId":"cnps-guide"},{"formulaId":"route-contractor-vs-employee","routes":["/tools/contractor-vs-employee/"],"sourceUrls":["https://www.ilo.org/topics/employment-relationship"],"toolId":"contractor-vs-employee"},{"formulaId":"route-crypto-cgt","routes":["/tools/crypto-tax/"],"sourceUrls":["https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf","https://new.kenyalaw.org/akn/ke/act/2025/9","https://new.kenyalaw.org/akn/ke/act/1973/16/eng@2026-01-01","https://www.sars.gov.za/individuals/crypto-assets-tax/","https://www.sars.gov.za/tax-rates/income-tax/capital-gains-tax-cgt/"],"toolId":"crypto-cgt"},{"formulaId":"route-cv-paye","routes":["/cape-verde/cv-paye","/fr/cape-verde/cv-paye","/fr/cape-verde/cv-paye/","/sw/cape-verde/kikokotoo-kodi-mshahara/"],"sourceUrls":["https://www.mf.gov.cv/web/dnre/dire%C3%A7%C3%A3o-geral-das-contribui%C3%A7%C3%B5es-e-impostos","https://www.mf.gov.cv/documents/54571/227418/0E%2B2018_Principais%2BMedidas%2BFiscais.pdf/c18e0d23-28ee-4d81-e03f-bfd3f0168e54?download=true","https://boe.incv.cv/Bulletins/Download/3596","https://inps.cv/obrigacoes/","https://boe.incv.cv/Bulletins/View?id=89137"],"toolId":"cv-paye"},{"formulaId":"route-cv-vat","routes":["/cape-verde/cv-vat","/fr/cape-verde/cv-vat","/fr/cape-verde/cv-vat/","/sw/cape-verde/kikokotoo-vat/"],"sourceUrls":["https://www.mf.gov.cv/documents/198414/5793427/Proposta%2Bde%2BLei%2Bque%2BAprova%2Bo%2BOr%C3%A7amento%2Bdo%2BEstado%2Bpara%2Bo%2Bano%2Becon%C3%B3mico%2Bde%2B2026.docx.pdf/a482dc41-69a8-e126-8287-3bf23464d85c","https://www.mf.gov.cv/web/dnre/circulares/-/document_library/CKZUyhVe5lAf/view_file/2377957","https://www.mf.gov.cv/web/dnre/dire%C3%A7%C3%A3o-geral-das-contribui%C3%A7%C3%B5es-e-impostos","https://www.mf.gov.cv/documents/54571/0/Calendario_Fiscal_2026_PEC_Vers%C3%A3o_Atualizado_110626.pdf/7f524ec2-1b35-2f33-8936-42e8b752516e","https://boe.incv.cv/Bulletins/View?id=89137"],"toolId":"cv-vat"},{"formulaId":"route-dj-paye","routes":["/djibouti/dj-paye","/fr/djibouti/calculateur-salaire-net/","/fr/djibouti/dj-paye","/sw/djibouti/kikokotoo-kodi-mshahara/"],"sourceUrls":["https://www.journalofficiel.dj/texte-juridique/loi-de-finances-n142-an-21-8eme-l-portant-budget-initial-de-letat-pour-lexercice-2022/","https://www.journalofficiel.dj/texte-juridique/loi-de-finances-n120-an-15-7eme-l-portant-budget-initial-de-letat-pour-lexercice-2016/","https://www.journalofficiel.dj/texte-juridique/loi-n42-an-08-6emel-portant-refonte-du-code-generale-des-impots/","https://cnss.dj/declaration-et-versement-des-cotisations/","https://www.journalofficiel.dj/texte-juridique/loi-n43-an-08-6eme-l-portant-creation-de-la-taxe-sur-la-valeur-ajoutee-et-definissant-les-dispositifs-dapplication/"],"toolId":"dj-paye"},{"formulaId":"route-dj-paye-fr","routes":["/fr/djibouti/calculateur-salaire-net/"],"sourceUrls":["https://www.journalofficiel.dj/texte-juridique/loi-de-finances-n142-an-21-8eme-l-portant-budget-initial-de-letat-pour-lexercice-2022/","https://www.journalofficiel.dj/texte-juridique/loi-n42-an-08-6emel-portant-refonte-du-code-generale-des-impots/","https://cnss.dj/declaration-et-versement-des-cotisations/"],"toolId":"dj-paye-fr"},{"formulaId":"route-dj-vat","routes":["/djibouti/dj-vat","/fr/djibouti/dj-vat","/sw/djibouti/kikokotoo-vat/"],"sourceUrls":["https://www.journalofficiel.dj/texte-juridique/loi-n43-an-08-6eme-l-portant-creation-de-la-taxe-sur-la-valeur-ajoutee-et-definissant-les-dispositifs-dapplication/","https://www.journalofficiel.dj/texte-juridique/loi-de-finances-n142-an-21-8eme-l-portant-budget-initial-de-letat-pour-lexercice-2022","https://www.journalofficiel.dj/texte-juridique/loi-de-finances-n203-an-25-9eme-l-portant-budget-initial-de-letat-pour-lexercice-2026/","https://www.journalofficiel.dj/texte-juridique/loi-de-finances-n142-an-21-8eme-l-portant-budget-initial-de-letat-pour-lexercice-2022/","https://www.journalofficiel.dj/texte-juridique/loi-n42-an-08-6emel-portant-refonte-du-code-generale-des-impots/"],"toolId":"dj-vat"},{"formulaId":"route-domestic-worker","routes":["/tools/domestic-worker/"],"sourceUrls":["https://www.ilo.org/resource/record-proceedings/ilc/100/text-convention-concerning-decent-work-domestic-workers"],"toolId":"domestic-worker"},{"formulaId":"route-dz-paye","routes":["/algeria/dz-paye","/fr/algerie/calculateur-salaire-net"],"sourceUrls":["https://www.mfdgi.gov.dz/fr/particuliers/irg-traitements-et-salaires","https://cnas.dz/fr/employeur/"],"toolId":"dz-paye"},{"formulaId":"route-dz-vat","routes":["/algeria/dz-vat","/fr/algeria/dz-vat","/fr/algerie/calculateur-tva","/sw/algeria/kikokotoo-vat/"],"sourceUrls":["https://www.mfdgi.gov.dz/fr/professionnels/services-pro/regime-reel/la-taxe-sur-la-valeur-ajoutee","https://www.mfdgi.gov.dz/fr/a-propos/actu-fr/codes-fiscaux-fr","https://www.mfdgi.gov.dz/fr/professionnels/calandrier-fiscal-pro/593-regime-reel/421-paiement-mensuel-tva","https://www.mfdgi.gov.dz","https://mfdgi.gov.dz"],"toolId":"dz-vat"},{"formulaId":"route-eg-paye","routes":["/egypt/eg-paye","/fr/egypt/eg-paye"],"sourceUrls":["https://eta.gov.eg","https://www.eta.gov.eg/sites/default/files/2024-02/Law-english-no.67-2016.pdf.pdf","https://www.eta.gov.eg/sites/default/files/2024-02/VAT-Executive-Regulations-English.pdf"],"toolId":"eg-paye"},{"formulaId":"route-eg-vat","routes":["/egypt/eg-vat","/fr/egypt/eg-vat","/sw/egypt/kikokotoo-vat/","/widgets/iframe/financial-egypt-vat.html"],"sourceUrls":["https://www.eta.gov.eg/ar/content/qwanyn-aldrybt-ly-alqymt-almdaft","https://www.eta.gov.eg/sites/default/files/2024-02/Law-english-no.67-2016.pdf.pdf","https://www.eta.gov.eg/sites/default/files/2024-02/VAT-Executive-Regulations-English.pdf","https://eta.gov.eg/en/node/250","https://eta.gov.eg/sites/default/files/2025-07/vat-law_no.157.of_.2025.pdf"],"toolId":"eg-vat"},{"formulaId":"route-employee-cost","routes":["/tools/employee-cost/"],"sourceUrls":["https://www.ilo.org/topics/wages"],"toolId":"employee-cost"},{"formulaId":"route-er-paye","routes":["/eritrea/er-paye","/fr/eritrea/er-paye","/sw/eritrea/kikokotoo-kodi-mshahara/"],"sourceUrls":["https://tile.loc.gov/storage-services/service/ll/lleritrea/eritrean-proc-62-1994/eritrean-proc-62-1994.pdf","https://faolex.fao.org/docs/pdf/eri203352.pdf","https://rodra.co.za/images/countries/eritrea/legislation/Eritrea-PensionProclamation2005.pdf","https://www.elibrary.imf.org/view/journals/002/2000/055/article-A001-en.xml","https://www.elibrary.imf.org/view/journals/002/2003/165/article-A001-en.xml"],"toolId":"er-paye"},{"formulaId":"route-er-vat","routes":["/eritrea/er-vat","/fr/eritrea/er-vat","/sw/eritrea/kikokotoo-vat/"],"sourceUrls":["https://www.elibrary.imf.org/view/journals/002/2003/165/article-A001-en.xml","https://www.elibrary.imf.org/view/journals/002/2000/055/article-A001-en.xml","https://tile.loc.gov/storage-services/service/ll/lleritrea/eritrean-proc-62-1994/eritrean-proc-62-1994.pdf","https://faolex.fao.org/docs/pdf/eri203352.pdf","https://rodra.co.za/images/countries/eritrea/legislation/Eritrea-PensionProclamation2005.pdf"],"toolId":"er-vat"},{"formulaId":"route-et-paye","routes":["/ethiopia/et-paye"],"sourceUrls":["https://erca.gov.et","https://www.mofed.gov.et/media/filer_public/af/45/af45af2f-7959-4e8b-b736-9494dda9f017/vat_proclamation_no_1341-2016_with_annex.pdf"],"toolId":"et-paye"},{"formulaId":"route-et-paye-fr","routes":["/fr/ethiopia/et-paye"],"sourceUrls":["https://erca.gov.et","https://www.mofed.gov.et/media/filer_public/af/45/af45af2f-7959-4e8b-b736-9494dda9f017/vat_proclamation_no_1341-2016_with_annex.pdf"],"toolId":"et-paye-fr"},{"formulaId":"route-et-vat","routes":["/ethiopia/et-vat","/fr/ethiopia/et-vat","/sw/ethiopia/kikokotoo-vat/"],"sourceUrls":["https://www.mofed.gov.et/media/filer_public/af/45/af45af2f-7959-4e8b-b736-9494dda9f017/vat_proclamation_no_1341-2016_with_annex.pdf","https://erca.gov.et"],"toolId":"et-vat"},{"formulaId":"route-etims-guide","routes":["/fr/tools/guide-d-etims-de-la-kra/","/tools/etims-guide/"],"sourceUrls":["https://etims.kra.go.ke/","https://www.kra.go.ke/online-services/etims","https://www.kra.go.ke/business/etims-electronic-tax-invoice-management-system/learn-about-etims/what-is-etims","https://www.kra.go.ke/business/etims-electronic-tax-invoice-management-system/learn-about-etims/how-to-onboard-on-etims","https://www.kra.go.ke/services/service/16"],"toolId":"etims-guide"},{"formulaId":"route-ga-paye","routes":["/fr/gabon/ga-paye","/gabon/ga-paye"],"sourceUrls":["https://dgi.ga/","https://journal-officiel.ga/22265-041-2025-/","https://dgi.ga/wp-content/uploads/2025/12/Gabon-CGI-2025.pdf"],"toolId":"ga-paye"},{"formulaId":"route-ga-vat","routes":["/fr/gabon/calculateur-tva","/fr/gabon/ga-vat","/gabon/ga-vat","/sw/gabon/kikokotoo-vat/"],"sourceUrls":["https://journal-officiel.ga/22265-041-2025-/","https://dgi.ga/wp-content/uploads/2025/12/Gabon-CGI-2025.pdf","https://dgi.ga/"],"toolId":"ga-vat"},{"formulaId":"route-gh-paye","routes":["/ghana/gh-paye"],"sourceUrls":["https://gra.gov.gh/news/portfolio/amendments-income-tax-act-2026-act-1178/","https://www.ssnit.org.gh/wp-content/uploads/2026/01/Public-Notice-Min-Max-Insurable.pdf","https://gra.gov.gh/","https://gra.gov.gh/domestic-tax/tax-types/paye/","https://gra.gov.gh/online-tools/tax-calendar/","https://gra.gov.gh","https://gra.gov.gh/domestic-tax/tax-types/vat/"],"toolId":"gh-paye"},{"formulaId":"route-gh-paye-fr","routes":["/fr/ghana/gh-paye"],"sourceUrls":["https://gra.gov.gh/news/portfolio/amendments-income-tax-act-2026-act-1178/","https://www.ssnit.org.gh/wp-content/uploads/2026/01/Public-Notice-Min-Max-Insurable.pdf","https://gra.gov.gh","https://gra.gov.gh/","https://gra.gov.gh/domestic-tax/tax-types/paye/","https://gra.gov.gh/online-tools/tax-calendar/","https://gra.gov.gh/domestic-tax/tax-types/vat/"],"toolId":"gh-paye-fr"},{"formulaId":"route-gh-vat","routes":["/fr/ghana/gh-vat","/ghana/gh-vat","/sw/ghana/kikokotoo-vat/"],"sourceUrls":["https://gra.gov.gh/news/portfolio/notice-to-all-vat-registered-taxpayers/","https://gra.gov.gh/domestic-tax/tax-types/vat/","https://gra.gov.gh/domestic-tax/tax-types/vat-exemptions/","https://gra.gov.gh/e-services/e-vat/","https://gra.gov.gh/"],"toolId":"gh-vat"},{"formulaId":"route-gm-paye","routes":["/fr/gambia/gm-paye","/gambia/gm-paye","/sw/gambia/kikokotoo-kodi-mshahara/"],"sourceUrls":["https://www.gra.gm/calculators/pay-as-you-earn-paye-","https://www.gra.gm/download-file/8d0ccc58-d217-11ed-9b31-029254d29bb1","https://www.sshfc.gm/national-provident-fund","https://www.sshfc.gm/industrial-injury-compensation-fund","https://www.sshfc.gm/overview"],"toolId":"gm-paye"},{"formulaId":"route-gm-vat","routes":["/fr/gambia/gm-vat","/gambia/gm-vat","/sw/gambia/kikokotoo-vat/"],"sourceUrls":["https://www.gra.gm/domestic-faqs","https://www.gra.gm/download-file/8d0cfa28-d217-11ed-9b31-029254d29bb1","https://www.gra.gm/calculators/pay-as-you-earn-paye-","https://www.gra.gm/download-file/8d0ccc58-d217-11ed-9b31-029254d29bb1","https://www.sshfc.gm/overview"],"toolId":"gm-vat"},{"formulaId":"route-gn-paye","routes":["/fr/guinea/gn-paye","/guinea/gn-paye"],"sourceUrls":["https://mf.gov.gn","https://dgi.gov.gn/code-general-des-impots/","https://mbudget.gov.gn/lois-de-finances/"],"toolId":"gn-paye"},{"formulaId":"route-gn-vat","routes":["/fr/guinea/gn-vat","/fr/guinee/calculateur-tva","/guinea/gn-vat","/sw/guinea/kikokotoo-vat/"],"sourceUrls":["https://dgi.gov.gn/code-general-des-impots/","https://mbudget.gov.gn/lois-de-finances/","https://mf.gov.gn"],"toolId":"gn-vat"},{"formulaId":"route-gq-paye","routes":["/eq-guinea/gq-paye","/fr/eq-guinea/gq-paye"],"sourceUrls":["https://minhacienda-gob.com/","https://www.guineaecuatorialpress.com/noticias/presentacion_oficial_de_la_nueva_ley_general_tributaria_de_guinea_ecuatorial","https://minhacienda-gob.com/wp-content/uploads/2026/01/Libro_LPGE-2026.pdf","https://www.guineaecuatorialpress.com/noticias/orden_ministerial_relativa_al_iva"],"toolId":"gq-paye"},{"formulaId":"route-gq-vat","routes":["/eq-guinea/gq-vat","/fr/eq-guinea/gq-vat","/fr/eq-guinea/gq-vat/","/sw/equatorial-guinea/kikokotoo-vat/"],"sourceUrls":["https://www.guineaecuatorialpress.com/noticias/presentacion_oficial_de_la_nueva_ley_general_tributaria_de_guinea_ecuatorial","https://minhacienda-gob.com/wp-content/uploads/2026/01/Libro_LPGE-2026.pdf","https://www.guineaecuatorialpress.com/noticias/orden_ministerial_relativa_al_iva","https://minhacienda-gob.com/"],"toolId":"gq-vat"},{"formulaId":"route-gratuity-calculator","routes":["/tools/gratuity-calculator/"],"sourceUrls":["https://normlex.ilo.org/dyn/nrmlx_en/f?p=NORMLEXPUB:12100:0::NO::P12100_ILO_CODE:C158"],"toolId":"gratuity-calculator"},{"formulaId":"route-gw-paye","routes":["/fr/guinea-bissau/gw-paye","/guinea-bissau/gw-paye"],"sourceUrls":["https://mf.gov.gw","https://kontaktu.mef.gw/","https://kontaktu.mef.gw/legislation"],"toolId":"gw-paye"},{"formulaId":"route-gw-vat","routes":["/fr/guinea-bissau/gw-vat","/guinea-bissau/gw-vat","/sw/guinea-bissau/kikokotoo-vat/"],"sourceUrls":["https://kontaktu.mef.gw/","https://kontaktu.mef.gw/legislation","https://mf.gov.gw"],"toolId":"gw-vat"},{"formulaId":"route-investment-return","routes":["/tools/investment-return/"],"sourceUrls":["https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator","https://www.stlouisfed.org/publications/regional-economist/april-2014/the-ups-and-downs-of-inflation-and-the-role-of-fed-credibility"],"toolId":"investment-return"},{"formulaId":"route-itax-guide","routes":["/fr/tools/guide-d-itax-de-la-kra/","/sw/zana/mwongozo-wa-itax/","/tools/itax-guide/"],"sourceUrls":["https://itax.kra.go.ke/KRA-Portal/","https://www.kra.go.ke/file-my-returns","https://www.kra.go.ke/individual/individual-pin-registration/learn-about-pin/about-pin","https://www.kra.go.ke/individual/individual-pin-registration/learn-about-pin/how-to-register-for-a-kra-pin-individual","https://www.kra.go.ke/individual/individual-pin-registration/learn-about-pin/requirements-for-kra-pin-registration","https://www.kra.go.ke/helping-tax-payers/faqs/kra-pin","https://www.kra.go.ke/helping-tax-payers/faqs/filing-returns-on-itax"],"toolId":"itax-guide"},{"formulaId":"route-ke-cgt","routes":["/fr/tools/ke-plus-value/","/tools/ke-cgt/"],"sourceUrls":["https://www.kra.go.ke/helping-tax-payers/faqs/capital-gain-taxes","https://new.kenyalaw.org/akn/ke/act/1973/16/eng@2026-01-01"],"toolId":"ke-cgt"},{"formulaId":"route-ke-paye","routes":["/kenya/ke-paye"],"sourceUrls":["https://www.kra.go.ke/","https://www.nssf.or.ke/","https://www.kra.go.ke/individual/filing-paying/types-of-taxes/paye","https://itax.kra.go.ke/KRA-Portal/forwardOnly.htm?viewName=homePage","https://www.kra.go.ke/helping-tax-payers/faqs/learn-about-etims"],"toolId":"ke-paye"},{"formulaId":"route-ke-paye-fr","routes":["/fr/kenya/ke-paye"],"sourceUrls":["https://www.kra.go.ke/","https://www.nssf.or.ke/","https://www.kra.go.ke/individual/filing-paying/types-of-taxes/paye","https://itax.kra.go.ke/KRA-Portal/forwardOnly.htm?viewName=homePage","https://www.kra.go.ke/helping-tax-payers/faqs/learn-about-etims"],"toolId":"ke-paye-fr"},{"formulaId":"route-ke-vat","routes":["/fr/kenya/ke-vat","/kenya/ke-vat","/sw/kenya/kikokotoo-vat/"],"sourceUrls":["https://www.kra.go.ke/individual/filing-paying/types-of-taxes/value-added-tax","https://new.kenyalaw.org/akn/ke/act/2013/35/eng@2025-07-01","https://etims.kra.go.ke/","https://etims.kra.go.ke","https://www.kra.go.ke/"],"toolId":"ke-vat"},{"formulaId":"route-ke-wht","routes":["/fr/tools/ke-retenue-source/","/tools/ke-wht/"],"sourceUrls":["https://www.kra.go.ke/helping-tax-payers/faqs/withholding-income-tax","https://new.kenyalaw.org/akn/ke/act/1973/16/eng@2026-01-01","https://www.kra.go.ke/helping-tax-payers/faqs/everything-about-withholding-tax"],"toolId":"ke-wht"},{"formulaId":"route-km-paye","routes":["/comoros/km-paye","/fr/comores/calculateur-salaire-net/","/fr/comoros/km-paye","/sw/comoros/kikokotoo-kodi-mshahara/","/widgets/iframe/financial-comoros-paye.html"],"sourceUrls":["https://www.dgi.gouv.km/file/actes_officiels/Comores-CGI-2023.pdf","https://dgi.gouv.km/fr/agenda_fiscal.php","https://finances.gouv.km/wp-content/uploads/2026/02/Rapport-sur-les-Depenses-Fiscales-2024-1-1-5.pdf","https://finances.gouv.km/post-et-donnee/la-loi-n25-020-au-portant-loi-de-finances/","https://dgi.gouv.km/"],"toolId":"km-paye"},{"formulaId":"route-km-vat","routes":["/comoros/km-vat","/fr/comores/calculateur-tva","/fr/comoros/km-vat","/sw/comoros/kikokotoo-vat"],"sourceUrls":["https://www.dgi.gouv.km/file/actes_officiels/Comores-CGI-2023.pdf","https://finances.gouv.km/wp-content/uploads/2026/02/Rapport-sur-les-Depenses-Fiscales-2024-1-1-5.pdf","https://finances.gouv.km/post-et-donnee/la-loi-n25-020-au-portant-loi-de-finances/","https://dgi.gouv.km/fr/agenda_fiscal.php","https://dgi.gouv.km/"],"toolId":"km-vat"},{"formulaId":"route-lr-paye","routes":["/liberia/lr-paye"],"sourceUrls":["https://revenue.lra.gov.lr/domestic-tax/tax-education/","https://www.nasscorp.org.lr/wp-content/uploads/2024/06/Revised-Employers-Guide-Mar-20-24.pdf"],"toolId":"lr-paye"},{"formulaId":"route-lr-paye-fr","routes":["/fr/liberia/lr-paye"],"sourceUrls":["https://revenue.lra.gov.lr/domestic-tax/tax-education/","https://www.nasscorp.org.lr/wp-content/uploads/2024/06/Revised-Employers-Guide-Mar-20-24.pdf"],"toolId":"lr-paye-fr"},{"formulaId":"route-lr-vat","routes":["/fr/liberia/lr-vat","/liberia/lr-vat","/sw/liberia/kikokotoo-vat"],"sourceUrls":["https://revenue.lra.gov.lr/wp-content/uploads/2026/04/LRC-Amendment-December-2025.pdf","https://revenue.lra.gov.lr/important-revenue-noticeadjustment-to-goods-and-services-tax-gst-rates/","https://revenue.lra.gov.lr/tax-laws-and-amendments/","https://revenue.lra.gov.lr/domestic-tax/tax-education/","https://www.nasscorp.org.lr/"],"toolId":"lr-vat"},{"formulaId":"route-ls-paye","routes":["/fr/lesotho/ls-paye","/lesotho/ls-paye"],"sourceUrls":["https://www.lra.org.ls","https://www.rsl.org.ls/pay-you-earn","https://www.rsl.org.ls/pay-your-tax-bills","https://efiling.rsl.org.ls","https://lra.org.ls"],"toolId":"ls-paye"},{"formulaId":"route-ls-vat","routes":["/fr/lesotho/ls-vat","/lesotho/ls-vat","/sw/lesotho/kikokotoo-vat/"],"sourceUrls":["https://www.rsl.org.ls/tax-rates","https://www.rsl.org.ls/registrationde-registration","https://www.rsl.org.ls/sites/default/files/2024-07/VALUE%20ADDED%20TAX%20RETURN%20FORM_0.pdf","https://www.rsl.org.ls/publications","https://www.lra.org.ls"],"toolId":"ls-vat"},{"formulaId":"route-ly-paye","routes":["/fr/libya/ly-paye","/libya/ly-paye"],"sourceUrls":["https://financialministry.gov.sd"],"toolId":"ly-paye"},{"formulaId":"route-ly-vat","routes":["/fr/libya/ly-vat","/libya/ly-vat"],"sourceUrls":["https://financialministry.gov.sd"],"toolId":"ly-vat"},{"formulaId":"route-ma-paye","routes":["/fr/morocco/ma-paye","/morocco/ma-paye"],"sourceUrls":["https://dgi.gov.ma","https://tax.gov.ma","https://www.finances.gov.ma/Publication/dgi/2025/CGI-2026-FR.pdf","https://www.finances.gov.ma/Publication/dgi/2024/Note-Circulaire735LF2024.pdf"],"toolId":"ma-paye"},{"formulaId":"route-ma-paye-fr","routes":["/fr/morocco/ma-paye"],"sourceUrls":["https://dgi.gov.ma","https://tax.gov.ma","https://www.finances.gov.ma/Publication/dgi/2025/CGI-2026-FR.pdf","https://www.finances.gov.ma/Publication/dgi/2024/Note-Circulaire735LF2024.pdf"],"toolId":"ma-paye-fr"},{"formulaId":"route-ma-vat","routes":["/fr/maroc/calculateur-tva","/fr/morocco/ma-vat","/morocco/ma-vat","/sw/morocco/kikokotoo-vat/"],"sourceUrls":["https://www.finances.gov.ma/Publication/dgi/2025/CGI-2026-FR.pdf","https://www.finances.gov.ma/Publication/dgi/2024/Note-Circulaire735LF2024.pdf","https://dgi.gov.ma","https://tax.gov.ma"],"toolId":"ma-vat"},{"formulaId":"route-maternity-leave","routes":["/tools/maternity-leave/"],"sourceUrls":["https://natlex.ilo.org/"],"toolId":"maternity-leave"},{"formulaId":"route-mg-paye","routes":["/madagascar/mg-paye"],"sourceUrls":["https://mef.gov.mg","https://www.impots.mg/explorer?path=/legislation/Codes%20et%20Manuels/CDI-LFI%202026.pdf","https://www.impots.mg/explorer?path=%2Flegislation%2FCodes+et+Manuels"],"toolId":"mg-paye"},{"formulaId":"route-mg-paye-fr","routes":["/fr/madagascar/mg-paye"],"sourceUrls":["https://mef.gov.mg","https://www.impots.mg/explorer?path=/legislation/Codes%20et%20Manuels/CDI-LFI%202026.pdf","https://www.impots.mg/explorer?path=%2Flegislation%2FCodes+et+Manuels"],"toolId":"mg-paye-fr"},{"formulaId":"route-mg-vat","routes":["/fr/madagascar/calculateur-tva","/fr/madagascar/mg-vat","/madagascar/mg-vat","/sw/madagascar/kikokotoo-vat/"],"sourceUrls":["https://www.impots.mg/explorer?path=/legislation/Codes%20et%20Manuels/CDI-LFI%202026.pdf","https://www.impots.mg/explorer?path=%2Flegislation%2FCodes+et+Manuels","https://mef.gov.mg"],"toolId":"mg-vat"},{"formulaId":"route-ml-paye","routes":["/fr/mali/ml-paye","/mali/ml-paye"],"sourceUrls":["https://impots.gouv.ml","https://ts.gouv.ml"],"toolId":"ml-paye"},{"formulaId":"route-ml-paye-fr","routes":["/fr/mali/ml-paye"],"sourceUrls":["https://ts.gouv.ml","https://impots.gouv.ml"],"toolId":"ml-paye-fr"},{"formulaId":"route-ml-vat","routes":["/fr/mali/calculateur-tva","/fr/mali/ml-vat","/mali/ml-vat","/sw/mali/kikokotoo-vat/"],"sourceUrls":["https://www.dgi.gouv.ml/CGI/","https://www.dgi.gouv.ml/","https://ts.gouv.ml"],"toolId":"ml-vat"},{"formulaId":"route-mr-paye","routes":["/fr/mauritania/mr-paye","/fr/mauritanie/calculateur-salaire-net/","/mauritania/mr-paye","/sw/mauritania/kikokotoo-kodi-mshahara/"],"sourceUrls":["https://finances.gov.mr/fr/node/317","https://impots.gov.mr/DGI/particuliers/calendrier_obligations_paiement.html","https://www.fonctionpublique.gov.mr/fr/node/47","https://cnss.mr/wp-content/uploads/2025/01/DEC-CNSS-_der_version.pdf","https://dgi.gov.mr"],"toolId":"mr-paye"},{"formulaId":"route-mr-vat","routes":["/fr/mauritania/mr-vat","/fr/mauritanie/calculateur-tva","/mauritania/mr-vat","/sw/mauritania/kikokotoo-vat/"],"sourceUrls":["https://finances.gov.mr/sites/default/files/2023-03/CGI-Fr-2023.pdf","https://www.finances.gov.mr/sites/default/files/2023-08/LFR%202023-FR%20Final%201%20-%20Copie_0.pdf","https://finances.gov.mr/fr/node/745","https://dgi.gov.mr","https://finances.gov.mr/fr/node/317"],"toolId":"mr-vat"},{"formulaId":"route-mu-paye","routes":["/fr/mauritius/mu-paye","/mauritius/mu-paye"],"sourceUrls":["https://www.mra.mu","https://mra.mu/index.php/taxes-duties/26-vat","https://attorneygeneral.govmu.org/Documents/Laws%20of%20Mauritius/A-Z%20Acts/V/ValueAddedTaxActI9.pdf"],"toolId":"mu-paye"},{"formulaId":"route-mu-vat","routes":["/fr/mauritius/mu-vat","/mauritius/mu-vat","/sw/mauritius/kikokotoo-vat/"],"sourceUrls":["https://mra.mu/index.php/taxes-duties/26-vat","https://attorneygeneral.govmu.org/Documents/Laws%20of%20Mauritius/A-Z%20Acts/V/ValueAddedTaxActI9.pdf","https://www.mra.mu"],"toolId":"mu-vat"},{"formulaId":"route-mw-paye","routes":["/fr/malawi/mw-paye","/malawi/mw-paye"],"sourceUrls":["https://www.mra.mw","https://www.mra.mw/news/pages/48?cat=PAYE+Calculator","https://www.mra.mw/admin/storage/download_files/1767960355_Taxation%20%28Amendment%29%20ACT.pdf"],"toolId":"mw-paye"},{"formulaId":"route-mw-vat","routes":["/fr/malawi/mw-vat","/malawi/mw-vat","/sw/malawi/kikokotoo-vat/"],"sourceUrls":["https://www.mra.mw/admin/storage/download_files/1767960417_Value%20Adde%20Tax%20%28Amendment%29%20%28NO.%202%29%20ACT.pdf","https://www.mra.mw/admin/storage/download_files/1768232611_NEW%20CUSTOMS%20AND%20EXCISE%20MEASURES.pdf","https://eis-api.mra.mw/docs/response_3.htm","https://www.mra.mw","https://www.mra.mw/news/pages/48?cat=PAYE+Calculator"],"toolId":"mw-vat"},{"formulaId":"route-mz-paye","routes":["/fr/mozambique/mz-paye","/mozambique/mz-paye"],"sourceUrls":["https://minfin.gov.mz","https://at.gov.mz","https://www.at.gov.mz/por/Comercio-Internacional/Procedimento-Fiscais/Taxas-IRPS","https://www.at.gov.mz/por/Perguntas-Frequentes2/IRPS","https://www.inss.gov.mz/taxa-contributiva-contribuinte/"],"toolId":"mz-paye"},{"formulaId":"route-mz-vat","routes":["/fr/mozambique/mz-vat","/mozambique/mz-vat","/sw/mozambique/kikokotoo-vat/"],"sourceUrls":["https://www.inm.gov.mz/pt-br/content/suplemento-n%C2%BA-1-de-291225-pag-2180-1-20-br-n%C2%BA-248-boletim-da-rep%C3%BAblica-i-serie","https://www.mef.gov.mz/index.php/publicacoes/politicas/cenario-fiscal-de-medio-prazo-cfmp/cfmp-2024-2026/1912-cfmp-2024-2026/file","https://edeclaracao.at.gov.mz/","https://www.pwc.pt/pt/pwcinforfisco/flash/mocambique/mocambique-iva-alteracao-civa.html","https://minfin.gov.mz"],"toolId":"mz-vat"},{"formulaId":"route-na-paye","routes":["/fr/namibia/na-paye","/namibia/na-paye"],"sourceUrls":["https://www.namra.org.na","https://namra.org.na","https://www.namra.org.na/documents/cms/uploaded/valueadded-tax-act-10-of-2000-0d8c7ed7fc.pdf","https://namiblii.org/akn/na/act/2024/5/eng%402024-09-16/publication","https://www.itas.namra.org.na/"],"toolId":"na-paye"},{"formulaId":"route-na-vat","routes":["/fr/namibia/na-vat","/namibia/na-vat","/sw/namibia/kikokotoo-vat/"],"sourceUrls":["https://www.namra.org.na/documents/cms/uploaded/valueadded-tax-act-10-of-2000-0d8c7ed7fc.pdf","https://namiblii.org/akn/na/act/2024/5/eng%402024-09-16/publication","https://www.itas.namra.org.na/","https://www.namra.org.na","https://namra.org.na"],"toolId":"na-vat"},{"formulaId":"route-ne-paye","routes":["/fr/niger/ne-paye","/niger/ne-paye"],"sourceUrls":["https://www.impots.gouv.ne/","https://www.impots.gouv.ne/media/telech/LIVRE%201%20ET%202%20ENTIER%20CGI%202025.pdf","https://www.finances.gouv.ne/index.php/lois-de-finances/file/1303-ordonnance-n-2025-44"],"toolId":"ne-paye"},{"formulaId":"route-ne-vat","routes":["/fr/niger/calculateur-tva","/fr/niger/ne-vat","/niger/ne-vat","/sw/niger/kikokotoo-vat/"],"sourceUrls":["https://www.impots.gouv.ne/media/telech/LIVRE%201%20ET%202%20ENTIER%20CGI%202025.pdf","https://www.finances.gouv.ne/index.php/lois-de-finances/file/1303-ordonnance-n-2025-44","https://esecef.impots.gouv.ne/","https://www.impots.gouv.ne/"],"toolId":"ne-vat"},{"formulaId":"route-ng-cgt","routes":["/fr/tools/ng-plus-value/","/ha/kayan-aiki/cgt-najeriya/","/sw/zana/kikokotoo-cgt-nigeria/","/tools/ng-cgt/"],"sourceUrls":["https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf","https://finance.gov.ng/federal-government-issues-transition-guidelines-for-tax-acts-2025/"],"toolId":"ng-cgt"},{"formulaId":"route-ng-cit","routes":["/fr/tools/ng-impot-societes/","/ha/kayan-aiki/cit-najeriya/","/sw/zana/kikokotoo-cit-nigeria/","/tools/ng-cit/","/yo/awon-ise/cit-naijiria/"],"sourceUrls":["https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf","https://finance.gov.ng/federal-government-issues-transition-guidelines-for-tax-acts-2025/","https://statehouse.gov.ng/new-tax-laws-will-commence-on-january-1-2026-as-planned/"],"toolId":"ng-cit"},{"formulaId":"route-ng-paye","routes":["/nigeria/ng-salary-tax"],"sourceUrls":["https://www.firs.gov.ng/","https://firs.gov.ng","https://taxes.firs.gov.ng","https://nass.gov.ng/documents/download/11249","https://www.nrs.gov.ng/uploads/NIGERIA_TAX_ADMINISTRATION_ACT_2025_8c945071a7.pdf"],"toolId":"ng-paye"},{"formulaId":"route-ng-paye-fr","routes":["/fr/nigeria/ng-salary-tax"],"sourceUrls":["https://www.firs.gov.ng/","https://firs.gov.ng","https://taxes.firs.gov.ng","https://nass.gov.ng/documents/download/11249","https://www.nrs.gov.ng/uploads/NIGERIA_TAX_ADMINISTRATION_ACT_2025_8c945071a7.pdf"],"toolId":"ng-paye-fr"},{"formulaId":"route-ng-vat","routes":["/fr/nigeria/ng-vat","/nigeria/ng-vat","/sw/nigeria/kikokotoo-vat/"],"sourceUrls":["https://nass.gov.ng/documents/download/11249","https://www.nrs.gov.ng/uploads/NIGERIA_TAX_ADMINISTRATION_ACT_2025_8c945071a7.pdf","https://www.nrs.gov.ng/tax-information/value-added-tax","https://finance.gov.ng/federal-government-issues-transition-guidelines-for-tax-acts-2025/"],"toolId":"ng-vat"},{"formulaId":"route-ng-wht","routes":["/fr/tools/ng-wht/","/ha/kayan-aiki/wht-najeriya/","/sw/zana/kikokotoo-wht-nigeria/","/tools/ng-wht/","/yo/awon-ise/wht-naijiria/"],"sourceUrls":["https://fiscalreforms.ng/wp-content/uploads/2024/10/Deduction-of-Tax-at-Source-Withholding-Regulations-2024_Gazetted.pdf","https://www.nrs.gov.ng/uploads/NIGERIA_TAX_ACT_2025_ef6bb812a5.pdf","https://www.jrb.gov.ng/assets/2026-pit-guidelines-TJG3n9-T.pdf","https://finance.gov.ng/federal-government-issues-transition-guidelines-for-tax-acts-2025/"],"toolId":"ng-wht"},{"formulaId":"route-pension-proj","routes":["/tools/pension-proj/"],"sourceUrls":["https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator","https://www.oecd.org/content/dam/iops/en/iops-principles-and-guidelines/IOPS-Good-practices-for-designing-presenting-and-supervising-pension-projections-2022.pdf"],"toolId":"pension-proj"},{"formulaId":"route-retrenchment-calculator","routes":["/tools/retrenchment-calculator/"],"sourceUrls":["https://normlex.ilo.org/dyn/nrmlx_en/f?p=NORMLEXPUB:12100:0::NO::P12100_ILO_CODE:C158"],"toolId":"retrenchment-calculator"},{"formulaId":"route-rw-paye","routes":["/rwanda/rw-paye"],"sourceUrls":["https://rra.gov.rw","https://rssb.gov.rw"],"toolId":"rw-paye"},{"formulaId":"route-rw-paye-fr","routes":["/fr/rwanda/rw-paye"],"sourceUrls":["https://rra.gov.rw","https://rssb.gov.rw"],"toolId":"rw-paye-fr"},{"formulaId":"route-rw-vat","routes":["/fr/rwanda/rw-vat","/rwanda/rw-vat","/sw/rwanda/kikokotoo-vat/","/widgets/iframe/financial-rwanda-vat.html"],"sourceUrls":["https://www.rra.gov.rw/en/domestic-tax-services/value-added-tax/penalties-and-interest","https://www.rra.gov.rw/en/domestic-tax-services/value-added-tax/default-title-1","https://www.rlrc.gov.rw/fileadmin/user_upload/RLRC/Laws_of_Rwanda_v2/Domestic_laws/Laws_in_force/8._Taxation/8.2._Value_Added_Taxes/8.2.1._Value_Added_Tax__Law_n___49_of_2023.pdf","https://www.rra.gov.rw/fileadmin/user_upload/Law_amending_the_2023_VAT_law___May_2025.pdf","https://www.rra.gov.rw/fileadmin/user_upload/Law_n___020_2023_of_31.03.2023_on_tax_procedures.pdf","https://www.rra.gov.rw/en/laws-policies-and-rulings"],"toolId":"rw-vat"},{"formulaId":"route-sars-efiling","routes":["/fr/tools/guide-de-sars-efiling/","/tools/sars-efiling/"],"sourceUrls":["https://secure.sarsefiling.co.za/","https://www.sars.gov.za/individuals/how-do-i-register-for-tax/register-for-efiling/","https://www.sars.gov.za/types-of-tax/personal-income-tax/filing-season/","https://www.sars.gov.za/types-of-tax/personal-income-tax/filing-season/how-does-auto-assessment-work/","https://www.sars.gov.za/individuals/"],"toolId":"sars-efiling"},{"formulaId":"route-sc-paye","routes":["/fr/seychelles/sc-paye","/seychelles/sc-paye"],"sourceUrls":["https://src.gov.sc","https://src.gov.sc/legislation/","https://src.gov.sc/wp-content/uploads/2025/10/Act-16-2024-Value-Added-Tax-Amendment-Act-2024.pdf"],"toolId":"sc-paye"},{"formulaId":"route-sc-vat","routes":["/fr/seychelles/sc-vat","/seychelles/sc-vat","/sw/seychelles/kikokotoo-vat/"],"sourceUrls":["https://src.gov.sc/legislation/","https://src.gov.sc/wp-content/uploads/2025/10/Act-16-2024-Value-Added-Tax-Amendment-Act-2024.pdf","https://src.gov.sc/wp-content/uploads/2024/12/SI-97-2024-Value-Added-Tax-Amendment-of-Fourth-Schedule-Regulations-2024.pdf","https://www.src.gov.sc/wp-content/uploads/2022/12/VAT-Guideline.pdf","https://src.gov.sc"],"toolId":"sc-vat"},{"formulaId":"route-sd-paye","routes":["/fr/sudan/sd-paye","/sudan/sd-paye"],"sourceUrls":["https://financialministry.gov.sd","https://tax.gov.sd/en/newsen/","https://tax.gov.sd/en/value-added-tax-vat/","https://tax.gov.sd/en/tax-laws/"],"toolId":"sd-paye"},{"formulaId":"route-sd-vat","routes":["/fr/sudan/sd-vat","/sudan/sd-vat","/sw/sudan/kikokotoo-vat/"],"sourceUrls":["https://tax.gov.sd/en/newsen/","https://tax.gov.sd/en/value-added-tax-vat/","https://tax.gov.sd/en/tax-laws/"],"toolId":"sd-vat"},{"formulaId":"route-sl-paye","routes":["/sierra-leone/sl-paye"],"sourceUrls":["https://nra.gov.sl","https://nra.gov.sl/dtd/1"],"toolId":"sl-paye"},{"formulaId":"route-sl-paye-fr","routes":["/fr/sierra-leone/sl-paye"],"sourceUrls":["https://nra.gov.sl","https://nra.gov.sl/dtd/1"],"toolId":"sl-paye-fr"},{"formulaId":"route-sl-vat","routes":["/fr/sierra-leone/sl-vat","/sierra-leone/sl-vat","/sw/sierra-leone/kikokotoo-vat/"],"sourceUrls":["https://nra.gov.sl/dtd/1","https://nra.gov.sl/tax-laws","https://webtestcms.nra.gov.sl/uploads/The_Finance_Act_2024_0d6d83e684.pdf","https://webtestcms.nra.gov.sl/uploads/The_Finance_Act_2026_121df05d9b.pdf","https://nra.gov.sl"],"toolId":"sl-vat"},{"formulaId":"route-sn-paye","routes":["/fr/senegal/calculateur-salaire-net","/senegal/sn-paye"],"sourceUrls":["https://www.vie-publique.sn/docs/3bba2f1b-0ee5-41e5-92be-19f4ba06353f/rapport-trimestriel-dexecution-budgetaire-quatrieme-trimestre-2025.pdf","https://dgtss.gouv.sn/wp-content/uploads/simple-file-list/Publications/Rapports-statistiques/Rapport-annuel-des-statistiques-du-travail-2024.pdf","https://www.dgid.sn/loi-et-reglement/"],"toolId":"sn-paye"},{"formulaId":"route-sn-paye-fr","routes":["/fr/senegal/calculateur-salaire-net","/fr/senegal/sn-paye"],"sourceUrls":["https://www.vie-publique.sn/docs/3bba2f1b-0ee5-41e5-92be-19f4ba06353f/rapport-trimestriel-dexecution-budgetaire-quatrieme-trimestre-2025.pdf","https://dgtss.gouv.sn/wp-content/uploads/simple-file-list/Publications/Rapports-statistiques/Rapport-annuel-des-statistiques-du-travail-2024.pdf","https://www.dgid.sn/loi-et-reglement/"],"toolId":"sn-paye-fr"},{"formulaId":"route-sn-vat","routes":["/fr/senegal/calculateur-tva","/fr/senegal/sn-vat","/senegal/sn-vat","/sw/senegal/kikokotoo-vat/"],"sourceUrls":["https://www.dgid.sn/loi-et-reglement/","https://apimfb.finances.gouv.sn/files/minfin/4-0-2026/wwwbudgetgouvsnprojetdeloidefinancespourlannee20262026-01-0418-00_czcx7oiuuofbvuhtklo6n.pdf","https://impotsetdomaines.gouv.sn"],"toolId":"sn-vat"},{"formulaId":"route-so-paye","routes":["/fr/somalia/so-paye","/somalia/so-paye","/sw/somalia/kikokotoo-kodi-mshahara/"],"sourceUrls":["https://www.mof.gov.so/sites/default/files/Publications/Sh.Lr_.37%20-SHARCIGA%20CASHUURTA%20DAKHLIGA%20.pdf","https://mof.gov.so/sites/default/files/Publications/Income%20Tax%20Regulation_%200141%2C%202025.pdf","https://mof.gov.so/sites/default/files/Publications/Somalia%20Income%20Tax%20Manual_English%20Version.pdf","https://mof.gov.so/publications/fiscal-year-2026-budget-policy-framework-paper","https://mof.gov.so/publications/xeer-nidaamiyaha-canshuurta-gedis-layda-turnover-tax"],"toolId":"so-paye"},{"formulaId":"route-so-vat","routes":["/fr/somalia/so-vat","/somalia/so-vat","/sw/somalia/kikokotoo-vat/"],"sourceUrls":["https://mof.gov.so/publications/fiscal-year-2026-budget-policy-framework-paper","https://mof.gov.so/publications/xeer-nidaamiyaha-canshuurta-gedis-layda-turnover-tax","https://mof.gov.so/publications/inland-revenue"],"toolId":"so-vat"},{"formulaId":"route-ss-paye","routes":["/fr/south-sudan/ss-paye","/south-sudan/ss-paye","/sw/south-sudan/kikokotoo-kodi-mshahara/","/widgets/iframe/financial-south-sudan-paye.html"],"sourceUrls":["https://cms.nra.gov.ss/uploads/South_Sudan_Taxation_Act_2009_fc9418fd5d.pdf","https://cms.nra.gov.ss/uploads/FINANCIAL_Act_FY_2023_2024_MAIL_97b32cab38.pdf","https://docs.southsudanngoforum.org/sites/default/files/2016-06/01.A.1.3.%20Taxation%20Amendment%20Act%202012%20-%20South%20Sudan.pdf","https://dr.211check.org/wp-content/uploads/2024/02/NATIONAL-SOCIAL-INSURANCE-FUND-ACT-2023.pdf","https://docs.southsudanngoforum.org/sites/default/files/2024-09/CIRCULAR%20ON%20THE%20ADMINISTRATION%20OF%20PIT%20%281%29.pdf"],"toolId":"ss-paye"},{"formulaId":"route-ss-vat","routes":["/fr/south-sudan/ss-vat","/south-sudan/ss-vat"],"sourceUrls":["https://nra.gov.ss","https://financialministry.gov.sd","https://cms.nra.gov.ss/uploads/FINANCIAL_Act_FY_2023_2024_MAIL_97b32cab38.pdf","https://docs.southsudanngoforum.org/regulation/legislation","https://cms.nra.gov.ss/uploads/South_Sudan_Taxation_Act_2009_fc9418fd5d.pdf"],"toolId":"ss-vat"},{"formulaId":"route-st-paye","routes":["/fr/sao-tome/st-paye","/sao-tome/st-paye","/sw/sao-tome/kikokotoo-kodi-mshahara/","/widgets/iframe/financial-sao-tome-paye.html"],"sourceUrls":["https://inss.gov.st/assets/Leis/Lei_n_19_2022.pdf","https://inss.gov.st/trabalhador-outrem.html","https://impostos.financas.gov.st/index.php/legislacao/leg-tributaria/category/26-irs","https://cipstp.st/wp-content/uploads/2026/05/Lei-OGE-2026_23-marco-2026.pdf","https://www2.camara.leg.br/saotomeeprincipe/diarios-da-an/xii-legislatura-8-11-22-a-8-11-26/i-serie/2.a-sessao/DAN04-IS.pdf/at_download/file"],"toolId":"st-paye"},{"formulaId":"route-st-vat","routes":["/fr/sao-tome/st-vat","/sao-tome/st-vat","/sw/sao-tome/kikokotoo-vat/"],"sourceUrls":["https://www2.camara.leg.br/saotomeeprincipe/diarios-da-an/xii-legislatura-8-11-22-a-8-11-26/i-serie/2.a-sessao/DAN04-IS.pdf/at_download/file","https://www2.camara.leg.br/saotomeeprincipe/diarios-da-an/xii-legislatura-8-11-22-a-8-11-26/ii-serie/5.a-sessao-legislativa/DAN15-IIS.pdf/at_download/file","https://inss.gov.st/assets/Leis/Lei_n_19_2022.pdf","https://inss.gov.st/trabalhador-outrem.html","https://impostos.financas.gov.st/index.php/legislacao/leg-tributaria/category/26-irs"],"toolId":"st-vat"},{"formulaId":"route-staff-cost","routes":["/tools/staff-cost/"],"sourceUrls":["https://www.ifrs.org/issued-standards/list-of-standards/ias-19-employee-benefits/","https://www.ilo.org/resource/other/r198-raccomandazione-sul-rapporto-di-lavoro-2006"],"toolId":"staff-cost"},{"formulaId":"route-sz-paye","routes":["/eswatini/sz-paye","/fr/eswatini/sz-paye"],"sourceUrls":["https://ers.org.sz/IncomeTax/RatesandThres","https://ers.org.sz/IncomeForms","https://enpf.co.sz/"],"toolId":"sz-paye"},{"formulaId":"route-sz-vat","routes":["/eswatini/sz-vat","/fr/eswatini/sz-vat","/sw/eswatini/kikokotoo-vat/"],"sourceUrls":["https://www.ers.org.sz/VAT/Eswatini","https://www.ers.org.sz/LegalandPolicy/TaxLegislation","https://www.ers.org.sz","https://ers.org.sz"],"toolId":"sz-vat"},{"formulaId":"route-td-paye","routes":["/chad/td-paye","/fr/chad/td-paye"],"sourceUrls":["https://www.dgi.td/docs/","https://www.finances.gouv.td/index.php/le-ministere/le-ministre/item/download/404_2503d5c174528169afd3a9cd827c3cb0","https://www.finances.gouv.td/index.php/le-ministere/le-ministre/item/download/438_afa372566d4acca63cb857e846d67eef"],"toolId":"td-paye"},{"formulaId":"route-td-vat","routes":["/chad/td-vat","/fr/chad/td-vat","/fr/tchad/calculateur-tva","/sw/chad/kikokotoo-vat/"],"sourceUrls":["https://www.finances.gouv.td/index.php/le-ministere/le-ministre/item/download/404_2503d5c174528169afd3a9cd827c3cb0","https://www.finances.gouv.td/index.php/le-ministere/le-ministre/item/download/403_f415c0610b4b26d6bae5aeec20c82e81","https://www.finances.gouv.td/index.php/le-ministere/le-ministre/item/download/438_afa372566d4acca63cb857e846d67eef","https://www.finances.gouv.td/index.php/le-ministere/le-ministre/item/download/454_94f28246efd69cb6a80af5e0e49b36e9","https://www.dgi.td/docs/"],"toolId":"td-vat"},{"formulaId":"route-tg-paye","routes":["/fr/togo/calculateur-salaire-net","/fr/togo/tg-paye","/sw/togo/kikokotoo-kodi-mshahara/","/togo/tg-paye","/widgets/iframe/financial-togo-paye.html"],"sourceUrls":["https://www.otr.tg/index.php/fr/documentation/sur-les-impots/code-general-des-impots/600-code-general-des-impots-livre-des-procedures-fiscales-mis-a-jour-2025/file.html","https://cnss.tg/terme/taux-de-cotisations/","https://cnss.tg/prestations/recouvrement/","https://finances.gouv.tg/loi-n2025-002-portant-loi-de-finances-exercice-2026/","https://www.otr.tg/index.php/fr/documentation/sur-les-impots/code-general-des-impots/628-cahier-fiscal-2026/file.html"],"toolId":"tg-paye"},{"formulaId":"route-tg-vat","routes":["/fr/togo/tg-vat","/togo/tg-vat"],"sourceUrls":["https://www.otr.tg/","https://www.otr.tg/index.php/fr/documentation/sur-les-impots/code-general-des-impots/600-code-general-des-impots-livre-des-procedures-fiscales-mis-a-jour-2025/file.html","https://cnss.tg/terme/taux-de-cotisations/","https://cnss.tg/prestations/recouvrement/","https://finances.gouv.tg/loi-n2025-002-portant-loi-de-finances-exercice-2026/"],"toolId":"tg-vat"},{"formulaId":"route-tn-paye","routes":["/fr/tunisia/tn-paye","/tunisia/tn-paye"],"sourceUrls":["https://www.finances.gov.tn","https://finances.gov.tn"],"toolId":"tn-paye"},{"formulaId":"route-tn-paye-fr","routes":["/fr/tunisia/tn-paye"],"sourceUrls":["https://www.finances.gov.tn","https://finances.gov.tn"],"toolId":"tn-paye-fr"},{"formulaId":"route-tn-vat","routes":["/fr/tunisia/tn-vat","/tunisia/tn-vat"],"sourceUrls":["https://www.finances.gov.tn","https://finances.gov.tn","https://www.finances.gov.tn/ar/lmht-amwt","https://www.finances.gov.tn/fr/document/loi-des-finances-pour-lannee-2026-ar","https://www.finances.gov.tn/sites/default/files/CODE%20TVA%202017%20FR.pdf"],"toolId":"tn-vat"},{"formulaId":"route-transfer-pricing","routes":["/fr/tools/prix-transfert/","/tools/transfer-pricing/"],"sourceUrls":["https://www.oecd.org/en/publications/2022/01/oecd-transfer-pricing-guidelines-for-multinational-enterprises-and-tax-administrations-2022_57104b3a.html","https://www.oecd.org/en/topics/transfer-pricing.html","https://www.oecd.org/en/publications/consolidated-report-on-amount-b_182b47ad-en.html","https://ataftax.org/international-tax/","https://ataftax.org/fr/library/ataf-suggested-approach-to-drafting-transfer-pricing-legislation/"],"toolId":"transfer-pricing"},{"formulaId":"route-tz-paye","routes":["/fr/tanzania/tz-paye","/tanzania/tz-paye"],"sourceUrls":["https://paymentregistration.tra.go.tz/payecalculator/paye.htm","https://taxpayersportal.tra.go.tz/ept/main","https://tra.go.tz","https://repository.mof.go.tz/items/47310f34-17e4-4aeb-b25a-5484c2d5fb3a","https://repository.mof.go.tz/items/70e59251-afff-49ee-9b52-d5c85bfd03e8"],"toolId":"tz-paye"},{"formulaId":"route-tz-vat","routes":["/fr/tanzania/tz-vat","/sw/tanzania/kikokotoo-vat/","/tanzania/tz-vat","/widgets/iframe/financial-tanzania-vat.html"],"sourceUrls":["https://www.mof.go.tz/uploads/documents/en-1676548670-THE%20VALUE%20ADDED%20TAX%20ACT%2C%20CAP%20148%20R.E.%202019.pdf","https://www.mof.go.tz/uploads/text-editor/files/FINANCE%20ACT%202025_1750842655.pdf","https://www.mof.go.tz/uploads/documents/en-1779189357-MEDIUM%20TERM%20REVENUE%20STRATEGY%20202526%20-%20202728%20%281%29.pdf","https://www.tra.go.tz/","https://repository.mof.go.tz/items/47310f34-17e4-4aeb-b25a-5484c2d5fb3a"],"toolId":"tz-vat"},{"formulaId":"route-ug-paye","routes":["/uganda/ug-paye"],"sourceUrls":["https://ura.go.ug/en/changes-to-paye-return-form-following-the-income-tax-amendment-act-2026/","https://ura.go.ug/en/domestic-taxes/paye-rates/","https://kcca.go.ug/uDocs/Local_Service_Tax_FAQs.pdf","https://www.nssfug.org/about-us/membership/","https://ura.go.ug"],"toolId":"ug-paye"},{"formulaId":"route-ug-paye-fr","routes":["/fr/uganda/ug-paye"],"sourceUrls":["https://ura.go.ug/en/changes-to-paye-return-form-following-the-income-tax-amendment-act-2026/","https://ura.go.ug/en/domestic-taxes/paye-rates/","https://kcca.go.ug/uDocs/Local_Service_Tax_FAQs.pdf","https://www.nssfug.org/about-us/membership/","https://ura.go.ug"],"toolId":"ug-paye-fr"},{"formulaId":"route-ug-vat","routes":["/fr/uganda/ug-vat","/sw/uganda/kikokotoo-vat/","/uganda/ug-vat","/widgets/iframe/financial-uganda-vat"],"sourceUrls":["https://ura.go.ug/en/value-added-tax-vat/","https://ura.go.ug/en/dt-faqs/","https://ura.go.ug/en/efris/","https://ura.go.ug/wp-content/uploads/2024/09/GUIDE-TO-TAXATION-OF-GOVERNMENT-AGENCIES-2023-24.pdf","https://ura.go.ug/wp-content/uploads/2025/02/VAT_TN_v1_beta.pdf"],"toolId":"ug-vat"},{"formulaId":"route-za-cgt","routes":["/sw/zana/kikokotoo-cgt-afrika-kusini/","/tools/za-cgt/"],"sourceUrls":["https://www.sars.gov.za/tax-rates/income-tax/capital-gains-tax-cgt/","https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/","https://www.sars.gov.za/lapd-cgt-g01-comprehensive-guide-to-capital-gains-tax/"],"toolId":"za-cgt"},{"formulaId":"route-za-dividend-tax","routes":["/fr/tools/za-impot-dividendes/","/sw/zana/kikokotoo-kodi-gawio-afrika-kusini/","/tools/za-dividend-tax/"],"sourceUrls":["https://www.sars.gov.za/types-of-tax/dividends-tax/","https://www.sars.gov.za/tax-rates/income-tax/interest-and-dividends/","https://www.sars.gov.za/wp-content/uploads/Ops/Guides/LAPD-IT-G19-Comprehensive-Guide-to-Dividends-Tax.pdf","https://www.sars.gov.za/legal-counsel/international-treaties-agreements/double-taxation-agreements-protocols/"],"toolId":"za-dividend-tax"},{"formulaId":"route-za-gepf","routes":["/fr/tools/za-gepf/","/sw/zana/kikokotoo-gepf-afrika-kusini/","/tools/za-gepf/"],"sourceUrls":["https://www.gepf.co.za/wp-content/uploads/2025/03/51202-10-9-NationalTreasury.pdf","https://www.gepf.co.za/retirement-benefits/","https://www.gepf.co.za/employer-contributions/","https://www.gepf.co.za/clarification-on-the-implementation-of-revised-actuarialinterest-factors-as-at-1-october-2025/"],"toolId":"za-gepf"},{"formulaId":"route-za-paye","routes":["/fr/south-africa/za-paye","/south-africa/za-paye"],"sourceUrls":["https://www.sars.gov.za/","https://sars.gov.za","https://www.sars.gov.za/types-of-tax/value-added-tax/","https://www.sars.gov.za/tax-rates/other-taxes/","https://www.sars.gov.za/legal-counsel/legal-counsel-publications/find-a-guide/value-added-tax-vat/"],"toolId":"za-paye"},{"formulaId":"route-za-transfer-duty","routes":["/fr/tools/za-droits-mutation/","/sw/zana/kikokotoo-ushuru-uhamisho-afrika-kusini/","/tools/za-transfer-duty/"],"sourceUrls":["https://www.sars.gov.za/tax-rates/transfer-duty/","https://www.sars.gov.za/td-ae-02-g02-guide-for-transfer-duty-via-efiling-external-guide/","https://www.sars.gov.za/wp-content/uploads/Docs/Budget/Budget2026/Budget-tax-guide-2026-online-version-for-printing.pdf","https://www.sars.gov.za/wp-content/uploads/Legal/Acts/2026/Rates-and-Monetary-Amounts-and-Amendment-of-Revenue-Laws-Act-3-of-2026-Government-Gazette-55258.pdf"],"toolId":"za-transfer-duty"},{"formulaId":"route-za-uif","routes":["/fr/tools/za-uif/","/sw/zana/kikokotoo-uif-afrika-kusini/","/tools/za-uif/"],"sourceUrls":["https://www.labour.gov.za/DocumentCenter/Publications/Unemployment%20Insurance%20Fund/Fact%20Sheet%20on%20the%20Calculation%20of%20normal%20UIF%20benefit.pdf","https://www.labour.gov.za/DocumentCenter/Publications/Unemployment%20Insurance%20Fund/KNOW%20YOUR%20UIF%20RIGHTS%202022.pdf","https://www.sars.gov.za/types-of-tax/unemployment-insurance-fund/","https://www.labour.gov.za/DocumentCenter/Acts/UIF/Unemployment%20Insurance%20Amendment%20Act%202016.pdf","https://uif.labour.gov.za/UIF_BENEFITS/Pages/Maternity-Benefits.aspx"],"toolId":"za-uif"},{"formulaId":"route-za-vat","routes":["/fr/south-africa/za-vat","/south-africa/za-vat","/sw/south-africa/kikokotoo-vat/"],"sourceUrls":["https://www.sars.gov.za/tax-rates/other-taxes/","https://www.sars.gov.za/about/sars-tax-and-customs-system/budget/budget-2026-frequently-asked-questions/","https://www.sars.gov.za/legal-counsel/legal-counsel-publications/find-a-guide/value-added-tax-vat/","https://www.gov.za/documents/value-added-tax-act-12-may-2015-0846","https://www.sars.gov.za/types-of-tax/value-added-tax/"],"toolId":"za-vat"},{"formulaId":"route-zm-paye","routes":["/fr/zambia/zm-paye","/zambia/zm-paye"],"sourceUrls":["https://www.zra.org.zm/tax-information/","https://www.linkedin.com/posts/national-pension-scheme-authority_public-notice-revision-in-contribution-ceiling-activity-7417941633180090368-y4Dr","https://media.zambialii.org/media/legislation/41897/source_file/e1932f4e1b7838ef/zm-act-si-2019-63-publication-document.pdf"],"toolId":"zm-paye"},{"formulaId":"route-zm-vat","routes":["/fr/zambia/zm-vat","/zambia/zm-vat"],"sourceUrls":["https://www.zra.org.zm","https://zra.org.zm","https://www.zra.org.zm/tax-information/","https://www.zra.org.zm/wp-content/uploads/2024/08/VSDC-API-Specification-Document-v1.0.7-1.pdf","https://www.parliament.gov.zm/node/12767"],"toolId":"zm-vat"},{"formulaId":"route-zw-paye","routes":["/fr/zimbabwe/zw-paye","/zimbabwe/zw-paye"],"sourceUrls":["https://www.zimra.co.zw","https://zimra.co.zw","https://www.zimra.co.zw/public-notices?download=4441%3Apublic-notice-07-of-2026-change-of-vat-rate-on-submission-of-return-category-a","https://zimra.co.zw/domestic-taxes/vat/mechanics-of-vat","https://zimlii.org/akn/zw/act/2025/7/eng%402025-12-29"],"toolId":"zw-paye"},{"formulaId":"route-zw-vat","routes":["/fr/zimbabwe/zw-vat","/zimbabwe/zw-vat"],"sourceUrls":["https://www.zimra.co.zw","https://zimra.co.zw","https://www.zimra.co.zw/public-notices?download=4441%3Apublic-notice-07-of-2026-change-of-vat-rate-on-submission-of-return-category-a","https://zimra.co.zw/domestic-taxes/vat/mechanics-of-vat","https://zimlii.org/akn/zw/act/2025/7/eng%402025-12-29"],"toolId":"zw-vat"}],"schemaVersion":1};}},cache={};
function resolve(from,request){
 if(request.charAt(0)!=='.')throw Error('Unsupported browser engine import');
 var pieces=from.split('/');pieces.pop();
 request.split('/').forEach(function(piece){if(piece==='..')pieces.pop();else if(piece!=='.'&&piece)pieces.push(piece);});
 var id=pieces.join('/');if(!/\.(js|json)$/.test(id))id+='.js';return id;
}
function load(id){if(cache[id])return cache[id].exports;if(!definitions[id])throw Error('Missing browser engine '+id);var module={exports:{}};cache[id]=module;definitions[id](module,module.exports,function(request){return load(resolve(id,request));});return module.exports;}
var payeEngines=load('netlify/functions/_engines/index.js');
var BotEngine=root.AfroTools&&root.AfroTools.engines&&root.AfroTools.engines.whatsappBot;
if(!BotEngine)throw Error('WhatsApp command engine must load before payroll preview');
var SITE_URL='https://afrotools.com';
function countryName(code) {
  var names = {
    NG:'Nigeria', KE:'Kenya', ZA:'South Africa', GH:'Ghana', TZ:'Tanzania',
    UG:'Uganda', ET:'Ethiopia', EG:'Egypt', MA:'Morocco', SN:'Senegal',
    CI:'Ivory Coast', CM:'Cameroon', AO:'Angola', MZ:'Mozambique', ZM:'Zambia',
    ZW:'Zimbabwe', RW:'Rwanda', BW:'Botswana', NA:'Namibia', ML:'Mali',
    BF:'Burkina Faso', NE:'Niger', TD:'Chad', SD:'Sudan', SS:'South Sudan',
    SO:'Somalia', ER:'Eritrea', DJ:'Djibouti', MG:'Madagascar', MW:'Malawi',
    MU:'Mauritius', MR:'Mauritania', GN:'Guinea', GW:'Guinea-Bissau',
    GQ:'Equatorial Guinea', GA:'Gabon', CG:'Congo (Republic)', CD:'DR Congo',
    CF:'Central African Republic', BJ:'Benin', TG:'Togo', SL:'Sierra Leone',
    LR:'Liberia', GM:'Gambia', CV:'Cabo Verde', ST:'São Tomé & Príncipe',
    KM:'Comoros', SC:'Seychelles', LS:'Lesotho', SZ:'Eswatini',
    TN:'Tunisia', DZ:'Algeria', LY:'Libya', BI:'Burundi'
  };
  return names[code] || code;
}
function handlePaye(intent) {
  var cc = String(intent.country || '').toUpperCase();
  var gross = Number(intent.salary);
  if (!cc) return 'Which country? Include the country name. Example: PAYE Nigeria 450000';
  if (!Number.isFinite(gross) || gross <= 0 || !Number.isFinite(gross * 12)) {
    return 'Enter a finite, positive gross monthly salary. Example: PAYE ' + countryName(cc) + ' 300000';
  }
  var engine = payeEngines.get(cc);
  if (!engine) return 'No payroll model is available for this country. Browse ' + SITE_URL + '/salary-tax/';
  try {
    var calculation = engine.calculate({ grossAnnual: gross * 12 });
    var result = calculation && calculation.result;
    var tax = calculation && calculation.tax;
    var net = result && result.netMonthly;
    var annualTax = tax && tax.netTax;
    if (!result || !tax || !Number.isFinite(net) || !Number.isFinite(annualTax)) {
      throw new Error('Payroll model returned an incomplete result');
    }
    var sym = (BotEngine.CURRENCIES[cc] || {}).symbol || engine.currency + ' ';
    var metadata = calculation.meta || {};
    var effectiveOn = new Date().toISOString().slice(0, 10);
    var coverage = payeEngines.resolve(cc, effectiveOn);
    var lines = [
      BotEngine.getFlag(cc) + ' *' + countryName(cc) + ' payroll estimate*',
      'Monthly gross: ' + sym + BotEngine.fmtNum(gross),
      'Annual income tax: ' + sym + BotEngine.fmtNum(annualTax),
      'Total employee deductions per month: ' + sym + BotEngine.fmtNum(gross - net),
      '*Estimated net pay: ' + sym + BotEngine.fmtNum(net) + '*',
      'Effective income-tax rate: ' + (annualTax / (gross * 12) * 100).toFixed(2) + '%',
      '',
      'Uses the country model default settings; personal reliefs and optional deductions may change your result.',
      'Monthly net uses the default pay-month; seasonal deductions can differ from an annual average.',
      'Model: ' + (metadata.regime || 'default settings'),
      'Model updated: ' + (metadata.lastUpdated || engine.lastUpdated || 'not recorded')
    ];
    if (!coverage.ok) {
      lines.push('Current-date coverage is not verified. Check the applicable tax year and official rules before using this estimate for payroll.');
    } else {
      lines.push('Model period: ' + (coverage.formula.effectiveFrom || 'not date-specific') + ' to ' + (coverage.formula.effectiveTo || 'no end date recorded') + '. Verify applicable rules and inputs before filing.');
    }
    lines.push('Adjust assumptions and review sources: ' + SITE_URL + '/salary-tax/');
    lines.push('_Type HELP for more commands_');
    return lines.join('\n');
  } catch (_) {
    return 'Could not produce a valid payroll estimate. Review the country calculator at ' + SITE_URL + '/salary-tax/';
  }
}
root.AfroTools.whatsappPayrollPreview=handlePaye;
})(window);
