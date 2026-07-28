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

// Bracket exclusion (tiering). Once net taxable income passes a threshold the
// lower brackets are withdrawn and the income they covered is taxed at the
// FIRST SURVIVING rate — it is a re-rating of income already counted, not an
// extra charge stacked on top of the standard band tax.
//
//   NATI >        withdrawn            re-rated income  at     extra
//   600,000       0%                   first 40,000     10%    +4,000
//   700,000       0%, 10%              first 55,000     15%    +6,750
//   800,000       0%, 10%, 15%         first 70,000     20%    +10,250
//   900,000       0%, 10%, 15%, 20%    first 200,000    22.5%  +15,250
//   1,200,000     …plus 22.5%          first 400,000    25%    +25,250
//
// Five tiers, not six: the step after 900,000 is 1,200,000 (there is no
// 1,000,000 tier) and the 25% bracket is never withdrawn. Extras are derived
// from ETA_BANDS so they cannot drift if a band width changes.
const EXCLUSION_THRESHOLDS = [600000, 700000, 800000, 900000, 1200000];

const EXCLUSION_RULES = EXCLUSION_THRESHOLDS.map((threshold, k) => {
  let coveredIncome = 0;
  let standardOnIt = 0;
  const excludedBands = [];
  for (let i = 0; i <= k; i++) {
    coveredIncome += ETA_BANDS[i][0];
    standardOnIt += ETA_BANDS[i][0] * ETA_BANDS[i][1];
    excludedBands.push(i);
  }
  return {
    threshold,
    excludedBands,
    extraTax: coveredIncome * ETA_BANDS[k + 1][1] - standardOnIt
  };
});

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
  let exclusionThreshold = null;

  // Only the highest tier reached applies — each one already subsumes the tiers
  // below it, so the band list is taken whole rather than accumulated.
  for (const rule of EXCLUSION_RULES) {
    if (nati > rule.threshold) {
      exclusionExtra = rule.extraTax;
      excludedBands = rule.excludedBands;
      exclusionThreshold = rule.threshold;
    }
  }

  return { exclusionExtra, excludedBands, exclusionThreshold };
}

function getMarginalRate(nati) {
  let remaining = Math.max(0, nati);

  for (const [width, rate] of ETA_BANDS) {
    const bandWidth = width === Infinity ? remaining : width;
    // Round: 0.275 * 100 is 27.500000000000004 in binary floating point, and
    // this value is rendered straight into the result string.
    if (remaining <= bandWidth) return Math.round(rate * 1000) / 10;
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
        excludedBands: exclusion.excludedBands,
        exclusionThreshold: exclusion.exclusionThreshold
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
