// South Africa PAYE Engine — extracted from AfroTools payslip generator
// Source: South African Revenue Service (SARS) 2026/2027

const ANNUAL_BRACKETS = [[245100,0.18],[383100,0.26],[530200,0.31],[695800,0.36],[887000,0.39],[1878600,0.41],[Infinity,0.45]];

const TAX_PERIOD = Object.freeze({ assessmentYear: 2027, label: '2026/27', effectiveFrom: '2026-03-01', effectiveTo: '2027-02-28', inputBasis: 'annual', currency: 'ZAR', method: 'annual-marginal-formula-estimate', monthlyBasis: 'annual-estimate-divided-by-12' });

// Rebates by age
const REBATES = { primary: 17820, secondary: 9765, tertiary: 3249 };
// Tax thresholds by age (income below threshold = no tax)
const THRESHOLDS = { under65: 99000, age65to74: 153250, age75plus: 171300 };

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
  sourceCheckedOn: '2026-10-16',
  nextReviewDate: '2027-01-14',
  /* source-confidence-stamp:end */

  source: 'South African Revenue Service (SARS)',

  calculate(params) {
    const { grossAnnual, uif: inclUif = true, age = 35, retirement = 0 } = params;
    if (!Number.isFinite(grossAnnual) || grossAnnual < 0) throw new RangeError('Annual salary must be a finite nonnegative amount.');
    if (!Number.isFinite(retirement) || retirement < 0) throw new RangeError('Retirement must be a finite nonnegative annual amount.');
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

    // Retirement fund deduction (limited to 27.5% of taxable income, capped at R430,000/yr)
    const retirementDeduction = Math.min(retirement, grossAnnual * 0.275, 430000);
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
        effectiveRate: (grossAnnual > 0 ? netTax / grossAnnual * 100 : 0).toFixed(2) + '%',
        marginalRate: (taxableIncome > 0 ? ANNUAL_BRACKETS.find(([ceiling]) => taxableIncome <= ceiling)[1] * 100 : 0) + '%'
      },
      employer: { uif: Math.round(empUif), sdl: Math.round(grossAnnual * 0.01), totalCostAnnual: Math.round(grossAnnual + empUif + grossAnnual * 0.01), totalCostMonthly: Math.round((grossAnnual + empUif + grossAnnual * 0.01) / 12) },
      meta: { taxPeriod: { ...TAX_PERIOD }, regime: 'STANDARD', currency: 'ZAR', lastUpdated: this.lastUpdated, source: this.source }
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
      regimes: [{ key: 'STANDARD', label: 'SARS 2026/27', default: true }]
    };
  }
};
