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

  function own(object, key) { return Object.prototype.hasOwnProperty.call(object, key); }
  function finiteTree(value) {
    if (typeof value === 'number') return Number.isFinite(value);
    return !value || typeof value !== 'object' || Object.keys(value).every(function(key) { return finiteTree(value[key]); });
  }

  function productPlan(id, products, target, prices) {
    var supplied = { n: 0, p: 0, k: 0 };
    var purchaseSupply = { n: 0, p: 0, k: 0 };
    var totalCost = 0, completePrice = true;
    products.forEach(function(product) {
      product.bagWeightKg = 50;
      product.purchaseBags = Math.ceil(product.applicationKg / 50);
      product.purchaseKg = product.purchaseBags * 50;
      product.remainingKg = Math.max(0, product.purchaseKg - product.applicationKg);
      ['n', 'p', 'k'].forEach(function(key, index) {
        supplied[key] += product.applicationKg * product.grade[index] / 100;
        purchaseSupply[key] += product.purchaseKg * product.grade[index] / 100;
      });
      var price = prices[product.id];
      product.bagPrice = typeof price === 'number' && Number.isFinite(price) && price >= 0 ? price : null;
      product.purchaseCost = product.purchaseBags === 0 ? 0 : product.bagPrice === null ? null : product.purchaseBags * product.bagPrice;
      if (product.purchaseCost === null) completePrice = false;
      else totalCost += product.purchaseCost;
    });
    return { id: id, nutrientBasis: ['N', 'P2O5', 'K2O'], products: products, applicationSupply: supplied,
      purchaseSupply: purchaseSupply, excess: { n: Math.max(0, supplied.n - target.n), p: Math.max(0, supplied.p - target.p), k: Math.max(0, supplied.k - target.k) },
      purchaseCost: completePrice ? totalCost : null, priceComplete: completePrice,
      priceStatus: 'undated-example-prices', applicationStatus: 'mathematical-scenario-requires-local-review' };
  }

  function productPlans(target, prices) {
    var npkKg = Math.max(target.p, target.k) / 0.15;
    var dapKg = target.p / 0.46;
    return {
      compound: productPlan('npk15-plus-urea', [
        { id: 'npk15', grade: [15, 15, 15], applicationKg: npkKg },
        { id: 'urea', grade: [46, 0, 0], applicationKg: Math.max(0, target.n - npkKg * 0.15) / 0.46 }
      ], target, prices),
      separate: productPlan('dap-mop-plus-urea', [
        { id: 'dap', grade: [18, 46, 0], applicationKg: dapKg },
        { id: 'mop', grade: [0, 0, 60], applicationKg: target.k / 0.60 },
        { id: 'urea', grade: [46, 0, 0], applicationKg: Math.max(0, target.n - dapKg * 0.18) / 0.46 }
      ], target, prices)
    };
  }

  function priceQuote(value, currency) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || value.currency !== currency) return null;
    if (typeof value.source !== 'string' || !value.source.trim() || value.source.length > 300) return null;
    if (typeof value.observedOn !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value.observedOn)) return null;
    var date = new Date(value.observedOn + 'T00:00:00Z');
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value.observedOn) return null;
    var prices = value.prices;
    if (!prices || typeof prices !== 'object' || Array.isArray(prices) || !Object.keys(prices).length) return null;
    var keys = ['urea', 'npk15', 'dap', 'mop'];
    if (!Object.keys(prices).every(function(key) { return keys.indexOf(key) >= 0 && typeof prices[key] === 'number' && Number.isFinite(prices[key]) && prices[key] >= 0; })) return null;
    var copy = {};
    keys.forEach(function(key) { if (own(prices, key)) copy[key] = prices[key]; });
    return { prices: copy, currency: currency, source: value.source.trim(), observedOn: value.observedOn, status: 'user-provided-unverified' };
  }

  function calculate(input, data) {
    input = input || {};
    if (!data || !data.crops || !data.costs || !data.soilMultipliers || !data.microTips) return { ok: false, status: 'missing-data' };
    var cropId = typeof input.cropId === 'string' ? input.cropId : '';
    var crop = own(data.crops, cropId) ? data.crops[cropId] : null;
    if (!crop) return { ok: false, status: 'unsupported-crop', cropId: cropId };
    var soil = typeof input.soil === 'string' ? input.soil : '';
    var soilMultiplier = data.soilMultipliers[soil];
    if (!Number.isFinite(soilMultiplier)) return { ok: false, status: 'unsupported-soil', soil: soil };
    var target = typeof input.target === 'string' ? input.target : '';
    var nutrient = own(crop.npk, target) ? crop.npk[target] : null;
    if (!nutrient) return { ok: false, status: 'unsupported-target', target: target };
    var currency = typeof input.currency === 'string' ? input.currency : '';
    var costs = own(data.costs, currency) ? data.costs[currency] : null;
    if (!costs) return { ok: false, status: 'unsupported-currency', currency: currency };
    var suppliedArea = input.area === undefined ? 1 : input.area;
    var numericText = typeof suppliedArea === 'string' && /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(suppliedArea.trim());
    if (typeof suppliedArea !== 'number' && !numericText) return { ok: false, status: 'invalid-area' };
    var area = Number(suppliedArea);
    if (!Number.isFinite(area) || area <= 0) return { ok: false, status: 'invalid-area' };
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
    var quote = input.priceQuote === undefined ? null : priceQuote(input.priceQuote, currency);
    if (input.priceQuote !== undefined && !quote) return { ok: false, status: 'invalid-price-quote' };
    var plans = productPlans(totals, quote ? quote.prices : costs);
    if (quote) Object.keys(plans).forEach(function(key) {
      plans[key].priceStatus = quote.status;
      plans[key].priceProvenance = { source: quote.source, observedOn: quote.observedOn, currency: quote.currency };
    });
    var bags = {
      urea: plans.compound.products[1].purchaseBags,
      npk15: plans.compound.products[0].purchaseBags,
      dap: plans.separate.products[0].purchaseBags,
      mop: plans.separate.products[1].purchaseBags
    };
    var cost = { symbol: costs.symbol, urea: plans.compound.products[1].purchaseCost,
      npk15: plans.compound.products[0].purchaseCost, total: plans.compound.purchaseCost,
      planId: plans.compound.id, priceStatus: plans.compound.priceStatus };
    var totalRatio = perHectare.n + perHectare.p + perHectare.k;
    var result = {
      ok: true,
      status: 'calculated',
      input: { cropId: cropId, area: area, soil: soil, target: target, currency: currency },
      crop: { id: cropId, name: crop.name, unit: crop.unit },
      perHectare: perHectare,
      totals: totals,
      bags: bags,
      productPlans: plans,
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
    // The legacy banana timetable allocates125% of K; retain quantity calculations,
    // but do not publish that timetable until a sourced replacement is reviewed.
    if (cropId === 'banana') {
      result.schedule = ['Banana application schedule is under review. Do not use the previous timetable; confirm timing and nutrient splits with a local agronomist.'];
      result.scheduleReview = { status: 'needs-review', issue: 'banana-potassium-overallocation' };
    }
    if (quote) result.input.priceQuote = { prices: quote.prices, currency: quote.currency, source: quote.source, observedOn: quote.observedOn };
    if (!finiteTree(result)) return { ok: false, status: 'out-of-range' };
    return result;
  }

  return { calculate: calculate };
});
