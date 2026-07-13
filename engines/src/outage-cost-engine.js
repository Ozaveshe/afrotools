!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {}, window.AfroTools.OutageCostEngine = {
    calculate: function(e, o) {
      var t = ENERGY_DATA.countries[o];
      if (!t) {
        return {
          error: "Country data not available."
        };
      }
      var a = parseFloat(e.dailyRevenue) || 0, r = parseFloat(e.outageHrsPerDay) || 0, n = e.businessType || "retail";
      if (a <= 0) {
        return {
          error: "Please enter your average daily business revenue."
        };
      }
      if (r <= 0 || r > 24) {
        return {
          error: "Please enter valid daily outage hours (0.5–24)."
        };
      }
      var s = t.currencySymbol, i = {
        retail: .6,
        restaurant: .8,
        manufacturing: .9,
        office: .4,
        hotel: .7,
        clinic: .75
      }[n] || .6, u = a / 12, l = Math.round(u * r * i), c = Math.round(22 * l), d = Math.round(265 * l), g = {
        restaurant: .05,
        clinic: .03,
        retail: .01,
        hotel: .02,
        manufacturing: .02,
        office: 0
      }[n] || .01, h = Math.round(a * g * (r / 8)), y = Math.round(22 * h), f = c + y, p = "manufacturing" === n ? 20 : "hotel" === n ? 15 : 10, S = Math.round(.8 * p * r * t.fuel.diesel * .28), m = Math.round(22 * S), L = f - m, b = [];
      return b.push("Power outages cost " + t.name + " businesses an estimated $" + Math.round(l / (t.usdRate || 1)).toLocaleString() + " USD/day on average."),
      b.push("Your " + n + " loses ~" + s + l.toLocaleString() + " per day during " + r + " hour outages."),
      g > 0 && b.push("Stock/equipment spoilage adds ~" + s + h.toLocaleString() + " per day for " + n + " businesses."),
      b.push("Monthly total impact: " + s + f.toLocaleString() + " — generator costs ~" + s + m.toLocaleString() + "/month."),
      L > 0 ? b.push("Net monthly benefit of backup power: " + s + L.toLocaleString() + " — backup power is fully justified.") : b.push("Generator cost exceeds losses — consider smaller UPS/battery backup instead."),
      {
        dailyLoss: s + l.toLocaleString(),
        monthlyRevenueLoss: s + c.toLocaleString(),
        monthlySpoilage: s + y.toLocaleString(),
        totalMonthlyImpact: s + f.toLocaleString(),
        annualLoss: s + d.toLocaleString(),
        genMonthlyCost: s + m.toLocaleString(),
        netMonthlyBenefit: s + L.toLocaleString(),
        backupJustified: L > 0,
        observations: b,
        countryName: t.name,
        currencySymbol: s
      };
    }
  };
}();
