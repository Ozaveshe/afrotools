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
