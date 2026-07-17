!function() {
  "use strict";
  function e(e, r) {
    if (null == e || isNaN(e)) {
      return r + "0";
    }
    var t = Math.abs(e);
    return r + (t >= 1e9 ? (e / 1e9).toFixed(1) + "B" : t >= 1e6 ? (e / 1e6).toFixed(1) + "M" : Math.round(e).toLocaleString());
  }
  function r(e) {
    return (e >= 0 ? "+" : "") + e.toFixed(1) + "%";
  }
  function t(e) {
    return Math.round(100 * e) / 100;
  }
  function o(r) {
    var o = window.AquaData;
    if (!o) {
      return {
        error: "AquaData not loaded"
      };
    }
    var a = r.countryCode, n = r.speciesId, i = o.COSTS[a], s = o.SPECIES[n];
    if (!i || !s) {
      return {
        error: "Data not found for " + a + "/" + n
      };
    }
    var l = i.symbol, c = function(e) {
      return "tarpaulin_tank" === e.system ? e.pondArea / 200 : e.pondArea;
    }(r), u = s.stockingDensity[r.system] || s.stockingDensity.earthen_pond, g = "low" === r.densityLevel ? u.low : "high" === r.densityLevel ? u.high : u.medium, f = Math.round(c * g), p = "good" === r.managementLevel ? s.survivalRate_pct.good / 100 : "poor" === r.managementLevel ? s.survivalRate_pct.poor / 100 : s.survivalRate_pct.average / 100, d = Math.round(f * p), v = "min" === r.targetSizeLevel ? s.marketSize_kg.min : "premium" === r.targetSizeLevel ? s.marketSize_kg.premium : s.marketSize_kg.typical, h = t(d * v), _ = r.cyclesPerYear || 1, m = t(h * _), y = "good" === r.managementLevel ? s.feedConversionRatio.good : "poor" === r.managementLevel ? s.feedConversionRatio.poor : s.feedConversionRatio.average, C = t(h * y), P = r.feedType || "local_float", b = i.feed_per_kg[P] || i.feed_per_kg.local_float, k = t(C * b), w = Math.ceil(C / 25), M = i.fingerling[n] || i.fingerling[Object.keys(i.fingerling)[0]] || 0, L = t(f * M), R = t((r.laborDays || i.labor_days_cycle) * i.labor_per_day * (1 - (r.familyLaborPct || 0) / 100 * .5)), K = t((i.electricity_monthly || 0) * (r.growPeriodMonths / 1)), S = t((i.water_monthly || 0) * r.growPeriodMonths), I = i.medications_cycle || 0, A = t(h * (i.transport_per_kg || 0)), x = k + L + R + K + S + I + A, z = function(e, r) {
      var t = e.system, o = e.pondArea;
      if (e.hasExistingInfra) {
        return 0;
      }
      var a = 0;
      if ("earthen_pond" === t || "concrete_tank" === t) {
        var n = "earthen_pond" === t ? "earthen_pond_m2" : "concrete_tank_m2";
        a = o * (r.infrastructure[n] || 0);
      } else if ("tarpaulin_tank" === t) {
        var i = r.infrastructure.tarpaulin_1000L || 0, s = r.infrastructure.tarpaulin_5000L || 0, l = o % 5e3;
        a = Math.ceil(o / 5e3) * s, l > 0 && l <= 1e3 ? a += i : l > 1e3 && (a += Math.ceil(l / 1e3) * i);
      } else {
        "cage" === t && (a = o * (r.infrastructure.earthen_pond_m2 || 0) * .4);
      }
      return a + (r.infrastructure.pump || 0) + (r.infrastructure.aerator || 0) + (e.needsBorehole && r.infrastructure.borehole || 0) + (r.infrastructure.nets_scales || 0);
    }(r, i), D = t(z / 10), E = t(x + D), F = function(e, r, t) {
      return "smoked" === r ? e + "_smoked" : "dried" === r ? e + "_dried" : "fillet" === r ? e + "_fillet" : "live" === t ? e + "_live" : e + "_fresh";
    }(n, r.processingLevel, r.sellingMethod), O = i.selling_per_kg[F] || i.selling_per_kg[n + "_fresh"] || i.selling_per_kg[n + "_live"] || Object.values(i.selling_per_kg)[0], T = t(h * O), j = 0;
    r.processingLevel && "none" !== r.processingLevel && (j = t(T * ((i.processing_cost_pct || 10) / 100)));
    var q = t(T - j), B = t(q - E), H = t(B * _), N = z > 0 ? t(H / z * 100) : null, W = H > 0 ? t(z / H * 12) : null, Y = h > 0 ? t(E / h) : 0, G = h > 0 ? t(E / h) : 0, J = q > 0 ? t(B / q * 100) : 0, Q = [ {
      label: "Feed",
      value: k,
      pct: 0
    }, {
      label: "Fingerlings",
      value: L,
      pct: 0
    }, {
      label: "Labor",
      value: R,
      pct: 0
    }, {
      label: "Electricity",
      value: K,
      pct: 0
    }, {
      label: "Water",
      value: S,
      pct: 0
    }, {
      label: "Medications",
      value: I,
      pct: 0
    }, {
      label: "Transport",
      value: A,
      pct: 0
    }, {
      label: "Infra (amort)",
      value: D,
      pct: 0
    } ].filter(function(e) {
      return e.value > 0;
    });
    Q.forEach(function(e) {
      e.pct = E > 0 ? t(e.value / E * 100) : 0;
    });
    var U, V, X, Z, $, ee, re, te, oe, ae, ne, ie, se, le, ce, ue, ge, fe, pe = function(e, r, o, a, n) {
      for (var i = [], s = 1; s <= o; s++) {
        var l = e.growthProfile[s] || e.growthProfile[Object.keys(e.growthProfile).length], c = t(n * (l / 1e3) * (l < 200 ? .05 : l < 500 ? .03 : .02) * 30 * a);
        i.push({
          month: s,
          weightG: l,
          weightKg: t(l / 1e3),
          feedCostMonth: c
        });
      }
      return i;
    }(s, 0, r.growPeriodMonths, b, d), de = (V = (U = {
      inputs: r,
      costs: i,
      species: s,
      fishHarvested: d,
      harvestKg: h,
      fcr: y,
      totalCostPerCycle: E,
      revenue: T,
      processingCost: j,
      profitPerCycle: B,
      feedPricePerKg: b,
      sellingPrice: O,
      feedCost: k,
      fingerlingCost: L,
      laborCost: R,
      mktWeight: v
    }).profitPerCycle, U.costs.symbol, X = U.species.survivalRate_pct.poor / 100, Math.round(U.inputs.areaM2 * (U.fishHarvested / (U.inputs.pondArea || 1)) * X / X),
    Z = t(U.harvestKg * (U.species.survivalRate_pct.poor / 100) / (("good" === U.inputs.managementLevel ? U.species.survivalRate_pct.good : U.species.survivalRate_pct.average) / 100)),
    $ = t(Z * U.sellingPrice), ee = t(Z * U.fcr * U.feedPricePerKg), re = t($ - (U.totalCostPerCycle - U.feedCost - U.fingerlingCost + ee + Z * (U.fingerlingCost / (U.harvestKg || 1)))),
    te = t(1.3 * U.feedCost), oe = t(V - (te - U.feedCost)), ae = t(.8 * U.revenue),
    ne = t(V - (U.revenue - ae)), ie = t(1.6 * U.revenue), se = t(ie * ((U.costs.processing_cost_pct || 10) / 100)),
    le = t(V + (ie - se - U.revenue)), ce = t(1.25 * U.harvestKg), ue = t(ce * U.sellingPrice),
    ge = t(1.25 * U.feedCost), fe = t(U.profitPerCycle + (ue - U.revenue) - (ge - U.feedCost)),
    [ {
      label: "If survival drops to " + U.species.survivalRate_pct.poor + "%",
      profit: re,
      change: t(re - V),
      negative: re < V
    }, {
      label: "If feed price rises 30%",
      profit: oe,
      change: t(oe - V),
      negative: !0
    }, {
      label: "If selling price drops 20%",
      profit: ne,
      change: t(ne - V),
      negative: !0
    }, {
      label: "If you smoke/process fish (×1.6 revenue)",
      profit: le,
      change: t(le - V),
      negative: le < V
    }, {
      label: "If yield improves by 25%",
      profit: fe,
      change: t(fe - V),
      negative: !1
    } ]);
    return {
      fishStocked: f,
      survivalPct: Math.round(100 * p),
      fishHarvested: d,
      harvestKg: h,
      cyclesPerYear: _,
      annualKg: m,
      feedKg: C,
      feedBags: w,
      growPeriodMonths: r.growPeriodMonths,
      infraTotal: z,
      infraAmortized: D,
      feedCost: k,
      fingerlingCost: L,
      laborCost: R,
      electricityCost: K,
      waterCost: S,
      medicationsCost: I,
      transportCost: A,
      processingCost: j,
      opCostTotal: x,
      totalCostPerCycle: E,
      revenue: T,
      netRevenue: q,
      profitPerCycle: B,
      annualProfit: H,
      roiPct: N,
      paybackMonths: W,
      costPerKg: Y,
      breakEvenPrice: G,
      profitMargin: J,
      sellingPrice: O,
      feedPricePerKg: b,
      fingerlingPrice: M,
      breakdown: Q,
      growth: pe,
      scenarios: de,
      sym: l,
      fmt: function(r) {
        return e(r, l);
      },
      isProfit: B >= 0
    };
  }
  "undefined" != typeof window && (window.AquaROI = {
    calculate: o,
    fmt: e,
    pct: r
  }), "undefined" != typeof module && module.exports && (module.exports = {
    calculate: o,
    fmt: e,
    pct: r
  });
}();
