/**
 * AFROTOOLS — Egypt PAYE Calculation Engine
 * ===================================================================
 * Pure function: input options -> output results. No DOM, no side effects.
 *
 * Implements the bracket exclusion (tiering) rule correctly.
 *
 * Usage:
 *   const result = AfroTools.engines.egPAYE.calculate(600000, {
 *     nosi: true, disabled: false
 *   });
 *
 * Source: Egyptian Tax Authority (ETA), Income Tax Law No. 91/2005
 *         as amended by Law No. 7/2024.
 * ===================================================================
 */

(function (window) {
  'use strict';

  // ── TAX BANDS (annual, on net taxable income after exemption) ───

  const ETA_BANDS = [
    { limit: 40000,    rate: 0.000 },
    { limit: 15000,    rate: 0.100 },
    { limit: 15000,    rate: 0.150 },
    { limit: 130000,   rate: 0.200 },
    { limit: 200000,   rate: 0.225 },
    { limit: 800000,   rate: 0.250 },
    { limit: Infinity, rate: 0.275 },
  ];

  /**
   * Bracket exclusion rules:
   * If net annual taxable income (NATI) exceeds these thresholds,
   * the corresponding band is "excluded" (collapsed), resulting
   * in higher effective tax at that income level.
   */
  const EXCLUSION_RULES = [
    { threshold: 600000,  bandIdx: 0, extraTax: 0 },
    { threshold: 700000,  bandIdx: 1, extraTax: 1500 },
    { threshold: 800000,  bandIdx: 2, extraTax: 2250 },
    { threshold: 900000,  bandIdx: 3, extraTax: 26000 },
    { threshold: 1000000, bandIdx: 4, extraTax: 45000 },
    { threshold: 1200000, bandIdx: 5, extraTax: 200000 },
  ];

  // Personal exemption
  const PERSONAL_EXEMPTION         = 20000;
  const DISABLED_PERSONAL_EXEMPTION = 30000;

  // NOSI (Social Insurance) rate: 11%, cap EGP 14,500/month = 174,000/year
  const NOSI_RATE        = 0.11;
  const NOSI_ANNUAL_CAP  = 174000;
  const NOSI_EMPLOYER_RATE = 0.1875;

  // ── HELPERS ──────────────────────────────────────────────

  function calcTax(nati) {
    // Standard progressive computation
    let tax = 0, rem = nati;
    const breakdown = [];
    for (const b of ETA_BANDS) {
      if (rem <= 0) break;
      const chunk = isFinite(b.limit) ? Math.min(rem, b.limit) : rem;
      const t = chunk * b.rate;
      if (chunk > 0) breakdown.push({ rate: b.rate * 100, income: chunk, tax: t });
      tax += t;
      rem -= chunk;
    }

    // Apply bracket exclusion
    let exclusionExtra = 0;
    const excludedBands = [];
    for (const rule of EXCLUSION_RULES) {
      if (nati > rule.threshold) {
        exclusionExtra = rule.extraTax;
        excludedBands.push(rule.bandIdx);
      }
    }

    return {
      standardTax: tax,
      exclusionExtra,
      tax: tax + exclusionExtra,
      breakdown,
      excludedBands,
    };
  }

  function getMarginalRate(nati) {
    let rem = nati;
    for (const b of ETA_BANDS) {
      if (rem <= (isFinite(b.limit) ? b.limit : rem)) return b.rate * 100;
      rem -= b.limit;
    }
    return 27.5;
  }

  // ── MAIN CALCULATION ──────────────────────────────────────

  /**
   * Calculate Egypt PAYE
   * @param {number} annualGross - Annual gross salary in EGP
   * @param {Object} opts
   * @param {boolean} [opts.nosi=true] - National Organization for Social Insurance
   * @param {boolean} [opts.disabled=false] - Higher personal exemption
   * @returns {Object}
   */
  function calculate(annualGross, opts = {}) {
    const gross = annualGross;

    // Personal exemption
    const personalExemption = opts.disabled ? DISABLED_PERSONAL_EXEMPTION : PERSONAL_EXEMPTION;

    // NOSI
    const nosiBase = opts.nosi !== false ? Math.min(gross, NOSI_ANNUAL_CAP) : 0;
    const nosi = nosiBase * NOSI_RATE;

    // Net Annual Taxable Income (NATI)
    const nati = Math.max(0, gross - personalExemption - nosi);

    // Tax
    const taxResult = calcTax(nati);
    const tax = taxResult.tax;

    // Employer NOSI
    const employerNOSI = nosiBase * NOSI_EMPLOYER_RATE;

    // Net
    const totalDeductions = nosi + tax;
    const netAnnual = gross - totalDeductions;
    const effectiveRate = gross > 0 ? (tax / gross) * 100 : 0;
    const marginalRate = getMarginalRate(nati);

    return {
      gross,
      personalExemption,
      nosi, nosiBase,
      nati,
      standardTax: taxResult.standardTax,
      exclusionExtra: taxResult.exclusionExtra,
      excludedBands: taxResult.excludedBands,
      tax,
      totalDeductions,
      netAnnual,
      netMonthly: netAnnual / 12,
      effectiveRate,
      marginalRate,
      bandBreakdown: taxResult.breakdown,
      // Employer
      employerNOSI,
      totalEmployerCost: gross + employerNOSI,
    };
  }

  function validate(annualGross) {
    if (!annualGross || isNaN(annualGross) || annualGross <= 0) {
      return { valid: false, error: 'Please enter a valid salary amount' };
    }
    return { valid: true, error: null };
  }

  function reverseCalc(desiredNetAnnual, opts = {}) {
    let lo = desiredNetAnnual, hi = desiredNetAnnual * 3;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      const result = calculate(mid, opts);
      if (Math.abs(result.netAnnual - desiredNetAnnual) < 1) return mid;
      if (result.netAnnual < desiredNetAnnual) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // ── EXPOSE ─────────────────────────────────────────────

  const engine = {
    calculate,
    validate,
    reverseCalc,
    ETA_BANDS,
    EXCLUSION_RULES,
    PERSONAL_EXEMPTION,
    DISABLED_PERSONAL_EXEMPTION,
    NOSI_RATE,
    NOSI_ANNUAL_CAP,
    country: 'Egypt',
    currency: 'EGP',
    id: 'eg-paye',
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.egPAYE = engine;

})(window);
