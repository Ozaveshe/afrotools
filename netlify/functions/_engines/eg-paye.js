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
