(function pesticideDosageEngineModule(root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.PesticideDosageEngine = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function createPesticideDosageEngine() {
  'use strict';

  function positive(value) {
    var number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : 0;
  }

  function numberOr(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeRate(rate, unitLabel) {
    var numericRate = positive(rate);
    if (!numericRate) return null;
    if (unitLabel === 'mL/ha') {
      return { ratePerHa: numericRate / 1000, displayUnit: 'L', sourceUnit: unitLabel };
    }
    if (unitLabel === 'g/ha') {
      return { ratePerHa: numericRate / 1000, displayUnit: 'kg', sourceUnit: unitLabel };
    }
    return {
      ratePerHa: numericRate,
      displayUnit: String(unitLabel || '').replace('/ha', ''),
      sourceUnit: unitLabel,
    };
  }

  function calculateSpray(input, data) {
    var normalized = normalizeRate(input.rate, input.unitLabel);
    var areaHa = positive(input.areaHa);
    var sprayers = data && data.sprayers;
    var sprayer = sprayers && sprayers[input.sprayerKey];
    if (!normalized || !areaHa || !sprayer) {
      return { ok: false, status: 'invalid-input' };
    }
    var fallbackWater = input.sprayerDefaults && input.sprayerDefaults[input.sprayerKey]
      ? input.sprayerDefaults[input.sprayerKey].water
      : 0;
    var waterPerHa = positive(input.waterPerHa) || fallbackWater;
    if (!waterPerHa) return { ok: false, status: 'invalid-input' };
    var totalProduct = normalized.ratePerHa * areaHa;
    var totalWater = waterPerHa * areaHa;
    var tankLoads = Math.ceil(totalWater / sprayer.tankSize);
    var productPerTank = totalProduct / tankLoads;
    var price = positive(input.pricePerUnit);

    return {
      ok: true,
      status: 'calculated',
      kind: 'spray',
      sourceRate: positive(input.rate),
      sourceUnit: input.unitLabel,
      ratePerHa: normalized.ratePerHa,
      displayUnit: normalized.displayUnit,
      areaHa: areaHa,
      totalProduct: totalProduct,
      waterPerHa: waterPerHa,
      totalWater: totalWater,
      sprayerKey: input.sprayerKey,
      tankSize: sprayer.tankSize,
      tankLoads: tankLoads,
      productPerTank: productPerTank,
      pricePerUnit: price || null,
      totalCost: price ? totalProduct * price : null,
      currency: String(input.currency || 'USD'),
      reentryHours: numberOr(input.reentryHours, 24),
      preHarvestDays: numberOr(input.preHarvestDays, 7),
    };
  }

  function calculateSeedTreatment(input) {
    var rate = positive(input.rate);
    var seedKg = positive(input.seedKg);
    var unit = input.unit === 'mL' ? 'mL' : 'g';
    if (!rate || !seedKg) return { ok: false, status: 'invalid-input' };
    var totalProduct = rate * seedKg;
    return {
      ok: true,
      status: 'calculated',
      kind: 'seed-treatment',
      ratePerKg: rate,
      unit: unit,
      seedKg: seedKg,
      totalProduct: totalProduct,
      displayQuantity: totalProduct >= 1000 ? totalProduct / 1000 : totalProduct,
      displayUnit: totalProduct >= 1000 ? (unit === 'g' ? 'kg' : 'L') : unit,
      reentryHours: numberOr(input.reentryHours, 24),
      preHarvestDays: numberOr(input.preHarvestDays, 0),
    };
  }

  function calculate(input, data) {
    return input && input.kind === 'seed-treatment'
      ? calculateSeedTreatment(input)
      : calculateSpray(input || {}, data || {});
  }

  return {
    normalizeRate: normalizeRate,
    calculateSpray: calculateSpray,
    calculateSeedTreatment: calculateSeedTreatment,
    calculate: calculate,
  };
}));
