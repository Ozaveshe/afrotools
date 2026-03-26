/**
 * cocoa-engine.js
 * AfroTools Cocoa Yield & Export Price Tracker Engine
 * Modes: A = Yield Estimator, B = Profitability, C = Quality Premium, D = Export Gap
 * Requires: /data/agriculture/cocoa-data.js (COCOA_DATA)
 */
!function () {
  'use strict';

  window.AfroTools = window.AfroTools || {};

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function fmt(n, dp) {
    dp = dp === undefined ? 0 : dp;
    return n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  }

  function fmtCur(n, sym, dp) {
    return sym + ' ' + fmt(Math.round(n), dp === undefined ? 0 : dp);
  }

  function usdToLocal(usd, countryCode) {
    var rate = COCOA_DATA.usdRates[COCOA_DATA.countries[countryCode].currency] || 1;
    return usd * rate;
  }

  // ─── Core Yield Calculation ───────────────────────────────────────────────
  /**
   * Calculate yield per hectare based on regional base + agronomic multipliers.
   * @param {object} inputs
   * @param {string} inputs.countryCode
   * @param {string} inputs.regionId
   * @param {string} inputs.treeAge    — key into yieldFactors.treeAge
   * @param {string} inputs.variety    — key into yieldFactors.variety
   * @param {string} inputs.management — key into yieldFactors.management
   * @param {string} inputs.shade      — key into yieldFactors.shade
   * @param {string} inputs.disease    — key into yieldFactors.disease
   * @param {number} inputs.farmSizeHa
   * @returns {object} { yieldPerHa, totalYield, regionalBase, factors }
   */
  function calcYield(inputs) {
    var c       = COCOA_DATA.countries[inputs.countryCode];
    var factors = COCOA_DATA.agronomy.yieldFactors;

    // Base: regional yield if region found, else national average
    var region   = null;
    var baseYield = c.avgYield_kg_ha;
    if (inputs.regionId) {
      for (var i = 0; i < c.regions.length; i++) {
        if (c.regions[i].id === inputs.regionId) {
          region    = c.regions[i];
          baseYield = region.yield_kg_ha;
          break;
        }
      }
    }

    var ageFactor  = factors.treeAge[inputs.treeAge]     || 0.75;
    var varFactor  = factors.variety[inputs.variety]     || 1.00;
    var mgmtFactor = factors.management[inputs.management] || 0.85;
    var shadeFactor = factors.shade[inputs.shade]         || 1.00;
    var disFactor  = factors.disease[inputs.disease]      || 0.75;

    // Yield/ha = base × all multipliers (base already reflects national/regional reality)
    // We apply factors relative to the "prime_6_15 / improved_hybrid / full_recommended /
    // moderate_shade / good_ipm" reference point
    var refFactor  = factors.treeAge["prime_6_15"] *
                     factors.variety["improved_hybrid"] *
                     factors.management["full_recommended"] *
                     factors.shade["moderate_shade"] *
                     factors.disease["good_ipm"];
    // refFactor = 1.0 × 1.0 × 1.0 × 1.0 × 0.9 = 0.9
    // Scale actual factors relative to reference so base yield is achieved at reference
    var actualFactor = ageFactor * varFactor * mgmtFactor * shadeFactor * disFactor;
    var scaledYield  = baseYield * (actualFactor / refFactor);

    // Clamp to realistic range
    var yieldPerHa = Math.max(50, Math.min(scaledYield, c.potentialYield_kg_ha));
    var totalYield = yieldPerHa * inputs.farmSizeHa;

    return {
      yieldPerHa:    Math.round(yieldPerHa),
      totalYield:    Math.round(totalYield),
      regionalBase:  Math.round(baseYield),
      nationalAvg:   c.avgYield_kg_ha,
      potential:     c.potentialYield_kg_ha,
      factors: {
        age:        ageFactor,
        variety:    varFactor,
        management: mgmtFactor,
        shade:      shadeFactor,
        disease:    disFactor
      },
      region: region
    };
  }

  // ─── MODE A: Farm Yield Estimator ─────────────────────────────────────────
  function calcModeA(inputs) {
    var c   = COCOA_DATA.countries[inputs.countryCode];
    var sym = c.currencySymbol;
    var y   = calcYield(inputs);

    var revenue = y.totalYield * c.farmGatePrice_per_kg;

    // Yield gap
    var gapVsNational   = y.nationalAvg  - y.yieldPerHa;
    var gapVsPotential  = y.potential    - y.yieldPerHa;
    var gapPct          = ((y.yieldPerHa / y.nationalAvg) * 100).toFixed(0);

    return {
      mode: 'A',
      yieldPerHa:   y.yieldPerHa,
      totalYield:   y.totalYield,
      revenue:      revenue,
      revenueFmt:   fmtCur(revenue, sym),
      nationalAvg:  y.nationalAvg,
      potential:    y.potential,
      regionalBase: y.regionalBase,
      gapVsNational: Math.max(0, gapVsNational),
      gapVsPotential: Math.max(0, gapVsPotential),
      gapPct:       gapPct,
      farmGatePrice: c.farmGatePrice_per_kg,
      factors:      y.factors,
      countryData:  c
    };
  }

  // ─── MODE B: Profitability Analysis ──────────────────────────────────────
  function calcModeB(inputs) {
    var c    = COCOA_DATA.countries[inputs.countryCode];
    var sym  = c.currencySymbol;
    var y    = calcYield(inputs);
    var agro = COCOA_DATA.agronomy;

    // Revenue at farm-gate price
    var revenue = y.totalYield * c.farmGatePrice_per_kg;

    // Production costs — convert USD/ha estimates to local currency
    var usdRate     = COCOA_DATA.usdRates[c.currency] || 1;
    var costsUSD_ha = agro.productionCosts_USD_per_ha.total;
    var costsLocal_ha = costsUSD_ha * usdRate;
    var totalCosts    = costsLocal_ha * inputs.farmSizeHa;

    var netProfit    = revenue - totalCosts;
    var netPerHa     = netProfit / inputs.farmSizeHa;
    var roi_pct      = totalCosts > 0 ? (netProfit / totalCosts * 100) : 0;

    // Minimum wage comparison
    var minWage = c.minWageAnnual || 0;
    var minWageRatio = minWage > 0 ? (netProfit / minWage) : null;

    // Cost breakdown (local currency)
    var laborCost    = agro.productionCosts_USD_per_ha.labor.total    * usdRate * inputs.farmSizeHa;
    var inputsCost   = agro.productionCosts_USD_per_ha.inputs.total   * usdRate * inputs.farmSizeHa;
    var toolsCost    = agro.productionCosts_USD_per_ha.tools           * usdRate * inputs.farmSizeHa;
    var transportCost = agro.productionCosts_USD_per_ha.transport      * usdRate * inputs.farmSizeHa;

    return {
      mode: 'B',
      yieldPerHa:    y.yieldPerHa,
      totalYield:    y.totalYield,
      revenue:       revenue,
      revenueFmt:    fmtCur(revenue, sym),
      totalCosts:    totalCosts,
      totalCostsFmt: fmtCur(totalCosts, sym),
      netProfit:     netProfit,
      netProfitFmt:  fmtCur(netProfit, sym),
      netPerHa:      netPerHa,
      netPerHaFmt:   fmtCur(netPerHa, sym),
      roi_pct:       roi_pct.toFixed(1),
      isProfitable:  netProfit > 0,
      costBreakdown: {
        labor:     { amt: laborCost,     pct: (laborCost    / totalCosts * 100).toFixed(0) },
        inputs:    { amt: inputsCost,    pct: (inputsCost   / totalCosts * 100).toFixed(0) },
        tools:     { amt: toolsCost,     pct: (toolsCost    / totalCosts * 100).toFixed(0) },
        transport: { amt: transportCost, pct: (transportCost / totalCosts * 100).toFixed(0) }
      },
      minWageAnnual:  minWage,
      minWageNote:    c.minWageNote,
      minWageRatioFmt: minWageRatio !== null ? minWageRatio.toFixed(1) + 'x' : null,
      countryData:    c
    };
  }

  // ─── MODE C: Quality Premium Calculator ──────────────────────────────────
  function calcModeC(inputs) {
    var c    = COCOA_DATA.countries[inputs.countryCode];
    var sym  = c.currencySymbol;
    var y    = calcYield(inputs);
    var grades = COCOA_DATA.qualityGrades;
    var certs  = COCOA_DATA.certifications;
    var usdRate = COCOA_DATA.usdRates[c.currency] || 1;

    var baseGrade    = inputs.qualityGrade || 'grade_2';
    var certKey      = inputs.certification || 'none';
    var baseGradeObj = grades[baseGrade];
    var certObj      = certs[certKey];

    var basePricePct = 1 + (baseGradeObj.premiumOverBase_pct / 100);
    var baseRevenue  = y.totalYield * c.farmGatePrice_per_kg * basePricePct;

    // Grade 1 upgrade value
    var grade1Pct    = 1 + (grades["grade_1"].premiumOverBase_pct / 100);
    var grade1Revenue = y.totalYield * c.farmGatePrice_per_kg * grade1Pct;
    var grade1Uplift = grade1Revenue - (y.totalYield * c.farmGatePrice_per_kg);

    // Certification premium
    var certPremiumLocal = 0;
    if (certObj.premiumPct > 0) {
      certPremiumLocal = baseRevenue * (certObj.premiumPct / 100);
    }
    if (certObj.premiumUSD_t > 0) {
      var totalTonnes   = y.totalYield / 1000;
      certPremiumLocal += totalTonnes * certObj.premiumUSD_t * usdRate;
    }

    var totalRevenue = baseRevenue + certPremiumLocal;

    // Scenario comparison table
    var scenarios = [];
    Object.keys(grades).forEach(function(gk) {
      var gPct  = 1 + (grades[gk].premiumOverBase_pct / 100);
      var gRev  = y.totalYield * c.farmGatePrice_per_kg * gPct;
      scenarios.push({
        id:    gk,
        name:  grades[gk].name,
        rev:   gRev,
        revFmt: fmtCur(gRev, sym),
        pct:   grades[gk].premiumOverBase_pct
      });
    });

    return {
      mode: 'C',
      totalYield:       y.totalYield,
      currentGrade:     baseGradeObj.name,
      baseRevenue:      baseRevenue,
      baseRevenueFmt:   fmtCur(baseRevenue, sym),
      grade1Uplift:     grade1Uplift,
      grade1UpliftFmt:  fmtCur(grade1Uplift, sym),
      certKey:          certKey,
      certLabel:        certObj.label,
      certPremium:      certPremiumLocal,
      certPremiumFmt:   fmtCur(certPremiumLocal, sym),
      totalRevenue:     totalRevenue,
      totalRevenueFmt:  fmtCur(totalRevenue, sym),
      certNotes:        certObj.notes,
      scenarios:        scenarios,
      countryData:      c
    };
  }

  // ─── MODE D: Export Price Gap Tracker ────────────────────────────────────
  function calcModeD(inputs) {
    var c    = COCOA_DATA.countries[inputs.countryCode];
    var sym  = c.currencySymbol;
    var usdRate  = COCOA_DATA.usdRates[c.currency] || 1;
    var worldPrice = COCOA_DATA.worldPrice;

    var farmGate   = c.farmGatePrice_per_kg;
    var exportFOB  = c.exportPrice_per_kg;
    var sharePct   = (farmGate / exportFOB * 100).toFixed(1);
    var gapPerKg   = exportFOB - farmGate;

    // LID / living income context
    var livingIncomeLocal = (worldPrice.livingIncomeRef_USD_per_tonne / 1000) * usdRate;
    var currentWorldLocal = (worldPrice.currentPerTonne_USD / 1000) * usdRate;

    // Per-farm calculation if farm size given
    var y = null;
    var farmGapRevenue = null;
    if (inputs.farmSizeHa && inputs.countryCode) {
      y = calcYield(inputs);
      farmGapRevenue = y.totalYield * gapPerKg;
    }

    return {
      mode: 'D',
      farmGate:         farmGate,
      farmGateFmt:      fmtCur(farmGate, sym) + '/kg',
      exportFOB:        exportFOB,
      exportFOBFmt:     fmtCur(exportFOB, sym) + '/kg',
      sharePct:         sharePct,
      targetSharePct:   70,
      gapPerKg:         gapPerKg,
      gapPerKgFmt:      fmtCur(gapPerKg, sym) + '/kg',
      livingIncomeLocal: livingIncomeLocal,
      livingIncomeFmt:  fmtCur(livingIncomeLocal * 1000, sym) + '/tonne',
      currentWorldFmt:  fmtCur(currentWorldLocal * 1000, sym) + '/tonne',
      worldPriceUSD:    worldPrice.currentPerTonne_USD,
      pricingSystem:    c.pricingSystem,
      govBody:          c.govBody,
      totalYield:       y ? y.totalYield : null,
      farmGapRevenue:   farmGapRevenue,
      farmGapRevFmt:    farmGapRevenue !== null ? fmtCur(farmGapRevenue, sym) : null,
      countryData:      c
    };
  }

  // ─── RECOMMENDATIONS ─────────────────────────────────────────────────────
  function getRecommendations(inputs, modeA, modeB) {
    var recs = [];
    var c    = COCOA_DATA.countries[inputs.countryCode];

    // Tree age
    if (inputs.treeAge === 'old_26_35' || inputs.treeAge === 'very_old_35p') {
      recs.push({ icon: '🌱', title: 'Replant aging trees', body: 'Trees over 25 years old yield <50% of their potential. Progressive replanting at 10% per year with improved varieties can double your yield within a decade.' });
    }
    // Variety
    if (inputs.variety === 'local_forastero') {
      recs.push({ icon: '🧬', title: 'Switch to improved hybrid varieties', body: 'Improved hybrids from ' + c.govBody + ' yield 30–100% more than local varieties and show better disease resistance. Free or subsidised seedlings may be available.' });
    }
    // Disease control
    if (inputs.disease === 'no_control' || inputs.disease === 'some_control') {
      recs.push({ icon: '🧴', title: 'Improve disease management', body: 'Black pod and mirids can cut yields by 30–50% with no control. A good IPM programme (2–3 fungicide sprays + mirid control) typically pays for itself 5× over in yield gain.' });
    }
    // Management
    if (inputs.management === 'no_inputs' || inputs.management === 'minimal_pruning') {
      recs.push({ icon: '🌿', title: 'Apply fertilizer and prune regularly', body: 'Annual pruning improves light penetration and reduces disease pressure. Fertilizer application at recommended rates can increase yields by 20–40% on depleted soils.' });
    }
    // Shade
    if (inputs.shade === 'heavy_shade') {
      recs.push({ icon: '☀️', title: 'Reduce shade tree density', body: 'Heavy shade (>60% canopy cover) suppresses cocoa yield. Selective removal of shade trees to 40–50% canopy cover can increase yields by up to 30% without increasing input costs.' });
    }
    // Profitability
    if (modeB && !modeB.isProfitable) {
      recs.push({ icon: '📊', title: 'Increase farm size or diversify income', body: 'At current yields and costs, this farm size is not profitable. Consider intercropping with plantain or vegetables to generate income while young cocoa trees mature.' });
    }
    // Quality
    recs.push({ icon: '✅', title: 'Improve fermentation & drying quality', body: 'Proper 6-day fermentation followed by 10 days of sun drying is free — it costs only time and attention. Achieving Grade 1 quality typically adds 10% to your revenue with no extra inputs.' });

    return recs.slice(0, 3);
  }

  // ─── MAIN CALCULATE ──────────────────────────────────────────────────────
  function calculate(inputs) {
    if (!inputs || !inputs.countryCode || !COCOA_DATA.countries[inputs.countryCode]) {
      return { error: 'Please select a valid cocoa-producing country.' };
    }
    if (!inputs.farmSizeHa || inputs.farmSizeHa <= 0) {
      return { error: 'Please enter a valid farm size (hectares).' };
    }

    var modeA = calcModeA(inputs);
    var modeB = calcModeB(inputs);
    var modeC = calcModeC(inputs);
    var modeD = calcModeD(inputs);
    var recs  = getRecommendations(inputs, modeA, modeB);

    return {
      ok:    true,
      modeA: modeA,
      modeB: modeB,
      modeC: modeC,
      modeD: modeD,
      recommendations: recs,
      inputs: inputs
    };
  }

  // ─── Public API ──────────────────────────────────────────────────────────
  window.AfroTools.CocoaEngine = {
    calculate:           calculate,
    getCountries:        function () { return COCOA_DATA.countries; },
    getRegions:          function (cc) { return COCOA_DATA.countries[cc] ? COCOA_DATA.countries[cc].regions : []; },
    getQualityGrades:    function () { return COCOA_DATA.qualityGrades; },
    getCertifications:   function () { return COCOA_DATA.certifications; },
    getWorldPrice:       function () { return COCOA_DATA.worldPrice; }
  };

}();
