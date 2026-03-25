// /engines/greenhouse-engine.js
// ═══════════════════════════════════════════════════════════
// GREENHOUSE COST ESTIMATOR ENGINE
// Depends on: /data/agriculture/greenhouse-data.js
// ═══════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Helpers ──────────────────────────────────────────────

  function fmtNum(n) {
    return Math.round(n).toLocaleString('en-US');
  }

  function fmtMoney(amount, symbol) {
    return symbol + '\u00a0' + fmtNum(amount);
  }

  function fmtPct(n) {
    return (Math.round(n * 10) / 10).toFixed(1) + '%';
  }

  function fmtYears(n) {
    if (!isFinite(n) || n <= 0) return 'N/A';
    if (n < 1) return '< 1 year';
    if (n >= 20) return '> 20 years';
    return (Math.round(n * 10) / 10).toFixed(1) + ' yrs';
  }

  // ── Core calculation ──────────────────────────────────────

  function calculate(params) {
    var countryCode  = params.countryCode;
    var type         = params.greenhouseType;
    var area         = params.area;
    var cropId       = params.crop;
    var cycles       = params.cyclesPerYear;
    var waterSource  = params.waterSource;    // 'municipal' | 'borehole' | 'rain'
    var isNewSetup   = params.isNewSetup;     // true/false

    var cd       = GREENHOUSE_DATA.countries[countryCode];
    var typeInfo = GREENHOUSE_DATA.types[type];
    var cropMeta = GREENHOUSE_DATA.crops[cropId];
    var cropData = cd && cd.crops ? cd.crops[cropId] : null;

    if (!cd || !typeInfo || !cropData) return null;

    // ── 1. SETUP COSTS ──────────────────────────────────────
    var structCostPerM2 = cd.struct[type] || cd.struct.steel_polythene;
    var structCost    = area * structCostPerM2;
    var groundPrep    = area * cd.ground_prep;
    var dripIrrig     = area * cd.irrigation_drip;
    var fertigCost    = area * cd.fertigation;
    var inputsCost    = area * cd.initial_inputs;

    // Borehole: roughly 4× the drip kit cost for the borehole+pump, only if new setup
    var boreholeCost  = (waterSource === 'borehole' && isNewSetup)
                          ? area * cd.irrigation_drip * 4
                          : 0;

    var totalSetup = structCost + groundPrep + dripIrrig + fertigCost + inputsCost + boreholeCost;

    // ── 2. ANNUAL RUNNING COSTS ──────────────────────────────
    // Production cost: seeds, fert, labour, pest mgmt — per m² per cycle
    var productionCost = area * cropData.running * cycles;

    // Cover replacement (annualized)
    var coverCost = 0;
    if (type === 'wooden_polythene' || type === 'steel_polythene' || type === 'hydroponic_tunnel') {
      var mult = typeInfo.coverReplaceMultiplier;
      coverCost = area * cd.polythene_replace_cost_per_m2 * mult / typeInfo.coverLifespan;
    } else if (type === 'shade_house') {
      coverCost = area * cd.polythene_replace_cost_per_m2 * 0.65 / typeInfo.coverLifespan;
    } else if (type === 'steel_polycarbonate') {
      // Panels are ~30% of structure cost; replaced after 12 years
      coverCost = (structCost * 0.3) / typeInfo.coverLifespan;
    }

    // Maintenance: 1.5% of structure cost per year
    var maintenanceCost = structCost * 0.015;

    // Water source modifiers
    var waterExtra = 0;
    if (waterSource === 'borehole') {
      // Electricity for pumping (~8% on top of production) + borehole amortisation over 15 yr
      waterExtra = productionCost * 0.08;
      if (isNewSetup) waterExtra += boreholeCost / 15;
    } else if (waterSource === 'rain') {
      // Rain harvest reduces water cost component (~8% saving)
      waterExtra = -productionCost * 0.08;
    }

    var totalRunning = productionCost + coverCost + maintenanceCost + waterExtra;
    if (totalRunning < 0) totalRunning = 0;

    // ── 3. ANNUAL REVENUE ────────────────────────────────────
    var yieldPerCycle   = cropData.yield;              // kg/m²/cycle
    var totalYieldKg    = area * yieldPerCycle * cycles;
    var revenueLow      = totalYieldKg * cropData.price.low;
    var revenueMid      = totalYieldKg * cropData.price.mid;
    var revenueHigh     = totalYieldKg * cropData.price.high;

    // ── 4. NET PROFIT & METRICS ──────────────────────────────
    var netProfit   = revenueMid - totalRunning;
    var roi         = totalSetup > 0 ? (netProfit / totalSetup) * 100 : 0;
    var payback     = netProfit > 0 ? totalSetup / netProfit : Infinity;

    // Break-even: how many kg/year needed to cover running costs
    var breakEvenKg     = totalRunning / cropData.price.mid;
    var breakEvenPerM2  = area > 0 ? breakEvenKg / area : 0;

    // ── 5. OPEN-FIELD COMPARISON ─────────────────────────────
    var openYieldPerM2  = cropMeta ? cropMeta.openFieldYieldPerM2 : 0; // kg/m²/year
    var openYieldTotal  = area * openYieldPerM2;
    var openRevenue     = openYieldTotal * cropData.price.low;          // no quality premium
    var openRunning     = productionCost * 0.42;                        // ~42% less input cost
    var openProfit      = openRevenue - openRunning;

    // ── 6. PRICE SCENARIOS ───────────────────────────────────
    var scenarios = {
      low:  { revenue: revenueLow,  profit: revenueLow  - totalRunning },
      mid:  { revenue: revenueMid,  profit: netProfit },
      high: { revenue: revenueHigh, profit: revenueHigh - totalRunning }
    };

    return {
      // Meta
      country:   cd,
      type:      typeInfo,
      cropMeta:  cropMeta,
      cropData:  cropData,
      area:      area,
      cycles:    cycles,
      symbol:    cd.symbol,

      // Setup
      setup: {
        structure:   structCost,
        groundPrep:  groundPrep,
        drip:        dripIrrig,
        fertigation: fertigCost,
        inputs:      inputsCost,
        borehole:    boreholeCost,
        total:       totalSetup
      },

      // Running
      running: {
        production:   productionCost,
        cover:        coverCost,
        maintenance:  maintenanceCost,
        water:        waterExtra,
        total:        totalRunning
      },

      // Revenue
      revenue: {
        yieldKg:  totalYieldKg,
        yieldPerM2: yieldPerCycle * cycles,
        low:      revenueLow,
        mid:      revenueMid,
        high:     revenueHigh
      },

      // Metrics
      netProfit:       netProfit,
      roi:             roi,
      payback:         payback,
      breakEvenKg:     breakEvenKg,
      breakEvenPerM2:  breakEvenPerM2,

      // Comparison
      openField: {
        yieldTotal:  openYieldTotal,
        revenue:     openRevenue,
        running:     openRunning,
        profit:      openProfit
      },

      // Scenarios
      scenarios: scenarios,

      // Utilities
      fmt: function (n) { return fmtMoney(n, cd.symbol); },
      fmtKg: function (n) { return fmtNum(n) + ' kg'; },
      fmtPct: fmtPct,
      fmtYears: fmtYears
    };
  }

  // ── Public API ────────────────────────────────────────────

  window.GHEngine = {
    calculate: calculate,
    availableCrops: function (countryCode) {
      var cd = GREENHOUSE_DATA.countries[countryCode];
      if (!cd) return [];
      return Object.keys(cd.crops).map(function (k) {
        var cm = GREENHOUSE_DATA.crops[k] || {};
        return { id: k, name: cm.name || k, icon: cm.icon || '' };
      });
    },
    availableTypes: function () {
      return Object.keys(GREENHOUSE_DATA.types).map(function (k) {
        var t = GREENHOUSE_DATA.types[k];
        return { id: k, name: t.name, desc: t.desc, icon: t.icon };
      });
    },
    countryData: function (code) { return GREENHOUSE_DATA.countries[code]; }
  };

}());
