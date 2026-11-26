/* Angola 2026 budget, article 21(3), Annex I. Monthly group A taxable pay.
 * Each legal row specifies a fixed amount plus a rate on the excess. */
(function (root, factory) {
  const engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  else root.AngolaIRT = engine;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const bands = [
    // Upper bound (inclusive), fixed tax, rate on excess over preceding bound.
    [150000, 0, 0],
    [200000, 12500, 0.16],
    [300000, 31250, 0.18],
    [500000, 49250, 0.19],
    [1000000, 87250, 0.20],
    [1500000, 187250, 0.21],
    [2000000, 292250, 0.22],
    [2500000, 402250, 0.23],
    [5000000, 517250, 0.24],
    [10000000, 1117250, 0.245],
    [Infinity, 2342250, 0.25]
  ];
  function withholding(taxable) {
    let lower = 0;
    for (const [upper, fixed, rate] of bands) {
      if (taxable <= upper) {
        const excess = Math.max(0, taxable - lower);
        return { tax: fixed + excess * rate, lower, excess, fixed, rate };
      }
      lower = upper;
    }
    throw new RangeError('Taxable earnings must be finite.');
  }
  function breakpoints(employeeRate, periods) {
    return bands.slice(0, -1).map(([upper]) => Math.floor(upper * periods / (1 - employeeRate)));
  }
  return { bands, withholding, breakpoints };
});
