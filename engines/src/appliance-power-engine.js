!function() {
  "use strict";
  function n(n) {
    return parseFloat(n) || 0;
  }
  function t(n) {
    return parseInt(n, 10) || 1;
  }
  window.AfroTools = window.AfroTools || {}, window.AfroTools.AppliancePowerEngine = {
    calculate: function(o) {
      var a = o.appliances || [], r = o.country || "NG", e = window.ENERGY_DATA && window.ENERGY_DATA.countries ? window.ENERGY_DATA.countries : null, l = e ? e[r] : null, i = l ? l.currencySymbol : "$", s = l ? l.electricityTariff.residential : 50;
      if (!a.length) {
        return {
          error: "Please add at least one appliance."
        };
      }
      var u = 0, h = 0, c = [];
      if (a.forEach(function(o, a) {
        var r = n(o.watts), e = function(t) {
          return n(null != t.hoursPerDay ? t.hoursPerDay : t.hours);
        }(o), l = t(o.qty), i = r * l, s = n(o.standbyWatts) * l, d = i * e / 1e3 + s * Math.max(0, 24 - e) / 1e3;
        u += i, h += d, c.push({
          name: o.name || "Appliance " + (a + 1),
          watts: i,
          hoursPerDay: e,
          dailyKWh: Math.round(100 * d) / 100,
          monthlyKWh: Math.round(30 * d * 10) / 10,
          standbyW: s > 0 ? s : null
        });
      }), h <= 0) {
        return {
          error: "Please enter daily usage hours for at least one appliance."
        };
      }
      var d = Math.round(30 * h), y = Math.round(d * s), f = Math.round(365 * h), p = Math.round(f * s);
      c.sort(function(n, t) {
        return t.monthlyKWh - n.monthlyKWh;
      });
      var W = c.slice(0, 3), m = 0;
      a.forEach(function(o) {
        m += n(o.standbyWatts) * t(o.qty);
      });
      var w = Math.round(24 * m / 1e3 * 30), M = Math.round(w * s), g = [];
      return g.push("Total connected load: " + u + "W. Monthly consumption: " + d + " kWh."),
      g.push("Monthly electricity bill: " + i + y.toLocaleString() + " at " + i + s.toFixed(2) + "/kWh."),
      W.length > 0 && g.push("Top consumer: " + W[0].name + " (" + W[0].monthlyKWh + " kWh/month = " + Math.round(W[0].monthlyKWh / d * 100) + "% of total)."),
      M > 0 && g.push("Standby waste: " + i + M.toLocaleString() + "/month (" + w + " kWh). Unplug devices not in use."),
      g.push("LED bulbs and efficient fans are usually the quickest low-cost savings before solar sizing."),
      {
        totalWatts: u + "W",
        dailyKWh: Math.round(100 * h) / 100 + " kWh",
        monthlyKWh: d + " kWh",
        monthlyBill: i + y.toLocaleString(),
        annualKWh: f + " kWh",
        annualBill: i + p.toLocaleString(),
        standbyMonthlyCost: i + M.toLocaleString(),
        appliances: c,
        topConsumers: W,
        tariff: i + s.toFixed(2) + "/kWh",
        observations: g
      };
    }
  };
}();
