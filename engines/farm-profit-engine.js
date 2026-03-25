/**
 * farm-profit-engine.js
 * AfroTools Farm Profit/Loss Calculator Engine
 * Calculates comprehensive farm profitability: revenue, all input costs, net profit, ROI
 */
!function () {
  'use strict';

  window.AfroTools = window.AfroTools || {};

  // Processing multipliers: raw → processed product revenue boost
  var PROCESSING_MULTIPLIERS = {
    cassava:    { product: 'Garri/Cassava Flour', conversionRate: 3.5, priceMultiplier: 2.7 },
    rice:       { product: 'Milled Rice',         conversionRate: 1.5, priceMultiplier: 1.9 },
    groundnut:  { product: 'Groundnut Oil',       conversionRate: 3,   priceMultiplier: 2.5 },
    oil_palm:   { product: 'Palm Oil',            conversionRate: 5,   priceMultiplier: 3.5 },
    cocoa:      { product: 'Dry Cocoa Beans',     conversionRate: 2.5, priceMultiplier: 1.5 },
    coffee_arabica:  { product: 'Green Coffee Beans', conversionRate: 5, priceMultiplier: 2.5 },
    coffee_robusta:  { product: 'Green Coffee Beans', conversionRate: 5, priceMultiplier: 2.0 },
    maize:      { product: 'Maize Flour',         conversionRate: 1.2, priceMultiplier: 1.5 },
    sesame:     { product: 'Sesame Oil',          conversionRate: 3,   priceMultiplier: 2.5 },
    shea:       { product: 'Shea Butter',         conversionRate: 4,   priceMultiplier: 3.5 }
  };

  // Seed cost estimates by crop (kg/ha seeding rate × estimated price per kg)
  // These are fallback values when seed-data is not available
  var SEED_COST_ESTIMATES_PCT_OF_REVENUE = 0.05; // ~5% of gross revenue as seed cost fallback

  function calculate(inputs, countryData, farmCosts) {
    // inputs:
    // {
    //   cropId, regionId, farmSizeHa,
    //   yieldPerHa,           // user's expected yield t/ha
    //   marketPricePerTonne,  // local market price in local currency
    //   sellingMethod,        // 'local' | 'export' | 'process'
    //   exportPricePerTonne,  // optional, for export
    //   seedCost,             // total seed cost (user entered)
    //   fertilizerCost,       // total fertilizer cost (user entered)
    //   herbicideCostPerHa,   // from farm-costs or user override
    //   pesticideCostPerHa,
    //   fungicideCostPerHa,
    //   laborMode,            // 'simplified' | 'detailed'
    //   laborManDaysPerHa,    // for simplified mode
    //   laborDailyWage,
    //   familyLaborPct,       // 0-100
    //   landType,             // 'communal' | 'rented' | 'owned'
    //   landRentPerHa,        // if rented or owned (opportunity cost)
    //   mechanizationType,    // 'none' | 'animal' | 'tractor' | 'own'
    //   tractorCostPerHa,     // if tractor
    //   irrigationCost,       // total irrigation cost (optional)
    //   distanceToMarket,     // km
    //   transportCostPerTonneKm,
    //   marketFeesPct,        // % of sale
    //   throughMiddleman,     // boolean
    //   middlemanCommissionPct,
    //   storageMonths,        // 0 = no storage
    //   storageCostPerTonneMonth,
    //   postHarvestLossPct,   // %
    //   loanAmount,           // 0 = no loan
    //   loanInterestPct,
    //   insurancePremiumPct,  // % of gross revenue, 0 = none
    // }

    var CD = countryData;
    var FC = farmCosts;

    if (!CD || !FC) return { error: true, message: 'Missing country or cost data' };

    var cropData = (CD.crops || []).find(function (c) { return c.id === inputs.cropId; });
    if (!cropData) return { error: true, message: 'Crop not found' };

    var sym = CD.currencySymbol || '';
    var farmSizeHa = parseFloat(inputs.farmSizeHa) || 1;
    var yieldPerHa = parseFloat(inputs.yieldPerHa) || cropData.baseYieldPerHa || 1;
    var totalYield = yieldPerHa * farmSizeHa;

    // ─── REVENUE ───
    var marketPrice = parseFloat(inputs.marketPricePerTonne) || cropData.localMarketPrice || 0;
    var effectivePrice = marketPrice;
    var sellingMethod = inputs.sellingMethod || 'local';
    var processingInfo = null;

    if (sellingMethod === 'export' && inputs.exportPricePerTonne) {
      effectivePrice = parseFloat(inputs.exportPricePerTonne);
    } else if (sellingMethod === 'process') {
      var pm = PROCESSING_MULTIPLIERS[inputs.cropId];
      if (pm) {
        // revenue = totalYield / conversionRate × (marketPrice × priceMultiplier)
        // effectivePrice per tonne raw = processed price / conversionRate
        effectivePrice = (marketPrice * pm.priceMultiplier) / pm.conversionRate;
        processingInfo = pm;
      }
    }

    var grossRevenue = totalYield * effectivePrice;

    // Post-harvest loss reduces revenue
    var phLossPct = parseFloat(inputs.postHarvestLossPct) || 0;
    var phLossAmount = grossRevenue * (phLossPct / 100);
    var netRevenue = grossRevenue - phLossAmount;

    // ─── COSTS ───
    var costs = {};

    // 1. Seeds
    costs.seeds = parseFloat(inputs.seedCost) || 0;

    // 2. Fertilizer
    costs.fertilizer = parseFloat(inputs.fertilizerCost) || 0;

    // 3. Agrochemicals
    var herbPerHa = parseFloat(inputs.herbicideCostPerHa) || (FC.agrochemicals ? FC.agrochemicals.herbicide_perHa : 0) || 0;
    var pestPerHa = parseFloat(inputs.pesticideCostPerHa) || (FC.agrochemicals ? FC.agrochemicals.pesticide_perHa : 0) || 0;
    var fungPerHa = parseFloat(inputs.fungicideCostPerHa) || (FC.agrochemicals ? FC.agrochemicals.fungicide_perHa : 0) || 0;
    costs.agrochemicals = (herbPerHa + pestPerHa + fungPerHa) * farmSizeHa;

    // 4. Labor
    var laborMode = inputs.laborMode || 'simplified';
    var manDaysPerHa = parseFloat(inputs.laborManDaysPerHa) || (FC.labor ? FC.labor.manDaysPerHa_simplified : 100) || 100;
    var dailyWage = parseFloat(inputs.laborDailyWage) || (FC.labor ? FC.labor.dailyWageRate : 0) || 0;
    var familyLaborPct = parseFloat(inputs.familyLaborPct) || 0;
    var familyDiscount = FC.labor ? (FC.labor.familyLaborDiscount || 0.5) : 0.5;

    var totalManDays = manDaysPerHa * farmSizeHa;
    var hiredManDays = totalManDays * (1 - familyLaborPct / 100);
    var familyManDays = totalManDays * (familyLaborPct / 100);
    var hiredLaborCost = hiredManDays * dailyWage;
    var familyLaborCost = familyManDays * dailyWage * familyDiscount;
    costs.labor = hiredLaborCost + familyLaborCost;
    costs.laborBreakdown = { hired: hiredLaborCost, family: familyLaborCost };

    // 5. Land
    var landType = inputs.landType || 'communal';
    var landRentPerHa = parseFloat(inputs.landRentPerHa) || (FC.landCost ? FC.landCost.rental_perHa_perSeason : 0) || 0;
    costs.land = (landType === 'communal') ? 0 : (landRentPerHa * farmSizeHa);

    // 6. Mechanization
    var mechType = inputs.mechanizationType || 'none';
    var tractorCostPerHa = parseFloat(inputs.tractorCostPerHa) || (FC.mechanization ? FC.mechanization.tractorPloughing_perHa : 0) || 0;
    if (mechType === 'tractor') {
      costs.mechanization = tractorCostPerHa * farmSizeHa;
    } else if (mechType === 'animal') {
      costs.mechanization = tractorCostPerHa * 0.4 * farmSizeHa; // animal traction ~40% of tractor cost
    } else {
      costs.mechanization = 0;
    }

    // 7. Irrigation
    costs.irrigation = parseFloat(inputs.irrigationCost) || 0;

    // 8. Transport & Marketing
    var distKm = parseFloat(inputs.distanceToMarket) || 20;
    var transportRate = parseFloat(inputs.transportCostPerTonneKm) || (FC.transport ? FC.transport.farmToMarket_perTonne_perKm : 0) || 0;
    var mktFeesPct = parseFloat(inputs.marketFeesPct) || (FC.transport ? FC.transport.marketFees_percentOfSale : 0) || 0;
    var middlemanCommPct = (inputs.throughMiddleman) ? (parseFloat(inputs.middlemanCommissionPct) || 15) : 0;

    costs.transport = totalYield * transportRate * distKm;
    costs.marketingFees = netRevenue * (mktFeesPct / 100);
    costs.middleman = netRevenue * (middlemanCommPct / 100);

    // 9. Storage
    var storageMonths = parseFloat(inputs.storageMonths) || 0;
    var storageCostPerTonneMonth = parseFloat(inputs.storageCostPerTonneMonth) || (FC.storage ? (FC.storage.perTonne_perMonth || 0) : 0);
    costs.storage = totalYield * storageCostPerTonneMonth * storageMonths;

    // 10. Finance
    var loanAmount = parseFloat(inputs.loanAmount) || 0;
    var loanInterestPct = parseFloat(inputs.loanInterestPct) || (FC.finance ? FC.finance.averageInterestRate_percent : 0) || 0;
    costs.finance = loanAmount * (loanInterestPct / 100);

    // 11. Insurance
    var insurancePct = parseFloat(inputs.insurancePremiumPct) || 0;
    costs.insurance = grossRevenue * (insurancePct / 100);

    // ─── TOTALS ───
    var totalCost =
      costs.seeds + costs.fertilizer + costs.agrochemicals + costs.labor +
      costs.land + costs.mechanization + costs.irrigation +
      costs.transport + costs.marketingFees + costs.middleman +
      costs.storage + costs.finance + costs.insurance;

    var netProfit = netRevenue - totalCost;
    var profitPerHa = netProfit / farmSizeHa;
    var roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
    var breakEvenYield = effectivePrice > 0 ? totalCost / effectivePrice : 0;
    var breakEvenPrice = totalYield > 0 ? totalCost / totalYield : 0;
    var profitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;
    var costOfProductionPerTonne = totalYield > 0 ? totalCost / totalYield : 0;
    var revenuePerHa = netRevenue / farmSizeHa;
    var totalManDaysUsed = manDaysPerHa * farmSizeHa;
    var revenuePerManDay = totalManDaysUsed > 0 ? netRevenue / totalManDaysUsed : 0;

    // Cost breakdown percentages
    var costPcts = {};
    var costKeys = ['seeds', 'fertilizer', 'agrochemicals', 'labor', 'land', 'mechanization', 'irrigation', 'transport', 'marketingFees', 'middleman', 'storage', 'finance', 'insurance'];
    costKeys.forEach(function (k) {
      costPcts[k] = totalCost > 0 ? (costs[k] / totalCost) * 100 : 0;
    });

    // What-if scenarios
    var scenarios = {
      yieldUp25: (function () {
        var newYield = totalYield * 1.25;
        var newRevenue = newYield * effectivePrice * (1 - phLossPct / 100);
        return { label: 'Yield +25%', netProfit: newRevenue - totalCost, change: (newRevenue - totalCost) - netProfit };
      })(),
      priceUp20: (function () {
        var newRevenue = totalYield * effectivePrice * 1.2 * (1 - phLossPct / 100);
        return { label: 'Price +20%', netProfit: newRevenue - totalCost, change: (newRevenue - totalCost) - netProfit };
      })(),
      phLossHalved: (function () {
        var newPHLoss = phLossPct / 2;
        var newRevenue = totalYield * effectivePrice * (1 - newPHLoss / 100);
        return { label: 'Post-harvest loss halved', netProfit: newRevenue - totalCost, change: (newRevenue - totalCost) - netProfit };
      })(),
      familyLabor100: (function () {
        var newLaborCost = totalManDays * dailyWage * familyDiscount;
        var laborSaving = costs.labor - newLaborCost;
        return { label: '100% family labor', netProfit: netProfit + laborSaving, change: laborSaving };
      })()
    };

    // If processing is available for this crop, add processing scenario
    var pm2 = PROCESSING_MULTIPLIERS[inputs.cropId];
    if (pm2 && sellingMethod !== 'process') {
      scenarios.processBeforeSelling = (function () {
        var newPrice = (marketPrice * pm2.priceMultiplier) / pm2.conversionRate;
        var processingCostPct = 0.15; // ~15% of gross revenue as processing cost
        var newGross = totalYield * newPrice * (1 - phLossPct / 100);
        var processingCost = newGross * processingCostPct;
        var newProfit = newGross - totalCost - processingCost;
        return { label: 'Process before selling (' + pm2.product + ')', netProfit: newProfit, change: newProfit - netProfit };
      })();
    }

    return {
      // Inputs
      cropName: cropData.name,
      farmSizeHa: farmSizeHa,
      yieldPerHa: yieldPerHa,
      totalYield: totalYield,
      currency: CD.currency,
      currencySymbol: sym,
      sellingMethod: sellingMethod,
      effectivePrice: effectivePrice,
      processingInfo: processingInfo,

      // Revenue
      grossRevenue: grossRevenue,
      postHarvestLossPct: phLossPct,
      postHarvestLossAmount: phLossAmount,
      netRevenue: netRevenue,

      // Costs
      costs: costs,
      costPcts: costPcts,
      totalCost: totalCost,

      // Profit
      netProfit: netProfit,
      profitPerHa: profitPerHa,
      roi: roi,
      profitMargin: profitMargin,

      // Key Metrics
      breakEvenYield: breakEvenYield,
      breakEvenYieldPerHa: farmSizeHa > 0 ? breakEvenYield / farmSizeHa : 0,
      breakEvenPrice: breakEvenPrice,
      costOfProductionPerTonne: costOfProductionPerTonne,
      revenuePerHa: revenuePerHa,
      revenuePerManDay: revenuePerManDay,

      // What-if
      scenarios: scenarios,

      // Profit status
      isProfitable: netProfit > 0
    };
  }

  window.AfroTools.FarmProfitEngine = { calculate: calculate };

}();
