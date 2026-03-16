// Kenya PAYE Engine — extracted from AfroTools payslip generator
// Source: Kenya Revenue Authority (KRA)

const MONTHLY_BANDS = [[24000,0.10],[8333,0.25],[467778,0.30],[300000,0.325],[Infinity,0.35]];
const PERSONAL_RELIEF = 2400;

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
    const { grossAnnual, nssf: inclNssf = true, shif: inclShif = true, ahl: inclAhl = true } = params;
    const monthly = grossAnnual / 12;

    const nssfAmt = inclNssf ? Math.min(monthly * 0.06, 2160) * 12 : 0;
    const shifAmt = inclShif ? monthly * 0.0275 * 12 : 0;
    const ahlAmt = inclAhl ? monthly * 0.015 * 12 : 0;

    const { tax: monthlyTax, bands: bandDetail } = calcBands(monthly, MONTHLY_BANDS);
    const paye = Math.max(0, monthlyTax - PERSONAL_RELIEF);
    const annualTax = Math.round(paye * 12);

    const totalDeductions = nssfAmt + shifAmt + ahlAmt + annualTax;
    const netAnnual = grossAnnual - totalDeductions;

    const empNssf = inclNssf ? Math.min(monthly * 0.06, 2160) * 12 : 0;

    return {
      input: { country: 'KE', grossAnnual, regime: 'STANDARD' },
      deductions: { nssf: Math.round(nssfAmt), shif: Math.round(shifAmt), ahl: Math.round(ahlAmt), totalDeductions: Math.round(totalDeductions) },
      tax: { taxableIncome: Math.round(grossAnnual), bands: bandDetail, grossTax: Math.round(monthlyTax * 12), reliefs: { personalRelief: PERSONAL_RELIEF * 12 }, netTax: annualTax },
      result: { netAnnual: Math.round(netAnnual), netMonthly: Math.round(netAnnual / 12), effectiveRate: (annualTax / grossAnnual * 100).toFixed(2) + '%', marginalRate: bandDetail.filter(b => b.taxInBand > 0).pop()?.rate * 100 + '%' || '0%' },
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
        { key: 'nssf', label: 'NSSF (6%, cap KES 2,160/mo)', default: true },
        { key: 'shif', label: 'SHIF (2.75%)', default: true },
        { key: 'ahl', label: 'AHL (1.5%)', default: true }
      ],
      regimes: [{ key: 'STANDARD', label: 'Standard PAYE', default: true }]
    };
  }
};
