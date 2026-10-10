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
  function owns(object,key) { return !!object && typeof key === 'string' && Object.prototype.hasOwnProperty.call(object,key); }
  function finiteTree(value) { if(typeof value === 'number')return Number.isFinite(value);if(value && typeof value === 'object')return Object.keys(value).every(function(k){return finiteTree(value[k]);});return true; }
  function calculate(input, references) {
    if(!input || typeof input !== 'object' || Array.isArray(input))return {ok:false,status:'invalid-input'};
    references = references || {};
    var data = references.data;
    var farmCosts = references.farmCosts || {};
    if (!data) return { ok: false, status: 'missing-data' };
    var countryCode = input.countryCode;
    if(countryCode===undefined||countryCode==='')return {ok:false,status:'invalid-input'};
    if(!owns(farmCosts,countryCode))return {ok:false,status:'unknown-country'};
    if(!Array.isArray(input.crops)||!input.crops.length||input.crops.some(function(c){return !c || typeof c!=='object' || !owns(data.seedRate,c.crop) || !Number.isFinite(c.area) || c.area<=0;}))return {ok:false,status:'invalid-crops'};
    var crops=input.crops.map(function(c){var row={crop:c.crop,area:c.area};['seedPricePerKg','marketPricePerTonne'].forEach(function(k){if(c[k]!==undefined)row[k]=c[k];});return row;});
    var country=farmCosts[countryCode];
    var hasQuotes=input.fertilizerPricePerKg!==undefined||crops.some(function(c){return c.seedPricePerKg!==undefined||c.marketPricePerTonne!==undefined;});
    if(hasQuotes&&input.priceCurrency!==country.currency)return {ok:false,status:'quote-currency-mismatch',currency:country.currency};
    if(input.fertilizerPricePerKg!==undefined&&(!Number.isFinite(input.fertilizerPricePerKg)||input.fertilizerPricePerKg<0))return {ok:false,status:'invalid-price'};
    if(crops.some(function(c){return ['seedPricePerKg','marketPricePerTonne'].some(function(k){return c[k]!==undefined&&(!Number.isFinite(c[k])||c[k]<0||(k==='marketPricePerTonne'&&c[k]===0));});}))return {ok:false,status:'invalid-price'};
    function referencePrice(table,crop){var t=owns(table,countryCode)?table[countryCode]:null;return owns(t,crop)&&Number.isFinite(t[crop])?t[crop]:undefined;}
    var missingPrices=[];
    crops.forEach(function(c,index){if(!data.plantingMaterialCostPerHa[c.crop]&&c.seedPricePerKg===undefined&&referencePrice(data.seedPricePerKg,c.crop)===undefined)missingPrices.push({cropIndex:index,field:'seedPricePerKg'});if(c.marketPricePerTonne===undefined&&referencePrice(data.marketPricePerTonne,c.crop)===undefined)missingPrices.push({cropIndex:index,field:'marketPricePerTonne'});});
    var countryFertilizerPrice=owns(data.fertilizerPricePerKg,countryCode)?data.fertilizerPricePerKg[countryCode]:undefined;
    if(input.fertilizerPricePerKg===undefined&&!Number.isFinite(countryFertilizerPrice))missingPrices.push({field:'fertilizerPricePerKg'});
    if(missingPrices.length)return {ok:false,status:'needs-local-prices',currency:country.currency,missingPrices:missingPrices};
    var landMode=input.landMode===undefined?'own':input.landMode;
    var laborMode=input.laborMode===undefined?'hired':input.laborMode;
    var mechanizationMode=input.mechanizationMode===undefined?'manual':input.mechanizationMode;
    var financeMode=input.financeMode===undefined?'cash':input.financeMode;
    var startMonth=input.startMonth===undefined?1:input.startMonth;
    if(['own','rent','communal'].indexOf(landMode)<0||['hired','family','mixed'].indexOf(laborMode)<0||['manual','tractor','ox'].indexOf(mechanizationMode)<0||['cash','loan'].indexOf(financeMode)<0||!Number.isInteger(startMonth)||startMonth<1||startMonth>12)return {ok:false,status:'invalid-input'};
    if(['rentOverride','loanRate','loanTerm'].some(function(k){return input[k]!==undefined&&(!Number.isFinite(input[k])||input[k]<0||(k==='loanTerm'&&input[k]<=0));}))return {ok:false,status:'invalid-input'};
    var laborMultiplier = laborMode === 'family'
      ? country.labor.familyLaborDiscount
      : laborMode === 'mixed' ? ((1 + country.labor.familyLaborDiscount) / 2) : 1;
    var cropLines = [];
    var totals = {
      seed: 0, fertilizer: 0, chemicals: 0, labor: 0, mechanization: 0,
      land: 0, transport: 0, revenue: 0, area: 0
    };
    var fertilizerPrice = input.fertilizerPricePerKg === undefined ? countryFertilizerPrice : input.fertilizerPricePerKg;
    crops.forEach(function calculateCrop(item) {
      var crop = item.crop;
      var area = item.area;
      var plantingMultiplier = data.plantingMaterialCostPerHa[crop];
      var seedCost = plantingMultiplier
        ? plantingMultiplier * country.labor.dailyWageRate * area * 10
        : (data.seedRate[crop] || 20) * (item.seedPricePerKg === undefined ? referencePrice(data.seedPricePerKg,crop) : item.seedPricePerKg) * area;
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
      var rentOverride = input.rentOverride;
      var landCost = landMode === 'rent'
        ? (rentOverride !== undefined ? rentOverride : (country.landCost.rental_perHa_perSeason || country.labor.dailyWageRate * 8)) * area
        : 0;
      var yieldTonnes = (data.yieldTonnesHa[crop] || 1.5) * area;
      var transportCost = country.transport.farmToMarket_perTonne_perKm * 20 * yieldTonnes;
      var marketPrice = item.marketPricePerTonne === undefined ? referencePrice(data.marketPricePerTonne,crop) : item.marketPricePerTonne;
      var revenue = yieldTonnes * marketPrice;
      var line = {
        crop: crop, area: area, seedCost: seedCost, fertilizerCost: fertilizerCost,
        chemicalCost: chemicalCost, laborCost: laborCost, mechanizationCost: mechanizationCost,
        landCost: landCost, transportCost: transportCost, revenue: revenue,
        yieldTonnes: yieldTonnes, marketPricePerTonne: marketPrice,
        priceSources: {seed:plantingMultiplier?'static-planting-material-model':item.seedPricePerKg===undefined?'static-country-reference':'user-entered',market:item.marketPricePerTonne===undefined?'static-country-reference':'user-entered'}
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
      var rate = input.loanRate === undefined ? country.finance.averageInterestRate_percent : input.loanRate;
      var term = input.loanTerm === undefined ? 6 : input.loanTerm;
      loanInterest = subtotal * (rate / 100) * (term / 12);
    }
    var totalBudget = subtotal + contingency + loanInterest;
    var profit = totals.revenue - totalBudget;
    var roi = totalBudget > 0 ? profit / totalBudget * 100 : 0;
    // Planning cash allocation, not an agronomic application schedule: split the
    // full fertilizer budget equally between the two existing payment months.
    var cashflow = [
      totals.land + totals.mechanization + totals.seed * 0.5 + contingency * 0.5,
      totals.seed * 0.5 + totals.labor * 0.2,
      totals.fertilizer * 0.5 + totals.chemicals * 0.4 + totals.labor * 0.2,
      totals.fertilizer * 0.5 + totals.chemicals * 0.3 + totals.labor * 0.2,
      totals.chemicals * 0.3 + totals.labor * 0.15,
      totals.labor * 0.25 + totals.transport + contingency * 0.5 + loanInterest
    ];
    // Revenue per tonne of the modeled crop mix. Splitting one crop into
    // multiple rows must not change the break-even threshold.
    var totalYieldTonnes = cropLines.reduce(function(sum,line){return sum+line.yieldTonnes;},0);
    var averagePrice = totals.revenue / totalYieldTonnes;
    var breakEvenYield = averagePrice > 0 ? totalBudget / (averagePrice * totals.area) : 0;
    var scenarioDefinitions = [
      { id: 'yield-25-below', yieldFactor: 0.75, priceFactor: 1 },
      { id: 'price-20-below', yieldFactor: 1, priceFactor: 0.8 },
      { id: 'worst-case', yieldFactor: 0.75, priceFactor: 0.8 },
      { id: 'yield-20-above', yieldFactor: 1.2, priceFactor: 1 }
    ];
    var result = {
      ok: true,
      status: 'calculated',
      input: Object.assign({
        countryCode: countryCode, crops: crops, landMode: landMode, laborMode: laborMode,
        mechanizationMode: mechanizationMode, financeMode: financeMode, startMonth: startMonth
      }, input.rentOverride === undefined ? {} : {rentOverride:input.rentOverride}, financeMode === 'loan' ? {loanRate:rate,loanTerm:term} : {}, hasQuotes ? {priceCurrency:country.currency} : {}, input.fertilizerPricePerKg === undefined ? {} : {fertilizerPricePerKg:input.fertilizerPricePerKg}),
      currency: { code: country.currency, symbol: country.currencySymbol },
      fertilizerPricePerKg: fertilizerPrice,
      fertilizerPriceSource: input.fertilizerPricePerKg===undefined?'static-country-reference':'user-entered',
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
      breakEvenBasis: 'constant-crop-output-mix-and-prices-fixed-budget',
      modeledYieldTonnes: totalYieldTonnes,
      breakEvenYieldFactor: totalBudget / totals.revenue,
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
    return finiteTree(result) ? result : {ok:false,status:'non-finite-result'};
  }
  return { calculate: calculate, GENERIC_COSTS: GENERIC_COSTS };
});
