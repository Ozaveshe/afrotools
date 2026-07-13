var DemurrageEngine = function() {
  "use strict";
  function e(e, a, r, t) {
    var n = PORT_DEMURRAGE.ports[e];
    if (!n) {
      return null;
    }
    var o = n.freeDays && n.freeDays[a] || 5, s = Math.max(0, r - o), i = 0, u = [];
    if (s > 0 && n.demurrageRates && n.demurrageRates[a]) {
      for (var y = n.demurrageRates[a], d = s, c = 0; c < y.length; c++) {
        var g = y[c], m = g.daysFrom - o, D = 999 === g.daysTo ? s : g.daysTo - o, l = Math.min(d, D - Math.max(0, m) + 1);
        if (!(l <= 0)) {
          var p = (l = Math.max(0, l)) * g.ratePerDay;
          if (i += p, u.push({
            tier: "Days " + g.daysFrom + (999 === g.daysTo ? "+" : "–" + g.daysTo),
            daysInTier: l,
            ratePerDay: g.ratePerDay,
            currency: n.currency,
            cost: p
          }), (d -= l) <= 0) {
            break;
          }
        }
      }
    }
    var f = 0;
    n.storageRates && n.storageRates[a] && (f = n.storageRates[a].perDay || 0);
    var h = s > 0 ? s * f : 0, v = 0, R = [];
    n.additionalCharges && n.additionalCharges.forEach(function(e) {
      var a = "USD" === e.currency ? e.amount : e.amount / (t || 1);
      v += a, R.push({
        name: e.name,
        amount: e.amount,
        currency: e.currency,
        amountUSD: a,
        description: e.description
      });
    });
    var U = i;
    "USD" !== n.currency && t && (U = i / t);
    var S = "USD" !== n.currency && t ? h / t : h, C = U + S + v;
    return {
      portCode: e,
      portName: n.name,
      country: n.country,
      containerType: a,
      daysAtPort: r,
      freeDays: o,
      paidDays: s,
      demurrageRaw: i,
      currency: n.currency,
      demurrageUSD: Math.round(U),
      storageChargesUSD: Math.round(S),
      additionalChargesUSD: Math.round(v),
      totalUSD: Math.round(C),
      breakdown: u,
      additionalBreakdown: R,
      avgClearingDays: n.avgClearingDays,
      notes: n.notes,
      tip: n.tip,
      warningLevel: C > 5e3 ? "high" : C > 2e3 ? "medium" : "low"
    };
  }
  return {
    calculateDemurrage: e,
    getDailyAccrual: function(e, a) {
      var r = PORT_DEMURRAGE.ports[e];
      return r && r.demurrageRates && r.demurrageRates[a] ? r.demurrageRates[a].map(function(e) {
        return {
          label: "Days " + e.daysFrom + (999 === e.daysTo ? "+" : "–" + e.daysTo),
          ratePerDay: e.ratePerDay,
          currency: r.currency
        };
      }) : null;
    },
    projectCosts: function(a, r, t, n) {
      for (var o = [], s = 1; s <= t; s++) {
        var i = e(a, r, s, n);
        i && o.push({
          day: s,
          totalUSD: i.totalUSD,
          demurrageUSD: i.demurrageUSD
        });
      }
      return o;
    },
    getObservations: function(a) {
      var r = [];
      if (!a) {
        return r;
      }
      if (a.paidDays <= 0 ? r.push({
        type: "info",
        text: "Container is still within free days (" + a.freeDays + " days). No demurrage accruing yet."
      }) : r.push({
        type: "high" === a.warningLevel ? "warn" : "info",
        text: "Total accrued demurrage: $" + a.totalUSD.toLocaleString() + " for " + a.paidDays + " paid days at " + a.portName + "."
      }), a.avgClearingDays) {
        var t = e(a.portCode, a.containerType, a.avgClearingDays, 1600);
        t && r.push({
          type: "tip",
          text: "Average clearing time at " + a.portName + " is ~" + a.avgClearingDays + " days. If typical, expect ~$" + t.demurrageUSD.toLocaleString() + " in demurrage."
        });
      }
      return r.push({
        type: "tip",
        text: "Request 30 free days from the shipping line when booking. Most lines offer 7–21 extra free days if requested in advance — this can save thousands in demurrage."
      }), r;
    },
    getAllPorts: function() {
      return Object.keys(PORT_DEMURRAGE.ports).map(function(e) {
        var a = PORT_DEMURRAGE.ports[e];
        return {
          code: e,
          name: a.name,
          city: a.city,
          country: a.country,
          flag: a.flag,
          avgClearingDays: a.avgClearingDays
        };
      });
    }
  };
}();

"undefined" != typeof module && (module.exports = {
  DemurrageEngine: DemurrageEngine
});
