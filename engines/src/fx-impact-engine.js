var FxImpactEngine = function() {
  "use strict";
  function e(e) {
    var t = FX_HISTORY[e];
    if (!t) {
      return null;
    }
    var r = Object.keys(t.monthlyAverages).sort();
    return t.monthlyAverages[r[r.length - 1]];
  }
  function t(e) {
    var t = FX_HISTORY[e];
    return t ? Object.keys(t.monthlyAverages).sort().map(function(e) {
      return {
        month: e,
        rate: t.monthlyAverages[e]
      };
    }) : [];
  }
  return {
    getCountryData: function(e) {
      var t = FX_HISTORY[e];
      return t ? Object.assign({
        code: e
      }, t) : null;
    },
    getCurrentRate: e,
    getHistoricalSeries: t,
    calculateImpact: function(t, r, a) {
      var n = FX_HISTORY[r];
      if (!n) {
        return null;
      }
      var o = a || e(r);
      return {
        usdAmount: t,
        rate: o,
        localCost: t * o,
        currency: n.currency,
        symbol: n.symbol || "",
        flag: n.flag
      };
    },
    modelScenarios: function(e, t, r) {
      return [ -20, -15, -10, -5, 0, 5, 10, 15, 20 ].map(function(t) {
        var a = r * (1 + t / 100), n = e * a, o = n - e * r;
        return {
          changePercent: t,
          rate: parseFloat(a.toFixed(2)),
          localCost: n,
          delta: o,
          deltaPercent: t
        };
      });
    },
    calcBreakeven: function(e, t, r) {
      var a = parseFloat(r) || 0, n = parseFloat(t) || 0;
      if (n <= 0) {
        return null;
      }
      var o = parseFloat(e) - a;
      return {
        breakevenRate: parseFloat((o / n).toFixed(2)),
        maxLocalCost: o,
        usdCost: n
      };
    },
    getHistoricalCostSeries: function(e, r) {
      return t(r).map(function(t) {
        return {
          month: t.month,
          rate: t.rate,
          localCost: e * t.rate
        };
      });
    },
    getObservations: function(e, r, a) {
      var n = FX_HISTORY[e];
      if (!n) {
        return [];
      }
      var o = [], l = t(e);
      if (l.length >= 2) {
        var u = l[0].rate, c = ((l[l.length - 1].rate - u) / u * 100).toFixed(1), i = c > 0 ? "depreciated" : "appreciated", s = Math.abs(c);
        o.push({
          type: c > 0 ? "warn" : "info",
          text: n.flag + " " + n.currency + " has " + i + " " + s + "% against USD over the past year. Import costs have " + (c > 0 ? "risen" : "fallen") + " accordingly."
        });
      }
      if (n.parallelPremium) {
        var f = r * (a * (1 + n.parallelPremium / 100));
        o.push({
          type: "warn",
          text: "Parallel market rate is ~" + n.parallelPremium + "% higher than official rate. If paying at parallel rate, your cost would be " + n.symbol + " " + Math.round(f).toLocaleString() + " vs official " + n.symbol + " " + Math.round(r * a).toLocaleString() + "."
        });
      }
      return n.notes && o.push({
        type: "info",
        text: n.notes
      }), o;
    },
    getAllCountries: function() {
      return Object.keys(FX_HISTORY).map(function(e) {
        return {
          code: e,
          name: FX_HISTORY[e].name,
          flag: FX_HISTORY[e].flag,
          currency: FX_HISTORY[e].currency
        };
      });
    }
  };
}();
