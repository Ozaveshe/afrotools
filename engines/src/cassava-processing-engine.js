!function() {
  "use strict";
  function r(r, a) {
    return isFinite(r) ? a + Math.round(r).toLocaleString() : a + "0";
  }
  function a(a, o, e) {
    var t = o, n = e;
    if (!t || !n) {
      return {
        error: !0,
        message: "Missing data"
      };
    }
    var s = t.symbol || "", i = parseFloat(a.rawTonnes) || 1, u = parseFloat(a.batchesPerMonth) || 4, c = parseFloat(a.rawPricePerTonne) || t.fresh_cassava_per_tonne, f = a.processingLevel || "manual", _ = parseFloat(a.distanceKm) || 0, p = 1e3 * i, l = p / n.conversionRate, h = {
      garri: "garri_per_kg",
      fufu_flour: "fufu_flour_per_kg",
      hqcf: "hqcf_per_kg",
      cassava_chips: "cassava_chips_per_kg",
      cassava_starch: "cassava_starch_per_kg"
    }[n.id], g = parseFloat(a.sellingPricePerKg) || t[h] || 0, d = l * g, v = i * c, w = n.laborHrsPerTonneRoots * i * (t.labor_per_day / 8), P = 0;
    n.firewoodKgPerTonneGarri && n.firewoodKgPerTonneGarri > 0 && (P = n.firewoodKgPerTonneGarri * l / 1e3 * t.firewood_per_kg);
    var M = n.waterLitresPerTonneRoots * i / 1e3 * t.water_per_1000L, y = Math.ceil(l / 50) * t.packaging_50kg_bag, k = (n.equipment[f] ? n.equipment[f].cost_usd : 0) * (t.labor_per_day / 15), m = k / (n.lifespan_months || 36) / u, T = 0;
    a.includeTransport && _ > 0 && (T = l / 1e3 * _ * t.transport_per_km_tonne);
    var b = v + w + P + M + y + m + T, q = d - b, A = l > 0 ? q / l : 0, F = d > 0 ? q / d * 100 : 0, K = q * u, D = 12 * K, C = b > 0 ? q / b * 100 : 0, R = q > 0 && k > 0 ? k / (q * u) : null;
    return {
      pathway: n.id,
      pathwayName: n.name,
      sym: s,
      rawKg: p,
      outputKg: Math.round(l),
      conversionRate: n.conversionRate,
      sellingPrice: g,
      revenue: Math.round(d),
      costs: {
        rawMaterial: Math.round(v),
        labor: Math.round(w),
        fuel: Math.round(P),
        water: Math.round(M),
        packaging: Math.round(y),
        equipment: Math.round(m),
        transport: Math.round(T),
        total: Math.round(b)
      },
      profitPerBatch: Math.round(q),
      profitPerKgOutput: Math.round(A),
      profitMarginPct: Math.round(10 * F) / 10,
      monthlyProfit: Math.round(K),
      annualProfit: Math.round(D),
      roi: Math.round(10 * C) / 10,
      paybackMonths: null !== R ? Math.ceil(R) : null,
      revenueDisplay: r(d, s),
      totalCostDisplay: r(b, s),
      profitDisplay: r(q, s),
      monthlyProfitDisplay: r(K, s),
      annualProfitDisplay: r(D, s),
      isProfit: q >= 0
    };
  }
  window.AfroTools = window.AfroTools || {}, window.AfroTools.CassavaProcessingEngine = {
    calculate: function(r, o) {
      var e = window.AfroTools.cassavaProcessing;
      if (!e) {
        return {
          error: !0,
          message: "Data not loaded"
        };
      }
      var t = e.countries[o];
      if (!t) {
        return {
          error: !0,
          message: "Country not found: " + o
        };
      }
      var n = e.pathways[r.pathwayId];
      return n ? a(r, t, n) : {
        error: !0,
        message: "Pathway not found: " + r.pathwayId
      };
    },
    compareAll: function(r, o) {
      var e = window.AfroTools.cassavaProcessing;
      if (!e) {
        return [];
      }
      var t = e.countries[o];
      return t ? function(r, o) {
        var e = window.AfroTools.cassavaProcessing;
        if (!e) {
          return [];
        }
        var t = [];
        return [ "garri", "fufu_flour", "hqcf", "cassava_chips", "cassava_starch" ].forEach(function(n) {
          var s = e.pathways[n];
          if (s && 0 !== o[{
            garri: "garri_per_kg",
            fufu_flour: "fufu_flour_per_kg",
            hqcf: "hqcf_per_kg",
            cassava_chips: "cassava_chips_per_kg",
            cassava_starch: "cassava_starch_per_kg"
          }[n]]) {
            var i = a(Object.assign({}, r, {
              pathwayId: n
            }), o, s);
            i.error || t.push(i);
          }
        }), t.sort(function(r, a) {
          return a.profitPerBatch - r.profitPerBatch;
        }), t;
      }(r, t) : [];
    },
    getDefaultPrice: function(r, a) {
      var o = window.AfroTools.cassavaProcessing;
      if (!o) {
        return 0;
      }
      var e = o.countries[r];
      return e && e[{
        garri: "garri_per_kg",
        fufu_flour: "fufu_flour_per_kg",
        hqcf: "hqcf_per_kg",
        cassava_chips: "cassava_chips_per_kg",
        cassava_starch: "cassava_starch_per_kg"
      }[a]] || 0;
    },
    getCountryData: function(r) {
      var a = window.AfroTools.cassavaProcessing;
      return a ? a.countries[r] : null;
    },
    getPathway: function(r) {
      var a = window.AfroTools.cassavaProcessing;
      return a ? a.pathways[r] : null;
    },
    formatCurrency: r,
    formatShort: function(r, a) {
      if (!isFinite(r)) {
        return a + "0";
      }
      var o = Math.abs(r);
      return a + (o >= 1e6 ? (r / 1e6).toFixed(1) + "M" : o >= 1e3 ? (r / 1e3).toFixed(1) + "K" : r.toFixed(0));
    }
  };
}();
