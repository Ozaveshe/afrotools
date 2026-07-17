var LandedCostEngine = function() {
  "use strict";
  return {
    calculate: function(e) {
      var t = LANDED_COST_DATA[e.destCountry];
      if (!t) {
        return null;
      }
      var a = parseFloat(e.fobUSD) || 0, r = parseFloat(e.freightUSD) || 0, n = parseFloat(e.insuranceUSD) || .005 * a, o = parseFloat(e.dutyRate) || 0, u = parseInt(e.quantity) || 1, s = parseFloat(e.fxRate) || 1, D = a + r + n, i = D * (o / 100), l = 0, c = [], S = t.dutyStructure;
      (S.levies || []).forEach(function(e) {
        var t = ("FOB" === e.base ? a : "CIF" === e.base ? D : "CIF+duty" === e.base ? D + i : "duty" === e.base ? i : D) * (e.rate / 100);
        l += t, c.push({
          name: e.name,
          rate: e.rate,
          base: e.base,
          description: e.description || "",
          amountUSD: t
        });
      });
      var f = D + i + l, A = f * (S.vatRate / 100), d = i + l + A, U = D + d, p = (parseFloat(e.brokerFeeLocal) || 0) / s, F = (parseFloat(e.handlingLocal) || 0) / s, y = (parseFloat(e.haulageLocal) || 0) / s, v = p + F + y, g = U + v, L = g * s, m = D > 0 ? (d / D * 100).toFixed(1) : "0", C = u > 0 ? g / u : g, T = C * s;
      return {
        fobUSD: a,
        freightUSD: r,
        insuranceUSD: n,
        cifUSD: D,
        dutyRate: o,
        fxRate: s,
        qty: u,
        importDutyUSD: i,
        levyBreakdown: c,
        totalLeviesUSD: l,
        vatRate: S.vatRate,
        vatUSD: A,
        vatBase: f,
        totalCustomsUSD: d,
        brokerFeeUSD: p,
        handlingUSD: F,
        haulageUSD: y,
        localChargesUSD: v,
        totalLandedUSD: g,
        totalLandedLocal: L,
        currency: t.currency,
        symbol: t.symbol || "",
        effectiveTaxRate: m,
        perUnitUSD: C,
        perUnitLocal: T,
        getMarginAnalysis: function(e) {
          var t = parseFloat(e) || 0, a = t - T, r = t > 0 ? (a / t * 100).toFixed(1) : 0, n = T > 0 ? (a / T * 100).toFixed(1) : 0;
          return {
            sellPrice: t,
            costPerUnit: T,
            profit: a,
            margin: r,
            markup: n,
            breakeven: T
          };
        }
      };
    },
    getCountryPorts: function(e) {
      var t = LANDED_COST_DATA[e];
      return t ? t.ports : [];
    },
    getDefaultBrokerFee: function(e) {
      var t = LANDED_COST_DATA[e];
      return t && t.customsBrokerFee ? t.customsBrokerFee.min : 0;
    },
    getAllCountries: function() {
      return Object.keys(LANDED_COST_DATA).map(function(e) {
        return {
          code: e,
          name: LANDED_COST_DATA[e].name,
          flag: LANDED_COST_DATA[e].flag,
          currency: LANDED_COST_DATA[e].currency
        };
      });
    }
  };
}();
