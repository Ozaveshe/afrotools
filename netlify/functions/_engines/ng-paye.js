// Nigeria PAYE Engine — extracted from AfroTools payslip generator
// Source: Federal Inland Revenue Service (FIRS)
// Supports PITA 2025 (old law) and NTA 2026 (new law)

const BANDS_PITA = [[300000,0.07],[300000,0.11],[500000,0.15],[500000,0.19],[1600000,0.21],[Infinity,0.24]];
const BANDS_NTA  = [[800000,0],[3000000,0.15],[1200000,0.18],[1200000,0.21],[1600000,0.24],[Infinity,0.28]];

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

module.exports = {
  country: 'NG',
  countryName: 'Nigeria',
  currency: 'NGN',
  regimes: ['PITA_2025', 'NTA_2026'],
  lastUpdated: '2026-03-01',
  source: 'Federal Inland Revenue Service (FIRS)',

  calculate(params) {
    const { grossAnnual, regime = 'NTA_2026', pension: inclPension = true, nhf: inclNhf = true, nhis: inclNhis = false } = params;
    const pensionAmt = inclPension ? grossAnnual * 0.08 : 0;
    const nhfAmt = inclNhf ? grossAnnual * 0.025 : 0;
    const nhisAmt = inclNhis ? grossAnnual * 0.01 : 0;

    const bands = regime === 'NTA_2026' ? BANDS_NTA : BANDS_PITA;
    let taxableIncome, cra = 0;

    if (regime === 'NTA_2026') {
      taxableIncome = Math.max(0, grossAnnual - pensionAmt - nhfAmt - nhisAmt);
    } else {
      cra = 200000 + grossAnnual * 0.01;
      taxableIncome = Math.max(0, grossAnnual - cra - pensionAmt);
    }

    const { tax: grossTax, bands: bandDetail } = calcBands(taxableIncome, bands);
    const reliefs = regime === 'PITA_2025' ? { cra: Math.round(cra) } : {};
    const netTax = Math.round(grossTax);
    const totalDeductions = pensionAmt + nhfAmt + nhisAmt + netTax;
    const netAnnual = grossAnnual - totalDeductions;
    const empPension = grossAnnual * 0.10;
    const empNhf = grossAnnual * 0.025;

    return {
      input: { country: 'NG', grossAnnual, regime },
      deductions: { pension: Math.round(pensionAmt), nhf: Math.round(nhfAmt), nhis: Math.round(nhisAmt), totalDeductions: Math.round(totalDeductions) },
      tax: { taxableIncome: Math.round(taxableIncome), bands: bandDetail, grossTax: Math.round(grossTax), reliefs, netTax },
      result: { netAnnual: Math.round(netAnnual), netMonthly: Math.round(netAnnual / 12), effectiveRate: (netTax / grossAnnual * 100).toFixed(2) + '%', marginalRate: bandDetail.filter(b => b.taxInBand > 0).pop()?.rate * 100 + '%' || '0%' },
      employer: { pension: Math.round(empPension), nhf: Math.round(empNhf), totalCostAnnual: Math.round(grossAnnual + empPension + empNhf), totalCostMonthly: Math.round((grossAnnual + empPension + empNhf) / 12) },
      meta: { regime, currency: 'NGN', lastUpdated: this.lastUpdated, source: this.source }
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
        { key: 'pension', label: 'Pension (8%)', default: true },
        { key: 'nhf', label: 'NHF (2.5%)', default: true },
        { key: 'nhis', label: 'NHIS (1%)', default: false }
      ],
      regimes: [
        { key: 'PITA_2025', label: 'PITA 2025 (Old Law)' },
        { key: 'NTA_2026', label: 'NTA 2026 (New Law)', default: true }
      ]
    };
  }
};
