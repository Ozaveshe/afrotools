/**
 * AFROTOOLS — Nigeria PAYE Calculation Engine
 * ===================================================================
 * Pure function: input options -> output results. No DOM, no side effects.
 *
 * Supports both PITA 2025 and NTA 2026 regimes.
 *
 * Usage:
 *   const result = AfroTools.engines.ngPAYE.calculate(3600000, {
 *     regime: 'nta',
 *     pension: true,
 *     nhf: true,
 *     annualRent: 1200000,
 *   });
 *
 * Source: Personal Income Tax Act (PITA), Cap P8 LFN 2004 as amended.
 *         Nigeria Tax Act 2025 (NTA), signed 26 June 2025, effective 1 Jan 2026.
 * ===================================================================
 */

(function (window) {
  'use strict';

  // ── TAX TABLES ───────────────────────────────────────────

  const PITA_BANDS = [
    { limit: 300000,   rate: 0.07 },
    { limit: 300000,   rate: 0.11 },
    { limit: 500000,   rate: 0.15 },
    { limit: 500000,   rate: 0.19 },
    { limit: 1600000,  rate: 0.21 },
    { limit: Infinity, rate: 0.24 },
  ];

  const NTA_BANDS = [
    { limit: 800000,   rate: 0.00 },
    { limit: 2200000,  rate: 0.15 },
    { limit: 9000000,  rate: 0.18 },
    { limit: 13000000, rate: 0.21 },
    { limit: 25000000, rate: 0.23 },
    { limit: Infinity, rate: 0.25 },
  ];

  const PITA_EXEMPT_THRESHOLD = 840000; // Minimum wage earners exempt under PITA

  // ── HELPERS ──────────────────────────────────────────────

  function applyBands(taxable, bands) {
    let tax = 0, rem = taxable, cumulative = 0;
    const breakdown = [];
    for (const b of bands) {
      if (rem <= 0) {
        breakdown.push({ rate: b.rate * 100, income: 0, amount: 0, cumulative });
        continue;
      }
      const chunk = Math.min(rem, b.limit);
      const t = chunk * b.rate;
      cumulative += t;
      breakdown.push({ rate: b.rate * 100, income: chunk, amount: t, cumulative });
      tax += t;
      rem -= chunk;
    }
    return { tax, breakdown };
  }

  function getMarginalRate(taxable, bands) {
    let rem = taxable;
    for (const b of bands) {
      if (rem <= b.limit) return b.rate * 100;
      rem -= b.limit;
    }
    return bands[bands.length - 1].rate * 100;
  }

  // ── PITA 2025 CALCULATION ────────────────────────────────

  function calcPITA(gross, opts = {}) {
    const pension    = opts.pension    ? gross * 0.08 : 0;
    const nhf        = opts.nhf        ? gross * 0.025 : 0;
    const nhisRate   = opts.nhis       ? (opts.nhisRate || 5) / 100 : 0;
    const nhis       = nhisRate > 0    ? gross * nhisRate : 0;
    const life       = opts.lifeInsurance || 0;
    const homeloan   = opts.homeLoanInterest ? Math.min(opts.homeLoanInterest, 500000) : 0;
    const statutory  = pension + nhf + nhis + life + homeloan;

    const craBase = Math.max(200000, gross * 0.01);
    const cra     = craBase + gross * 0.20;
    const taxable = Math.max(0, gross - statutory - cra);

    const { tax, breakdown } = applyBands(taxable, PITA_BANDS);

    // Minimum tax: 1% of gross when PAYE < minimum tax
    const minTax = gross * 0.01;
    const minTaxApplied = taxable > 0 && tax < minTax;
    const finalTax = taxable > 0 ? Math.max(tax, minTax) : 0;

    // Exemption (minimum wage earners)
    const isExempt = gross <= PITA_EXEMPT_THRESHOLD;
    const effectiveTax = isExempt ? 0 : finalTax;
    const netAnnual = gross - statutory - effectiveTax;

    return {
      regime: 'pita',
      gross,
      pension, nhf, nhis, life, homeloan, statutory,
      cra, rentRelief: 0,
      taxable,
      tax: effectiveTax,
      isExempt,
      minTaxApplied: !isExempt && minTaxApplied,
      netAnnual,
      netMonthly: netAnnual / 12,
      effectiveRate: gross > 0 ? (effectiveTax / gross) * 100 : 0,
      marginalRate: getMarginalRate(taxable, PITA_BANDS),
      bandBreakdown: breakdown,
      // Employer costs
      employerPension: opts.pension ? gross * 0.10 : 0,
      employerNHIS: nhisRate > 0 ? gross * nhisRate : 0,
      employerNHF: opts.nhf ? gross * 0.025 : 0,
    };
  }

  // ── NTA 2026 CALCULATION ─────────────────────────────────

  function calcNTA(gross, opts = {}) {
    const pensionableBase = opts.pension ? (opts.pensionableAmount || gross) : 0;
    const pension    = pensionableBase * 0.08;
    const nhf        = opts.nhf ? gross * 0.025 : 0;
    const nhisRate   = opts.nhis ? (opts.nhisRate || 5) / 100 : 0;
    const nhis       = nhisRate > 0 ? gross * nhisRate : 0;
    const life       = opts.lifeInsurance || 0;
    const homeloan   = opts.homeLoanInterest ? Math.min(opts.homeLoanInterest, 500000) : 0;
    const statutory  = pension + nhf + nhis + life + homeloan;

    const rent       = opts.annualRent || 0;
    const rentRelief = rent > 0 ? Math.min(rent * 0.20, 500000) : 0;
    const taxable    = Math.max(0, gross - statutory - rentRelief);

    const { tax, breakdown } = applyBands(taxable, NTA_BANDS);

    const isExempt = taxable <= 800000 && tax === 0;
    const netAnnual = gross - statutory - tax;

    return {
      regime: 'nta',
      gross,
      pension, nhf, nhis, life, homeloan, statutory,
      cra: 0, rentRelief,
      taxable,
      tax,
      isExempt,
      minTaxApplied: false,
      netAnnual,
      netMonthly: netAnnual / 12,
      effectiveRate: gross > 0 ? (tax / gross) * 100 : 0,
      marginalRate: getMarginalRate(taxable, NTA_BANDS),
      bandBreakdown: breakdown,
      // Employer costs
      employerPension: opts.pension ? (opts.pensionableAmount || gross) * 0.10 : 0,
      employerNHIS: nhisRate > 0 ? gross * nhisRate : 0,
      employerNHF: opts.nhf ? gross * 0.025 : 0,
    };
  }

  // ── MAIN ENTRY POINT ─────────────────────────────────────

  /**
   * Calculate Nigeria PAYE
   * @param {number} gross - Annual gross income in Naira
   * @param {Object} opts
   * @param {string} [opts.regime='nta'] - 'nta' | 'pita'
   * @param {boolean} [opts.pension=true]
   * @param {number}  [opts.pensionableAmount] - NTA: pensionable base (defaults to gross)
   * @param {boolean} [opts.nhf=true]
   * @param {boolean} [opts.nhis=false]
   * @param {number}  [opts.nhisRate=5] - NHIS percentage rate
   * @param {number}  [opts.lifeInsurance=0]
   * @param {number}  [opts.homeLoanInterest=0]
   * @param {number}  [opts.annualRent=0] - NTA: for rent relief
   * @returns {Object} Calculation result
   */
  function calculate(gross, opts = {}) {
    const regime = (opts.regime || 'nta').toLowerCase();
    return regime === 'pita' ? calcPITA(gross, opts) : calcNTA(gross, opts);
  }

  /**
   * Validate inputs
   * @param {number} gross
   * @returns {{ valid: boolean, error: string|null }}
   */
  function validate(gross) {
    if (!gross || isNaN(gross) || gross <= 0) {
      return { valid: false, error: 'Please enter a valid salary amount' };
    }
    if (gross > 10_000_000_000) {
      return { valid: false, error: 'Amount exceeds maximum (10 billion Naira)' };
    }
    return { valid: true, error: null };
  }

  /**
   * Net-to-gross reverse calculation
   * @param {number} desiredNetAnnual
   * @param {Object} opts - Same as calculate() opts
   * @returns {number} Required gross annual
   */
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
    calcPITA,
    calcNTA,
    PITA_BANDS,
    NTA_BANDS,
    PITA_EXEMPT_THRESHOLD,
    country: 'Nigeria',
    currency: 'NGN',
    id: 'ng-paye',
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.ngPAYE = engine;

})(window);
