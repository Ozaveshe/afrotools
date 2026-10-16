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
 * Source: SARS Budget Tax Guide, rates 1 March 2026 - 28 February 2027.
 * ===================================================================
 */

(function (window) {
  'use strict';

  // ── SARS 2026/27 TAX BANDS ─────────────────────────────────
  const SARS_BANDS = [
    { from: 1,       to: 245100,   rate: 0.18 },
    { from: 245101,  to: 383100,   rate: 0.26 },
    { from: 383101,  to: 530200,   rate: 0.31 },
    { from: 530201,  to: 695800,   rate: 0.36 },
    { from: 695801,  to: 887000,   rate: 0.39 },
    { from: 887001,  to: 1878600,  rate: 0.41 },
    { from: 1878601, to: Infinity, rate: 0.45 },
  ];

  const TAX_PERIOD = Object.freeze({ assessmentYear: 2027, label: '2026/27', effectiveFrom: '2026-03-01', effectiveTo: '2027-02-28', inputBasis: 'annual', currency: 'ZAR', method: 'annual-marginal-formula-estimate', monthlyBasis: 'annual-estimate-divided-by-12' });

  // Rebates
  const REBATES = {
    under65:  17820,
    '65to74': 17820 + 9765,         // 27,585
    '75plus': 17820 + 9765 + 3249,  // 30,834
  };

  // Tax-free thresholds
  const THRESHOLDS = {
    under65:  99000,
    '65to74': 153250,
    '75plus': 171300,
  };

  // UIF ceiling
  const UIF_ANNUAL_CEILING = 212544; // R17,712/month

  // ── HELPERS ──────────────────────────────────────────────

  function calcTax(taxableIncome) {
    let grossTax = 0;
    const breakdown = [];
    for (const b of SARS_BANDS) {
      if (taxableIncome <= b.from - 1) break;
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
      if (taxableIncome > SARS_BANDS[i].from - 1) return SARS_BANDS[i].rate * 100;
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
    if (!Number.isFinite(annualGross) || annualGross < 0) throw new RangeError('Annual salary must be a finite nonnegative amount.');
    const gross     = annualGross;
    const ageGroup  = opts.ageGroup || 'under65';
    const includeUIF = opts.uif !== false;
    const medMembers = opts.medMembers == null || opts.medMembers === '' ? 0 : opts.medMembers;
    if (!Number.isInteger(medMembers) || medMembers < 0) throw new RangeError('Medical members must be a nonnegative whole number.');

    // Retirement deduction: 27.5% of gross, max R430,000
    const retRaw    = opts.retirement == null || opts.retirement === '' ? 0 : opts.retirement;
    if (!Number.isFinite(retRaw) || retRaw < 0) throw new RangeError('Retirement must be a finite nonnegative annual amount.');
    const retCap    = Math.min(gross * 0.275, 430000);
    const retirement = Math.min(retRaw, retCap);

    // Taxable income
    const taxableIncome = Math.max(0, gross - retirement);

    // Gross tax
    const { grossTax, breakdown } = calcTax(taxableIncome);

    // Rebates
    const rebate = REBATES[ageGroup] || REBATES.under65;

    // Medical Tax Credits
    let mtcMonthly = 0;
    if (medMembers >= 1) mtcMonthly += 376;
    if (medMembers >= 2) mtcMonthly += 376;
    if (medMembers >= 3) mtcMonthly += (medMembers - 2) * 254;
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
      taxPeriod: { ...TAX_PERIOD },
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
    if (!Number.isFinite(annualGross) || annualGross <= 0) {
      return { valid: false, error: 'Please enter a valid salary amount' };
    }
    return { valid: true, error: null };
  }

  function reverseCalc(desiredNetAnnual, opts = {}) {
    if (!Number.isFinite(desiredNetAnnual) || desiredNetAnnual < 0) throw new RangeError('Net salary must be a finite nonnegative annual amount.');
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
    const maxRet = Math.min(annualGross * 0.275, 430000);
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
