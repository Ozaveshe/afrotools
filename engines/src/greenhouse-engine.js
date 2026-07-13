!function() {
  "use strict";
  function e(e) {
    return Math.round(e).toLocaleString("en-US");
  }
  function r(e) {
    return (Math.round(10 * e) / 10).toFixed(1) + "%";
  }
  function n(e) {
    return !isFinite(e) || e <= 0 ? "N/A" : e < 1 ? "< 1 year" : e >= 20 ? "> 20 years" : (Math.round(10 * e) / 10).toFixed(1) + " yrs";
  }
  window.GHEngine = {
    calculate: function(t) {
      var o = t.countryCode, i = t.greenhouseType, a = t.area, c = t.crop, u = t.cyclesPerYear, p = t.waterSource, l = t.isNewSetup, s = GREENHOUSE_DATA.countries[o], d = GREENHOUSE_DATA.types[i], y = GREENHOUSE_DATA.crops[c], f = s && s.crops ? s.crops[c] : null;
      if (!s || !d || !f) {
        return null;
      }
      var E = a * (s.struct[i] || s.struct.steel_polythene), _ = a * s.ground_prep, v = a * s.irrigation_drip, h = a * s.fertigation, m = a * s.initial_inputs, g = "borehole" === p && l ? a * s.irrigation_drip * 4 : 0, A = E + _ + v + h + m + g, b = a * f.running * u, S = 0;
      if ("wooden_polythene" === i || "steel_polythene" === i || "hydroponic_tunnel" === i) {
        var T = d.coverReplaceMultiplier;
        S = a * s.polythene_replace_cost_per_m2 * T / d.coverLifespan;
      } else {
        "shade_house" === i ? S = a * s.polythene_replace_cost_per_m2 * .65 / d.coverLifespan : "steel_polycarbonate" === i && (S = .3 * E / d.coverLifespan);
      }
      var w = .015 * E, D = 0;
      "borehole" === p ? (D = .08 * b, l && (D += g / 15)) : "rain" === p && (D = .08 * -b);
      var N = b + S + w + D;
      N < 0 && (N = 0);
      var O = f.yield, G = a * O * u, H = G * f.price.low, R = G * f.price.mid, U = G * f.price.high, M = R - N, P = A > 0 ? M / A * 100 : 0, k = M > 0 ? A / M : 1 / 0, F = N / f.price.mid, L = a > 0 ? F / a : 0, K = a * (y ? y.openFieldYieldPerM2 : 0), Y = K * f.price.low, j = .42 * b, x = Y - j, C = {
        low: {
          revenue: H,
          profit: H - N
        },
        mid: {
          revenue: R,
          profit: M
        },
        high: {
          revenue: U,
          profit: U - N
        }
      };
      return {
        country: s,
        type: d,
        cropMeta: y,
        cropData: f,
        area: a,
        cycles: u,
        symbol: s.symbol,
        setup: {
          structure: E,
          groundPrep: _,
          drip: v,
          fertigation: h,
          inputs: m,
          borehole: g,
          total: A
        },
        running: {
          production: b,
          cover: S,
          maintenance: w,
          water: D,
          total: N
        },
        revenue: {
          yieldKg: G,
          yieldPerM2: O * u,
          low: H,
          mid: R,
          high: U
        },
        netProfit: M,
        roi: P,
        payback: k,
        breakEvenKg: F,
        breakEvenPerM2: L,
        openField: {
          yieldTotal: K,
          revenue: Y,
          running: j,
          profit: x
        },
        scenarios: C,
        fmt: function(r) {
          return n = r, s.symbol + " " + e(n);
          var n;
        },
        fmtKg: function(r) {
          return e(r) + " kg";
        },
        fmtPct: r,
        fmtYears: n
      };
    },
    availableCrops: function(e) {
      var r = GREENHOUSE_DATA.countries[e];
      return r ? Object.keys(r.crops).map(function(e) {
        var r = GREENHOUSE_DATA.crops[e] || {};
        return {
          id: e,
          name: r.name || e,
          icon: r.icon || ""
        };
      }) : [];
    },
    availableTypes: function() {
      return Object.keys(GREENHOUSE_DATA.types).map(function(e) {
        var r = GREENHOUSE_DATA.types[e];
        return {
          id: e,
          name: r.name,
          desc: r.desc,
          icon: r.icon
        };
      });
    },
    countryData: function(e) {
      return GREENHOUSE_DATA.countries[e];
    }
  };
}();
