/**
 * AFROTOOLS — Tanzania PAYE Calculation Engine
 * ===================================================================
 * Pure function: input options -> output results. No DOM, no side effects.
 *
 * Tax bands are computed on MONTHLY taxable income.
 *
 * Usage:
 *   const result = AfroTools.engines.tzPAYE.calculate(1500000, {
 *     sector: 'private', nssf: true
 *   });
 *
 * Source: Tanzania Revenue Authority (TRA), Income Tax Act 2004
 *         as amended by Finance Act 2024.
 * ===================================================================
 */

(function (window) {
  'use strict';

  // ── TRA PAYE TAX BANDS (MONTHLY) ──────────────────────────
  //  0%    on first  TZS 270,000
  //  8%    on next   TZS 250,000  (270,001-520,000)
  //  20%   on next   TZS 240,000  (520,001-760,000)
  //  25%   on next   TZS 240,000  (760,001-1,000,000)
  //  30%   above     TZS 1,000,000
  const TRA_BANDS = [
    { limit: 270000,   rate: 0.00 },
    { limit: 250000,   rate: 0.08 },
    { limit: 240000,   rate: 0.20 },
    { limit: 240000,   rate: 0.25 },
    { limit: Infinity, rate: 0.30 },
  ];

  // Social security rates
  const PRIVATE_EMP_RATE     = 0.10;  // NSSF employee
  const PRIVATE_EMPLOYER_RATE = 0.10; // NSSF employer
  const PUBLIC_EMP_RATE      = 0.05;  // PSSSF employee
  const PUBLIC_EMPLOYER_RATE  = 0.15; // PSSSF employer

  // ── HELPERS ──────────────────────────────────────────────

  function calcMonthlyPAYE(monthlyTaxableIncome) {
    const income = Math.max(0, monthlyTaxableIncome);
    const breakdown = [];

    if (income <= 270000) {
      breakdown.push({ rate: 0, income, tax: 0 });
      return { tax: 0, breakdown };
    }

    let tax = 0;

    // Band 1: 0%
    breakdown.push({ rate: 0, income: 270000, tax: 0 });

    // Band 2: 8%
    if (income > 270000) {
      const chunk = Math.min(income - 270000, 250000);
      const t = chunk * 0.08;
      tax += t;
      breakdown.push({ rate: 8, income: chunk, tax: t });
    }

    // Band 3: 20%
    if (income > 520000) {
      const chunk = Math.min(income - 520000, 240000);
      const t = chunk * 0.20;
      tax += t;
      breakdown.push({ rate: 20, income: chunk, tax: t });
    }

    // Band 4: 25%
    if (income > 760000) {
      const chunk = Math.min(income - 760000, 240000);
      const t = chunk * 0.25;
      tax += t;
      breakdown.push({ rate: 25, income: chunk, tax: t });
    }

    // Band 5: 30%
    if (income > 1000000) {
      const chunk = income - 1000000;
      const t = chunk * 0.30;
      tax += t;
      breakdown.push({ rate: 30, income: chunk, tax: t });
    }

    return { tax, breakdown: breakdown.filter(b => b.income > 0) };
  }

  function getMarginalRate(monthlyTaxable) {
    if (monthlyTaxable <= 270000)  return 0;
    if (monthlyTaxable <= 520000)  return 8;
    if (monthlyTaxable <= 760000)  return 20;
    if (monthlyTaxable <= 1000000) return 25;
    return 30;
  }

  // ── MAIN CALCULATION ──────────────────────────────────────

  /**
   * Calculate Tanzania PAYE
   * @param {number} monthlyGross - Monthly gross salary in TZS
   * @param {Object} opts
   * @param {string}  [opts.sector='private'] - 'private' | 'public'
   * @param {boolean} [opts.nssf=true] - Include NSSF/PSSSF
   * @param {boolean} [opts.secondary=false] - Secondary employment (no 0% band)
   * @returns {Object}
   */
  function calculate(monthlyGross, opts = {}) {
    const gross = monthlyGross;
    const sector = opts.sector || 'private';
    const hasNSSF = opts.nssf !== false;
    const isSecondary = opts.secondary || false;

    // Social security
    const socialEmpRate = hasNSSF
      ? (sector === 'private' ? PRIVATE_EMP_RATE : PUBLIC_EMP_RATE)
      : 0;
    const socialEmployerRate = sector === 'private' ? PRIVATE_EMPLOYER_RATE : PUBLIC_EMPLOYER_RATE;

    const socialEmployee = gross * socialEmpRate;
    const socialEmployer = hasNSSF ? gross * socialEmployerRate : 0;

    // Monthly taxable
    let taxable = gross - socialEmployee;

    // Secondary employment: tax all income at 30% flat (no 0% band)
    let paye, bandBreakdown;
    if (isSecondary) {
      paye = taxable * 0.30;
      bandBreakdown = [{ rate: 30, income: taxable, tax: paye }];
    } else {
      const result = calcMonthlyPAYE(taxable);
      paye = result.tax;
      bandBreakdown = result.breakdown;
    }

    const totalDeductions = socialEmployee + paye;
    const net = gross - totalDeductions;
    const effectiveRate = gross > 0 ? (paye / gross) * 100 : 0;
    const marginalRate = isSecondary ? 30 : getMarginalRate(taxable);

    return {
      gross,
      sector,
      isSecondary,
      socialEmployee,
      socialEmployer,
      socialEmpRate: socialEmpRate * 100,
      taxable,
      paye,
      totalDeductions,
      net,
      netAnnual: net * 12,
      effectiveRate,
      marginalRate,
      bandBreakdown,
      // Employer
      employerSocial: socialEmployer,
      totalEmployerCost: gross + socialEmployer,
    };
  }

  function validate(monthlyGross) {
    if (!monthlyGross || isNaN(monthlyGross) || monthlyGross <= 0) {
      return { valid: false, error: 'Please enter a valid salary amount' };
    }
    return { valid: true, error: null };
  }

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
    calcMonthlyPAYE,
    TRA_BANDS,
    PRIVATE_EMP_RATE,
    PRIVATE_EMPLOYER_RATE,
    PUBLIC_EMP_RATE,
    PUBLIC_EMPLOYER_RATE,
    country: 'Tanzania',
    currency: 'TZS',
    id: 'tz-paye',
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.tzPAYE = engine;

})(window);
