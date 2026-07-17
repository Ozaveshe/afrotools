!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {}, window.AfroTools.BiogasROIEngine = {
    calculate: function(e) {
      var o = parseInt(e.livestockCount) || 0, t = e.livestockType || "cattle", a = parseFloat(e.cookingHours) || 3, r = e.country || "NG", i = ENERGY_DATA && ENERGY_DATA.countries ? ENERGY_DATA.countries[r] : null, n = i ? i.currencySymbol : "$", s = i ? i.usdRate : 1;
      if (o <= 0) {
        return {
          error: "Please enter the number of livestock."
        };
      }
      var l = ({
        cattle: .5,
        pig: .3,
        goat: .05,
        chicken: .005,
        sheep: .04
      }[t] || .1) * o, u = 6 * l, c = 1.5 * a, d = u >= c, g = Math.max(0, l - c / 6), h = g > .5, m = Math.ceil(2.5 * l * 10) / 10, y = m < 5 ? "Fixed Dome (small)" : m < 15 ? "Fixed Dome (medium)" : "Floating Drum", p = Math.round(300 * m + 500), S = Math.round(p * (s || 1)), f = i ? i.lpg.pricePerKg : 2, L = Math.round(30 * c / 13.7), k = Math.round(L * f), A = 12 * k, v = A > 0 ? (S / A).toFixed(1) : "N/A", M = Math.round(30 * l * 1.2 * 10) / 10, w = s ? 15 * s : 15, F = Math.round(M * w), b = A + 12 * F, x = b > 0 ? (S / b).toFixed(1) : v, D = Math.round(12 * L * 3), T = [];
      return T.push(o + " " + t + (o > 1 ? "s" : "") + " produces ~" + l.toFixed(2) + "m³ biogas/day."),
      T.push(d ? "Biogas fully meets your " + a + "hrs/day cooking need." : "Biogas meets " + Math.round(u / c * 100) + "% of cooking need — supplement with LPG for remainder."),
      T.push("Digester size: " + m + "m³ (" + y + ") — cost: " + n + S.toLocaleString() + "."),
      T.push("LPG savings: " + n + k.toLocaleString() + "/month. Bioslurry fertilizer: ~" + n + F.toLocaleString() + "/month value."),
      T.push("Adjusted payback (fuel + fertilizer): ~" + x + " years."), h && T.push("Surplus gas (" + g.toFixed(1) + "m³/day) can power 1–2 biogas lights."),
      {
        dailyBiogasM3: l.toFixed(2) + "m³/day",
        meetsCooking: d ? "Yes" : "Partial",
        digesterSize: m + "m³",
        digesterType: y,
        digesterCostLocal: n + S.toLocaleString(),
        digesterCostUSD: "$" + p.toLocaleString(),
        monthlySaving: n + k.toLocaleString(),
        annualSaving: n + A.toLocaleString(),
        monthlySlurryValue: n + F.toLocaleString(),
        paybackYrs: v + " years",
        adjustedPayback: x + " years",
        co2SavedAnnual: D.toLocaleString() + " kg",
        canPowerLight: h,
        observations: T
      };
    }
  };
}();
