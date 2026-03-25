// /engines/seed-rate-engine.js
// Seed Rate Calculator Engine — AfroTools Agriculture Suite
// Supports 20+ crops, 54 African countries. Handles both seed and vegetative crops.
!function(){"use strict";

var GERMINATION_RATES = {
  certified: 0.90,
  improved: 0.78,
  local: 0.68,
  old: 0.50
};

var FIELD_EST_FACTORS = {
  excellent: 0.90,
  good: 0.80,
  average: 0.70,
  poor: 0.60,
  harsh: 0.50
};

var INTERCROP_FACTORS = {
  sole: 1.0,
  primary: 0.75,
  secondary: 0.50
};

// Typical germination + field factor assumed when deriving typical seed rates
var BASE_GERM = 0.80;
var BASE_FIELD = 0.70;

function r2(n) { return Math.round(n * 100) / 100; }
function r1(n) { return Math.round(n * 10) / 10; }
function ri(n) { return Math.round(n); }

var ENG = {

  /**
   * Main calculate function
   * @param {Object} inputs - User form values
   * @param {Object} seedData - window.AfroTools.seedData
   * @param {string} countryCode - 2-letter ISO code (e.g. "NG")
   * @param {Object} countryData - window.AfroTools.countryData (for pricing)
   * @returns {Object} result
   */
  calculate: function(inputs, seedData, countryCode, countryData) {
    var cropId = inputs.cropId;
    if (!cropId) return { error: true, message: 'Please select a crop.' };

    var cropData = seedData[cropId];
    if (!cropData) return { error: true, message: 'Crop not found in seed database.' };

    var germRate   = GERMINATION_RATES[inputs.seedQuality] || GERMINATION_RATES.improved;
    var fieldFactor = FIELD_EST_FACTORS[inputs.fieldConditions] || FIELD_EST_FACTORS.average;
    var intercropFactor = INTERCROP_FACTORS[inputs.intercrop] || 1.0;
    var farmSizeHa = parseFloat(inputs.farmSizeHa) || 1;

    // Country override
    var override = (cropData.countryOverrides && cropData.countryOverrides[countryCode]) || {};

    var base = {
      cropId: cropId,
      germRate: germRate,
      germRatePct: ri(germRate * 100),
      fieldFactor: fieldFactor,
      fieldFactorPct: ri(fieldFactor * 100),
      intercropFactor: intercropFactor,
      farmSizeHa: farmSizeHa,
      countryCode: countryCode,
      overrideNotes: override.notes || null
    };

    if (cropData.propagation === 'vegetative') {
      return this._vegetative(cropData, override, inputs, base);
    }
    return this._seed(cropData, override, inputs, base, germRate, fieldFactor, intercropFactor, farmSizeHa, countryCode, seedData, countryData);
  },

  _seed: function(cropData, override, inputs, base, germRate, fieldFactor, intercropFactor, farmSizeHa, countryCode, seedData, countryData) {
    // Determine planting method
    var method = inputs.plantingMethod ||
                 override.method ||
                 (cropData.plantingMethod && cropData.plantingMethod[0]) ||
                 'drilling';
    var isBroadcast = (method === 'broadcasting' || method === 'direct_seeding_broadcast');

    // Spacing
    var defaultSpacing = override.spacing || cropData.defaultSpacing || {};
    var rowCm   = parseFloat(inputs.rowSpacing_cm)   || (defaultSpacing.row_cm   ? parseFloat(defaultSpacing.row_cm) : 75);
    var plantCm = parseFloat(inputs.plantSpacing_cm) || (defaultSpacing.plant_cm && defaultSpacing.plant_cm !== 'continuous' ? parseFloat(defaultSpacing.plant_cm) : 10);
    var seedsPerHole = parseInt(inputs.seedsPerHole) || override.seedsPerHole || cropData.seedsPerHole || 1;

    var rowM   = rowCm / 100;
    var plantM = plantCm / 100;
    var targetPopHa = ri(10000 / (rowM * plantM));

    var seedRateKgHa;

    if (override.seedRate) {
      // Country-specific calibrated rate at standard conditions (BASE_GERM=0.80, BASE_FIELD=0.70).
      // Adjust proportionally for actual seed quality and field conditions.
      seedRateKgHa = override.seedRate * (BASE_GERM / germRate) * (BASE_FIELD / fieldFactor);
      if (isBroadcast) targetPopHa = null; // N/A for broadcast
    } else if (isBroadcast && cropData.typicalSeedRate) {
      // For broadcast crops without override: derive from typical seed rate midpoint
      var tr = cropData.typicalSeedRate;
      var typicalRate;
      if (tr.broadcast) typicalRate = (tr.broadcast.min + tr.broadcast.max) / 2;
      else if (tr.min !== undefined) typicalRate = (tr.min + tr.max) / 2;
      if (typicalRate) {
        seedRateKgHa = typicalRate * (BASE_GERM * BASE_FIELD) / (germRate * fieldFactor);
      }
      targetPopHa = null; // N/A for broadcast
    }

    if (!seedRateKgHa) {
      // Fallback formula: theoretical from spacing + seed weight + germination/field factors
      var sw = cropData.seedWeightPer1000 || 100;
      seedRateKgHa = (targetPopHa * sw) / (1000000 * germRate * fieldFactor);
    }

    // Apply intercrop adjustment
    var adjSeedRateKgHa = seedRateKgHa * intercropFactor;
    var totalSeedKg     = adjSeedRateKgHa * farmSizeHa;

    var bagSize = override.bagSize_kg || cropData.bagSize_kg || 25;
    var numBags = Math.ceil(totalSeedKg / bagSize);

    // Pricing
    var pricing = seedData.seedPricing && seedData.seedPricing[countryCode];
    var cropId = base.cropId;
    var pricingKey = cropId;
    var pricePerKg = pricing && pricing[pricingKey];
    var currSym = (countryData && countryData.currencySymbol) || '';

    var costCertified = null, costFarmSaved = null, costSavings = null;
    if (pricePerKg) {
      costCertified = ri(totalSeedKg * pricePerKg);
      costFarmSaved = ri(totalSeedKg * pricePerKg * 0.45); // farm-saved ≈ 45% of certified price
      costSavings   = costCertified - costFarmSaved;
    }

    return Object.assign({}, base, {
      propagation: 'seed',
      plantingMethod: method,
      isBroadcast: isBroadcast,
      rowSpacing_cm: rowCm,
      plantSpacing_cm: plantCm,
      seedsPerHole: seedsPerHole,
      targetPopHa: targetPopHa,
      targetPopm2: targetPopHa ? r1(targetPopHa / 10000) : null,
      seedRateKgHa: r1(adjSeedRateKgHa),
      seedRateKgHaBase: r1(seedRateKgHa),
      totalSeedKg: r1(totalSeedKg),
      bagSize_kg: bagSize,
      numBags: numBags,
      daysToEmergence: cropData.daysToEmergence || null,
      shelfLife_months: cropData.shelfLife_months || null,
      storageNotes: cropData.storageNotes || null,
      notes: cropData.notes || null,
      costCertified: costCertified,
      costFarmSaved: costFarmSaved,
      costSavings: costSavings,
      currency: (countryData && countryData.currency) || '',
      currencySymbol: currSym,
      pricePerKg: pricePerKg || null
    });
  },

  _vegetative: function(cropData, override, inputs, base) {
    var farmSizeHa = base.farmSizeHa;

    var defaultSpacing = override.spacing || cropData.defaultSpacing || {};
    var rowCm   = parseFloat(inputs.rowSpacing_cm)   || (defaultSpacing.row_cm   ? parseFloat(defaultSpacing.row_cm) : 100);
    var plantCm = parseFloat(inputs.plantSpacing_cm) || (defaultSpacing.plant_cm ? parseFloat(defaultSpacing.plant_cm) : 100);

    var plantsPerHa;
    if (override.plantsPerHa) {
      plantsPerHa = override.plantsPerHa;
    } else if (cropData.plantsPerHa) {
      plantsPerHa = Math.round((cropData.plantsPerHa.min + cropData.plantsPerHa.max) / 2);
    } else if (rowCm && plantCm) {
      plantsPerHa = ri(10000 / (rowCm / 100 * plantCm / 100));
    } else {
      plantsPerHa = 10000;
    }

    var totalPlants = ri(plantsPerHa * farmSizeHa);
    var spacingArea_m2 = r1(rowCm / 100 * plantCm / 100);

    // Material weight for tuber crops
    var materialWeight = null;
    var matLabel = override.materialLabel || cropData.materialLabel || 'plants';

    if (cropData.seedYamPerHa_kg) {
      var ratePerHa = override.seedYamPerHa_kg || ((cropData.seedYamPerHa_kg.min + cropData.seedYamPerHa_kg.max) / 2);
      materialWeight = { perHa: ri(ratePerHa), total: ri(ratePerHa * farmSizeHa), unit: 'kg' };
    } else if (cropData.seedTubersPerHa_kg) {
      var ratePerHa2 = override.seedTubersPerHa_kg || ((cropData.seedTubersPerHa_kg.min + cropData.seedTubersPerHa_kg.max) / 2);
      materialWeight = { perHa: ri(ratePerHa2), total: ri(ratePerHa2 * farmSizeHa), unit: 'kg' };
    } else if (cropData.settsPerHa) {
      var settsPerHa = (cropData.settsPerHa.min + cropData.settsPerHa.max) / 2;
      materialWeight = { perHa: ri(settsPerHa), total: ri(settsPerHa * farmSizeHa), unit: 'setts' };
    }

    return Object.assign({}, base, {
      propagation: 'vegetative',
      plantingMaterial: cropData.plantingMaterial,
      materialLabel: matLabel,
      rowSpacing_cm: rowCm,
      plantSpacing_cm: plantCm,
      spacingArea_m2: spacingArea_m2,
      plantsPerHa: plantsPerHa,
      totalPlants: totalPlants,
      materialWeight: materialWeight,
      notes: cropData.notes || null
    });
  },

  // Format a number with locale separators
  fmtN: function(n, decimals) {
    if (typeof n !== 'number' || isNaN(n)) return '—';
    return n.toLocaleString(undefined, { maximumFractionDigits: decimals !== undefined ? decimals : 1 });
  }

};

window.AfroTools = window.AfroTools || {};
window.AfroTools.SeedRateEngine = ENG;

}();
