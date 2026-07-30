(function inputPricesEngineModule(root, factory) {
  'use strict';

  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.InputPricesEngine = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function inputPricesEngineFactory() {
  'use strict';

  var VALID_INPUT_TYPES = ['all', 'fertilizers', 'seeds', 'agrochemicals'];
  var VALID_PRICE_MODES = ['market', 'subsidized'];

  function finiteNumber(value) {
    var parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function selectedFertilizerPrice(fertilizer, priceMode) {
    return priceMode === 'subsidized' && fertilizer.subsidizedPrice
      ? fertilizer.subsidizedPrice
      : fertilizer.marketPrice;
  }

  function seedSortUnitPrice(seed, strategy) {
    if (strategy === 'legacy-post-division-fallback') {
      return seed.price / seed.bag_kg || seed.price;
    }
    return seed.price / (seed.bag_kg || 25);
  }

  function calculate(input, countryData, appRates, behavior) {
    input = input || {};
    behavior = behavior || {};
    appRates = appRates || {};

    if (!countryData) {
      return {
        ok: false,
        status: 'unknown-country',
        countryCode: input.countryCode || null,
      };
    }

    var inputType = VALID_INPUT_TYPES.indexOf(input.inputType) >= 0 ? input.inputType : 'all';
    var priceMode = VALID_PRICE_MODES.indexOf(input.priceMode) >= 0 ? input.priceMode : 'market';
    var farmSize = finiteNumber(input.farmSize) || 1;
    var requestedCrop = typeof input.crop === 'string' ? input.crop : '';
    var perKgDecimals = behavior.fertilizerPerKgDecimals === 0 ? 0 : 1;
    var seedSortStrategy = behavior.seedSortStrategy === 'legacy-post-division-fallback'
      ? 'legacy-post-division-fallback'
      : 'pack-fallback-25';

    var includeFertilizers = inputType === 'all' || inputType === 'fertilizers';
    var includeSeeds = inputType === 'all' || inputType === 'seeds';
    var includeAgrochemicals = inputType === 'all' || inputType === 'agrochemicals';

    var fertilizerRows = [];
    var fertilizerSubtotal = 0;
    var cheapestFertilizer = null;
    if (includeFertilizers) {
      fertilizerRows = (countryData.fertilizers || []).slice().sort(function sortFertilizers(a, b) {
        return selectedFertilizerPrice(a, priceMode) - selectedFertilizerPrice(b, priceMode);
      }).map(function mapFertilizer(fertilizer, index) {
        var price = selectedFertilizerPrice(fertilizer, priceMode);
        var rateKey = fertilizer.brand.split(' ')[0];
        var bagsPerHa = (appRates.fertilizer && appRates.fertilizer[rateKey]) || 3;
        var perHa = price * bagsPerHa;
        var row = {
          brand: fertilizer.brand,
          supplier: fertilizer.supplier,
          bagKg: fertilizer.bag_kg,
          marketPrice: fertilizer.marketPrice,
          subsidizedPrice: fertilizer.subsidizedPrice || null,
          selectedPrice: price,
          selectedPriceMode: priceMode === 'subsidized' && fertilizer.subsidizedPrice ? 'subsidized' : 'market',
          perKg: Number((price / fertilizer.bag_kg).toFixed(perKgDecimals)),
          perKgDecimals: perKgDecimals,
          applicationRateKey: rateKey,
          bagsPerHa: bagsPerHa,
          perHa: perHa,
          isCheapest: index === 0,
        };
        if (index === 0) {
          cheapestFertilizer = row;
          fertilizerSubtotal = perHa * farmSize;
        }
        return row;
      });
    }

    var allSeeds = countryData.seeds || [];
    var filteredSeeds = allSeeds.filter(function filterSeed(seed) {
      return !requestedCrop || seed.crop === requestedCrop;
    });
    var usedSeedFallback = includeSeeds && filteredSeeds.length === 0;
    if (usedSeedFallback) filteredSeeds = allSeeds;

    var seedRows = [];
    var seedSubtotal = 0;
    var cheapestSeed = null;
    if (includeSeeds) {
      seedRows = filteredSeeds.slice().sort(function sortSeeds(a, b) {
        return seedSortUnitPrice(a, seedSortStrategy) - seedSortUnitPrice(b, seedSortStrategy);
      }).map(function mapSeed(seed, index) {
        var rateKgPerHa = (appRates.seeds && appRates.seeds[seed.crop]) || 30;
        var quantity = Math.ceil(rateKgPerHa * farmSize / (seed.bag_kg || 25));
        var row = {
          crop: seed.crop,
          brand: seed.brand,
          supplier: seed.supplier,
          bagKg: seed.bag_kg == null ? null : seed.bag_kg,
          unit: seed.unit || null,
          price: seed.price,
          type: seed.type || null,
          notes: seed.notes || null,
          sortUnitPrice: seedSortUnitPrice(seed, seedSortStrategy),
          rateKgPerHa: rateKgPerHa,
          quantity: quantity,
          total: seed.price * quantity,
          isCheapest: index === 0,
        };
        if (index === 0) {
          cheapestSeed = row;
          seedSubtotal = row.total;
        }
        return row;
      });
    }

    var groupedAgrochemicals = [];
    var agrochemicalSubtotal = 0;
    var cheapestAgrochemical = null;
    if (includeAgrochemicals) {
      var sortedChemicals = (countryData.agrochemicals || []).slice().sort(function sortChemicals(a, b) {
        return a.price - b.price;
      });
      var byType = {};
      sortedChemicals.forEach(function groupChemical(chemical) {
        if (!byType[chemical.type]) byType[chemical.type] = [];
        byType[chemical.type].push(chemical);
      });
      var first = true;
      Object.keys(byType).forEach(function mapChemicalGroup(type) {
        var rows = byType[type].map(function mapChemical(chemical, index) {
          var row = {
            type: chemical.type,
            brand: chemical.brand,
            size: chemical.size,
            price: chemical.price,
            quantity: farmSize,
            total: chemical.price * farmSize,
            isCheapestInType: index === 0,
            isBudgetSelection: first && index === 0,
          };
          if (row.isBudgetSelection) {
            cheapestAgrochemical = row;
            agrochemicalSubtotal = row.total;
            first = false;
          }
          return row;
        });
        groupedAgrochemicals.push({ type: type, rows: rows });
      });
    }

    var total = fertilizerSubtotal + seedSubtotal + agrochemicalSubtotal;
    var premium = total * 1.35;

    return {
      ok: true,
      status: 'calculated',
      countryCode: input.countryCode || null,
      countryName: countryData.name || null,
      currency: countryData.currency || null,
      symbol: countryData.symbol || null,
      input: {
        inputType: inputType,
        crop: requestedCrop,
        farmSize: farmSize,
        priceMode: priceMode,
      },
      behavior: {
        fertilizerPerKgDecimals: perKgDecimals,
        seedSortStrategy: seedSortStrategy,
      },
      visibility: {
        fertilizers: includeFertilizers,
        seeds: includeSeeds,
        agrochemicals: includeAgrochemicals,
      },
      fertilizers: {
        rows: fertilizerRows,
        cheapest: cheapestFertilizer,
        subtotal: fertilizerSubtotal,
      },
      seeds: {
        requestedCrop: requestedCrop,
        usedFallback: usedSeedFallback,
        fallbackStatus: usedSeedFallback ? 'unsupported-crop-showing-all' : 'matched-or-all',
        rows: seedRows,
        cheapest: cheapestSeed,
        subtotal: seedSubtotal,
      },
      agrochemicals: {
        groups: groupedAgrochemicals,
        cheapest: cheapestAgrochemical,
        subtotal: agrochemicalSubtotal,
      },
      budget: {
        fertilizerSubtotal: fertilizerSubtotal,
        seedSubtotal: seedSubtotal,
        agrochemicalSubtotal: agrochemicalSubtotal,
        total: total,
        premium: premium,
        savings: premium - total,
        premiumRate: 0.35,
      },
      subsidyProgram: countryData.subsidyProgram || null,
    };
  }

  return {
    calculate: calculate,
    selectedFertilizerPrice: selectedFertilizerPrice,
    seedSortUnitPrice: seedSortUnitPrice,
  };
});
