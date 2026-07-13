!function() {
  "use strict";
  var e = {
    certified: .9,
    improved: .78,
    local: .68,
    old: .5
  }, a = {
    excellent: .9,
    good: .8,
    average: .7,
    poor: .6,
    harsh: .5
  }, t = {
    sole: 1,
    primary: .75,
    secondary: .5
  };
  function r(e) {
    return Math.round(10 * e) / 10;
  }
  function n(e) {
    return Math.round(e);
  }
  var o = {
    calculate: function(r, o, s, i) {
      var l = r.cropId;
      if (!l) {
        return {
          error: !0,
          message: "Please select a crop."
        };
      }
      var c = o[l];
      if (!c) {
        return {
          error: !0,
          message: "Crop not found in seed database."
        };
      }
      var d = e[r.seedQuality] || e.improved, g = a[r.fieldConditions] || a.average, p = t[r.intercrop] || 1, m = parseFloat(r.farmSizeHa) || 1, u = c.countryOverrides && c.countryOverrides[s] || {}, _ = {
        cropId: l,
        germRate: d,
        germRatePct: n(100 * d),
        fieldFactor: g,
        fieldFactorPct: n(100 * g),
        intercropFactor: p,
        farmSizeHa: m,
        countryCode: s,
        overrideNotes: u.notes || null
      };
      return "vegetative" === c.propagation ? this._vegetative(c, u, r, _) : this._seed(c, u, r, _, d, g, p, m, s, o, i);
    },
    _seed: function(e, a, t, o, s, i, l, c, d, g, p) {
      var m, u = t.plantingMethod || a.method || e.plantingMethod && e.plantingMethod[0] || "drilling", _ = "broadcasting" === u || "direct_seeding_broadcast" === u, f = a.spacing || e.defaultSpacing || {}, v = parseFloat(t.rowSpacing_cm) || (f.row_cm ? parseFloat(f.row_cm) : 75), P = parseFloat(t.plantSpacing_cm) || (f.plant_cm && "continuous" !== f.plant_cm ? parseFloat(f.plant_cm) : 10), H = parseInt(t.seedsPerHole) || a.seedsPerHole || e.seedsPerHole || 1, S = n(1e4 / (v / 100 * (P / 100)));
      if (a.seedRate) {
        m = a.seedRate * (.8 / s) * (.7 / i), _ && (S = null);
      } else if (_ && e.typicalSeedRate) {
        var b, h = e.typicalSeedRate;
        h.broadcast ? b = (h.broadcast.min + h.broadcast.max) / 2 : void 0 !== h.min && (b = (h.min + h.max) / 2),
        b && (m = b * (.8 * .7) / (s * i)), S = null;
      }
      m || (m = S * (e.seedWeightPer1000 || 100) / (1e6 * s * i));
      var y = m * l, w = y * c, F = a.bagSize_kg || e.bagSize_kg || 25, k = Math.ceil(w / F), M = g.seedPricing && g.seedPricing[d], R = o.cropId, T = M && M[R], x = p && p.currencySymbol || "", z = null, L = null, N = null;
      return T && (N = (z = n(w * T)) - (L = n(w * T * .45))), Object.assign({}, o, {
        propagation: "seed",
        plantingMethod: u,
        isBroadcast: _,
        rowSpacing_cm: v,
        plantSpacing_cm: P,
        seedsPerHole: H,
        targetPopHa: S,
        targetPopm2: S ? r(S / 1e4) : null,
        seedRateKgHa: r(y),
        seedRateKgHaBase: r(m),
        totalSeedKg: r(w),
        bagSize_kg: F,
        numBags: k,
        daysToEmergence: e.daysToEmergence || null,
        shelfLife_months: e.shelfLife_months || null,
        storageNotes: e.storageNotes || null,
        notes: e.notes || null,
        costCertified: z,
        costFarmSaved: L,
        costSavings: N,
        currency: p && p.currency || "",
        currencySymbol: x,
        pricePerKg: T || null
      });
    },
    _vegetative: function(e, a, t, o) {
      var s, i = o.farmSizeHa, l = a.spacing || e.defaultSpacing || {}, c = parseFloat(t.rowSpacing_cm) || (l.row_cm ? parseFloat(l.row_cm) : 100), d = parseFloat(t.plantSpacing_cm) || (l.plant_cm ? parseFloat(l.plant_cm) : 100);
      s = a.plantsPerHa ? a.plantsPerHa : e.plantsPerHa ? Math.round((e.plantsPerHa.min + e.plantsPerHa.max) / 2) : c && d ? n(1e4 / (c / 100 * d / 100)) : 1e4;
      var g = n(s * i), p = r(c / 100 * d / 100), m = null, u = a.materialLabel || e.materialLabel || "plants";
      if (e.seedYamPerHa_kg) {
        var _ = a.seedYamPerHa_kg || (e.seedYamPerHa_kg.min + e.seedYamPerHa_kg.max) / 2;
        m = {
          perHa: n(_),
          total: n(_ * i),
          unit: "kg"
        };
      } else if (e.seedTubersPerHa_kg) {
        var f = a.seedTubersPerHa_kg || (e.seedTubersPerHa_kg.min + e.seedTubersPerHa_kg.max) / 2;
        m = {
          perHa: n(f),
          total: n(f * i),
          unit: "kg"
        };
      } else if (e.settsPerHa) {
        var v = (e.settsPerHa.min + e.settsPerHa.max) / 2;
        m = {
          perHa: n(v),
          total: n(v * i),
          unit: "setts"
        };
      }
      return Object.assign({}, o, {
        propagation: "vegetative",
        plantingMaterial: e.plantingMaterial,
        materialLabel: u,
        rowSpacing_cm: c,
        plantSpacing_cm: d,
        spacingArea_m2: p,
        plantsPerHa: s,
        totalPlants: g,
        materialWeight: m,
        notes: e.notes || null
      });
    },
    fmtN: function(e, a) {
      return "number" != typeof e || isNaN(e) ? "—" : e.toLocaleString(void 0, {
        maximumFractionDigits: void 0 !== a ? a : 1
      });
    }
  };
  window.AfroTools = window.AfroTools || {}, window.AfroTools.SeedRateEngine = o;
}();
