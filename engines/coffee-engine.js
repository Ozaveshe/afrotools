/**
 * coffee-engine.js
 * AfroTools Coffee Grade & Price Calculator Engine
 * Requires: /data/agriculture/coffee-data.js (defines window.COFFEE_DATA)
 *
 * Exposes: window.AfroTools.CoffeeEngine
 * Modes:
 *   A — gradeInfo(countryCode, gradeId) → grade details
 *   B — calcYield(inputs) → cherry/green bean yield + revenue
 *   C — qualityImprovement(countryCode, currentGradeId, targetGradeId, farmHa) → improvement plan
 *   D — processingCost(cherryKg, method) → stage-by-stage cost breakdown
 */
!function () {
  'use strict';

  window.AfroTools = window.AfroTools || {};

  // ── Helpers ───────────────────────────────────────────────────────────────

  function fmt(n, dp) {
    if (n === undefined || n === null || isNaN(n)) return '—';
    return Number(n).toLocaleString('en', { minimumFractionDigits: dp || 0, maximumFractionDigits: dp !== undefined ? dp : 0 });
  }

  function fmtUSD(n) {
    if (!n && n !== 0) return '—';
    return '$' + fmt(n, 2);
  }

  function getGrade(countryCode, gradeId) {
    var c = COFFEE_DATA.gradingSystems[countryCode];
    if (!c) return null;
    for (var i = 0; i < c.grades.length; i++) {
      if (c.grades[i].grade === gradeId) return c.grades[i];
    }
    return null;
  }

  // ── Engine ────────────────────────────────────────────────────────────────

  window.AfroTools.CoffeeEngine = {

    fmt: fmt,
    fmtUSD: fmtUSD,

    /**
     * MODE A — Grade Info
     * Returns full grade object for a country + grade combination.
     */
    gradeInfo: function (countryCode, gradeId) {
      var c = COFFEE_DATA.gradingSystems[countryCode];
      if (!c) return null;
      var grade = getGrade(countryCode, gradeId);
      if (!grade) return null;
      return {
        country: c,
        grade: grade,
        basePrice_arabica: COFFEE_DATA.prices.arabica_per_kg_USD,
        basePrice_robusta: COFFEE_DATA.prices.robusta_per_kg_USD,
        estimatedExportPrice: (COFFEE_DATA.prices[c.species[0] === 'arabica' ? 'arabica_per_kg_USD' : 'robusta_per_kg_USD']) * (1 + (grade.price_premium_pct || 0) / 100)
      };
    },

    /**
     * MODE B — Farm Yield & Revenue Calculator
     * inputs: {
     *   countryCode, species ('arabica'|'robusta'),
     *   treesPerHa, yieldLevel ('low'|'average'|'good'|'excellent'),
     *   processingMethod ('washed'|'natural'|'honey'),
     *   gradeId, farmHa, regionIdx (index into regions array)
     * }
     */
    calcYield: function (inputs) {
      var agron = COFFEE_DATA.agronomy[inputs.species];
      if (!agron) return null;

      var cherryPerTree = agron.yieldPerTree_kg_cherry[inputs.yieldLevel] || agron.yieldPerTree_kg_cherry.average;
      var treesPerHa    = parseFloat(inputs.treesPerHa) || agron.treesPerHa.semi_intensive;
      var farmHa        = parseFloat(inputs.farmHa)     || 1;

      var cherryKgPerHa = treesPerHa * cherryPerTree;

      var convRatio = inputs.processingMethod === 'natural'
        ? agron.cherryToGreen_natural
        : agron.cherryToGreen_ratio;

      var greenKgPerHa  = cherryKgPerHa / convRatio;
      var totalCherry   = cherryKgPerHa * farmHa;
      var totalGreen    = greenKgPerHa  * farmHa;

      // Base export price
      var basePrice = COFFEE_DATA.prices[inputs.species === 'arabica' ? 'arabica_per_kg_USD' : 'robusta_per_kg_USD'];

      // Grade premium
      var grade         = getGrade(inputs.countryCode, inputs.gradeId);
      var gradePremPct  = grade ? (grade.price_premium_pct || 0) : 0;

      // Region premium
      var c            = COFFEE_DATA.gradingSystems[inputs.countryCode];
      var regionPremPct = 0;
      var ri = parseInt(inputs.regionIdx);
      if (c && c.regions && ri >= 0 && ri < c.regions.length) {
        regionPremPct = c.regions[ri].premium_pct || 0;
      }

      var effectivePrice = basePrice * (1 + gradePremPct / 100) * (1 + regionPremPct / 100);
      var grossRevenueUSD = totalGreen * effectivePrice;

      // Processing costs
      var pc = COFFEE_DATA.processingCosts[inputs.processingMethod] || COFFEE_DATA.processingCosts.washed;
      var procStage1 = totalCherry * (pc.wetMillPerKgCherry || pc.dryingBedsPerKgCherry || pc.pulpingPerKgCherry || 0);
      var procStage2 = totalGreen  * ((pc.hullingPerKgGreen || pc.hullingSkinPerKgGreen || 0) + (pc.gradingPerKgGreen || 0) + (pc.transportPerKgGreen || 0));
      var totalProcCost = procStage1 + procStage2;

      var netRevenueUSD = grossRevenueUSD - totalProcCost;

      // Potential uplift (if they could reach top grade)
      var topGrade   = c ? c.grades[0] : null;
      var topPremPct = topGrade ? (topGrade.price_premium_pct || 0) : gradePremPct;
      var potentialPrice = basePrice * (1 + topPremPct / 100) * (1 + regionPremPct / 100);
      var potentialRevenue = totalGreen * potentialPrice;

      return {
        // Inputs echo
        treesPerHa:     treesPerHa,
        farmHa:         farmHa,
        species:        inputs.species,
        processingMethod: inputs.processingMethod,
        // Cherry
        cherryKgPerHa:  cherryKgPerHa,
        totalCherryKg:  totalCherry,
        // Green bean
        conversionRatio: convRatio,
        greenKgPerHa:   greenKgPerHa,
        totalGreenKg:   totalGreen,
        // Price
        basePrice:      basePrice,
        gradePremiumPct: gradePremPct,
        regionPremiumPct: regionPremPct,
        effectivePrice: effectivePrice,
        // Revenue
        grossRevenueUSD:  grossRevenueUSD,
        processingCostUSD: totalProcCost,
        netRevenueUSD:    netRevenueUSD,
        revenuePerHaUSD:  netRevenueUSD / farmHa,
        // Potential
        potentialPriceUSD:   potentialPrice,
        potentialRevenueUSD: potentialRevenue,
        revenueUpliftUSD:    potentialRevenue - grossRevenueUSD
      };
    },

    /**
     * MODE C — Quality Improvement
     * Returns recommendations and revenue uplift for moving from currentGrade → targetGrade.
     */
    qualityImprovement: function (countryCode, currentGradeId, targetGradeId, farmHa) {
      var c = COFFEE_DATA.gradingSystems[countryCode];
      if (!c) return null;

      var current = getGrade(countryCode, currentGradeId);
      var target  = getGrade(countryCode, targetGradeId);
      if (!current || !target) return null;

      var premDiff = (target.price_premium_pct || 0) - (current.price_premium_pct || 0);
      var species  = c.species[0];
      var agron    = COFFEE_DATA.agronomy[species];

      // Estimate green bean output from average farm in this country
      var estimatedGreenPerHa = c.avgYield_kg_ha ? c.avgYield_kg_ha / 5 : 150; // rough: avg cherry / 5
      var totalGreenKg = estimatedGreenPerHa * (farmHa || 1);

      var basePrice = COFFEE_DATA.prices[species === 'arabica' ? 'arabica_per_kg_USD' : 'robusta_per_kg_USD'];
      var currentPrice = basePrice * (1 + (current.price_premium_pct || 0) / 100);
      var targetPrice  = basePrice * (1 + (target.price_premium_pct  || 0) / 100);
      var annualUpliftUSD = totalGreenKg * (targetPrice - currentPrice);

      // General steps + country-specific defect info
      var steps = COFFEE_DATA.qualitySteps.general.slice();
      var ctryDefect = COFFEE_DATA.qualitySteps.defectReduction[countryCode];

      return {
        country:          c,
        currentGrade:     current,
        targetGrade:      target,
        isPossible:       premDiff > 0,
        premiumDiff:      premDiff,
        currentPriceUSD:  currentPrice,
        targetPriceUSD:   targetPrice,
        estimatedGreenKg: totalGreenKg,
        annualUpliftUSD:  annualUpliftUSD,
        steps:            steps,
        countryDefectNote: ctryDefect || null
      };
    },

    /**
     * MODE D — Processing Cost Breakdown
     * inputs: cherryKg (total harvest), method ('washed'|'natural'|'honey'), species
     */
    processingCost: function (cherryKg, method, species) {
      cherryKg = parseFloat(cherryKg) || 0;
      if (cherryKg <= 0) return null;

      var agron = COFFEE_DATA.agronomy[species || 'arabica'];
      var pc    = COFFEE_DATA.processingCosts[method] || COFFEE_DATA.processingCosts.washed;

      var convRatio   = method === 'natural' ? agron.cherryToGreen_natural : agron.cherryToGreen_ratio;
      var parchKg     = method === 'washed'  ? cherryKg / 4   : null;  // rough: 4:1 cherry:parchment
      var greenKg     = cherryKg / convRatio;

      var s1Cost, s1Name, s1Unit;
      if (method === 'washed') {
        s1Name = 'Wet Milling & Fermentation';
        s1Cost = cherryKg * pc.wetMillPerKgCherry;
        s1Unit = 'per kg cherry';
      } else if (method === 'honey') {
        s1Name = 'Pulping (skin-on drying)';
        s1Cost = cherryKg * pc.pulpingPerKgCherry;
        s1Unit = 'per kg cherry';
      } else {
        s1Name = 'Sun Drying on Raised Beds';
        s1Cost = cherryKg * pc.dryingBedsPerKgCherry;
        s1Unit = 'per kg cherry';
      }

      var s2Cost = greenKg * (pc.hullingPerKgGreen || pc.hullingSkinPerKgGreen || 0);
      var s3Cost = greenKg * pc.gradingPerKgGreen;
      var s4Cost = greenKg * pc.transportPerKgGreen;
      var totalCost = s1Cost + s2Cost + s3Cost + s4Cost;

      var baseExportPrice = COFFEE_DATA.prices[(species || 'arabica') === 'arabica' ? 'arabica_per_kg_USD' : 'robusta_per_kg_USD'];
      var grossRevenueUSD = greenKg * baseExportPrice;
      var margin = grossRevenueUSD - totalCost;
      var marginPct = grossRevenueUSD > 0 ? (margin / grossRevenueUSD * 100) : 0;

      return {
        cherryKg:         cherryKg,
        parchKg:          parchKg,
        greenKg:          greenKg,
        conversionRatio:  convRatio,
        method:           method,
        stages: [
          { step: 1, name: s1Name,                    costUSD: s1Cost, inputKg: cherryKg,  unitNote: s1Unit },
          { step: 2, name: 'Hulling / Milling',       costUSD: s2Cost, inputKg: greenKg,   unitNote: 'per kg green' },
          { step: 3, name: 'Grading & Sorting',       costUSD: s3Cost, inputKg: greenKg,   unitNote: 'per kg green' },
          { step: 4, name: 'Transport to Export Port', costUSD: s4Cost, inputKg: greenKg,   unitNote: 'per kg green' }
        ],
        totalCostUSD:      totalCost,
        costPerGreenKgUSD: totalCost / greenKg,
        grossRevenueUSD:   grossRevenueUSD,
        marginUSD:         margin,
        marginPct:         marginPct,
        exportPriceUSD:    baseExportPrice
      };
    }

  };

}();
