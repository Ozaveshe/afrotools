/**
 * cassava-processing-engine.js
 * AfroTools — Cassava Processing Profit Calculator Engine
 * Calculates profitability of cassava processing pathways: garri, fufu flour, HQCF, chips, starch
 */
!function () {
  'use strict';
  window.AfroTools = window.AfroTools || {};

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function fmt(n, sym) {
    if (!isFinite(n)) return sym + '0';
    var abs = Math.abs(n);
    var str;
    if (abs >= 1000000) str = (n / 1000000).toFixed(1) + 'M';
    else if (abs >= 1000) str = (n / 1000).toFixed(1) + 'K';
    else str = n.toFixed(0);
    return sym + str;
  }

  function fmtFull(n, sym) {
    if (!isFinite(n)) return sym + '0';
    return sym + Math.round(n).toLocaleString();
  }

  // ── Main Calculate ───────────────────────────────────────────────────────────
  // inputs: {
  //   pathwayId,          // 'garri' | 'fufu_flour' | 'hqcf' | 'cassava_chips' | 'cassava_starch'
  //   rawTonnes,          // tonnes of fresh cassava per batch
  //   batchesPerMonth,    // number
  //   rawPricePerTonne,   // local currency
  //   processingLevel,    // 'manual' | 'semi_mechanized' | 'mechanized'
  //   sellingPricePerKg,  // local currency
  //   includeTransport,   // boolean
  //   distanceKm,         // km to market
  // }
  // countryData: single country object from window.AfroTools.cassavaProcessing.countries
  // pathwayData: single pathway object from window.AfroTools.cassavaProcessing.pathways

  function calculatePathway(inputs, countryData, pathwayData) {
    var CD = countryData;
    var PD = pathwayData;
    if (!CD || !PD) return { error: true, message: 'Missing data' };

    var sym = CD.symbol || '';
    var rawTonnes = parseFloat(inputs.rawTonnes) || 1;
    var batchesPerMonth = parseFloat(inputs.batchesPerMonth) || 4;
    var rawPrice = parseFloat(inputs.rawPricePerTonne) || CD.fresh_cassava_per_tonne;
    var processingLevel = inputs.processingLevel || 'manual';
    var distanceKm = parseFloat(inputs.distanceKm) || 0;

    // ─── Output ────────────────────────────────────────────────────────────────
    var rawKg = rawTonnes * 1000;
    var outputKg = rawKg / PD.conversionRate;          // kg of finished product per batch

    // ─── Selling Price ─────────────────────────────────────────────────────────
    // Use user input or default country data price for this pathway
    var defaultPriceKey = {
      garri: 'garri_per_kg',
      fufu_flour: 'fufu_flour_per_kg',
      hqcf: 'hqcf_per_kg',
      cassava_chips: 'cassava_chips_per_kg',
      cassava_starch: 'cassava_starch_per_kg'
    }[PD.id];
    var sellingPrice = parseFloat(inputs.sellingPricePerKg) || CD[defaultPriceKey] || 0;

    // ─── Revenue ────────────────────────────────────────────────────────────────
    var revenue = outputKg * sellingPrice;

    // ─── Costs ─────────────────────────────────────────────────────────────────

    // 1. Raw material
    var costRaw = rawTonnes * rawPrice;

    // 2. Labour  (laborHrsPerTonneRoots × rawTonnes, at daily_wage/8 per hour)
    var laborHrsTotal = PD.laborHrsPerTonneRoots * rawTonnes;
    var wagePerHr = CD.labor_per_day / 8;
    var costLabor = laborHrsTotal * wagePerHr;

    // 3. Fuel / Firewood (only significant for garri)
    var costFuel = 0;
    if (PD.firewoodKgPerTonneGarri && PD.firewoodKgPerTonneGarri > 0) {
      var firewoodKgNeeded = PD.firewoodKgPerTonneGarri * outputKg / 1000; // per tonne garri output
      costFuel = firewoodKgNeeded * CD.firewood_per_kg;
    }

    // 4. Water
    var waterLitres = PD.waterLitresPerTonneRoots * rawTonnes;
    var costWater = (waterLitres / 1000) * CD.water_per_1000L;

    // 5. Packaging (50kg bags)
    var bagsNeeded = Math.ceil(outputKg / 50);
    var costPackaging = bagsNeeded * CD.packaging_50kg_bag;

    // 6. Equipment depreciation per batch
    var equipCost = PD.equipment[processingLevel] ? PD.equipment[processingLevel].cost_usd : 0;
    // Convert USD to local: use rough USD equivalent of local currency
    // We'll compute an approximate local-currency cost using the labour wage as proxy
    // Daily wage in USD ≈ labor_per_day / usdRate. Instead store equiv as equipCost_local in each country.
    // Simpler: depreciation = (equipCost_local / 36) / batchesPerMonth
    // We'll convert USD to local using a ratio: labor_per_day / 15 (approximate USD daily wage $15)
    var usdToLocal = CD.labor_per_day / 15; // rough conversion factor
    var equipCostLocal = equipCost * usdToLocal;
    var costEquip = equipCostLocal / (PD.lifespan_months || 36) / batchesPerMonth;

    // 7. Transport
    var costTransport = 0;
    if (inputs.includeTransport && distanceKm > 0) {
      var outputTonnes = outputKg / 1000;
      costTransport = outputTonnes * distanceKm * CD.transport_per_km_tonne;
    }

    // ─── Totals ─────────────────────────────────────────────────────────────────
    var totalCost = costRaw + costLabor + costFuel + costWater + costPackaging + costEquip + costTransport;
    var profitPerBatch = revenue - totalCost;
    var profitPerKgOutput = outputKg > 0 ? profitPerBatch / outputKg : 0;
    var profitMarginPct = revenue > 0 ? (profitPerBatch / revenue) * 100 : 0;
    var monthlyProfit = profitPerBatch * batchesPerMonth;
    var annualProfit = monthlyProfit * 12;
    var roi = totalCost > 0 ? (profitPerBatch / totalCost) * 100 : 0;

    // Payback period on equipment (months)
    var paybackMonths = (profitPerBatch > 0 && equipCostLocal > 0)
      ? equipCostLocal / (profitPerBatch * batchesPerMonth)
      : null;

    return {
      pathway: PD.id,
      pathwayName: PD.name,
      sym: sym,

      // Output
      rawKg: rawKg,
      outputKg: Math.round(outputKg),
      conversionRate: PD.conversionRate,

      // Revenue
      sellingPrice: sellingPrice,
      revenue: Math.round(revenue),

      // Cost breakdown
      costs: {
        rawMaterial:  Math.round(costRaw),
        labor:        Math.round(costLabor),
        fuel:         Math.round(costFuel),
        water:        Math.round(costWater),
        packaging:    Math.round(costPackaging),
        equipment:    Math.round(costEquip),
        transport:    Math.round(costTransport),
        total:        Math.round(totalCost)
      },

      // Profit metrics
      profitPerBatch:   Math.round(profitPerBatch),
      profitPerKgOutput: Math.round(profitPerKgOutput),
      profitMarginPct:  Math.round(profitMarginPct * 10) / 10,
      monthlyProfit:    Math.round(monthlyProfit),
      annualProfit:     Math.round(annualProfit),
      roi:              Math.round(roi * 10) / 10,
      paybackMonths:    paybackMonths !== null ? Math.ceil(paybackMonths) : null,

      // Display helpers
      revenueDisplay:        fmtFull(revenue, sym),
      totalCostDisplay:      fmtFull(totalCost, sym),
      profitDisplay:         fmtFull(profitPerBatch, sym),
      monthlyProfitDisplay:  fmtFull(monthlyProfit, sym),
      annualProfitDisplay:   fmtFull(annualProfit, sym),
      isProfit: profitPerBatch >= 0
    };
  }

  // ── Compare all pathways ─────────────────────────────────────────────────────
  function compareAll(inputs, countryData) {
    var data = window.AfroTools.cassavaProcessing;
    if (!data) return [];
    var results = [];
    var pathwayIds = ['garri', 'fufu_flour', 'hqcf', 'cassava_chips', 'cassava_starch'];
    pathwayIds.forEach(function (pid) {
      var pd = data.pathways[pid];
      if (!pd) return;
      // Skip products with 0 price in this country (e.g. garri in Tanzania)
      var priceKey = {
        garri: 'garri_per_kg', fufu_flour: 'fufu_flour_per_kg', hqcf: 'hqcf_per_kg',
        cassava_chips: 'cassava_chips_per_kg', cassava_starch: 'cassava_starch_per_kg'
      }[pid];
      if (countryData[priceKey] === 0) return;
      var inp = Object.assign({}, inputs, { pathwayId: pid });
      var r = calculatePathway(inp, countryData, pd);
      if (!r.error) results.push(r);
    });
    // Sort by profitPerBatch descending
    results.sort(function (a, b) { return b.profitPerBatch - a.profitPerBatch; });
    return results;
  }

  // ── Get default selling price ─────────────────────────────────────────────────
  function getDefaultPrice(countryCode, pathwayId) {
    var data = window.AfroTools.cassavaProcessing;
    if (!data) return 0;
    var cd = data.countries[countryCode];
    if (!cd) return 0;
    var map = {
      garri: 'garri_per_kg', fufu_flour: 'fufu_flour_per_kg', hqcf: 'hqcf_per_kg',
      cassava_chips: 'cassava_chips_per_kg', cassava_starch: 'cassava_starch_per_kg'
    };
    return cd[map[pathwayId]] || 0;
  }

  // ── Expose API ────────────────────────────────────────────────────────────────
  window.AfroTools.CassavaProcessingEngine = {
    calculate: function (inputs, countryCode) {
      var data = window.AfroTools.cassavaProcessing;
      if (!data) return { error: true, message: 'Data not loaded' };
      var cd = data.countries[countryCode];
      if (!cd) return { error: true, message: 'Country not found: ' + countryCode };
      var pd = data.pathways[inputs.pathwayId];
      if (!pd) return { error: true, message: 'Pathway not found: ' + inputs.pathwayId };
      return calculatePathway(inputs, cd, pd);
    },

    compareAll: function (inputs, countryCode) {
      var data = window.AfroTools.cassavaProcessing;
      if (!data) return [];
      var cd = data.countries[countryCode];
      if (!cd) return [];
      return compareAll(inputs, cd);
    },

    getDefaultPrice: getDefaultPrice,

    getCountryData: function (countryCode) {
      var data = window.AfroTools.cassavaProcessing;
      return data ? data.countries[countryCode] : null;
    },

    getPathway: function (pathwayId) {
      var data = window.AfroTools.cassavaProcessing;
      return data ? data.pathways[pathwayId] : null;
    },

    formatCurrency: fmtFull,
    formatShort: fmt
  };

}();
