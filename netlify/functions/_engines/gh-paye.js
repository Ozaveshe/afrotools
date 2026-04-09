// Ghana PAYE Engine
// Source: Ghana Revenue Authority (GRA)
// Updated: Apr 2026

const GH_BANDS = [
  [5880, 0.00],
  [1320, 0.05],
  [1560, 0.10],
  [38000, 0.175],
  [192000, 0.25],
  [366240, 0.30],
  [Infinity, 0.35]
];

const SSNIT_CAP = 61000;
const SSNIT_EMPLOYEE_RATE = 0.055;
const SSNIT_EMPLOYER_RATE = 0.13;
const TIER3_CAP_RATE = 0.165;
const MARRIAGE_RELIEF = 1200;
const CHILD_RELIEF = 1200;
const MAX_CHILDREN = 2;
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
  lastUpdated: '2026-04-06',
  source: 'Ghana Revenue Authority (GRA)',

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
