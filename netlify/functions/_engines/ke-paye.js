// Kenya PAYE Engine — extracted from AfroTools payslip generator
// Source: Kenya Revenue Authority (KRA)
// Updated: Feb 2025 NSSF rates, Oct 2024 SHIF replacement

// Monthly PAYE bands: 10% first 24K → 25% to 32,333 → 30% to 500K → 32.5% to 800K → 35% above
const MONTHLY_BANDS = [[24000,0.10],[8333,0.25],[467667,0.30],[300000,0.325],[Infinity,0.35]];
const PERSONAL_RELIEF = 2400; // KES/month

function calcBands(monthly, bands) {
  let tax = 0, rem = monthly, detail = [], cumFrom = 0;
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

module.exports = {
  country: 'KE',
  countryName: 'Kenya',
  currency: 'KES',
  regimes: ['STANDARD'],
  lastUpdated: '2026-03-01',
  source: 'Kenya Revenue Authority (KRA)',

  calculate(params) {
    const {
      grossAnnual,
      nssf: inclNssf = true,
      shif: inclShif = true,
      ahl: inclAhl = true,
      insurancePremium = 0,
      prmf = 0
    } = params;
    const monthly = grossAnnual / 12;

    // NSSF: Tier I = 6% of first KES 8,000; Tier II = 6% of KES 8,001–72,000
    const nssfTier1 = inclNssf ? Math.min(monthly, 8000) * 0.06 : 0;
    const nssfTier2 = inclNssf ? Math.max(0, Math.min(monthly, 72000) - 8000) * 0.06 : 0;
    const nssfMonthly = nssfTier1 + nssfTier2;
    const nssfAmt = nssfMonthly * 12;

    // SHIF: 2.75% of gross, min KES 300/month, no cap (replaced NHIF Oct 2024)
    const shifMonthly = inclShif ? Math.max(300, monthly * 0.0275) : 0;
    const shifAmt = shifMonthly * 12;

    // Affordable Housing Levy: 1.5% of gross
    const ahlAmt = inclAhl ? monthly * 0.015 * 12 : 0;

    // Taxable income = gross minus NSSF (SHIF and AHL are NOT pre-tax deductions for PAYE)
    const taxableMonthly = monthly - nssfMonthly;

    // Voluntary pension: max KES 30,000/month deductible
    const voluntaryPension = Math.min(prmf, 30000);
    const taxableAfterPension = Math.max(0, taxableMonthly - voluntaryPension);

    const { tax: monthlyTax, bands: bandDetail } = calcBands(taxableAfterPension, MONTHLY_BANDS);

    // Personal relief: KES 2,400/month
    let relief = PERSONAL_RELIEF;

    // Insurance relief: 15% of premium, max KES 5,000/month
    const insuranceRelief = Math.min(insurancePremium * 0.15, 5000);
    relief += insuranceRelief;

    const paye = Math.max(0, monthlyTax - relief);
    const annualTax = Math.round(paye * 12);

    const totalDeductions = nssfAmt + shifAmt + ahlAmt + annualTax;
    const netAnnual = grossAnnual - totalDeductions;

    const empNssf = nssfMonthly * 12; // Employer matches employee NSSF

    return {
      input: { country: 'KE', grossAnnual, regime: 'STANDARD' },
      deductions: {
        nssf: Math.round(nssfAmt),
        shif: Math.round(shifAmt),
        ahl: Math.round(ahlAmt),
        totalDeductions: Math.round(totalDeductions)
      },
      tax: {
        taxableIncome: Math.round(taxableAfterPension * 12),
        bands: bandDetail,
        grossTax: Math.round(monthlyTax * 12),
        reliefs: {
          personalRelief: PERSONAL_RELIEF * 12,
          ...(insuranceRelief > 0 ? { insuranceRelief: Math.round(insuranceRelief * 12) } : {})
        },
        netTax: annualTax
      },
      result: {
        netAnnual: Math.round(netAnnual),
        netMonthly: Math.round(netAnnual / 12),
        effectiveRate: (annualTax / grossAnnual * 100).toFixed(2) + '%',
        marginalRate: (bandDetail.filter(b => b.taxInBand > 0).pop()?.rate * 100 || 0) + '%'
      },
      employer: { nssf: Math.round(empNssf), totalCostAnnual: Math.round(grossAnnual + empNssf), totalCostMonthly: Math.round((grossAnnual + empNssf) / 12) },
      meta: { regime: 'STANDARD', currency: 'KES', lastUpdated: this.lastUpdated, source: this.source }
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
        { key: 'nssf', label: 'NSSF (6% Tier I + II)', default: true },
        { key: 'shif', label: 'SHIF (2.75%, min KES 300)', default: true },
        { key: 'ahl', label: 'Housing Levy (1.5%)', default: true }
      ],
      regimes: [{ key: 'STANDARD', label: 'Standard PAYE', default: true }]
    };
  }
};
