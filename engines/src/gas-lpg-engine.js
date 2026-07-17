!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {}, window.AfroTools.GasLPGEngine = {
    calculate: function(o, r) {
      var e = ENERGY_DATA.countries[r];
      if (!e) {
        return {
          error: "Country data not available."
        };
      }
      var n = parseFloat(o.cylinderSize) || 12.5, t = parseFloat(o.monthlyRefills) || 1, a = parseInt(o.householdSize) || 4;
      if (t <= 0) {
        return {
          error: "Please enter how many cylinders you use per month."
        };
      }
      var i = e.currencySymbol, l = e.lpg.pricePerKg;
      if (!l || l <= 0) {
        return {
          error: "LPG price data not available for this country."
        };
      }
      var c = Math.round(l * n), s = Math.round(c * t), u = Math.round(12 * s), h = n * t, d = Math.round(13.7 * h), y = d > 0 ? (s / d).toFixed(2) : 0, p = Math.round(s / 30), g = a > 0 ? Math.round(p / a * 100) / 100 : p, m = Math.round(2 * a * 30 * .5) - s, P = [];
      return P.push("LPG price in " + e.name + ": " + i + l.toFixed(2) + "/kg — " + i + c.toLocaleString() + " per " + n + "kg cylinder."),
      P.push("Monthly cooking cost: " + i + s.toLocaleString() + " (" + i + g + " per person/day)."),
      P.push("LPG delivers " + d + " kWh of cooking energy at " + i + y + "/kWh — cleaner than charcoal."),
      m > 0 && P.push("LPG saves ~" + i + m.toLocaleString() + "/month vs charcoal — plus zero indoor smoke."),
      P.push("Bulk buy 2× cylinders at once to avoid running out and reduce trips."),
      {
        pricePerCylinder: i + c.toLocaleString(),
        pricePerKg: i + l.toFixed(2),
        monthlyCost: i + s.toLocaleString(),
        annualCost: i + u.toLocaleString(),
        monthlyKWh: d + " kWh",
        costPerKWh: i + y,
        costPerPersonDay: i + g,
        cylinderSize: n + "kg",
        observations: P,
        countryName: e.name,
        currencySymbol: i
      };
    }
  };
}();
