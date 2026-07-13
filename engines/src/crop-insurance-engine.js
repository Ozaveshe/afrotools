!function() {
  "use strict";
  function e(e, a) {
    return isFinite(e) && null != e ? (a || "") + Math.round(Math.abs(e)).toLocaleString("en-US") : (a || "") + "0";
  }
  window.AfroTools = window.AfroTools || {}, window.AfroTools.CropInsuranceEngine = {
    calculate: function(a, r) {
      var t = r;
      if (!t) {
        return {
          error: !0,
          message: "No country data loaded."
        };
      }
      var s = t.symbol || "", i = a.insureType || "crops", o = a.item || "", n = parseInt(a.programIndex) || 0, u = t.programs || [];
      if (!u.length) {
        return {
          error: !0,
          message: "No insurance programs found for this country."
        };
      }
      n >= u.length && (n = 0);
      var l = u[n], m = 0, c = parseFloat(a.farmSize) || 1, p = parseFloat(a.numAnimals) || 1, f = a.sumBasis || "input_cost", d = "";
      if ("crops" === i) {
        if ("input_cost" === f) {
          var v = parseFloat(a.inputCostPerHa);
          !v && t.inputCostPerHa && t.inputCostPerHa[o] && (v = t.inputCostPerHa[o]), v || (v = 0),
          m = v * c, d = "Input Cost Basis (" + s + e(v) + "/ha × " + c + " ha)";
        } else if ("revenue" === f) {
          var y = parseFloat(a.expectedYield);
          !y && t.typicalYield && t.typicalYield[o] && (y = t.typicalYield[o]), y || (y = 1);
          var P = parseFloat(a.marketPrice);
          !P && t.prices && t.prices[o] && (P = t.prices[o]), P || (P = 0), m = y * P * c,
          d = "Revenue Basis (" + y + " t/ha × " + s + e(P) + "/t × " + c + " ha)";
        } else {
          m = parseFloat(a.customAmount) || 0, d = "Custom Amount";
        }
      } else {
        var g = parseFloat(a.valuePerAnimal);
        !g && t.prices && t.prices[o] && (g = t.prices[o]), g || (g = 0), m = g * p, d = "Livestock Value (" + p + " × " + s + e(g) + "/head)";
      }
      var b = parseFloat(l.premiumRate) || 5, F = parseFloat(l.govSubsidy) || 0, h = parseFloat(l.deductible) || 0, S = m * (b / 100), A = S * (F / 100), x = S - A, C = "crops" === i ? c > 0 ? x / c : 0 : p > 0 ? x / p : 0, I = "crops" === i ? "/ha" : "/animal", T = m > 0 ? x / m * 100 : 0;
      function w(e) {
        var a = Math.max(0, e - h), r = m * (a / 100);
        return Math.max(0, r);
      }
      var M = [ {
        label: "25% loss",
        lossPct: 25,
        payout: w(25)
      }, {
        label: "50% loss",
        lossPct: 50,
        payout: w(50)
      }, {
        label: "75% loss",
        lossPct: 75,
        payout: w(75)
      }, {
        label: "Total loss (100%)",
        lossPct: 100,
        payout: w(100)
      } ], Y = 10 * x, L = w(100), R = L > 0 ? Math.ceil(Y / L) : null;
      return {
        countryName: t.name,
        sym: s,
        currency: t.currency,
        insureType: i,
        item: o,
        farmSize: c,
        numAnimals: p,
        sumBasis: f,
        basisLabel: d,
        program: l,
        programIndex: n,
        allPrograms: u,
        sumInsured: m,
        premiumRate: b,
        govSubsidyPct: F,
        deductiblePct: h,
        grossPremium: S,
        govSubsidyAmt: A,
        farmerPays: x,
        premiumPerUnit: C,
        unitLabel: I,
        effectiveRate: T,
        scenarios: M,
        totalPremium10Yr: Y,
        breakEvenEvents: R,
        fSumInsured: e(m, s),
        fGrossPremium: e(S, s),
        fGovSubsidy: e(A, s),
        fFarmerPays: e(x, s),
        fPremiumPerUnit: e(C, s),
        fTotalPremium10Yr: e(Y, s),
        fEffectiveRate: T.toFixed(2)
      };
    },
    fmt: e,
    fmtDec: function(e, a, r) {
      return isFinite(e) && null != e ? (a || "") + Math.abs(e).toLocaleString("en-US", {
        minimumFractionDigits: r || 2,
        maximumFractionDigits: r || 2
      }) : (a || "") + "0";
    }
  };
}();
