// Ghana PAYE Engine — extracted from AfroTools payslip generator
// Source: Ghana Revenue Authority (GRA)

// GRA monthly bands: 0% first 490 → 5% to 600 → 10% to 730 → 17.5% to 3,896.67 → 25% to 20K → 30% to 50K → 35% above
const MONTHLY_BANDS = [[490,0],[110,0.05],[130,0.10],[3166.67,0.175],[16000,0.25],[30520,0.30],[Infinity,0.35]];

function calcBands(monthly, bands) {
  let tax = 0, rem = monthly, detail = [], cumFrom = 0;
  for (const [width, rate] of bands) {
    const t = Math.min(rem, width);
    const inBand = t * rate;
    tax += inBand;
    detail.push({ from: cumFrom, to: cumFrom + (width === Infinity ? rem : width), rate, taxInBand: Math.round(inBand * 100) / 100 });
    cumFrom += width === Infinity ? rem : width;
    rem -= t;
    if (rem <= 0) break;
  }
  return { tax, bands: detail };
}

module.exports = {
  country: 'GH',
  countryName: 'Ghana',
  currency: 'GHS',
  regimes: ['STANDARD'],
  lastUpdated: '2026-03-01',
  source: 'Ghana Revenue Authority (GRA)',

  calculate(params) {
    const { grossAnnual, ssnit: inclSsnit = true, tier2: inclTier2 = true } = params;
    const monthly = grossAnnual / 12;

    // SSNIT Tier 1: 5.5% employee
    const ssnitAmt = inclSsnit ? monthly * 0.055 * 12 : 0;
    // Tier 2: 5% employee
    const tier2Amt = inclTier2 ? monthly * 0.05 * 12 : 0;

    const taxableMonthly = monthly - (inclSsnit ? monthly * 0.055 : 0) - (inclTier2 ? monthly * 0.05 : 0);
    const { tax: monthlyTax, bands: bandDetail } = calcBands(taxableMonthly, MONTHLY_BANDS);
    const annualTax = Math.round(monthlyTax * 12);

    const totalDeductions = ssnitAmt + tier2Amt + annualTax;
    const netAnnual = grossAnnual - totalDeductions;

    const empSsnit = inclSsnit ? monthly * 0.13 * 12 : 0; // employer 13%

    return {
      input: { country: 'GH', grossAnnual, regime: 'STANDARD' },
      deductions: { ssnit: Math.round(ssnitAmt), tier2: Math.round(tier2Amt), totalDeductions: Math.round(totalDeductions) },
      tax: { taxableIncome: Math.round(taxableMonthly * 12), bands: bandDetail, grossTax: annualTax, reliefs: {}, netTax: annualTax },
      result: {
        netAnnual: Math.round(netAnnual),
        netMonthly: Math.round(netAnnual / 12),
        effectiveRate: (annualTax / grossAnnual * 100).toFixed(2) + '%',
        marginalRate: (bandDetail.filter(b => b.taxInBand > 0).pop()?.rate * 100 || 0) + '%'
      },
      employer: { ssnit: Math.round(empSsnit), totalCostAnnual: Math.round(grossAnnual + empSsnit), totalCostMonthly: Math.round((grossAnnual + empSsnit) / 12) },
      meta: { regime: 'STANDARD', currency: 'GHS', lastUpdated: this.lastUpdated, source: this.source }
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
        { key: 'ssnit', label: 'SSNIT Tier 1 (5.5%)', default: true },
        { key: 'tier2', label: 'Tier 2 (5%)', default: true }
      ],
      regimes: [{ key: 'STANDARD', label: 'Standard PAYE', default: true }]
    };
  }
};
