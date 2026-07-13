!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {}, window.AfroTools.PrepaidMeterEngine = {
    calculate: function(e, r) {
      var a = ENERGY_DATA.countries[r];
      if (!a) {
        return {
          error: "Country data not available."
        };
      }
      var o = parseFloat(e.tokenAmount) || 0, i = e.customerType || "residential";
      if (o <= 0) {
        return {
          error: "Please enter a valid recharge amount."
        };
      }
      var t = a.electricityTariff, n = a.currencySymbol, s = 0;
      s = "commercial" === i ? t.commercial : "industrial" === i ? t.industrial : t.residential;
      var u = Math.round(.12 * o), c = o - u, l = s > 0 ? c / s : 0, d = "residential" === i ? 10 : "commercial" === i ? 30 : 80, y = (l = Math.round(10 * l) / 10) > 0 ? Math.round(l / d) : 0, p = s, m = (s > 0 && Math.round(5e3 / s * 10),
      []);
      return m.push("Current " + i + " tariff in " + a.name + ": " + n + s.toFixed(2) + " per kWh."),
      m.push("A " + n + o.toLocaleString() + " token yields ~" + l + " kWh after service charges."),
      y > 0 && m.push("Estimated " + y + " days supply (based on average " + i + " consumption)."),
      a.paygo && a.paygo.available && m.push("Pay-as-you-go solar available via: " + (a.paygo.providers ? a.paygo.providers.join(", ") : "local providers") + "."),
      m.push("Buying larger tokens reduces % lost to fixed service charges."), {
        unitsReceived: l + " kWh",
        serviceCharge: n + u.toLocaleString(),
        energyAmount: n + Math.round(c).toLocaleString(),
        pricePerUnit: n + p.toFixed(2),
        estimatedDays: y + " days",
        customerType: i,
        observations: m,
        countryName: a.name,
        currencySymbol: n
      };
    }
  };
}();
