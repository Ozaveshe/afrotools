/**
 * AFROTOOLS — South Africa PAYE Calculation Engine
 * ===================================================================
 * Pure function: input options -> output results. No DOM, no side effects.
 *
 * Usage:
 *   const result = AfroTools.engines.zaPAYE.calculate(500000, {
 *     ageGroup: 'under65', retirement: 50000, uif: true
 *   });
 *
 * Source: SARS Budget Tax Guide, rates 1 March 2025 - 28 February 2026.
 * ===================================================================
 */

(function (window) {
  'use strict';

  // ── SARS 2025/26 TAX BANDS ─────────────────────────────────
  const SARS_BANDS = [
    { from: 1,       to: 237100,   rate: 0.18 },
    { from: 237101,  to: 370500,   rate: 0.26 },
    { from: 370501,  to: 512800,   rate: 0.31 },
    { from: 512801,  to: 673000,   rate: 0.36 },
    { from: 673001,  to: 857900,   rate: 0.39 },
    { from: 857901,  to: 1817000,  rate: 0.41 },
    { from: 1817001, to: Infinity, rate: 0.45 },
  ];

  // Rebates
  const REBATES = {
    under65:  17235,
    '65to74': 17235 + 9444,         // 26,679
    '75plus': 17235 + 9444 + 3145,  // 29,824
  };

  // Tax-free thresholds
  const THRESHOLDS = {
    under65:  95750,
    '65to74': 148217,
    '75plus': 165689,
  };

  // UIF ceiling
  const UIF_ANNUAL_CEILING = 212544; // R17,712/month

  // ── HELPERS ──────────────────────────────────────────────

  function calcTax(taxableIncome) {
    let grossTax = 0;
    const breakdown = [];
    for (const b of SARS_BANDS) {
      if (taxableIncome < b.from) break;
      const upper = isFinite(b.to) ? b.to : taxableIncome;
      const incomeInBand = Math.min(taxableIncome, upper) - b.from + 1;
      const taxInBand = incomeInBand * b.rate;
      grossTax += taxInBand;
      breakdown.push({
        rate: b.rate * 100,
        from: b.from,
        to: b.to,
        incomeInBand,
        taxInBand,
        cumTax: grossTax,
      });
      if (taxableIncome <= upper) break;
    }
    return { grossTax, breakdown };
  }

  function getMarginalRate(taxableIncome) {
    for (let i = SARS_BANDS.length - 1; i >= 0; i--) {
      if (taxableIncome >= SARS_BANDS[i].from) return SARS_BANDS[i].rate * 100;
    }
    return 18;
  }

  // ── MAIN CALCULATION ──────────────────────────────────────

  /**
   * Calculate South Africa PAYE
   * @param {number} annualGross - Annual gross income in ZAR
   * @param {Object} opts
   * @param {string}  [opts.ageGroup='under65'] - 'under65' | '65to74' | '75plus'
   * @param {number}  [opts.retirement=0] - Annual retirement contribution
   * @param {boolean} [opts.uif=true]
   * @param {number}  [opts.medMembers=0] - Medical aid members (main + dependents)
   * @returns {Object}
   */
  function calculate(annualGross, opts = {}) {
    const gross     = annualGross;
    const ageGroup  = opts.ageGroup || 'under65';
    const includeUIF = opts.uif !== false;
    const medMembers = opts.medMembers || 0;

    // Retirement deduction: 27.5% of gross, max R350,000
    const retRaw    = opts.retirement || 0;
    const retCap    = Math.min(gross * 0.275, 350000);
    const retirement = Math.min(retRaw, retCap);

    // Taxable income
    const taxableIncome = Math.max(0, gross - retirement);

    // Gross tax
    const { grossTax, breakdown } = calcTax(taxableIncome);

    // Rebates
    const rebate = REBATES[ageGroup] || REBATES.under65;

    // Medical Tax Credits
    let mtcMonthly = 0;
    if (medMembers >= 1) mtcMonthly += 364;
    if (medMembers >= 2) mtcMonthly += 364;
    if (medMembers >= 3) mtcMonthly += (medMembers - 2) * 246;
    const mtcAnnual = mtcMonthly * 12;

    // PAYE
    const payeBeforeCredits = Math.max(0, grossTax - rebate);
    const paye = Math.max(0, payeBeforeCredits - mtcAnnual);

    // UIF
    const uifBase = Math.min(gross, UIF_ANNUAL_CEILING);
    const uif = includeUIF ? uifBase * 0.01 : 0;

    // Employer costs
    const employerUIF = uifBase * 0.01;
    const employerSDL = gross * 0.01;
    const totalEmployerCost = gross + employerUIF + employerSDL;

    // Net
    const totalDeductions = uif + paye;
    const netAnnual = gross - totalDeductions;
    const netMonthly = netAnnual / 12;
    const effectiveRate = gross > 0 ? (paye / gross) * 100 : 0;
    const marginalRate = getMarginalRate(taxableIncome);
    const threshold = THRESHOLDS[ageGroup] || THRESHOLDS.under65;

    return {
      gross, ageGroup,
      retirement, retCap, retRaw,
      taxableIncome,
      grossTax, rebate,
      mtcAnnual, mtcMonthly, medMembers,
      paye, uif,
      totalDeductions,
      netAnnual, netMonthly,
      effectiveRate,
      marginalRate,
      threshold,
      bandBreakdown: breakdown,
      // Employer
      employerUIF, employerSDL,
      totalEmployerCost,
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

  /**
   * Retirement optimizer: find optimal contribution
   */
  function optimizeRetirement(annualGross, opts = {}) {
    const maxRet = Math.min(annualGross * 0.275, 350000);
    const step = Math.max(1000, Math.round(maxRet / 20));
    let bestSaving = 0, bestAmount = 0;
    const baseResult = calculate(annualGross, { ...opts, retirement: 0 });

    for (let amount = step; amount <= maxRet; amount += step) {
      const result = calculate(annualGross, { ...opts, retirement: amount });
      const saving = baseResult.paye - result.paye;
      if (saving > bestSaving) {
        bestSaving = saving;
        bestAmount = amount;
      }
    }

    return {
      optimalAmount: bestAmount,
      maxAmount: maxRet,
      taxSaving: bestSaving,
      baseTax: baseResult.paye,
    };
  }

  // ── EXPOSE ─────────────────────────────────────────────

  const engine = {
    calculate,
    validate,
    reverseCalc,
    optimizeRetirement,
    SARS_BANDS,
    REBATES,
    THRESHOLDS,
    UIF_ANNUAL_CEILING,
    country: 'South Africa',
    currency: 'ZAR',
    id: 'za-paye',
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.zaPAYE = engine;

})(window);
