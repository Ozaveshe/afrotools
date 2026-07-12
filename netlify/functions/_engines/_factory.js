// Shared factory for creating PAYE engines with standard progressive band structure
// Used by countries where we apply a standard progressive tax calculation

function calcProgressiveBands(amount, bands) {
  let tax = 0, rem = amount, detail = [], cumFrom = 0;
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

function calcCumulativeBands(amount, brackets) {
  let tax = 0, prev = 0, detail = [];
  for (const [threshold, rate] of brackets) {
    const t = Math.min(amount, threshold) - prev;
    if (t > 0) {
      const inBand = t * rate;
      tax += inBand;
      detail.push({ from: prev, to: Math.min(amount, threshold), rate, taxInBand: Math.round(inBand) });
    }
    prev = threshold;
    if (amount <= threshold) break;
  }
  return { tax, bands: detail };
}

function createEngine(config) {
  const {
    country, countryName, currency, source,
    bands, bandType = 'progressive', // 'progressive' (width-based) or 'cumulative' (threshold-based)
    isMonthly = false, // if bands are monthly, multiply result by 12
    socialSecurity = [], // [{key, label, rate, cap, default}]
    employerSS = [], // [{key, label, rate, cap}]
    personalRelief = 0,
    regimes = ['STANDARD']
  } = config;

  return {
    country,
    countryName,
    currency,
    regimes,
    lastUpdated: '2026-03-01',
    source,
    formulaParameters: {
      bandType,
      isMonthly,
      bands,
      socialSecurity,
      employerSS,
      personalRelief,
      regimes
    },
    roundingPolicy: {
      method: 'nearest-integer',
      stages: [
        'individual statutory deductions',
        'tax per band in the result breakdown',
        'annual net tax after relief',
        'annual and monthly net result',
        'employer contribution totals'
      ],
      calculationNote: 'Unrounded intermediate amounts feed later stages unless the implementation explicitly applies Math.round.'
    },

    calculate(params) {
      const { grossAnnual, ...opts } = params;
      const monthly = grossAnnual / 12;

      // Calculate social security deductions
      let totalSS = 0;
      const deductions = {};
      for (const ss of socialSecurity) {
        if (opts[ss.key] === false) { deductions[ss.key] = 0; continue; }
        const base = isMonthly ? monthly : grossAnnual;
        let amt = base * ss.rate;
        if (ss.cap) amt = Math.min(amt, ss.cap * (isMonthly ? 1 : 12));
        if (isMonthly) amt *= 12;
        deductions[ss.key] = Math.round(amt);
        totalSS += amt;
      }

      // Calculate taxable income
      const taxable = Math.max(0, grossAnnual - totalSS);
      const calcAmount = isMonthly ? taxable / 12 : taxable;

      // Calculate tax
      const calcFn = bandType === 'cumulative' ? calcCumulativeBands : calcProgressiveBands;
      const { tax: rawTax, bands: bandDetail } = calcFn(calcAmount, bands);
      const annualTax = isMonthly ? rawTax * 12 : rawTax;
      const relief = isMonthly ? personalRelief * 12 : personalRelief;
      const netTax = Math.max(0, Math.round(annualTax - relief));

      const totalDeductions = totalSS + netTax;
      deductions.totalDeductions = Math.round(totalDeductions);
      const netAnnual = grossAnnual - totalDeductions;

      // Employer costs
      let empTotal = 0;
      const employer = {};
      for (const es of employerSS) {
        const base = isMonthly ? monthly : grossAnnual;
        let amt = base * es.rate;
        if (es.cap) amt = Math.min(amt, es.cap * (isMonthly ? 1 : 12));
        if (isMonthly) amt *= 12;
        employer[es.key] = Math.round(amt);
        empTotal += amt;
      }
      employer.totalCostAnnual = Math.round(grossAnnual + empTotal);
      employer.totalCostMonthly = Math.round((grossAnnual + empTotal) / 12);

      const lastBand = bandDetail.filter(b => b.taxInBand > 0).pop();

      return {
        input: { country, grossAnnual, regime: regimes[0] },
        deductions,
        tax: {
          taxableIncome: Math.round(taxable),
          bands: bandDetail,
          grossTax: Math.round(annualTax),
          reliefs: relief > 0 ? { personalRelief: relief } : {},
          netTax
        },
        result: {
          netAnnual: Math.round(netAnnual),
          netMonthly: Math.round(netAnnual / 12),
          effectiveRate: (netTax / grossAnnual * 100).toFixed(2) + '%',
          marginalRate: lastBand ? (lastBand.rate * 100) + '%' : '0%'
        },
        employer,
        meta: { regime: regimes[0], currency, lastUpdated: '2026-03-01', source }
      };
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
        deductions: socialSecurity.map(s => ({ key: s.key, label: s.label, default: s.default !== false })),
        regimes: regimes.map((r, i) => ({ key: r, label: r.replace(/_/g, ' '), default: i === 0 }))
      };
    }
  };
}

module.exports = { createEngine, calcProgressiveBands, calcCumulativeBands };
