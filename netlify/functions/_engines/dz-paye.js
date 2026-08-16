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
