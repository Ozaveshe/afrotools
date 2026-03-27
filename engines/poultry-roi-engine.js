// ============================================================
// AfroTools Poultry ROI Engine
// Handles: Broilers, Layers, Indigenous, Compare-All
// ============================================================
!function () {
  'use strict';
  window.AfroTools = window.AfroTools || {};

  var PROD = null; // lazily loaded from window.AfroTools.PoultryProduction

  function getProd() {
    if (!PROD) PROD = window.AfroTools.PoultryProduction;
    if (!PROD) {
      console.error('[PoultryROI] PoultryProduction data not loaded. Ensure the data script is included before this engine.');
      return null;
    }
    return PROD;
  }

  // ── helpers ─────────────────────────────────────────────
  function usdToLocal(usd, code) {
    var prod = getProd();
    if (!prod || !prod.usdRates) return usd;
    return usd * (prod.usdRates[code] || 1);
  }

  function getFeedPriceKg(cd, type) {
    // type: 'starter' | 'grower' | 'finisher' | 'layer_mash'
    if (cd.feed_per_kg && cd.feed_per_kg[type]) return cd.feed_per_kg[type];
    return 0;
  }

  function getSellingPricePerBird(cd, type) {
    if (type === 'broiler') {
      return cd.sellingPrice.broiler_per_bird ||
             (cd.sellingPrice.broiler_live_per_kg * getProd().broilers.marketWeight_kg.typical);
    }
    return 0;
  }

  // ── Broiler calculation ──────────────────────────────────
  function calcBroilers(inputs, cd) {
    var p = getProd().broilers;
    var mgmt = inputs.management || 'smallholder';
    var flock = inputs.flockSize || 100;

    var mortalityPct = p.mortalityPct[mgmt] || 8;
    var cyclesYear = inputs.cyclesPerYear || p.cyclesPerYear[mgmt] || 4;
    var marketWeight = 2.0; // kg typical

    // ── Per-cycle costs ──────────────────────────────────
    var chickCost = flock * cd.dayOldChick.broiler;

    var feedCost =
      flock * p.feedBreakdown.starter_kg * getFeedPriceKg(cd, 'starter') +
      flock * p.feedBreakdown.grower_kg  * getFeedPriceKg(cd, 'grower')  +
      flock * p.feedBreakdown.finisher_kg * getFeedPriceKg(cd, 'finisher');

    var vacCost = flock * usdToLocal(p.vaccinationUSD_per_bird, cd.symbol ? null : null);
    // Use per-bird cost in local currency (approx $0.022 * rate)
    var rates = getProd().usdRates;
    var rate = rates[inputs.countryCode] || 1;
    vacCost = flock * p.vaccinationUSD_per_bird * rate;

    var medCost = flock * p.medicationUSD_per_bird * rate;

    var cycleWeeks = p.cycleWeeks;
    var laborCost = (cycleWeeks / 4.33) * cd.labor_per_month;

    var elecCost = cd.electricity_per_month ? (cycleWeeks / 4.33) * cd.electricity_per_month : 0;
    var waterCost = cd.water_per_month ? (cycleWeeks / 4.33) * cd.water_per_month : 0;

    // Litter: floor area / 10 birds per sqm; ~1 bag per 5 sqm
    var floorArea = flock / p.birdsPerSqM;
    var litterBags = Math.ceil(floorArea / 5);
    var litterCost = cd.litter_per_bag ? litterBags * cd.litter_per_bag : 0;

    var totalCostPerCycle = chickCost + feedCost + vacCost + medCost +
                            laborCost + elecCost + waterCost + litterCost;

    // Add 4% for transport / miscellaneous
    var otherCost = totalCostPerCycle * 0.04;
    totalCostPerCycle += otherCost;

    // ── Revenue ──────────────────────────────────────────
    var survivingBirds = Math.round(flock * (1 - mortalityPct / 100));
    var pricePerBird = cd.sellingPrice.broiler_per_bird ||
                       (cd.sellingPrice.broiler_live_per_kg * marketWeight);
    var revenue = survivingBirds * pricePerBird;

    var profitPerCycle = revenue - totalCostPerCycle;

    // ── Housing / equipment (one-time) ───────────────────
    var housingCost = 0;
    var equipmentCost = 0;
    if (!inputs.ownHouse) {
      var hType = inputs.housingType || 'simple';
      var hRate = cd.housing_per_sqm[hType] || cd.housing_per_sqm.simple || 0;
      housingCost = floorArea * hRate;
      equipmentCost = flock * (cd.equipment_per_bird || 0);
    }
    var totalInvestment = housingCost + equipmentCost;
    var workingCapital = totalCostPerCycle;

    // ── Annual projections ───────────────────────────────
    var annualRevenue = revenue * cyclesYear;
    var annualCosts   = totalCostPerCycle * cyclesYear;
    var annualProfit  = annualRevenue - annualCosts;

    // Amortize housing over 10 years
    var annualHousingAmort = totalInvestment / 10;
    var netAnnualProfit = annualProfit - annualHousingAmort;

    var totalCapital = totalInvestment + workingCapital;
    var roi = totalCapital > 0 ? (netAnnualProfit / totalCapital) * 100 : annualProfit > 0 ? 999 : 0;
    var paybackMonths = netAnnualProfit > 0 ? (totalCapital / netAnnualProfit) * 12 : 9999;

    // ── Key metrics ──────────────────────────────────────
    var costPerKgMeat = survivingBirds > 0 ? totalCostPerCycle / (survivingBirds * marketWeight) : 0;
    var profitPerBird = survivingBirds > 0 ? profitPerCycle / survivingBirds : 0;
    var feedPct = feedCost / totalCostPerCycle * 100;

    // ── Risk scenarios ───────────────────────────────────
    var baseMortality = mortalityPct;
    var highMortalityBirds = Math.round(flock * (1 - (baseMortality * 2) / 100));
    var highMortalityRevenue = highMortalityBirds * pricePerBird;
    var highMortalityProfit = (highMortalityRevenue - totalCostPerCycle) * cyclesYear;

    var highFeedCost = feedCost * 1.20;
    var highFeedTotal = totalCostPerCycle - feedCost + highFeedCost;
    var highFeedProfit = (revenue - highFeedTotal) * cyclesYear;

    var lowPriceRevenue = revenue * 0.85;
    var lowPriceProfit = (lowPriceRevenue - totalCostPerCycle) * cyclesYear;

    // ── Cash flow (monthly, 2 cycles shown) ─────────────
    var cashFlow = buildBroilerCashFlow(inputs, cd, profitPerCycle, totalCostPerCycle,
                                        revenue, chickCost, feedCost, cyclesYear);

    return {
      mode: 'broilers',
      flockSize: flock,
      survivingBirds: survivingBirds,
      mortalityPct: mortalityPct,
      cyclesYear: cyclesYear,
      perCycle: {
        revenue: revenue,
        costs: {
          chicks: chickCost, feed: feedCost, vaccination: vacCost, medication: medCost,
          labor: laborCost, electricity: elecCost, water: waterCost,
          litter: litterCost, other: otherCost, total: totalCostPerCycle
        },
        profit: profitPerCycle
      },
      annual: { revenue: annualRevenue, costs: annualCosts, profit: annualProfit },
      investment: { housing: housingCost, equipment: equipmentCost, total: totalInvestment },
      workingCapital: workingCapital,
      metrics: {
        roi: roi, paybackMonths: paybackMonths,
        costPerKg: costPerKgMeat, profitPerBird: profitPerBird, feedPct: feedPct
      },
      risks: {
        highMortality: { desc: 'Mortality doubles to ' + (baseMortality * 2) + '%', annualProfit: highMortalityProfit },
        highFeed: { desc: 'Feed prices rise 20%', annualProfit: highFeedProfit },
        lowPrice: { desc: 'Selling price drops 15%', annualProfit: lowPriceProfit }
      },
      cashFlow: cashFlow
    };
  }

  function buildBroilerCashFlow(inputs, cd, profitPerCycle, costPerCycle, revenue, chickCost, feedCost, cyclesYear) {
    // Approximate monthly cash flow: expenses in months 1–2, revenue at end of cycle
    var weeklyCost = costPerCycle / 7;
    var months = [];
    var cycleWeeks = 7;
    var cleanupWeeks = 1;
    var weeksPerCycle = cycleWeeks + cleanupWeeks;
    var numCycles = Math.min(cyclesYear, 4); // show up to 4 cycles
    for (var c = 0; c < numCycles; c++) {
      var startWeek = c * weeksPerCycle;
      // Month of expenses (breeding cost + feed)
      months.push({
        label: 'Cycle ' + (c + 1) + ' in',
        amount: -costPerCycle,
        type: 'expense'
      });
      months.push({
        label: 'Cycle ' + (c + 1) + ' out',
        amount: revenue,
        type: 'revenue'
      });
    }
    return months;
  }

  // ── Layer calculation ────────────────────────────────────
  function calcLayers(inputs, cd) {
    var p = getProd().layers;
    var mgmt = inputs.management || 'smallholder';
    var flock = inputs.flockSize || 100;
    var rates = getProd().usdRates;
    var rate = rates[inputs.countryCode] || 1;

    var eggsPerHenYear = p.eggsPerHenYear[mgmt] || 240;

    // ── Rearing costs (one-time, 0–18 weeks) ─────────────
    var chickCost = flock * cd.dayOldChick.layer;
    // Rearing feed: chick mash + grower = approx starter + grower weighted
    var rearingFeedCost = flock * p.feedRearing_kg *
      ((getFeedPriceKg(cd, 'starter') + getFeedPriceKg(cd, 'grower')) / 2);

    var vacCostRearing = flock * p.vaccinationUSD_per_bird * rate;
    var mortalityRearing = p.mortalityRearing_pct / 100;
    var survivingToLay = Math.round(flock * (1 - mortalityRearing));

    // ── Laying period (annual) ────────────────────────────
    var mortalityLaying = p.mortalityLaying_pct / 100;
    var avgLayers = survivingToLay * (1 - mortalityLaying / 2); // average over year

    var layingFeedCost = survivingToLay * p.feedLayingPerYear_kg * getFeedPriceKg(cd, 'layer_mash');
    var annualLabor = 12 * cd.labor_per_month;
    var annualElec = 12 * (cd.electricity_per_month || 0);
    var annualWater = 12 * (cd.water_per_month || 0);
    var annualLitter = cd.litter_per_bag ?
      Math.ceil((survivingToLay / getProd().layers.birdsPerSqM) / 5) * cd.litter_per_bag * 4 : 0; // 4x per year

    // Amortize rearing costs over laying period (1 year)
    var rearingCostAmort = chickCost + rearingFeedCost + vacCostRearing;

    var annualLayingCost = layingFeedCost + annualLabor + annualElec + annualWater + annualLitter;
    var annualTotalCost = rearingCostAmort + annualLayingCost;
    // Add 4% misc
    var miscCost = annualTotalCost * 0.04;
    annualTotalCost += miscCost;

    // ── Revenue ──────────────────────────────────────────
    var eggsProduced = Math.round(avgLayers * eggsPerHenYear);
    var eggRevenue = eggsProduced * cd.sellingPrice.egg_per_egg;
    var spentHensAtCull = Math.round(survivingToLay * (1 - mortalityLaying));
    var cullRevenue = spentHensAtCull * cd.sellingPrice.spent_layer_per_bird;
    var totalRevenue = eggRevenue + cullRevenue;

    var annualProfit = totalRevenue - annualTotalCost;

    // ── Housing ──────────────────────────────────────────
    var housingCost = 0;
    var equipmentCost = 0;
    if (!inputs.ownHouse) {
      var hType = inputs.housingType || 'simple';
      var floorArea = survivingToLay / getProd().layers.birdsPerSqM;
      var hRate = cd.housing_per_sqm[hType] || cd.housing_per_sqm.simple || 0;
      housingCost = floorArea * hRate;
      equipmentCost = flock * (cd.equipment_per_bird || 0);
    }
    var totalInvestment = housingCost + equipmentCost;
    var annualHousingAmort = totalInvestment / 10;
    var netAnnualProfit = annualProfit - annualHousingAmort;
    var totalCapital = totalInvestment + rearingCostAmort;

    var roi = totalCapital > 0 ? (netAnnualProfit / totalCapital) * 100 : 0;
    var paybackMonths = netAnnualProfit > 0 ? (totalCapital / netAnnualProfit) * 12 : 9999;

    var cratesOf30 = Math.floor(eggsProduced / 30);
    var costPerEgg = eggsProduced > 0 ? annualTotalCost / eggsProduced : 0;
    var breakEvenEggPrice = eggsProduced > 0 ? annualTotalCost / eggsProduced : 0;
    var feedPct = (layingFeedCost + rearingFeedCost) / annualTotalCost * 100;

    // ── Risk scenarios ────────────────────────────────────
    var lowEggScenario = (eggsProduced * 0.85 * cd.sellingPrice.egg_per_egg + cullRevenue) - annualTotalCost;
    var highFeedScenario = totalRevenue - (annualTotalCost + layingFeedCost * 0.20);
    var highMortScenario = ((avgLayers * 0.90) * eggsPerHenYear * cd.sellingPrice.egg_per_egg + cullRevenue * 0.90) - annualTotalCost;

    // ── Monthly cash flow (18-month view) ────────────────
    var cashFlow = buildLayerCashFlow(flock, rearingCostAmort, annualLayingCost + miscCost, totalRevenue);

    return {
      mode: 'layers',
      flockSize: flock,
      survivingToLay: survivingToLay,
      eggsPerHenYear: eggsPerHenYear,
      eggsProduced: eggsProduced,
      cratesOf30: cratesOf30,
      spentHens: spentHensAtCull,
      annual: {
        revenue: { eggs: eggRevenue, spentHens: cullRevenue, total: totalRevenue },
        costs: {
          rearing: rearingCostAmort, layingFeed: layingFeedCost,
          labor: annualLabor, electricity: annualElec, water: annualWater,
          litter: annualLitter, misc: miscCost, total: annualTotalCost
        },
        profit: annualProfit
      },
      investment: { housing: housingCost, equipment: equipmentCost, total: totalInvestment },
      workingCapital: rearingCostAmort,
      metrics: {
        roi: roi, paybackMonths: paybackMonths,
        costPerEgg: costPerEgg, breakEvenEggPrice: breakEvenEggPrice, feedPct: feedPct
      },
      risks: {
        lowEggPrice: { desc: 'Egg price drops 15%', annualProfit: lowEggScenario },
        highFeed: { desc: 'Feed prices rise 20%', annualProfit: highFeedScenario },
        highMortality: { desc: 'Laying mortality doubles', annualProfit: highMortScenario }
      },
      cashFlow: cashFlow
    };
  }

  function buildLayerCashFlow(flock, rearingCost, annualLayingCost, annualRevenue) {
    // Months 1–4: rearing expenses (no revenue)
    // Months 5–18: laying phase (expenses + revenue)
    var months = [];
    var rearingMonths = 4;
    var rearingPerMonth = rearingCost / rearingMonths;
    var layingMonthlyExpense = annualLayingCost / 12;
    var layingMonthlyRevenue = annualRevenue / 12;
    for (var m = 1; m <= 18; m++) {
      if (m <= rearingMonths) {
        months.push({ label: 'Month ' + m, income: 0, expense: rearingPerMonth, net: -rearingPerMonth });
      } else {
        var net = layingMonthlyRevenue - layingMonthlyExpense;
        months.push({ label: 'Month ' + m, income: layingMonthlyRevenue, expense: layingMonthlyExpense, net: net });
      }
    }
    return months;
  }

  // ── Indigenous calculation ───────────────────────────────
  function calcIndigenous(inputs, cd) {
    var p = getProd().indigenous;
    var flock = inputs.flockSize || 50;
    var rates = getProd().usdRates;
    var rate = rates[inputs.countryCode] || 1;

    var mortalityPct = p.mortalityPct;
    var cyclesYear = p.cyclesPerYear;
    var marketWeight = p.marketWeight_kg;

    var chickCost = flock * cd.dayOldChick.indigenous;
    var feedCost = flock * p.feedBreakdown_kg *
      ((getFeedPriceKg(cd, 'starter') + getFeedPriceKg(cd, 'grower')) / 2) * 0.5; // supplemental only
    var laborCost = (16 / 4.33) * cd.labor_per_month * 0.25; // minimal management
    var vacCost = flock * 0.01 * rate; // minimal

    var totalCostPerCycle = chickCost + feedCost + laborCost + vacCost;
    var miscCost = totalCostPerCycle * 0.05;
    totalCostPerCycle += miscCost;

    var survivingBirds = Math.round(flock * (1 - mortalityPct / 100));
    var pricePerBird = cd.sellingPrice.indigenous_live_per_bird;
    var revenue = survivingBirds * pricePerBird;
    var profitPerCycle = revenue - totalCostPerCycle;

    var annualRevenue = revenue * cyclesYear;
    var annualCost = totalCostPerCycle * cyclesYear;
    var annualProfit = annualRevenue - annualCost;

    var roi = annualCost > 0 ? (annualProfit / annualCost) * 100 : 0;
    var paybackMonths = annualProfit > 0 ? (totalCostPerCycle / annualProfit) * 12 : 9999;
    var profitPerBird = survivingBirds > 0 ? profitPerCycle / survivingBirds : 0;

    return {
      mode: 'indigenous',
      flockSize: flock,
      survivingBirds: survivingBirds,
      mortalityPct: mortalityPct,
      cyclesYear: cyclesYear,
      perCycle: {
        revenue: revenue,
        costs: { chicks: chickCost, feed: feedCost, labor: laborCost, vaccination: vacCost, misc: miscCost, total: totalCostPerCycle },
        profit: profitPerCycle
      },
      annual: { revenue: annualRevenue, costs: annualCost, profit: annualProfit },
      metrics: { roi: roi, paybackMonths: paybackMonths, profitPerBird: profitPerBird, feedPct: feedCost / totalCostPerCycle * 100 },
      risks: {
        highMortality: { desc: 'Mortality rises to 35%', annualProfit: ((Math.round(flock * 0.65) * pricePerBird) - totalCostPerCycle) * cyclesYear },
        lowPrice: { desc: 'Price drops 20%', annualProfit: (survivingBirds * pricePerBird * 0.80 - totalCostPerCycle) * cyclesYear }
      }
    };
  }

  // ── Compare All ──────────────────────────────────────────
  function compareAll(inputs, cd) {
    var broiler = calcBroilers(Object.assign({}, inputs, { mode: 'broilers', flockSize: inputs.flockSize || 100 }), cd);
    var layer   = calcLayers(Object.assign({}, inputs, { mode: 'layers',   flockSize: inputs.flockSize || 100 }), cd);
    var indig   = calcIndigenous(Object.assign({}, inputs, { mode: 'indigenous', flockSize: inputs.flockSize || 100 }), cd);
    return { mode: 'compare', broiler: broiler, layer: layer, indigenous: indig };
  }

  // ── Public API ───────────────────────────────────────────
  window.AfroTools.PoultryROIEngine = {
    calculate: function (inputs, cd) {
      if (!cd) return { error: 'No country data provided' };
      var mode = inputs.mode || 'broilers';
      try {
        if (mode === 'broilers')   return calcBroilers(inputs, cd);
        if (mode === 'layers')     return calcLayers(inputs, cd);
        if (mode === 'indigenous') return calcIndigenous(inputs, cd);
        if (mode === 'compare')    return compareAll(inputs, cd);
        return { error: 'Unknown mode: ' + mode };
      } catch (e) {
        return { error: e.message || 'Calculation error' };
      }
    }
  };

}();
