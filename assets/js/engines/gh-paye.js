/**
 * AFROTOOLS — Ghana PAYE Calculation Engine
 * ===================================================================
 * Pure function: input options -> output results. No DOM, no side effects.
 *
 * Usage:
 *   const result = AfroTools.engines.ghPAYE.calculate(120000, {
 *     basicSalary: 60000,
 *     ssnit: true,
 *     tier3: true, tier3Amount: 5000,
 *   });
 *
 * Source: GRA, Income Tax Act 2015 (Act 896) as amended.
 *         SSNIT Act 2008 (Act 766).
 * ===================================================================
 */

(function (window) {
  'use strict';

  // ── GRA 2026 ANNUAL TAX BANDS ─────────────────────────────
  const GH_BANDS = [
    { limit: 5880,     rate: 0.000 },
    { limit: 1320,     rate: 0.050 },
    { limit: 1560,     rate: 0.100 },
    { limit: 38000,    rate: 0.175 },
    { limit: 192000,   rate: 0.250 },
    { limit: 360000,   rate: 0.300 },
    { limit: Infinity, rate: 0.350 },
  ];

  // SSNIT constants (monthly caps → used on annual values)
  const SSNIT_CAP           = 61000 * 12;   // Annual basic salary cap (61,000/month × 12)
  const SSNIT_EMP_RATE      = 0.055;   // Employee 5.5%
  const SSNIT_EMPLOYER_RATE = 0.13;    // Employer 13%
  const TIER3_CAP_RATE      = 0.165;   // Max Tier 3: 16.5% of basic

  // ── HELPERS ──────────────────────────────────────────────

  function applyBands(chargeableIncome) {
    let tax = 0, rem = chargeableIncome;
    const breakdown = [];
    for (const b of GH_BANDS) {
      if (rem <= 0) break;
      const chunk = isFinite(b.limit) ? Math.min(rem, b.limit) : rem;
      const t = chunk * b.rate;
      if (chunk > 0) breakdown.push({ rate: b.rate * 100, income: chunk, amount: t });
      tax += t;
      rem -= chunk;
    }
    return { tax, breakdown };
  }

  function getMarginalRate(chargeableIncome) {
    let rem = chargeableIncome;
    for (const b of GH_BANDS) {
      if (rem <= (isFinite(b.limit) ? b.limit : rem)) return b.rate * 100;
      rem -= b.limit;
    }
    return 35;
  }

  // ── MAIN CALCULATION ──────────────────────────────────────

  /**
   * Calculate Ghana PAYE
   * @param {number} annualGross - Annual gross salary in GHS
   * @param {Object} opts
   * @param {number}  [opts.basicSalary] - Monthly basic (defaults to gross)
   * @param {boolean} [opts.ssnit=true]
   * @param {boolean} [opts.tier3=false]
   * @param {number}  [opts.tier3Amount=0] - Monthly Tier 3 contribution
   * @param {boolean} [opts.marriage=false] - Marriage relief (GHS 1,200/yr)
   * @param {number}  [opts.children=0] - 0, 1, or 2 (GHS 1,200 each, max 2)
   * @param {boolean} [opts.disabled=false] - 25% of gross exempt
   * @param {boolean} [opts.oldAge=false] - Old age relief (GHS 1,500/yr)
   * @param {boolean} [opts.dependent=false] - Dependent relative (GHS 1,000/yr)
   * @returns {Object}
   */
  function calculate(annualGross, opts = {}) {
    const gross = annualGross;
    const basicRaw = opts.basicSalary || gross;
    const basic = Math.min(basicRaw, gross);

    // SSNIT Tier 1 (employee)
    const ssnitBase = Math.min(basic, SSNIT_CAP);
    const ssnit = opts.ssnit !== false ? ssnitBase * SSNIT_EMP_RATE : 0;

    // Tier 3 voluntary
    const tier3Cap = (basic / 12) * TIER3_CAP_RATE;
    const tier3Raw = opts.tier3Amount || 0;
    const tier3 = opts.tier3 ? Math.min(tier3Raw, tier3Cap) : 0;

    // Reliefs
    const marriage    = opts.marriage   ? 1200 : 0;
    const children    = Math.min(opts.children || 0, 2);
    const childRel    = children * 1200;
    const disabled    = opts.disabled   ? gross * 0.25 : 0;
    const oldAge      = opts.oldAge     ? 1500 : 0;
    const dependent   = opts.dependent  ? 1000 : 0;
    const totalRelief = marriage + childRel + disabled + oldAge + dependent;

    // Chargeable income
    const chargeableIncome = Math.max(0, gross - ssnit - tier3 - totalRelief);
    const { tax, breakdown } = applyBands(chargeableIncome);

    // Employer SSNIT
    const employerSSNIT = Math.min(basic, SSNIT_CAP) * SSNIT_EMPLOYER_RATE;

    // Totals
    const totalDeductions = ssnit + tier3 + tax;
    const netAnnual = gross - totalDeductions;

    return {
      gross, basic,
      ssnit, tier3, tier3Cap,
      marriage, childRel, disabled, oldAge, dependent, totalRelief,
      chargeableIncome,
      tax,
      bandBreakdown: breakdown,
      totalDeductions,
      netAnnual,
      netMonthly: netAnnual / 12,
      effectiveRate: gross > 0 ? (tax / gross) * 100 : 0,
      marginalRate: getMarginalRate(chargeableIncome),
      // Employer
      employerSSNIT,
      totalEmployerCost: gross + employerSSNIT,
    };
  }

  /**
   * Calculate bonus tax (flat 5% or 10% for non-residents)
   */
  function calcBonusTax(bonusAmount, isResident = true) {
    const rate = isResident ? 0.05 : 0.10;
    return {
      gross: bonusAmount,
      tax: bonusAmount * rate,
      net: bonusAmount * (1 - rate),
      rate: rate * 100,
    };
  }

  /**
   * Tier 3 optimizer: find optimal voluntary contribution
   */
  function optimizeTier3(annualGross, opts = {}) {
    const basic = opts.basicSalary || annualGross;
    const maxTier3 = basic * TIER3_CAP_RATE;
    const step = Math.max(100, Math.round(maxTier3 / 20));

    let bestSaving = 0, bestAmount = 0;
    const baseResult = calculate(annualGross, { ...opts, tier3: false });

    for (let amount = step; amount <= maxTier3; amount += step) {
      const result = calculate(annualGross, { ...opts, tier3: true, tier3Amount: amount });
      const saving = baseResult.tax - result.tax;
      if (saving > bestSaving) {
        bestSaving = saving;
        bestAmount = amount;
      }
    }

    return {
      optimalAmount: bestAmount,
      maxAmount: maxTier3,
      taxSaving: bestSaving,
      newTax: baseResult.tax - bestSaving,
      baseTax: baseResult.tax,
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
    calcBonusTax,
    optimizeTier3,
    GH_BANDS,
    SSNIT_CAP,
    SSNIT_EMP_RATE,
    SSNIT_EMPLOYER_RATE,
    TIER3_CAP_RATE,
    country: 'Ghana',
    currency: 'GHS',
    id: 'gh-paye',
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.ghPAYE = engine;

})(window);
