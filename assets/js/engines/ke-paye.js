/**
 * AFROTOOLS — Kenya PAYE Calculation Engine
 * ===================================================================
 * Pure function: input options -> output results. No DOM, no side effects.
 *
 * Usage:
 *   const result = AfroTools.engines.kePAYE.calculate(100000, {
 *     nssf: true, shif: true, personalRelief: true
 *   });
 *
 * Source: KRA, Income Tax Act Cap 470 as amended.
 *         Finance Act 2024 & Tax Laws Amendment Act 2024.
 *         NSSF Act 2013. SHIF Act 2023 (effective Oct 2024).
 * ===================================================================
 */

(function (window) {
  'use strict';

  // ── TAX TABLE (MONTHLY) ───────────────────────────────────
  const KES_BANDS = [
    { limit: 24000,    rate: 0.10 },
    { limit: 8333,     rate: 0.25 },
    { limit: 467667,   rate: 0.30 },
    { limit: 300000,   rate: 0.325 },
    { limit: Infinity, rate: 0.35 },
  ];

  const BAND_LABELS = [
    'First KES 24,000',
    'KES 24,001-32,333',
    'KES 32,334-500,000',
    'KES 500,001-800,000',
    'Above KES 800,000',
  ];

  // NSSF tiers
  const NSSF_LEL = 8000;   // Lower Earnings Limit
  const NSSF_UEL = 72000;  // Upper Earnings Limit

  // Personal relief (monthly)
  const PERSONAL_RELIEF = 2400;

  // ── HELPERS ──────────────────────────────────────────────

  function calcNSSF(monthlyGross) {
    return Math.min(monthlyGross, NSSF_LEL) * 0.06
         + Math.max(0, Math.min(monthlyGross, NSSF_UEL) - NSSF_LEL) * 0.06;
  }

  function calcGrossTax(monthlyTaxable) {
    let rem = Math.max(0, monthlyTaxable), tax = 0, cumulative = 0;
    const detail = [];
    for (let i = 0; i < KES_BANDS.length; i++) {
      const band = KES_BANDS[i];
      const income = Math.min(rem, band.limit === Infinity ? rem : band.limit);
      const t = income * band.rate;
      cumulative += t;
      detail.push({
        label: BAND_LABELS[i] || '',
        rate: band.rate * 100,
        income,
        tax: t,
        cumulative,
      });
      tax += t;
      rem -= income;
      if (rem <= 0) break;
    }
    return { tax, detail };
  }

  function getMarginalRate(monthlyTaxable) {
    let rem = monthlyTaxable;
    for (const b of KES_BANDS) {
      if (rem <= b.limit || b.limit === Infinity) return b.rate * 100;
      rem -= b.limit;
    }
    return 35;
  }

  // ── MAIN CALCULATION ──────────────────────────────────────

  /**
   * Calculate Kenya PAYE
   * @param {number} monthlyGross - Monthly gross salary in KES
   * @param {Object} opts
   * @param {boolean} [opts.nssf=true]
   * @param {boolean} [opts.shif=true]
   * @param {boolean} [opts.ahl=false] - Affordable Housing Levy
   * @param {boolean} [opts.personalRelief=true]
   * @param {boolean} [opts.disability=false] - KES 150,000/mo exempt
   * @param {number}  [opts.voluntaryPension=0] - Max KES 30,000/mo
   * @param {number}  [opts.prmf=0] - Post-Retirement Medical Fund, max KES 15,000/mo
   * @param {number}  [opts.insurancePremium=0] - For insurance relief (15%, max KES 5,000/mo)
   * @param {number}  [opts.mortgageInterest=0] - For mortgage relief (15%, max KES 25,000/mo)
   * @returns {Object}
   */
  function calculate(monthlyGross, opts = {}) {
    const gross = monthlyGross;

    // Statutory deductions
    const nssf    = opts.nssf !== false    ? calcNSSF(gross) : 0;
    const shif    = opts.shif !== false    ? Math.max(300, gross * 0.0275) : 0;
    const ahl     = opts.ahl              ? gross * 0.015 : 0;
    const pension = opts.voluntaryPension ? Math.min(30000, opts.voluntaryPension) : 0;
    const prmf    = opts.prmf             ? Math.min(15000, opts.prmf) : 0;

    // Disability exemption
    const disabilityExempt = opts.disability ? 150000 : 0;

    // Taxable = gross - deductions - disability
    // AHL does NOT reduce taxable (relief repealed Dec 2024)
    const taxable = Math.max(0, gross - nssf - shif - pension - prmf - disabilityExempt);

    const { tax: grossTax, detail: bandDetail } = calcGrossTax(taxable);

    // Reliefs (reduce tax payable)
    const personalRelief = opts.personalRelief !== false ? PERSONAL_RELIEF : 0;
    const insRelief    = opts.insurancePremium  ? Math.min(5000, opts.insurancePremium * 0.15) : 0;
    const mortRelief   = opts.mortgageInterest  ? Math.min(25000, opts.mortgageInterest * 0.15) : 0;

    const paye            = Math.max(0, grossTax - personalRelief - insRelief - mortRelief);
    const totalDeductions = nssf + shif + ahl + pension + prmf + paye;
    const net             = gross - totalDeductions;
    const effectiveRate   = gross > 0 ? (paye / gross) * 100 : 0;
    const marginalRate    = getMarginalRate(taxable);

    // Employer costs
    const employerNSSF = calcNSSF(gross);
    const employerAHL  = gross * 0.015;
    const totalEmployerCost = gross + employerNSSF + employerAHL;

    return {
      gross,
      nssf, shif, ahl, pension, prmf,
      disabilityExempt,
      taxable,
      grossTax,
      personalRelief, insRelief, mortRelief,
      paye,
      totalDeductions,
      net,
      netAnnual: net * 12,
      effectiveRate,
      marginalRate,
      bandDetail,
      // Employer
      employerNSSF,
      employerAHL,
      totalEmployerCost,
    };
  }

  /**
   * Validate inputs
   */
  function validate(monthlyGross) {
    if (!monthlyGross || isNaN(monthlyGross) || monthlyGross <= 0) {
      return { valid: false, error: 'Please enter a valid salary amount' };
    }
    if (monthlyGross > 100_000_000) {
      return { valid: false, error: 'Amount exceeds maximum' };
    }
    return { valid: true, error: null };
  }

  /**
   * Net-to-gross reverse calculation
   */
  function reverseCalc(desiredNet, opts = {}) {
    let lo = desiredNet, hi = desiredNet * 3;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      const result = calculate(mid, opts);
      if (Math.abs(result.net - desiredNet) < 1) return mid;
      if (result.net < desiredNet) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // ── EXPOSE ─────────────────────────────────────────────

  const engine = {
    calculate,
    validate,
    reverseCalc,
    calcNSSF,
    KES_BANDS,
    BAND_LABELS,
    NSSF_LEL,
    NSSF_UEL,
    PERSONAL_RELIEF,
    country: 'Kenya',
    currency: 'KES',
    id: 'ke-paye',
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.kePAYE = engine;

})(window);
