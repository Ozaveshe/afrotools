// Angola PAYE (IRT) — Source: Administração Geral Tributária (AGT)
const { createEngine } = require('./_factory');
const irt = require('../../../assets/js/engines/angola-irt');
const engine = createEngine({
  country: 'AO', countryName: 'Angola', currency: 'AOA',
  source: 'Orçamento Geral do Estado 2026, artigo 21.º, n.º 3, Anexo I',
  /* source-confidence-stamp:start */
  lastUpdated: '2026-11-26',
  sourceCheckedOn: '2026-11-26',
  nextReviewDate: '2027-01-01',
  /* source-confidence-stamp:end */

  isMonthly: true,
  bandType: 'fixed-plus-excess',
  bands: irt.bands,
  calculateBands(amount) {
    const row = irt.withholding(amount);
    return { tax: row.tax, bands: [{ from: row.lower, to: amount, rate: row.rate,
      fixedTax: row.fixed, taxInBand: Math.round(row.tax) }] };
  },
  socialSecurity: [{ key: 'inss', label: 'INSS (3%)', rate: 0.03 }],
  employerSS: [{ key: 'inss', label: 'INSS (8%)', rate: 0.08 }]
});

// Invert each legal row independently: tax jumps make gross pay non-unique.
// Calculate rounds annual tax and then annual net to whole kwanza. This can
// move the inverse by less than two kwanza at the minimum net slope of 0.7275.
engine.reverseCalculate = function ({ netAnnual, ...opts }) {
  if (!Number.isSafeInteger(Math.ceil(netAnnual)) || netAnnual > Number.MAX_SAFE_INTEGER / 2 || netAnnual < 0) throw new RangeError('Invalid annual net.');
  const taxableShare = opts.inss === false ? 1 : 0.97;
  const target = Math.ceil(netAnnual);
  const matches = [];
  let lower = 0;
  for (const [upper, fixed, rate] of irt.bands) {
    const first = lower === 0 ? 0 : Math.floor(12 * lower / taxableShare) + 1;
    const last = Math.floor(12 * upper / taxableShare);
    const estimate = (target + 12 * (fixed - rate * lower)) / ((1 - rate) * taxableShare);
    const start = Math.max(first, Math.floor(estimate) - 3);
    const end = Math.min(last, Math.max(first, Math.ceil(estimate) + 3));
    for (let grossAnnual = start; grossAnnual <= end; grossAnnual++) {
      const result = engine.calculate({ ...opts, grossAnnual });
      if (result.result.netAnnual >= target) {
        matches.push(result);
        break;
      }
    }
    lower = upper;
    if (matches.length && first > Math.ceil(estimate) + 3) break;
  }
  const result = matches[0];
  result.meta.reversePolicy = 'Lowest whole annual gross meeting the requested net';
  result.meta.alternativeGrossAnnual = matches.slice(1)
    .filter(match => match.result.netAnnual === result.result.netAnnual)
    .map(match => match.input.grossAnnual);
  return result;
};
module.exports = engine;
