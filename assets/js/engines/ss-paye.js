(function (root) {
  'use strict';
  var EMPLOYEE_NSIF_RATE = 0.08;
  var EMPLOYER_NSIF_RATE = 0.17;
  var PIT_SURTAX_RATE = 0.30;
  var BANDS = [
    { width: 20000, rate: 0 }, { width: 20000, rate: 0.05 },
    { width: 17000, rate: 0.10 }, { width: 33000, rate: 0.15 },
    { width: Infinity, rate: 0.20 }
  ];
  function pitMonthly(taxableIncome) {
    var remaining = Math.max(0, Number(taxableIncome) || 0), lower = 0, pit = 0, detail = [];
    BANDS.forEach(function (band) {
      if (remaining <= 0) return;
      var slice = Math.min(remaining, band.width), bandTax = slice * band.rate;
      detail.push({ from: lower, to: band.width === Infinity ? null : lower + band.width, rate: band.rate, income: slice, tax: bandTax });
      pit += bandTax; remaining -= slice; if (band.width !== Infinity) lower += band.width;
    });
    return { pit: pit, bands: detail };
  }
  function calculate(input) {
    input = input || {};
    var gross = Number(input.gross);
    if (!Number.isFinite(gross) || gross < 0) return { ok: false, error: 'Enter a monthly gross salary of zero or more.' };
    var includeNsif = input.includeNsif !== false;
    var employeeNsif = includeNsif ? gross * EMPLOYEE_NSIF_RATE : 0;
    var employerNsif = includeNsif ? gross * EMPLOYER_NSIF_RATE : 0;
    var taxableIncome = Math.max(0, gross - employeeNsif);
    var tax = pitMonthly(taxableIncome);
    var surtax = tax.pit * PIT_SURTAX_RATE;
    var totalTax = tax.pit + surtax;
    var net = gross - employeeNsif - totalTax;
    var employerCost = gross + employerNsif;
    return {
      ok: true, gross: gross, employeeNsif: employeeNsif, taxableIncome: taxableIncome,
      pit: tax.pit, surtax: surtax, totalTax: totalTax, net: net,
      employerNsif: employerNsif, employerCost: employerCost,
      effectiveDeductionRate: gross ? (employeeNsif + totalTax) / gross : 0,
      bands: tax.bands,
      annual: { gross: gross * 12, employeeNsif: employeeNsif * 12, taxableIncome: taxableIncome * 12,
        pit: tax.pit * 12, surtax: surtax * 12, totalTax: totalTax * 12, net: net * 12,
        employerNsif: employerNsif * 12, employerCost: employerCost * 12 }
    };
  }
  var engine = {
    bands: BANDS, employeeNsifRate: EMPLOYEE_NSIF_RATE, employerNsifRate: EMPLOYER_NSIF_RATE,
    pitSurtaxRate: PIT_SURTAX_RATE, sourceCheckedOn: '2026-07-22',
    formulaParameters: { period: 'monthly', currency: 'SSP', bands: BANDS,
      employeeNsifRate: EMPLOYEE_NSIF_RATE, employerNsifRate: EMPLOYER_NSIF_RATE,
      employeeNsifDeductibleFromPitBase: true, pitSurtaxRate: PIT_SURTAX_RATE, pitSurtaxBase: 'computed monthly PIT' },
    roundingPolicy: { method: 'exact-then-display', stages: [
      'calculate employee NSIF at 8% of monthly gross wages', 'deduct approved employee contribution from the PIT base',
      'apply progressive monthly PIT bands', 'calculate surtax at 30% of computed PIT', 'round user-facing SSP totals only' ] },
    pitMonthly: pitMonthly, calculate: calculate
  };
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.engines = root.AfroTools.engines || {}; root.AfroTools.engines.southSudanPaye = engine; }
}(typeof window !== 'undefined' ? window : globalThis));
