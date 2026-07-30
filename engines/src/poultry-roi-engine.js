(function poultryRoiEngineModule(root, factory) {
  'use strict';
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.PoultryROIEngine = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function createPoultryRoiEngine(root) {
  'use strict';

  function getProductionData(explicitData) {
    return explicitData || (root && root.AfroTools && root.AfroTools.PoultryProduction) || null;
  }

  function feedPrice(countryData, type) {
    return countryData.feed_per_kg && countryData.feed_per_kg[type]
      ? countryData.feed_per_kg[type]
      : 0;
  }

  function calculateBroilers(inputs, countryData, production) {
    var model = production.broilers;
    var management = inputs.management || 'smallholder';
    var flockSize = inputs.flockSize || 100;
    var mortalityPct = model.mortalityPct[management] || 8;
    var cyclesYear = inputs.cyclesPerYear || model.cyclesPerYear[management] || 4;
    var chickCost = flockSize * countryData.dayOldChick.broiler;
    var feedCost = (
      flockSize * model.feedBreakdown.starter_kg * feedPrice(countryData, 'starter')
      + flockSize * model.feedBreakdown.grower_kg * feedPrice(countryData, 'grower')
      + flockSize * model.feedBreakdown.finisher_kg * feedPrice(countryData, 'finisher')
    );
    var rate = production.usdRates[inputs.countryCode] || 1;
    var vaccinationCost = flockSize * model.vaccinationUSD_per_bird * rate;
    var medicationCost = flockSize * model.medicationUSD_per_bird * rate;
    var cycleWeeks = model.cycleWeeks;
    var laborCost = cycleWeeks / 4.33 * countryData.labor_per_month;
    var electricityCost = countryData.electricity_per_month
      ? cycleWeeks / 4.33 * countryData.electricity_per_month
      : 0;
    var waterCost = countryData.water_per_month
      ? cycleWeeks / 4.33 * countryData.water_per_month
      : 0;
    var housingArea = flockSize / model.birdsPerSqM;
    var litterBags = Math.ceil(housingArea / 5);
    var litterCost = countryData.litter_per_bag ? litterBags * countryData.litter_per_bag : 0;
    var cycleCost = chickCost + feedCost + vaccinationCost + medicationCost
      + laborCost + electricityCost + waterCost + litterCost;
    var otherCost = cycleCost * 0.04;
    cycleCost += otherCost;

    var survivingBirds = Math.round(flockSize * (1 - mortalityPct / 100));
    var sellingPrice = countryData.sellingPrice.broiler_per_bird
      || countryData.sellingPrice.broiler_live_per_kg * 2;
    var cycleRevenue = survivingBirds * sellingPrice;
    var cycleProfit = cycleRevenue - cycleCost;
    var housingInvestment = 0;
    var equipmentInvestment = 0;
    if (!inputs.ownHouse) {
      var housingType = inputs.housingType || 'simple';
      housingInvestment = housingArea * (
        countryData.housing_per_sqm[housingType]
        || countryData.housing_per_sqm.simple
        || 0
      );
      equipmentInvestment = flockSize * (countryData.equipment_per_bird || 0);
    }
    var totalInvestment = housingInvestment + equipmentInvestment;
    var workingCapital = cycleCost;
    var annualRevenue = cycleRevenue * cyclesYear;
    var annualCosts = cycleCost * cyclesYear;
    var annualProfit = annualRevenue - annualCosts;
    var annualProfitAfterDepreciation = annualProfit - totalInvestment / 10;
    var investmentAndWorkingCapital = totalInvestment + workingCapital;
    var roi = investmentAndWorkingCapital > 0
      ? annualProfitAfterDepreciation / investmentAndWorkingCapital * 100
      : annualProfit > 0 ? 999 : 0;
    var paybackMonths = annualProfitAfterDepreciation > 0
      ? investmentAndWorkingCapital / annualProfitAfterDepreciation * 12
      : 9999;
    var costPerKg = survivingBirds > 0 ? cycleCost / (survivingBirds * 2) : 0;
    var profitPerBird = survivingBirds > 0 ? cycleProfit / survivingBirds : 0;
    var feedPct = feedCost / cycleCost * 100;
    var highMortalityProfit = (
      Math.round(flockSize * (1 - 2 * mortalityPct / 100)) * sellingPrice - cycleCost
    ) * cyclesYear;
    var highFeedProfit = (cycleRevenue - (cycleCost - feedCost + feedCost * 1.2)) * cyclesYear;
    var lowPriceProfit = (cycleRevenue * 0.85 - cycleCost) * cyclesYear;
    var cashFlow = [];
    var displayedCycles = Math.min(cyclesYear, 4);
    for (var cycleIndex = 0; cycleIndex < displayedCycles; cycleIndex += 1) {
      cashFlow.push({
        label: 'Cycle ' + (cycleIndex + 1) + ' in',
        amount: -cycleCost,
        type: 'expense',
      });
      cashFlow.push({
        label: 'Cycle ' + (cycleIndex + 1) + ' out',
        amount: cycleRevenue,
        type: 'revenue',
      });
    }

    return {
      mode: 'broilers',
      flockSize: flockSize,
      survivingBirds: survivingBirds,
      mortalityPct: mortalityPct,
      cyclesYear: cyclesYear,
      perCycle: {
        revenue: cycleRevenue,
        costs: {
          chicks: chickCost,
          feed: feedCost,
          vaccination: vaccinationCost,
          medication: medicationCost,
          labor: laborCost,
          electricity: electricityCost,
          water: waterCost,
          litter: litterCost,
          other: otherCost,
          total: cycleCost,
        },
        profit: cycleProfit,
      },
      annual: {
        revenue: annualRevenue,
        costs: annualCosts,
        profit: annualProfit,
      },
      investment: {
        housing: housingInvestment,
        equipment: equipmentInvestment,
        total: totalInvestment,
      },
      workingCapital: workingCapital,
      metrics: {
        roi: roi,
        paybackMonths: paybackMonths,
        costPerKg: costPerKg,
        profitPerBird: profitPerBird,
        feedPct: feedPct,
      },
      risks: {
        highMortality: {
          desc: 'Mortality doubles to ' + (mortalityPct * 2) + '%',
          annualProfit: highMortalityProfit,
        },
        highFeed: {
          desc: 'Feed prices rise 20%',
          annualProfit: highFeedProfit,
        },
        lowPrice: {
          desc: 'Selling price drops 15%',
          annualProfit: lowPriceProfit,
        },
      },
      cashFlow: cashFlow,
    };
  }

  function calculateLayers(inputs, countryData, production) {
    var model = production.layers;
    var management = inputs.management || 'smallholder';
    var flockSize = inputs.flockSize || 100;
    var rate = production.usdRates[inputs.countryCode] || 1;
    var eggsPerHenYear = model.eggsPerHenYear[management] || 240;
    var chickCost = flockSize * countryData.dayOldChick.layer;
    var rearingFeedCost = flockSize * model.feedRearing_kg * (
      (feedPrice(countryData, 'starter') + feedPrice(countryData, 'grower')) / 2
    );
    var vaccinationCost = flockSize * model.vaccinationUSD_per_bird * rate;
    var rearingMortality = model.mortalityRearing_pct / 100;
    var survivingToLay = Math.round(flockSize * (1 - rearingMortality));
    var layingMortality = model.mortalityLaying_pct / 100;
    var averageLayers = survivingToLay * (1 - layingMortality / 2);
    var layingFeedCost = survivingToLay * model.feedLayingPerYear_kg
      * feedPrice(countryData, 'layer_mash');
    var laborCost = countryData.labor_per_month * 12;
    var electricityCost = (countryData.electricity_per_month || 0) * 12;
    var waterCost = (countryData.water_per_month || 0) * 12;
    var litterCost = countryData.litter_per_bag
      ? Math.ceil(survivingToLay / production.layers.birdsPerSqM / 5)
        * countryData.litter_per_bag * 4
      : 0;
    var rearingCost = chickCost + rearingFeedCost + vaccinationCost;
    var operatingCost = layingFeedCost + laborCost + electricityCost + waterCost + litterCost;
    var annualCost = rearingCost + operatingCost;
    var miscCost = annualCost * 0.04;
    annualCost += miscCost;

    var eggsProduced = Math.round(averageLayers * eggsPerHenYear);
    var eggRevenue = eggsProduced * countryData.sellingPrice.egg_per_egg;
    var spentHens = Math.round(survivingToLay * (1 - layingMortality));
    var spentHenRevenue = spentHens * countryData.sellingPrice.spent_layer_per_bird;
    var annualRevenue = eggRevenue + spentHenRevenue;
    var annualProfit = annualRevenue - annualCost;
    var housingInvestment = 0;
    var equipmentInvestment = 0;
    if (!inputs.ownHouse) {
      var housingType = inputs.housingType || 'simple';
      housingInvestment = survivingToLay / production.layers.birdsPerSqM * (
        countryData.housing_per_sqm[housingType]
        || countryData.housing_per_sqm.simple
        || 0
      );
      equipmentInvestment = flockSize * (countryData.equipment_per_bird || 0);
    }
    var totalInvestment = housingInvestment + equipmentInvestment;
    var annualProfitAfterDepreciation = annualProfit - totalInvestment / 10;
    var investmentAndWorkingCapital = totalInvestment + rearingCost;
    var roi = investmentAndWorkingCapital > 0
      ? annualProfitAfterDepreciation / investmentAndWorkingCapital * 100
      : 0;
    var paybackMonths = annualProfitAfterDepreciation > 0
      ? investmentAndWorkingCapital / annualProfitAfterDepreciation * 12
      : 9999;
    var cratesOf30 = Math.floor(eggsProduced / 30);
    var costPerEgg = eggsProduced > 0 ? annualCost / eggsProduced : 0;
    var breakEvenEggPrice = eggsProduced > 0 ? annualCost / eggsProduced : 0;
    var feedPct = (layingFeedCost + rearingFeedCost) / annualCost * 100;
    var lowEggPriceProfit = eggsProduced * 0.85 * countryData.sellingPrice.egg_per_egg
      + spentHenRevenue - annualCost;
    var highFeedProfit = annualRevenue - (annualCost + layingFeedCost * 0.2);
    var highMortalityProfit = averageLayers * 0.9 * eggsPerHenYear
      * countryData.sellingPrice.egg_per_egg + spentHenRevenue * 0.9 - annualCost;
    var cashFlow = [];
    var monthlyRearingCost = rearingCost / 4;
    var monthlyOperatingCost = (operatingCost + miscCost) / 12;
    var monthlyRevenue = annualRevenue / 12;
    for (var month = 1; month <= 18; month += 1) {
      if (month <= 4) {
        cashFlow.push({
          label: 'Month ' + month,
          income: 0,
          expense: monthlyRearingCost,
          net: -monthlyRearingCost,
        });
      } else {
        cashFlow.push({
          label: 'Month ' + month,
          income: monthlyRevenue,
          expense: monthlyOperatingCost,
          net: monthlyRevenue - monthlyOperatingCost,
        });
      }
    }

    return {
      mode: 'layers',
      flockSize: flockSize,
      survivingToLay: survivingToLay,
      eggsPerHenYear: eggsPerHenYear,
      eggsProduced: eggsProduced,
      cratesOf30: cratesOf30,
      spentHens: spentHens,
      annual: {
        revenue: {
          eggs: eggRevenue,
          spentHens: spentHenRevenue,
          total: annualRevenue,
        },
        costs: {
          rearing: rearingCost,
          layingFeed: layingFeedCost,
          labor: laborCost,
          electricity: electricityCost,
          water: waterCost,
          litter: litterCost,
          misc: miscCost,
          total: annualCost,
        },
        profit: annualProfit,
      },
      investment: {
        housing: housingInvestment,
        equipment: equipmentInvestment,
        total: totalInvestment,
      },
      workingCapital: rearingCost,
      metrics: {
        roi: roi,
        paybackMonths: paybackMonths,
        costPerEgg: costPerEgg,
        breakEvenEggPrice: breakEvenEggPrice,
        feedPct: feedPct,
      },
      risks: {
        lowEggPrice: {
          desc: 'Egg price drops 15%',
          annualProfit: lowEggPriceProfit,
        },
        highFeed: {
          desc: 'Feed prices rise 20%',
          annualProfit: highFeedProfit,
        },
        highMortality: {
          desc: 'Laying mortality doubles',
          annualProfit: highMortalityProfit,
        },
      },
      cashFlow: cashFlow,
    };
  }

  function calculateIndigenous(inputs, countryData, production) {
    var model = production.indigenous;
    var flockSize = inputs.flockSize || 50;
    var rate = production.usdRates[inputs.countryCode] || 1;
    var mortalityPct = model.mortalityPct;
    var cyclesYear = model.cyclesPerYear;
    var chickCost = flockSize * countryData.dayOldChick.indigenous;
    var feedCost = flockSize * model.feedBreakdown_kg * (
      (feedPrice(countryData, 'starter') + feedPrice(countryData, 'grower')) / 2
    ) * 0.5;
    var laborCost = 16 / 4.33 * countryData.labor_per_month * 0.25;
    var vaccinationCost = flockSize * 0.01 * rate;
    var cycleCost = chickCost + feedCost + laborCost + vaccinationCost;
    var miscCost = cycleCost * 0.05;
    cycleCost += miscCost;
    var survivingBirds = Math.round(flockSize * (1 - mortalityPct / 100));
    var sellingPrice = countryData.sellingPrice.indigenous_live_per_bird;
    var cycleRevenue = survivingBirds * sellingPrice;
    var cycleProfit = cycleRevenue - cycleCost;
    var annualRevenue = cycleRevenue * cyclesYear;
    var annualCosts = cycleCost * cyclesYear;
    var annualProfit = annualRevenue - annualCosts;

    return {
      mode: 'indigenous',
      flockSize: flockSize,
      survivingBirds: survivingBirds,
      mortalityPct: mortalityPct,
      cyclesYear: cyclesYear,
      perCycle: {
        revenue: cycleRevenue,
        costs: {
          chicks: chickCost,
          feed: feedCost,
          labor: laborCost,
          vaccination: vaccinationCost,
          misc: miscCost,
          total: cycleCost,
        },
        profit: cycleProfit,
      },
      annual: {
        revenue: annualRevenue,
        costs: annualCosts,
        profit: annualProfit,
      },
      metrics: {
        roi: annualCosts > 0 ? annualProfit / annualCosts * 100 : 0,
        paybackMonths: annualProfit > 0 ? cycleCost / annualProfit * 12 : 9999,
        profitPerBird: survivingBirds > 0 ? cycleProfit / survivingBirds : 0,
        feedPct: feedCost / cycleCost * 100,
      },
      risks: {
        highMortality: {
          desc: 'Mortality rises to 35%',
          annualProfit: (Math.round(flockSize * 0.65) * sellingPrice - cycleCost) * cyclesYear,
        },
        lowPrice: {
          desc: 'Price drops 20%',
          annualProfit: (survivingBirds * sellingPrice * 0.8 - cycleCost) * cyclesYear,
        },
      },
    };
  }

  function calculate(inputs, countryData, explicitProductionData) {
    if (!countryData) return { error: 'No country data provided' };
    var mode = inputs.mode || 'broilers';
    try {
      var production = getProductionData(explicitProductionData);
      if (!production) throw new Error('PoultryProduction data not loaded');
      if (mode === 'broilers') return calculateBroilers(inputs, countryData, production);
      if (mode === 'layers') return calculateLayers(inputs, countryData, production);
      if (mode === 'indigenous') return calculateIndigenous(inputs, countryData, production);
      if (mode === 'compare') {
        return {
          mode: 'compare',
          broiler: calculateBroilers(Object.assign({}, inputs, {
            mode: 'broilers',
            flockSize: inputs.flockSize || 100,
          }), countryData, production),
          layer: calculateLayers(Object.assign({}, inputs, {
            mode: 'layers',
            flockSize: inputs.flockSize || 100,
          }), countryData, production),
          indigenous: calculateIndigenous(Object.assign({}, inputs, {
            mode: 'indigenous',
            flockSize: inputs.flockSize || 100,
          }), countryData, production),
        };
      }
      return { error: 'Unknown mode: ' + mode };
    } catch (error) {
      return { error: error.message || 'Calculation error' };
    }
  }

  return {
    calculate: calculate,
  };
}));
