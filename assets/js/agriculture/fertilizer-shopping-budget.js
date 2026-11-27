/* Whole-bag purchase estimates for country fertilizer catalogues. */
(function () {
  'use strict';
  const grades = ['N', 'P2O5', 'K2O'];

  function budget(result, catalogue) {
    const target = [result.totalNPK.N, result.totalNPK.P, result.totalNPK.K];
    const items = catalogue.filter(p => p.composition && p.bagSize_kg > 0 &&
      Number.isFinite(p.pricePerBag) && p.pricePerBag >= 0 &&
      grades.some(key => p.composition[key] > 0));
    const weights = items.map(p => grades.map(key => p.bagSize_kg * (p.composition[key] || 0) / 100));
    const initial = items.map(p => result.products.find(line => line.name === p.name)?.bags || 0);
    const totals = counts => grades.map((_, j) => counts.reduce((sum, n, i) => sum + n * weights[i][j], 0));
    const original = totals(initial);
    // Limit surplus to the existing estimate or rounding up one available bag.
    // A zero target permits no new surplus for that nutrient.
    const caps = target.map((need, j) => Math.max(original[j], need + (need ? Math.max(0, ...weights.map(w => w[j])) : 0)));
    function score(counts) {
      const amounts = totals(counts);
      const deficit = amounts.reduce((sum, n, j) => sum + Math.max(0, target[j] - n) / Math.max(target[j], 1), 0);
      const excess = amounts.reduce((sum, n, j) => sum + Math.max(0, n - target[j]) / Math.max(target[j], 1), 0);
      return [deficit, excess, counts.reduce((sum, n, i) => sum + n * items[i].pricePerBag, 0)];
    }
    function better(left, right) {
      for (let j = 0; j < left.length; j++) {
        if (Math.abs(left[j] - right[j]) > 1e-8) return left[j] < right[j];
      }
      return false;
    }
    let best = initial.slice(), bestScore = score(best);
    // Start with the original mix and each catalogue product in first position.
    // Trial counts occur at target and surplus-limit boundaries; runtime is independent of hectares.
    function refine(seed, first) {
      const counts = seed.slice();
      const order = items.map((_, i) => (first + i) % items.length);
      for (let pass = 0; pass < 10; pass++) {
        let changed = false;
        for (const i of order) {
          const old = counts[i];
          counts[i] = 0;
          const base = totals(counts), options = new Set([0, old]);
          let limit = Infinity;
          weights[i].forEach((kg, j) => {
            if (!kg) return;
            const bags = (target[j] - base[j]) / kg;
            options.add(Math.max(0, Math.floor(bags)));
            options.add(Math.max(0, Math.ceil(bags)));
            limit = Math.min(limit, Math.max(0, Math.floor((caps[j] - base[j] + 1e-8) / kg)));
          });
          options.add(limit);
          let selected = old;
          counts[i] = old;
          let selectedScore = score(counts);
          for (const n of options) {
            if (!Number.isSafeInteger(n) || n > limit) continue;
            counts[i] = n;
            const value = score(counts);
            if (better(value, selectedScore)) { selected = n; selectedScore = value; }
          }
          counts[i] = selected;
          changed ||= selected !== old;
        }
        const amounts = totals(counts), value = score(counts);
        if (amounts.every((n, j) => n + 1e-8 >= Math.min(original[j], target[j]) && n <= caps[j] + 1e-8) && better(value, bestScore)) {
          best = counts.slice();
          bestScore = value;
        }
        if (!changed) break;
      }
    }
    refine(initial, 0);
    items.forEach((_, i) => refine(items.map(() => 0), i));
    const products = items.flatMap((product, i) => {
      const bags = best[i], subsidyPrice = product.subsidyPrice ?? product.pricePerBag;
      return bags ? [{ ...product, bags, subsidyPrice, totalCostMarket: bags * product.pricePerBag, totalCostSubsidy: bags * subsidyPrice }] : [];
    });
    const costMarket = products.reduce((sum, p) => sum + p.totalCostMarket, 0);
    const costSubsidy = result.costSubsidy === null ? null : products.reduce((sum, p) => sum + p.totalCostSubsidy, 0);
    return { ...result, products, costMarket, costSubsidy, costPerHaMarket: Math.round(costMarket / result.farmSizeHa),
      costPerHaSubsidy: costSubsidy === null ? null : Math.round(costSubsidy / result.farmSizeHa),
      savings: costSubsidy === null ? 0 : costMarket - costSubsidy };
  }
  if (typeof module === 'object' && module.exports) module.exports = budget;
  else window.AfroTools.fertilizerShoppingBudget = budget;
})();
