(function farmBudgetEngineModule(root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.FarmBudgetEngine = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function farmBudgetEngineFactory() {
  'use strict';

  var GENERIC_COSTS = {
    currency: 'USD', currencySymbol: '$',
    labor: { dailyWageRate: 5, manDaysPerHa_simplified: 90, familyLaborDiscount: 0.5 },
    mechanization: { tractorPloughing_perHa: 80 },
    agrochemicals: { herbicide_perHa: 30, pesticide_perHa: 20, fungicide_perHa: 15 },
    landCost: { rental_perHa_perSeason: 80 },
    transport: { farmToMarket_perTonne_perKm: 0.5 },
    finance: { averageInterestRate_percent: 15 }
  };
  function tableValue(table, countryCode, crop, fallback) {
    var country = table[countryCode] || table.default || {};
    var defaults = table.default || {};
    return country[crop] || defaults[crop] || fallback;
  }
  function calculate(input, references) {
    input = input || {};
    references = references || {};
    var data = references.data;
    var farmCosts = references.farmCosts || {};
    if (!data) return { ok: false, status: 'missing-data' };
    var countryCode = String(input.countryCode || '');
    var crops = Array.isArray(input.crops) ? input.crops.filter(function valid(crop) {
      return crop && data.seedRate[crop.crop] != null && Number(crop.area) > 0;
    }).map(function normalized(crop) {
      return { crop: String(crop.crop), area: Number(crop.area) };
    }) : [];
    if (!countryCode || !crops.length) return { ok: false, status: 'invalid-input' };
    var country = farmCosts[countryCode] || GENERIC_COSTS;
    var landMode = input.landMode || 'own';
    var laborMode = input.laborMode || 'hired';
    var mechanizationMode = input.mechanizationMode || 'manual';
    var financeMode = input.financeMode || 'cash';
    var startMonth = parseInt(input.startMonth, 10) || 1;
    var laborMultiplier = laborMode === 'family'
      ? country.labor.familyLaborDiscount
      : laborMode === 'mixed' ? ((1 + country.labor.familyLaborDiscount) / 2) : 1;
    var cropLines = [];
    var totals = {
      seed: 0, fertilizer: 0, chemicals: 0, labor: 0, mechanization: 0,
      land: 0, transport: 0, revenue: 0, area: 0
    };
    var fertilizerPrice = data.fertilizerPricePerKg[countryCode] || data.fertilizerPricePerKg.default;
    crops.forEach(function calculateCrop(item) {
      var crop = item.crop;
      var area = item.area;
      var plantingMultiplier = data.plantingMaterialCostPerHa[crop];
      var seedCost = plantingMultiplier
        ? plantingMultiplier * country.labor.dailyWageRate * area * 10
        : (data.seedRate[crop] || 20) * tableValue(data.seedPricePerKg, countryCode, crop, 200) * area;
      var fertilizerCost = (data.fertilizerRateKgHa[crop] || 100) * fertilizerPrice * area;
      var chemicalCost = (
        country.agrochemicals.herbicide_perHa
        + country.agrochemicals.pesticide_perHa
        + country.agrochemicals.fungicide_perHa
      ) * area;
      if (plantingMultiplier) chemicalCost *= 0.6;
      var laborCost = country.labor.dailyWageRate * country.labor.manDaysPerHa_simplified * area * laborMultiplier;
      var tractor = country.mechanization.tractorPloughing_perHa || country.labor.dailyWageRate * 5;
      var mechanizationCost = mechanizationMode === 'tractor'
        ? tractor * area
        : mechanizationMode === 'ox' ? tractor * 0.45 * area : 0;
      var rentOverride = parseFloat(input.rentOverride);
      var landCost = landMode === 'rent'
        ? (rentOverride > 0 ? rentOverride : (country.landCost.rental_perHa_perSeason || country.labor.dailyWageRate * 8)) * area
        : 0;
      var yieldTonnes = (data.yieldTonnesHa[crop] || 1.5) * area;
      var transportCost = country.transport.farmToMarket_perTonne_perKm * 20 * yieldTonnes;
      var marketPrice = tableValue(data.marketPricePerTonne, countryCode, crop, 1000);
      var revenue = yieldTonnes * marketPrice;
      var line = {
        crop: crop, area: area, seedCost: seedCost, fertilizerCost: fertilizerCost,
        chemicalCost: chemicalCost, laborCost: laborCost, mechanizationCost: mechanizationCost,
        landCost: landCost, transportCost: transportCost, revenue: revenue,
        yieldTonnes: yieldTonnes, marketPricePerTonne: marketPrice
      };
      cropLines.push(line);
      totals.area += area;
      totals.seed += seedCost;
      totals.fertilizer += fertilizerCost;
      totals.chemicals += chemicalCost;
      totals.labor += laborCost;
      totals.mechanization += mechanizationCost;
      totals.land += landCost;
      totals.transport += transportCost;
      totals.revenue += revenue;
    });
    var subtotal = totals.seed + totals.fertilizer + totals.chemicals + totals.labor
      + totals.mechanization + totals.land + totals.transport;
    var contingency = subtotal * 0.1;
    var loanInterest = 0;
    if (financeMode === 'loan') {
      var rate = parseFloat(input.loanRate) || country.finance.averageInterestRate_percent;
      var term = parseFloat(input.loanTerm) || 6;
      loanInterest = subtotal * (rate / 100) * (term / 12);
    }
    var totalBudget = subtotal + contingency + loanInterest;
    var profit = totals.revenue - totalBudget;
    var roi = totalBudget > 0 ? profit / totalBudget * 100 : 0;
    var cashflow = [
      totals.land + totals.mechanization + totals.seed * 0.5 + contingency * 0.5,
      totals.seed * 0.5 + totals.labor * 0.2,
      totals.fertilizer * 0.4 + totals.chemicals * 0.4 + totals.labor * 0.2,
      totals.fertilizer * 0.4 + totals.chemicals * 0.3 + totals.labor * 0.2,
      totals.chemicals * 0.3 + totals.labor * 0.15,
      totals.labor * 0.25 + totals.transport + contingency * 0.5 + loanInterest
    ];
    var averagePrice = crops.reduce(function sum(accumulator, crop) {
      return accumulator + tableValue(data.marketPricePerTonne, countryCode, crop.crop, 1000);
    }, 0) / crops.length;
    var breakEvenYield = averagePrice > 0 ? totalBudget / (averagePrice * totals.area) : 0;
    var scenarioDefinitions = [
      { id: 'yield-25-below', yieldFactor: 0.75, priceFactor: 1 },
      { id: 'price-20-below', yieldFactor: 1, priceFactor: 0.8 },
      { id: 'worst-case', yieldFactor: 0.75, priceFactor: 0.8 },
      { id: 'yield-20-above', yieldFactor: 1.2, priceFactor: 1 }
    ];
    return {
      ok: true,
      status: 'calculated',
      input: {
        countryCode: countryCode, crops: crops, landMode: landMode, laborMode: laborMode,
        mechanizationMode: mechanizationMode, financeMode: financeMode, startMonth: startMonth
      },
      currency: { code: country.currency, symbol: country.currencySymbol },
      cropLines: cropLines,
      totals: totals,
      subtotal: subtotal,
      contingency: contingency,
      loanInterest: loanInterest,
      totalBudget: totalBudget,
      profit: profit,
      roi: roi,
      costPerHectare: totalBudget / totals.area,
      cashflow: cashflow.map(function month(value, index) {
        return { monthIndex: (startMonth - 1 + index) % 12, value: value };
      }),
      averageMarketPricePerTonne: averagePrice,
      breakEvenYieldTonnesHa: breakEvenYield,
      breakEvenRevenuePerHa: breakEvenYield * averagePrice,
      scenarios: scenarioDefinitions.map(function scenario(definition) {
        var revenue = totals.revenue * definition.yieldFactor * definition.priceFactor;
        return {
          id: definition.id,
          yieldFactor: definition.yieldFactor,
          priceFactor: definition.priceFactor,
          revenue: revenue,
          profit: revenue - totalBudget
        };
      })
    };
  }
  return { calculate: calculate, GENERIC_COSTS: GENERIC_COSTS };
});
