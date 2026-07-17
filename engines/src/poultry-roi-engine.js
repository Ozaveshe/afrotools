!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var e = null;
  function r() {
    return e || (e = window.AfroTools.PoultryProduction), e || (console.error("[PoultryROI] PoultryProduction data not loaded. Ensure the data script is included before this engine."),
    null);
  }
  function i(e, r) {
    return e.feed_per_kg && e.feed_per_kg[r] ? e.feed_per_kg[r] : 0;
  }
  function o(e, o) {
    var t, n = r().broilers, a = e.management || "smallholder", s = e.flockSize || 100, l = n.mortalityPct[a] || 8, c = e.cyclesPerYear || n.cyclesPerYear[a] || 4, d = s * o.dayOldChick.broiler, u = s * n.feedBreakdown.starter_kg * i(o, "starter") + s * n.feedBreakdown.grower_kg * i(o, "grower") + s * n.feedBreakdown.finisher_kg * i(o, "finisher"), g = (n.vaccinationUSD_per_bird,
    o.symbol, (t = r()) && t.usdRates && t.usdRates.null), p = r().usdRates[e.countryCode] || 1;
    g = s * n.vaccinationUSD_per_bird * p;
    var _ = s * n.medicationUSD_per_bird * p, f = n.cycleWeeks, h = f / 4.33 * o.labor_per_month, m = o.electricity_per_month ? f / 4.33 * o.electricity_per_month : 0, y = o.water_per_month ? f / 4.33 * o.water_per_month : 0, P = s / n.birdsPerSqM, b = Math.ceil(P / 5), k = o.litter_per_bag ? b * o.litter_per_bag : 0, v = d + u + g + _ + h + m + y + k, w = .04 * v;
    v += w;
    var M = Math.round(s * (1 - l / 100)), S = o.sellingPrice.broiler_per_bird || 2 * o.sellingPrice.broiler_live_per_kg, C = M * S, z = C - v, q = 0, O = 0;
    if (!e.ownHouse) {
      var R = e.housingType || "simple";
      q = P * (o.housing_per_sqm[R] || o.housing_per_sqm.simple || 0), O = s * (o.equipment_per_bird || 0);
    }
    var B = q + O, Y = v, E = C * c, F = v * c, T = E - F, H = T - B / 10, U = B + Y, A = U > 0 ? H / U * 100 : T > 0 ? 999 : 0, D = H > 0 ? U / H * 12 : 9999, L = M > 0 ? v / (2 * M) : 0, j = M > 0 ? z / M : 0, x = u / v * 100, I = l, W = (Math.round(s * (1 - 2 * I / 100)) * S - v) * c, K = (C - (v - u + 1.2 * u)) * c, N = (.85 * C - v) * c, G = function(e, r, i, o, t, n, a, s) {
      for (var l = [], c = Math.min(s, 4), d = 0; d < c; d++) {
        l.push({
          label: "Cycle " + (d + 1) + " in",
          amount: -o,
          type: "expense"
        }), l.push({
          label: "Cycle " + (d + 1) + " out",
          amount: t,
          type: "revenue"
        });
      }
      return l;
    }(0, 0, 0, v, C, 0, 0, c);
    return {
      mode: "broilers",
      flockSize: s,
      survivingBirds: M,
      mortalityPct: l,
      cyclesYear: c,
      perCycle: {
        revenue: C,
        costs: {
          chicks: d,
          feed: u,
          vaccination: g,
          medication: _,
          labor: h,
          electricity: m,
          water: y,
          litter: k,
          other: w,
          total: v
        },
        profit: z
      },
      annual: {
        revenue: E,
        costs: F,
        profit: T
      },
      investment: {
        housing: q,
        equipment: O,
        total: B
      },
      workingCapital: Y,
      metrics: {
        roi: A,
        paybackMonths: D,
        costPerKg: L,
        profitPerBird: j,
        feedPct: x
      },
      risks: {
        highMortality: {
          desc: "Mortality doubles to " + 2 * I + "%",
          annualProfit: W
        },
        highFeed: {
          desc: "Feed prices rise 20%",
          annualProfit: K
        },
        lowPrice: {
          desc: "Selling price drops 15%",
          annualProfit: N
        }
      },
      cashFlow: G
    };
  }
  function t(e, o) {
    var t = r().layers, n = e.management || "smallholder", a = e.flockSize || 100, s = r().usdRates[e.countryCode] || 1, l = t.eggsPerHenYear[n] || 240, c = a * o.dayOldChick.layer, d = a * t.feedRearing_kg * ((i(o, "starter") + i(o, "grower")) / 2), u = a * t.vaccinationUSD_per_bird * s, g = t.mortalityRearing_pct / 100, p = Math.round(a * (1 - g)), _ = t.mortalityLaying_pct / 100, f = p * (1 - _ / 2), h = p * t.feedLayingPerYear_kg * i(o, "layer_mash"), m = 12 * o.labor_per_month, y = 12 * (o.electricity_per_month || 0), P = 12 * (o.water_per_month || 0), b = o.litter_per_bag ? Math.ceil(p / r().layers.birdsPerSqM / 5) * o.litter_per_bag * 4 : 0, k = c + d + u, v = h + m + y + P + b, w = k + v, M = .04 * w;
    w += M;
    var S = Math.round(f * l), C = S * o.sellingPrice.egg_per_egg, z = Math.round(p * (1 - _)), q = z * o.sellingPrice.spent_layer_per_bird, O = C + q, R = O - w, B = 0, Y = 0;
    if (!e.ownHouse) {
      var E = e.housingType || "simple";
      B = p / r().layers.birdsPerSqM * (o.housing_per_sqm[E] || o.housing_per_sqm.simple || 0),
      Y = a * (o.equipment_per_bird || 0);
    }
    var F = B + Y, T = R - F / 10, H = F + k, U = H > 0 ? T / H * 100 : 0, A = T > 0 ? H / T * 12 : 9999, D = Math.floor(S / 30), L = S > 0 ? w / S : 0, j = S > 0 ? w / S : 0, x = (h + d) / w * 100, I = .85 * S * o.sellingPrice.egg_per_egg + q - w, W = O - (w + .2 * h), K = .9 * f * l * o.sellingPrice.egg_per_egg + .9 * q - w, N = function(e, r, i, o) {
      for (var t = [], n = r / 4, a = i / 12, s = o / 12, l = 1; l <= 18; l++) {
        if (l <= 4) {
          t.push({
            label: "Month " + l,
            income: 0,
            expense: n,
            net: -n
          });
        } else {
          var c = s - a;
          t.push({
            label: "Month " + l,
            income: s,
            expense: a,
            net: c
          });
        }
      }
      return t;
    }(0, k, v + M, O);
    return {
      mode: "layers",
      flockSize: a,
      survivingToLay: p,
      eggsPerHenYear: l,
      eggsProduced: S,
      cratesOf30: D,
      spentHens: z,
      annual: {
        revenue: {
          eggs: C,
          spentHens: q,
          total: O
        },
        costs: {
          rearing: k,
          layingFeed: h,
          labor: m,
          electricity: y,
          water: P,
          litter: b,
          misc: M,
          total: w
        },
        profit: R
      },
      investment: {
        housing: B,
        equipment: Y,
        total: F
      },
      workingCapital: k,
      metrics: {
        roi: U,
        paybackMonths: A,
        costPerEgg: L,
        breakEvenEggPrice: j,
        feedPct: x
      },
      risks: {
        lowEggPrice: {
          desc: "Egg price drops 15%",
          annualProfit: I
        },
        highFeed: {
          desc: "Feed prices rise 20%",
          annualProfit: W
        },
        highMortality: {
          desc: "Laying mortality doubles",
          annualProfit: K
        }
      },
      cashFlow: N
    };
  }
  function n(e, o) {
    var t = r().indigenous, n = e.flockSize || 50, a = r().usdRates[e.countryCode] || 1, s = t.mortalityPct, l = t.cyclesPerYear, c = (t.marketWeight_kg,
    n * o.dayOldChick.indigenous), d = n * t.feedBreakdown_kg * ((i(o, "starter") + i(o, "grower")) / 2) * .5, u = 16 / 4.33 * o.labor_per_month * .25, g = .01 * n * a, p = c + d + u + g, _ = .05 * p;
    p += _;
    var f = Math.round(n * (1 - s / 100)), h = o.sellingPrice.indigenous_live_per_bird, m = f * h, y = m - p, P = m * l, b = p * l, k = P - b;
    return {
      mode: "indigenous",
      flockSize: n,
      survivingBirds: f,
      mortalityPct: s,
      cyclesYear: l,
      perCycle: {
        revenue: m,
        costs: {
          chicks: c,
          feed: d,
          labor: u,
          vaccination: g,
          misc: _,
          total: p
        },
        profit: y
      },
      annual: {
        revenue: P,
        costs: b,
        profit: k
      },
      metrics: {
        roi: b > 0 ? k / b * 100 : 0,
        paybackMonths: k > 0 ? p / k * 12 : 9999,
        profitPerBird: f > 0 ? y / f : 0,
        feedPct: d / p * 100
      },
      risks: {
        highMortality: {
          desc: "Mortality rises to 35%",
          annualProfit: (Math.round(.65 * n) * h - p) * l
        },
        lowPrice: {
          desc: "Price drops 20%",
          annualProfit: (f * h * .8 - p) * l
        }
      }
    };
  }
  window.AfroTools.PoultryROIEngine = {
    calculate: function(e, r) {
      if (!r) {
        return {
          error: "No country data provided"
        };
      }
      var i = e.mode || "broilers";
      try {
        return "broilers" === i ? o(e, r) : "layers" === i ? t(e, r) : "indigenous" === i ? n(e, r) : "compare" === i ? function(e, r) {
          return {
            mode: "compare",
            broiler: o(Object.assign({}, e, {
              mode: "broilers",
              flockSize: e.flockSize || 100
            }), r),
            layer: t(Object.assign({}, e, {
              mode: "layers",
              flockSize: e.flockSize || 100
            }), r),
            indigenous: n(Object.assign({}, e, {
              mode: "indigenous",
              flockSize: e.flockSize || 100
            }), r)
          };
        }(e, r) : {
          error: "Unknown mode: " + i
        };
      } catch (e) {
        return {
          error: e.message || "Calculation error"
        };
      }
    }
  };
}();
