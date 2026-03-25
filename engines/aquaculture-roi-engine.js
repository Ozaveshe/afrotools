// /engines/aquaculture-roi-engine.js
// AfroTools Fish Farming ROI Calculator Engine
// Depends on: /data/agriculture/aquaculture-data.js

(function () {
  'use strict';

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  function fmt(n, sym) {
    if (n === null || n === undefined || isNaN(n)) return sym + '0';
    var abs = Math.abs(n);
    var str;
    if (abs >= 1e9)       str = (n / 1e9).toFixed(1) + 'B';
    else if (abs >= 1e6)  str = (n / 1e6).toFixed(1) + 'M';
    else if (abs >= 1e4)  str = Math.round(n).toLocaleString();
    else                  str = Math.round(n).toLocaleString();
    return sym + str;
  }

  function pct(n) { return (n >= 0 ? '+' : '') + n.toFixed(1) + '%'; }

  function round2(n) { return Math.round(n * 100) / 100; }

  // ─── TARPAULIN TANK CAPACITY (L → effective m²) ───────────────────────────
  // 1000L tank ≈ 5m², 5000L ≈ 20m²  (assuming 0.5m depth)
  function tarpaulinToM2(litres) { return litres / 200; }

  // ─── INFRASTRUCTURE COST ─────────────────────────────────────────────────
  function calcInfraCost(inputs, costs) {
    var sys = inputs.system;
    var area = inputs.pondArea; // m² or litres depending on system
    var hasPond = inputs.hasExistingInfra;
    if (hasPond) return 0;

    var base = 0;
    if (sys === 'earthen_pond' || sys === 'concrete_tank') {
      var rateKey = sys === 'earthen_pond' ? 'earthen_pond_m2' : 'concrete_tank_m2';
      base = area * (costs.infrastructure[rateKey] || 0);
    } else if (sys === 'tarpaulin_tank') {
      var tanks1k = costs.infrastructure.tarpaulin_1000L || 0;
      var tanks5k = costs.infrastructure.tarpaulin_5000L || 0;
      // if pondArea is in litres: use 5000L tanks where possible
      var numTanks = Math.ceil(area / 5000);
      var remainder = area % 5000;
      base = numTanks * tanks5k;
      if (remainder > 0 && remainder <= 1000) base += tanks1k;
      else if (remainder > 1000) base += Math.ceil(remainder / 1000) * tanks1k;
    } else if (sys === 'cage') {
      // Cage: rough estimate — cage cost is typically lower (net + frame)
      base = area * (costs.infrastructure.earthen_pond_m2 || 0) * 0.4;
    }

    var pump = costs.infrastructure.pump || 0;
    var aerator = costs.infrastructure.aerator || 0;
    var borehole = inputs.needsBorehole ? (costs.infrastructure.borehole || 0) : 0;
    var netsScales = costs.infrastructure.nets_scales || 0;

    return base + pump + aerator + borehole + netsScales;
  }

  // ─── EFFECTIVE POND AREA (m²) ─────────────────────────────────────────────
  function effectiveM2(inputs) {
    if (inputs.system === 'tarpaulin_tank') return tarpaulinToM2(inputs.pondArea);
    return inputs.pondArea;
  }

  // ─── CORE CALCULATION ─────────────────────────────────────────────────────
  function calculate(inputs) {
    var D  = window.AquaData;
    if (!D) return { error: 'AquaData not loaded' };

    var cc  = inputs.countryCode;
    var sp  = inputs.speciesId;
    var costs  = D.COSTS[cc];
    var species = D.SPECIES[sp];
    if (!costs || !species) return { error: 'Data not found for ' + cc + '/' + sp };

    var sym = costs.symbol;

    // --- Stocking ---
    var areaM2   = effectiveM2(inputs);
    var density  = species.stockingDensity[inputs.system] || species.stockingDensity['earthen_pond'];
    var stockDensity = inputs.densityLevel === 'low' ? density.low
                     : inputs.densityLevel === 'high' ? density.high
                     : density.medium;

    var fishStocked   = Math.round(areaM2 * stockDensity);
    var survRate      = inputs.managementLevel === 'good'
                        ? species.survivalRate_pct.good / 100
                        : inputs.managementLevel === 'poor'
                        ? species.survivalRate_pct.poor / 100
                        : species.survivalRate_pct.average / 100;

    var fishHarvested = Math.round(fishStocked * survRate);

    // Market weight per fish (kg)
    var mktWeight = inputs.targetSizeLevel === 'min'     ? species.marketSize_kg.min
                  : inputs.targetSizeLevel === 'premium' ? species.marketSize_kg.premium
                  : species.marketSize_kg.typical;

    var harvestKg   = round2(fishHarvested * mktWeight);
    var cyclesPerYr = inputs.cyclesPerYear || 1;
    var annualKg    = round2(harvestKg * cyclesPerYr);

    // --- Feed ---
    var fcr = inputs.managementLevel === 'good'   ? species.feedConversionRatio.good
            : inputs.managementLevel === 'poor'   ? species.feedConversionRatio.poor
            : species.feedConversionRatio.average;

    var totalFeedKg  = round2(harvestKg * fcr);
    var feedPriceKey = inputs.feedType || 'local_float';
    var feedPricePerKg = costs.feed_per_kg[feedPriceKey] || costs.feed_per_kg.local_float;
    var feedCost     = round2(totalFeedKg * feedPricePerKg);

    // Feed bags (assume 25kg bags)
    var feedBags = Math.ceil(totalFeedKg / 25);

    // --- Fingerlings ---
    var fpKey = sp + '_per_piece'; // may not exist as direct key
    var fingerlingPrice = costs.fingerling[sp] || costs.fingerling[Object.keys(costs.fingerling)[0]] || 0;
    var fingerlingCost  = round2(fishStocked * fingerlingPrice);

    // --- Operating costs ---
    var laborDays     = inputs.laborDays || costs.labor_days_cycle;
    var dailyWage     = costs.labor_per_day;
    var familyPct     = (inputs.familyLaborPct || 0) / 100;
    var laborCost     = round2(laborDays * dailyWage * (1 - familyPct * 0.5));

    var electricityCost = round2((costs.electricity_monthly || 0) * (inputs.growPeriodMonths / 1.0));
    var waterCost       = round2((costs.water_monthly || 0) * inputs.growPeriodMonths);
    var medicationsCost = costs.medications_cycle || 0;

    var transportCost = round2(harvestKg * (costs.transport_per_kg || 0));

    var opCostTotal = feedCost + fingerlingCost + laborCost + electricityCost + waterCost + medicationsCost + transportCost;

    // --- Infrastructure ---
    var infraTotal     = calcInfraCost(inputs, costs);
    var infraLifespan  = 10; // weighted average
    var infraAmortized = round2(infraTotal / infraLifespan);

    // --- Total cost ---
    var totalCostPerCycle = round2(opCostTotal + infraAmortized);

    // --- Revenue ---
    var sellingKey = buildSellingKey(sp, inputs.processingLevel, inputs.sellingMethod);
    var sellingPrice = costs.selling_per_kg[sellingKey]
                    || costs.selling_per_kg[sp + '_fresh']
                    || costs.selling_per_kg[sp + '_live']
                    || Object.values(costs.selling_per_kg)[0];

    var revenue = round2(harvestKg * sellingPrice);

    // Processing cost if applicable
    var processingCost = 0;
    if (inputs.processingLevel && inputs.processingLevel !== 'none') {
      processingCost = round2(revenue * ((costs.processing_cost_pct || 10) / 100));
    }
    var netRevenue = round2(revenue - processingCost);

    // --- Profit ---
    var profitPerCycle = round2(netRevenue - totalCostPerCycle);
    var annualProfit   = round2(profitPerCycle * cyclesPerYr);
    var roiPct         = infraTotal > 0 ? round2((annualProfit / infraTotal) * 100) : null;
    var paybackMonths  = annualProfit > 0 ? round2((infraTotal / annualProfit) * 12) : null;
    var costPerKg      = harvestKg > 0 ? round2(totalCostPerCycle / harvestKg) : 0;
    var breakEvenPrice = harvestKg > 0 ? round2(totalCostPerCycle / harvestKg) : 0;
    var profitMargin   = netRevenue > 0 ? round2((profitPerCycle / netRevenue) * 100) : 0;

    // --- Cost breakdown (for donut chart) ---
    var breakdown = [
      { label: 'Feed',          value: feedCost,        pct: 0 },
      { label: 'Fingerlings',   value: fingerlingCost,  pct: 0 },
      { label: 'Labor',         value: laborCost,       pct: 0 },
      { label: 'Electricity',   value: electricityCost, pct: 0 },
      { label: 'Water',         value: waterCost,       pct: 0 },
      { label: 'Medications',   value: medicationsCost, pct: 0 },
      { label: 'Transport',     value: transportCost,   pct: 0 },
      { label: 'Infra (amort)', value: infraAmortized,  pct: 0 }
    ].filter(function (x) { return x.value > 0; });

    breakdown.forEach(function (b) {
      b.pct = totalCostPerCycle > 0 ? round2((b.value / totalCostPerCycle) * 100) : 0;
    });

    // --- Growth timeline ---
    var growth = buildGrowthTimeline(species, harvestKg, inputs.growPeriodMonths, feedPricePerKg, fishHarvested);

    // --- Sensitivity scenarios ---
    var scenarios = buildScenarios({
      inputs: inputs, costs: costs, species: species,
      fishHarvested: fishHarvested, harvestKg: harvestKg, fcr: fcr,
      totalCostPerCycle: totalCostPerCycle, revenue: revenue, processingCost: processingCost,
      profitPerCycle: profitPerCycle, feedPricePerKg: feedPricePerKg, sellingPrice: sellingPrice,
      feedCost: feedCost, fingerlingCost: fingerlingCost, laborCost: laborCost, mktWeight: mktWeight
    });

    return {
      // Production
      fishStocked: fishStocked,
      survivalPct: Math.round(survRate * 100),
      fishHarvested: fishHarvested,
      harvestKg: harvestKg,
      cyclesPerYear: cyclesPerYr,
      annualKg: annualKg,
      feedKg: totalFeedKg,
      feedBags: feedBags,
      growPeriodMonths: inputs.growPeriodMonths,

      // Financials
      infraTotal: infraTotal,
      infraAmortized: infraAmortized,
      feedCost: feedCost,
      fingerlingCost: fingerlingCost,
      laborCost: laborCost,
      electricityCost: electricityCost,
      waterCost: waterCost,
      medicationsCost: medicationsCost,
      transportCost: transportCost,
      processingCost: processingCost,
      opCostTotal: opCostTotal,
      totalCostPerCycle: totalCostPerCycle,
      revenue: revenue,
      netRevenue: netRevenue,
      profitPerCycle: profitPerCycle,
      annualProfit: annualProfit,
      roiPct: roiPct,
      paybackMonths: paybackMonths,
      costPerKg: costPerKg,
      breakEvenPrice: breakEvenPrice,
      profitMargin: profitMargin,
      sellingPrice: sellingPrice,
      feedPricePerKg: feedPricePerKg,
      fingerlingPrice: fingerlingPrice,

      // Charts & detail
      breakdown: breakdown,
      growth: growth,
      scenarios: scenarios,

      // Display
      sym: sym,
      fmt: function (n) { return fmt(n, sym); },
      isProfit: profitPerCycle >= 0
    };
  }

  function buildSellingKey(sp, processingLevel, sellingMethod) {
    if (processingLevel === 'smoked')  return sp + '_smoked';
    if (processingLevel === 'dried')   return sp + '_dried';
    if (processingLevel === 'fillet')  return sp + '_fillet';
    if (sellingMethod === 'live')      return sp + '_live';
    return sp + '_fresh';
  }

  function buildGrowthTimeline(species, harvestKg, months, feedPrice, fishCount) {
    var timeline = [];
    for (var m = 1; m <= months; m++) {
      var wt = species.growthProfile[m] || species.growthProfile[Object.keys(species.growthProfile).length];
      // feeding rate drops as fish grow (use growout rate 2% BW per day × 30 days)
      var feedRate = wt < 200 ? 0.05 : wt < 500 ? 0.03 : 0.02;
      var feedPerMonth = round2(fishCount * (wt / 1000) * feedRate * 30 * feedPrice);
      timeline.push({ month: m, weightG: wt, weightKg: round2(wt / 1000), feedCostMonth: feedPerMonth });
    }
    return timeline;
  }

  function buildScenarios(p) {
    var base  = p.profitPerCycle;
    var sym   = p.costs.symbol;

    // 1. Survival drops to 60%
    var survLow = p.species.survivalRate_pct.poor / 100;
    var fishLow = Math.round(p.inputs.areaM2 * (p.fishHarvested / (p.inputs.pondArea || 1)) * survLow / survLow);
    // simplified: scale harvest proportionally
    var harvestLow = round2(p.harvestKg * (p.species.survivalRate_pct.poor / 100) / ((p.inputs.managementLevel === 'good' ? p.species.survivalRate_pct.good : p.species.survivalRate_pct.average) / 100));
    var revLow     = round2(harvestLow * p.sellingPrice);
    var feedLow    = round2(harvestLow * p.fcr * p.feedPricePerKg);
    var profitLow  = round2(revLow - (p.totalCostPerCycle - p.feedCost - p.fingerlingCost + feedLow + harvestLow * (p.fingerlingCost / (p.harvestKg || 1))));

    // 2. Feed price +30%
    var feedHigh   = round2(p.feedCost * 1.3);
    var profitFeed = round2(base - (feedHigh - p.feedCost));

    // 3. Selling price -20%
    var revLow20   = round2(p.revenue * 0.8);
    var profitSell = round2(base - (p.revenue - revLow20));

    // 4. Process / smoke fish (revenue premium ~60%)
    var processPremium = 0.6;
    var processRevenu  = round2(p.revenue * (1 + processPremium));
    var processCostAdd = round2(processRevenu * ((p.costs.processing_cost_pct || 10) / 100));
    var profitProcess  = round2(base + (processRevenu - processCostAdd - p.revenue));

    // 5. Yield +25% (better management)
    var harvest25  = round2(p.harvestKg * 1.25);
    var rev25      = round2(harvest25 * p.sellingPrice);
    var feed25     = round2(p.feedCost * 1.25);
    var profit25   = round2(p.profitPerCycle + (rev25 - p.revenue) - (feed25 - p.feedCost));

    return [
      { label: 'If survival drops to ' + p.species.survivalRate_pct.poor + '%', profit: profitLow, change: round2(profitLow - base), negative: profitLow < base },
      { label: 'If feed price rises 30%',                                        profit: profitFeed, change: round2(profitFeed - base), negative: true },
      { label: 'If selling price drops 20%',                                     profit: profitSell, change: round2(profitSell - base), negative: true },
      { label: 'If you smoke/process fish (×1.6 revenue)',                       profit: profitProcess, change: round2(profitProcess - base), negative: profitProcess < base },
      { label: 'If yield improves by 25%',                                       profit: profit25, change: round2(profit25 - base), negative: false }
    ];
  }

  if (typeof window !== 'undefined') {
    window.AquaROI = { calculate: calculate, fmt: fmt, pct: pct };
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculate: calculate, fmt: fmt, pct: pct };
  }

})();
