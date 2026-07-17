!function() {
  "use strict";
  function e(e, t, r) {
    return t + " " + function(e, t) {
      return t = void 0 === t ? 0 : t, e.toLocaleString("en-US", {
        minimumFractionDigits: t,
        maximumFractionDigits: t
      });
    }(Math.round(e), void 0 === r ? 0 : r);
  }
  function t(e) {
    var t = COCOA_DATA.countries[e.countryCode], r = COCOA_DATA.agronomy.yieldFactors, a = null, i = t.avgYield_kg_ha;
    if (e.regionId) {
      for (var o = 0; o < t.regions.length; o++) {
        if (t.regions[o].id === e.regionId) {
          i = (a = t.regions[o]).yield_kg_ha;
          break;
        }
      }
    }
    var n = r.treeAge[e.treeAge] || .75, l = r.variety[e.variety] || 1, s = r.management[e.management] || .85, c = r.shade[e.shade] || 1, d = r.disease[e.disease] || .75, u = i * (n * l * s * c * d / (r.treeAge.prime_6_15 * r.variety.improved_hybrid * r.management.full_recommended * r.shade.moderate_shade * r.disease.good_ipm)), m = Math.max(50, Math.min(u, t.potentialYield_kg_ha)), p = m * e.farmSizeHa;
    return {
      yieldPerHa: Math.round(m),
      totalYield: Math.round(p),
      regionalBase: Math.round(i),
      nationalAvg: t.avgYield_kg_ha,
      potential: t.potentialYield_kg_ha,
      factors: {
        age: n,
        variety: l,
        management: s,
        shade: c,
        disease: d
      },
      region: a
    };
  }
  window.AfroTools = window.AfroTools || {}, window.AfroTools.CocoaEngine = {
    calculate: function(r) {
      if (!r || !r.countryCode || !COCOA_DATA.countries[r.countryCode]) {
        return {
          error: "Please select a valid cocoa-producing country."
        };
      }
      if (!r.farmSizeHa || r.farmSizeHa <= 0) {
        return {
          error: "Please enter a valid farm size (hectares)."
        };
      }
      var a = function(r) {
        var a = COCOA_DATA.countries[r.countryCode], i = a.currencySymbol, o = t(r), n = o.totalYield * a.farmGatePrice_per_kg, l = o.nationalAvg - o.yieldPerHa, s = o.potential - o.yieldPerHa, c = (o.yieldPerHa / o.nationalAvg * 100).toFixed(0);
        return {
          mode: "A",
          yieldPerHa: o.yieldPerHa,
          totalYield: o.totalYield,
          revenue: n,
          revenueFmt: e(n, i),
          nationalAvg: o.nationalAvg,
          potential: o.potential,
          regionalBase: o.regionalBase,
          gapVsNational: Math.max(0, l),
          gapVsPotential: Math.max(0, s),
          gapPct: c,
          farmGatePrice: a.farmGatePrice_per_kg,
          factors: o.factors,
          countryData: a
        };
      }(r), i = function(r) {
        var a = COCOA_DATA.countries[r.countryCode], i = a.currencySymbol, o = t(r), n = COCOA_DATA.agronomy, l = o.totalYield * a.farmGatePrice_per_kg, s = COCOA_DATA.usdRates[a.currency] || 1, c = n.productionCosts_USD_per_ha.total * s * r.farmSizeHa, d = l - c, u = d / r.farmSizeHa, m = c > 0 ? d / c * 100 : 0, p = a.minWageAnnual || 0, g = p > 0 ? d / p : null, y = n.productionCosts_USD_per_ha.labor.total * s * r.farmSizeHa, _ = n.productionCosts_USD_per_ha.inputs.total * s * r.farmSizeHa, A = n.productionCosts_USD_per_ha.tools * s * r.farmSizeHa, f = n.productionCosts_USD_per_ha.transport * s * r.farmSizeHa;
        return {
          mode: "B",
          yieldPerHa: o.yieldPerHa,
          totalYield: o.totalYield,
          revenue: l,
          revenueFmt: e(l, i),
          totalCosts: c,
          totalCostsFmt: e(c, i),
          netProfit: d,
          netProfitFmt: e(d, i),
          netPerHa: u,
          netPerHaFmt: e(u, i),
          roi_pct: m.toFixed(1),
          isProfitable: d > 0,
          costBreakdown: {
            labor: {
              amt: y,
              pct: (y / c * 100).toFixed(0)
            },
            inputs: {
              amt: _,
              pct: (_ / c * 100).toFixed(0)
            },
            tools: {
              amt: A,
              pct: (A / c * 100).toFixed(0)
            },
            transport: {
              amt: f,
              pct: (f / c * 100).toFixed(0)
            }
          },
          minWageAnnual: p,
          minWageNote: a.minWageNote,
          minWageRatioFmt: null !== g ? g.toFixed(1) + "x" : null,
          countryData: a
        };
      }(r), o = function(r) {
        var a = COCOA_DATA.countries[r.countryCode], i = a.currencySymbol, o = t(r), n = COCOA_DATA.qualityGrades, l = COCOA_DATA.certifications, s = COCOA_DATA.usdRates[a.currency] || 1, c = r.qualityGrade || "grade_2", d = r.certification || "none", u = n[c], m = l[d], p = 1 + u.premiumOverBase_pct / 100, g = o.totalYield * a.farmGatePrice_per_kg * p, y = 1 + n.grade_1.premiumOverBase_pct / 100, _ = o.totalYield * a.farmGatePrice_per_kg * y - o.totalYield * a.farmGatePrice_per_kg, A = 0;
        m.premiumPct > 0 && (A = g * (m.premiumPct / 100)), m.premiumUSD_t > 0 && (A += o.totalYield / 1e3 * m.premiumUSD_t * s);
        var f = g + A, v = [];
        return Object.keys(n).forEach(function(t) {
          var r = 1 + n[t].premiumOverBase_pct / 100, l = o.totalYield * a.farmGatePrice_per_kg * r;
          v.push({
            id: t,
            name: n[t].name,
            rev: l,
            revFmt: e(l, i),
            pct: n[t].premiumOverBase_pct
          });
        }), {
          mode: "C",
          totalYield: o.totalYield,
          currentGrade: u.name,
          baseRevenue: g,
          baseRevenueFmt: e(g, i),
          grade1Uplift: _,
          grade1UpliftFmt: e(_, i),
          certKey: d,
          certLabel: m.label,
          certPremium: A,
          certPremiumFmt: e(A, i),
          totalRevenue: f,
          totalRevenueFmt: e(f, i),
          certNotes: m.notes,
          scenarios: v,
          countryData: a
        };
      }(r), n = function(r) {
        var a = COCOA_DATA.countries[r.countryCode], i = a.currencySymbol, o = COCOA_DATA.usdRates[a.currency] || 1, n = COCOA_DATA.worldPrice, l = a.farmGatePrice_per_kg, s = a.exportPrice_per_kg, c = (l / s * 100).toFixed(1), d = s - l, u = n.livingIncomeRef_USD_per_tonne / 1e3 * o, m = n.currentPerTonne_USD / 1e3 * o, p = null, g = null;
        return r.farmSizeHa && r.countryCode && (g = (p = t(r)).totalYield * d), {
          mode: "D",
          farmGate: l,
          farmGateFmt: e(l, i) + "/kg",
          exportFOB: s,
          exportFOBFmt: e(s, i) + "/kg",
          sharePct: c,
          targetSharePct: 70,
          gapPerKg: d,
          gapPerKgFmt: e(d, i) + "/kg",
          livingIncomeLocal: u,
          livingIncomeFmt: e(1e3 * u, i) + "/tonne",
          currentWorldFmt: e(1e3 * m, i) + "/tonne",
          worldPriceUSD: n.currentPerTonne_USD,
          pricingSystem: a.pricingSystem,
          govBody: a.govBody,
          totalYield: p ? p.totalYield : null,
          farmGapRevenue: g,
          farmGapRevFmt: null !== g ? e(g, i) : null,
          countryData: a
        };
      }(r), l = function(e, t, r) {
        var a = [], i = COCOA_DATA.countries[e.countryCode];
        return "old_26_35" !== e.treeAge && "very_old_35p" !== e.treeAge || a.push({
          icon: "🌱",
          title: "Replant aging trees",
          body: "Trees over 25 years old yield <50% of their potential. Progressive replanting at 10% per year with improved varieties can double your yield within a decade."
        }), "local_forastero" === e.variety && a.push({
          icon: "🧬",
          title: "Switch to improved hybrid varieties",
          body: "Improved hybrids from " + i.govBody + " yield 30–100% more than local varieties and show better disease resistance. Free or subsidised seedlings may be available."
        }), "no_control" !== e.disease && "some_control" !== e.disease || a.push({
          icon: "🧴",
          title: "Improve disease management",
          body: "Black pod and mirids can cut yields by 30–50% with no control. A good IPM programme (2–3 fungicide sprays + mirid control) typically pays for itself 5× over in yield gain."
        }), "no_inputs" !== e.management && "minimal_pruning" !== e.management || a.push({
          icon: "🌿",
          title: "Apply fertilizer and prune regularly",
          body: "Annual pruning improves light penetration and reduces disease pressure. Fertilizer application at recommended rates can increase yields by 20–40% on depleted soils."
        }), "heavy_shade" === e.shade && a.push({
          icon: "☀️",
          title: "Reduce shade tree density",
          body: "Heavy shade (>60% canopy cover) suppresses cocoa yield. Selective removal of shade trees to 40–50% canopy cover can increase yields by up to 30% without increasing input costs."
        }), r && !r.isProfitable && a.push({
          icon: "📊",
          title: "Increase farm size or diversify income",
          body: "At current yields and costs, this farm size is not profitable. Consider intercropping with plantain or vegetables to generate income while young cocoa trees mature."
        }), a.push({
          icon: "✅",
          title: "Improve fermentation & drying quality",
          body: "Proper 6-day fermentation followed by 10 days of sun drying is free — it costs only time and attention. Achieving Grade 1 quality typically adds 10% to your revenue with no extra inputs."
        }), a.slice(0, 3);
      }(r, 0, i);
      return {
        ok: !0,
        modeA: a,
        modeB: i,
        modeC: o,
        modeD: n,
        recommendations: l,
        inputs: r
      };
    },
    getCountries: function() {
      return COCOA_DATA.countries;
    },
    getRegions: function(e) {
      return COCOA_DATA.countries[e] ? COCOA_DATA.countries[e].regions : [];
    },
    getQualityGrades: function() {
      return COCOA_DATA.qualityGrades;
    },
    getCertifications: function() {
      return COCOA_DATA.certifications;
    },
    getWorldPrice: function() {
      return COCOA_DATA.worldPrice;
    }
  };
}();
