// Kenya PAYE Engine
// Source: Kenya Revenue Authority (KRA)
// Updated: Apr 2026

const kePayroll = require("../../../assets/js/lib/ke-payroll.js");

function buildBandRanges(monthlyTaxable) {
  let remaining = Math.max(0, monthlyTaxable);
  let ranges = [];
  let bandStart = 0;

  for (const band of kePayroll.MONTHLY_BANDS) {
    const width = band.width === Infinity ? remaining : band.width;
    const bandIncome = Math.min(remaining, width);
    const bandEnd = band.width === Infinity ? bandStart + bandIncome : bandStart + band.width;

    ranges.push({
      from: bandStart,
      to: bandEnd,
      rate: band.rate,
      taxInBand: Math.round(bandIncome * band.rate * 100) / 100
    });

    remaining -= bandIncome;
    bandStart = bandEnd;

    if (remaining <= 0) {
      break;
    }
  }

  return ranges;
}

module.exports = {
  country: 'KE',
  countryName: 'Kenya',
  currency: 'KES',
  regimes: ['STANDARD'],
  lastUpdated: '2026-04-06',
  /* source-confidence-stamp:start */
  sourceCheckedOn: '2026-07-01',
  nextReviewDate: '2026-06-30',
  /* source-confidence-stamp:end */

  source: 'Kenya Revenue Authority (KRA)',

  calculate(params) {
    const {
      grossAnnual,
      nssf: inclNssf = true,
      shif: inclShif = true,
      ahl: inclAhl = false,
      personalRelief: inclPersonalRelief = true,
      insurancePremium = 0,
      voluntaryPension = 0,
      prmf = 0,
      mortgageInterest = 0,
      disability = false
    } = params;

    const monthlyGross = grossAnnual / 12;
    const monthly = kePayroll.calculateMonthlyPayroll(monthlyGross, {
      nssf: inclNssf,
      shif: inclShif,
      ahl: inclAhl,
      personalRelief: inclPersonalRelief,
      insurancePremium: insurancePremium / 12 || 0,
      voluntaryPension: voluntaryPension / 12 || 0,
      prmf: prmf / 12 || 0,
      mortgageInterest: mortgageInterest / 12 || 0,
      disability: disability
    });

    const annualNssf = monthly.nssf * 12;
    const annualShif = monthly.shif * 12;
    const annualAhl = monthly.ahl * 12;
    const annualVoluntaryPension = monthly.voluntaryPension * 12;
    const annualPrmf = monthly.prmf * 12;
    const annualGrossTax = monthly.grossTax * 12;
    const annualPaye = monthly.paye * 12;
    const annualEmployerNssf = monthly.employerNSSF * 12;
    const annualEmployerAhl = monthly.employerAHL * 12;

    const totalDeductions = annualNssf + annualShif + annualAhl + annualVoluntaryPension + annualPrmf + annualPaye;
    const netAnnual = grossAnnual - totalDeductions;

    return {
      input: { country: 'KE', grossAnnual, regime: 'STANDARD' },
      deductions: {
        nssf: Math.round(annualNssf),
        shif: Math.round(annualShif),
        ahl: Math.round(annualAhl),
        voluntaryPension: Math.round(annualVoluntaryPension),
        prmf: Math.round(annualPrmf),
        totalDeductions: Math.round(totalDeductions)
      },
      tax: {
        taxableIncome: Math.round(monthly.taxable * 12),
        bands: buildBandRanges(monthly.taxable),
        grossTax: Math.round(annualGrossTax * 100) / 100,
        reliefs: {
          personalRelief: Math.round(monthly.personalRelief * 12),
          insuranceRelief: Math.round(monthly.insuranceRelief * 12)
        },
        netTax: Math.round(annualPaye * 100) / 100
      },
      result: {
        netAnnual: Math.round(netAnnual * 100) / 100,
        netMonthly: Math.round((netAnnual / 12) * 100) / 100,
        effectiveRate: (annualPaye / grossAnnual * 100).toFixed(2) + '%',
        marginalRate: monthly.marginalRate + '%'
      },
      employer: {
        nssf: Math.round(annualEmployerNssf),
        ahl: Math.round(annualEmployerAhl),
        totalCostAnnual: Math.round(grossAnnual + annualEmployerNssf + annualEmployerAhl),
        totalCostMonthly: Math.round((grossAnnual + annualEmployerNssf + annualEmployerAhl) / 12)
      },
      meta: { regime: 'STANDARD', currency: 'KES', lastUpdated: this.lastUpdated, source: this.source }
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
        { key: 'nssf', label: 'NSSF (6% up to KES 72,000/month)', default: true },
        { key: 'shif', label: 'SHIF (2.75%, min KES 300/month)', default: true },
        { key: 'ahl', label: 'Housing Levy (1.5% of gross, net-pay only)', default: false }
      ],
      regimes: [{ key: 'STANDARD', label: 'Standard PAYE', default: true }]
    };
  }
};
