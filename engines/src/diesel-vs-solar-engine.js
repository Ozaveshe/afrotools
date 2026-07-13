!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {}, window.AfroTools.DieselVsSolarEngine = {
    calculate: function(a) {
      var r = parseFloat(a.farmHa) || 0, o = parseFloat(a.pumpKW) || 0, e = parseFloat(a.dailyPumpHrs) || 0, t = a.country || "NG", s = ENERGY_DATA && ENERGY_DATA.countries ? ENERGY_DATA.countries[t] : null, n = s ? s.currencySymbol : "$", l = s ? s.usdRate : 1;
      if (o <= 0 && r <= 0) {
        return {
          error: "Please enter pump size (kW) or farm size."
        };
      }
      if (!o && r && (o = Math.max(1, .5 * r)), e <= 0) {
        return {
          error: "Please enter daily pumping hours."
        };
      }
      var u = s ? s.solar.avgSunHours : 5.5, i = s ? s.fuel.diesel : 1.5, c = .28 * o * e, p = c * i, d = (Math.round(30 * p),
      Math.round(365 * p)), h = 10 * d, y = Math.round(200 * o), S = Math.round(y * (l || 1)), g = Math.round(.2 * h), m = S + h + g, L = Math.ceil(o / u * e * 1.3 * 2) / 2, f = Math.round(700 * L + 150 * o), M = Math.round(f * (l || 1)), A = M + 10 * Math.round(.015 * M), k = m - A, v = d > 0 ? (M / (d + g / 10)).toFixed(1) : "N/A", T = Math.round(365 * c * 2.68), W = [];
      return W.push((s ? s.name : "Your country") + " diesel price: " + n + i.toFixed(2) + "/L with " + u + " sun hours/day."),
      W.push("Solar pump system: " + L + "kW array for " + o + "kW pump × " + e + "hrs/day."),
      W.push("10-year diesel total: " + n + m.toLocaleString() + " vs solar: " + n + A.toLocaleString() + "."),
      k > 0 && W.push("Solar saves " + n + k.toLocaleString() + " over 10 years. Payback: ~" + v + " years."),
      W.push("Solar pump eliminates " + T.toLocaleString() + " kg CO₂/year (" + Math.round(T / 1e3) + " tonnes)."),
      W.push("Solar pump has no fuel dependency — protects against fuel price increases."),
      {
        pumpKW: o + "kW",
        solarKW: L + " kW array",
        dieselCapexLocal: n + S.toLocaleString(),
        dieselAnnualOpex: n + d.toLocaleString(),
        diesel10yrTotal: n + m.toLocaleString(),
        solarCapexLocal: n + M.toLocaleString(),
        solar10yrTotal: n + A.toLocaleString(),
        savings10yr: k > 0 ? n + k.toLocaleString() : "Diesel cheaper by " + n + Math.abs(k).toLocaleString(),
        paybackYrs: v + " years",
        co2SavedAnnual: T.toLocaleString() + " kg",
        observations: W
      };
    }
  };
}();
