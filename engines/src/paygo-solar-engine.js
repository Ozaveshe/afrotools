!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {}, window.AfroTools.PaygoSolarEngine = {
    calculate: function(e, r) {
      var o = ENERGY_DATA.countries[r];
      if (!o) {
        return {
          error: "Country data not available."
        };
      }
      var a = parseFloat(e.dailyWh) || 0, t = parseFloat(e.currentMonthlySpend) || 0;
      if (a <= 0 && t <= 0) {
        return {
          error: "Please enter daily energy need or current monthly spend."
        };
      }
      var n = o.currencySymbol, i = o.usdRate || 1, s = o.paygo;
      if (!s || !s.available) {
        return {
          available: !1,
          message: "Pay-as-you-go solar is not yet widely available in " + o.name + ". Check with local solar distributors.",
          countryName: o.name
        };
      }
      if (!a && t) {
        var l = t / o.electricityTariff.residential;
        a = Math.round(l / 30 * 1e3);
      }
      var y = "", d = 0, u = 0, c = 0;
      a <= 50 ? (y = "Pico Solar (phone+lights)", d = 20, c = 15, u = Math.round(.5 * i)) : a <= 200 ? (y = "Solar Home System – Basic",
      d = 50, c = 40, u = Math.round(1.2 * i)) : a <= 500 ? (y = "Solar Home System – Standard",
      d = 100, c = 80, u = Math.round(2.5 * i)) : (y = "Solar Home System – Premium",
      d = 200, c = 150, u = Math.round(5 * i));
      var m = Math.round(c * i), h = Math.round(4.3 * u), p = (Math.round((c * i + 24 * h) / h),
      m + 24 * h), v = Math.max(0, t - h), S = [];
      return s.providers && s.providers.length && S.push("PayGo solar providers in " + o.name + ": " + s.providers.join(", ") + "."),
      S.push("Recommended tier: " + y + " (" + d + "W system) for " + a + "Wh/day need."),
      S.push("Typical plan: " + n + m.toLocaleString() + " deposit + " + n + h.toLocaleString() + "/month for 24 months."),
      v > 0 && S.push("Monthly saving vs current spend: " + n + v.toLocaleString() + "/month."),
      S.push("After 2 years, the system is yours — energy becomes free for 8+ more years."),
      S.push("No credit check required — pay weekly via mobile money."), {
        available: !0,
        tier: y,
        systemWp: d + "W",
        depositLocal: n + m.toLocaleString(),
        weeklyPayment: n + u.toLocaleString(),
        monthlyPayment: n + h.toLocaleString(),
        totalOwnership: n + p.toLocaleString(),
        monthlySaving: v > 0 ? n + v.toLocaleString() : "0",
        providers: s.providers || [],
        observations: S,
        countryName: o.name,
        currencySymbol: n
      };
    }
  };
}();
