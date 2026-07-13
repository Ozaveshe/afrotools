!function() {
  "use strict";
  var e = {
    cowpea: 40,
    groundnut: 40,
    soybean: 60,
    common_bean: 30,
    pigeon_pea: 35,
    chickpea: 30,
    lentils: 25,
    fallow_grass: 10,
    none: 0
  }, t = {
    cattle_manure: {
      N: 5,
      P: 3,
      K: 5,
      label: "Cattle Manure"
    },
    poultry_manure: {
      N: 15,
      P: 10,
      K: 8,
      label: "Poultry Manure"
    },
    compost: {
      N: 8,
      P: 4,
      K: 6,
      label: "Compost"
    }
  };
  function r(e) {
    return Math.round(100 * e) / 100;
  }
  function i(e, t) {
    for (var r = 0; r < e.length; r++) {
      if (e[r].id === t) {
        return e[r];
      }
    }
    return null;
  }
  var a = {
    calculate: function(t, a, o) {
      var n = i(a.crops, t.cropId), s = i(a.regions, t.regionId), l = o && o.crops && o.crops[t.cropId];
      if (!n) {
        return {
          error: !0,
          message: "Invalid crop selection."
        };
      }
      var p = n.nutrientUptake || l && l.nutrientUptake;
      if (!p) {
        return {
          error: !0,
          message: "Nutrient data not available for this crop."
        };
      }
      var u = parseFloat(t.targetYieldPerHa) || 1.3 * n.baseYieldPerHa, c = parseFloat(t.farmSizeHa) || 1, g = {
        N: p.N_kg_per_tonne * u,
        P: p.P2O5_kg_per_tonne * u,
        K: p.K2O_kg_per_tonne * u
      }, P = {
        N: 0,
        P: 0,
        K: 0
      };
      t.soilTest && t.soilTest.organicMatter && (P.N = 20 * (parseFloat(t.soilTest.organicMatter) || 0)),
      t.soilTest && t.soilTest.P_ppm && (P.P = 2 * (parseFloat(t.soilTest.P_ppm) || 0)),
      t.soilTest && t.soilTest.K_ppm && (P.K = 1.5 * (parseFloat(t.soilTest.K_ppm) || 0));
      var d = e[t.previousCrop] || 0, N = {
        N: Math.max(0, (g.N - P.N - d) / .5),
        P: Math.max(0, (g.P - P.P) / .25),
        K: Math.max(0, (g.K - P.K) / .6)
      }, m = {
        N: r(N.N),
        P: r(N.P),
        K: r(N.K)
      }, f = {
        N: r(N.N * c),
        P: r(N.P * c),
        K: r(N.K * c)
      }, h = this._convertToProducts(f.N, f.P, f.K, a.fertilizers || []), K = this._buildSchedule(h, n, f), v = 0, b = 0;
      h.forEach(function(e) {
        v += e.totalCostMarket, b += e.totalCostSubsidy;
      });
      var y = this._organicAlternatives(f), _ = a.fertilizerSubsidy || null, M = _ && _.active;
      return {
        cropName: n.name,
        cropId: t.cropId,
        regionName: s ? s.name : "",
        farmSizeHa: c,
        targetYieldPerHa: r(u),
        demand: {
          N: r(g.N),
          P: r(g.P),
          K: r(g.K)
        },
        soilSupply: P,
        nCredit: d,
        perHa: m,
        totalNPK: f,
        products: h,
        schedule: K,
        organic: y,
        costMarket: v,
        costSubsidy: M ? b : null,
        costPerHaMarket: Math.round(v / c),
        costPerHaSubsidy: M ? Math.round(b / c) : null,
        savings: M ? v - b : 0,
        currency: a.currency,
        currencySymbol: a.currencySymbol,
        subsidyInfo: _
      };
    },
    _convertToProducts: function(e, t, i, a) {
      if (!a || !a.length) {
        return [];
      }
      var o = {
        N: e,
        P: t,
        K: i
      }, n = [];
      a.filter(function(e) {
        var t = e.composition;
        return (t.N > 0 ? 1 : 0) + (t.P2O5 > 0 ? 1 : 0) + (t.K2O > 0 ? 1 : 0) >= 2;
      }).forEach(function(e) {
        if (!(o.N <= 0 && o.P <= 0 && o.K <= 0)) {
          var t = e.composition, i = e.bagSize_kg || 50, a = t.N > 0 ? o.N / (i * t.N / 100) : 1 / 0, s = t.P2O5 > 0 ? o.P / (i * t.P2O5 / 100) : 1 / 0, l = t.K2O > 0 ? o.K / (i * t.K2O / 100) : 1 / 0, p = Math.ceil(Math.min(a, s, l));
          if (!(p <= 0) && isFinite(p)) {
            var u = p * i * (t.N || 0) / 100, c = p * i * (t.P2O5 || 0) / 100, g = p * i * (t.K2O || 0) / 100;
            o.N = Math.max(0, o.N - u), o.P = Math.max(0, o.P - c), o.K = Math.max(0, o.K - g),
            n.push({
              name: e.name,
              composition: t,
              bags: p,
              bagSize_kg: i,
              totalWeight_kg: p * i,
              suppliedN: r(u),
              suppliedP: r(c),
              suppliedK: r(g),
              pricePerBag: e.pricePerBag,
              subsidyPrice: e.subsidyPrice || e.pricePerBag,
              totalCostMarket: p * e.pricePerBag,
              totalCostSubsidy: p * (e.subsidyPrice || e.pricePerBag)
            });
          }
        }
      });
      var s = a.filter(function(e) {
        var t = e.composition;
        return 1 == (t.N > 0 ? 1 : 0) + (t.P2O5 > 0 ? 1 : 0) + (t.K2O > 0 ? 1 : 0);
      });
      return s.sort(function(e, t) {
        return e.composition.N > 0 && t.composition.N <= 0 || e.composition.P2O5 > 0 && t.composition.P2O5 <= 0 ? -1 : 0;
      }), s.forEach(function(e) {
        var t = e.composition, i = e.bagSize_kg || 50, a = t.N > 0 ? "N" : t.P2O5 > 0 ? "P" : "K", s = t.N > 0 ? t.N : t.P2O5 > 0 ? t.P2O5 : t.K2O;
        if (!(o[a] <= 0)) {
          var l = Math.ceil(o[a] / (i * s / 100));
          if (!(l <= 0)) {
            var p = l * i * s / 100;
            o[a] = Math.max(0, o[a] - p);
            var u = {
              name: e.name,
              composition: t,
              bags: l,
              bagSize_kg: i,
              totalWeight_kg: l * i,
              suppliedN: 0,
              suppliedP: 0,
              suppliedK: 0,
              pricePerBag: e.pricePerBag,
              subsidyPrice: e.subsidyPrice || e.pricePerBag,
              totalCostMarket: l * e.pricePerBag,
              totalCostSubsidy: l * (e.subsidyPrice || e.pricePerBag)
            };
            "N" === a ? u.suppliedN = r(p) : "P" === a ? u.suppliedP = r(p) : u.suppliedK = r(p),
            n.push(u);
          }
        }
      }), n;
    },
    _buildSchedule: function(e, t, i) {
      var a = [], o = r(i.N / 3);
      a.push({
        stage: "Basal (at planting)",
        timing: "Apply at or just before planting",
        nutrients: {
          N: o,
          P: i.P,
          K: i.K
        },
        note: "Apply all phosphorus and potassium at planting. Mix into soil 5–10 cm deep."
      });
      var n = r(i.N / 3), s = t.growingPeriodDays ? Math.round(.25 * t.growingPeriodDays / 7) : 4;
      a.push({
        stage: "First Top-dress",
        timing: s + " weeks after planting (vegetative stage)",
        nutrients: {
          N: n,
          P: 0,
          K: 0
        },
        note: "Apply nitrogen along the plant rows. Avoid contact with leaves."
      });
      var l = r(i.N - o - n), p = t.growingPeriodDays ? Math.round(.5 * t.growingPeriodDays / 7) : 8;
      return a.push({
        stage: "Second Top-dress",
        timing: p + " weeks after planting (flowering/grain fill)",
        nutrients: {
          N: l,
          P: 0,
          K: 0
        },
        note: "Final nitrogen application at flowering or tasseling stage."
      }), a;
    },
    _organicAlternatives: function(e) {
      for (var i = [], a = Object.keys(t), o = 0; o < a.length; o++) {
        var n = a[o], s = t[n], l = e.N > 0 ? Math.round(e.N / s.N * 1e3) : 0;
        i.push({
          type: n,
          label: s.label,
          kgNeeded: l,
          tonnes: r(l / 1e3),
          suppliesN: r(l * s.N / 1e3),
          suppliesP: r(l * s.P / 1e3),
          suppliesK: r(l * s.K / 1e3)
        });
      }
      return i;
    },
    formatNumber: function(e) {
      return "number" != typeof e || isNaN(e) ? "0" : e.toLocaleString(void 0, {
        maximumFractionDigits: 2
      });
    }
  };
  window.AfroTools = window.AfroTools || {}, window.AfroTools.FertilizerEngine = a;
}();
