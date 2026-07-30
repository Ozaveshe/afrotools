(function fertilizerCalcEngineModule(root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.FertilizerCalcEngine = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function fertilizerCalcEngineFactory() {
  'use strict';

  function calculate(input, data) {
    input = input || {};
    if (!data || !data.crops || !data.costs) return { ok: false, status: 'missing-data' };
    var cropId = String(input.cropId || '');
    var crop = data.crops[cropId];
    if (!crop) return { ok: false, status: 'unsupported-crop', cropId: cropId };
    var soil = String(input.soil || '');
    var soilMultiplier = data.soilMultipliers[soil];
    if (!Number.isFinite(soilMultiplier)) return { ok: false, status: 'unsupported-soil', soil: soil };
    var target = String(input.target || '');
    var nutrient = crop.npk[target];
    if (!nutrient) return { ok: false, status: 'unsupported-target', target: target };
    var currency = String(input.currency || '');
    var costs = data.costs[currency];
    if (!costs) return { ok: false, status: 'unsupported-currency', currency: currency };
    var parsedArea = parseFloat(input.area);
    var area = parsedArea || 1;
    var perHectare = {
      n: Math.round(nutrient[0] * soilMultiplier),
      p: Math.round(nutrient[1] * soilMultiplier),
      k: Math.round(nutrient[2] * soilMultiplier)
    };
    var totals = {
      n: Math.round(perHectare.n * area),
      p: Math.round(perHectare.p * area),
      k: Math.round(perHectare.k * area)
    };
    var bags = {
      urea: Math.ceil((totals.n / 0.46) / 50),
      dap: Math.ceil((totals.p / 0.46) / 50),
      mop: Math.ceil((totals.k / 0.60) / 50),
      npk15: Math.ceil(Math.max(totals.n, totals.p, totals.k) / 7.5)
    };
    var cost = {
      symbol: costs.symbol,
      urea: bags.urea * costs.urea,
      npk15: bags.npk15 * costs.npk15
    };
    cost.total = cost.urea + cost.npk15;
    var totalRatio = perHectare.n + perHectare.p + perHectare.k;
    return {
      ok: true,
      status: 'calculated',
      input: { cropId: cropId, area: area, soil: soil, target: target, currency: currency },
      crop: { id: cropId, name: crop.name, unit: crop.unit },
      perHectare: perHectare,
      totals: totals,
      bags: bags,
      cost: cost,
      subsidy: costs.subsidy,
      yieldEstimate: crop.yield[target] * area,
      schedule: crop.schedule.slice(),
      ratioPercent: {
        n: Math.round(perHectare.n / totalRatio * 100),
        p: Math.round(perHectare.p / totalRatio * 100),
        k: Math.round(perHectare.k / totalRatio * 100)
      },
      organicEquivalent: {
        cattleTonnes: Math.ceil(Math.max(totals.n / 5, totals.p / 2.5, totals.k / 5)),
        poultryTonnes: Math.ceil(Math.max(totals.n / 30, totals.p / 20, totals.k / 15))
      },
      microTip: data.microTips[cropId] || null
    };
  }

  return { calculate: calculate };
});
