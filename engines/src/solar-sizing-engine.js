!function() {
  "use strict";
  function a(a) {
    return parseFloat(a) || 0;
  }
  window.AfroTools = window.AfroTools || {}, window.AfroTools.SolarSizingEngine = {
    calculate: function(r) {
      var t = r.appliances || [], e = window.ENERGY_DATA && window.ENERGY_DATA.countries ? window.ENERGY_DATA.countries : null, o = r.country || "NG", n = e ? e[o] : null, s = a(r.sunHours) || 5;
      n && n.solar && (s = n.solar.avgSunHours || s);
      var i = n ? n.usdRate : 1, l = n ? n.currencySymbol : "$";
      if (!t.length) {
        return {
          error: "Please add at least one appliance."
        };
      }
      var u = 0, h = 0, c = [];
      if (t.forEach(function(r, t) {
        var e, o = a(r.watts), n = function(r) {
          return a(null != r.hoursPerDay ? r.hoursPerDay : r.hours);
        }(r), s = o * (e = r.qty, parseInt(e, 10) || 1), i = s * n;
        u += s, h += i, c.push({
          name: r.name || "Appliance " + (t + 1),
          watts: s,
          hoursPerDay: n,
          dailyWh: Math.round(i)
        });
      }), h <= 0) {
        return {
          error: "Please enter appliance hours per day so the calculator can size the system."
        };
      }
      var d = h / 1e3, p = Math.ceil(d / s * 1.25 * 10) / 10, y = Math.ceil(1.5 * d * 10) / 10, g = Math.round(1e3 * y / (48 * .8)), W = Math.ceil(1.2 * u / 1e3 * 2) / 2, A = Math.round(300 * p), w = Math.round(200 * y), v = Math.round(150 * W), f = Math.round(.2 * (A + w + v)), M = A + w + v + f, k = Math.round(M * (i || 1));
      c.sort(function(a, r) {
        return r.dailyWh - a.dailyWh;
      });
      var m = [];
      return m.push("Total connected load: " + u + "W. Daily energy need: " + Math.round(h) + "Wh."),
      m.push("With " + s + " peak sun hours, you need a " + p + "kW panel array."), m.push("Battery bank: " + y + "kWh / " + g + "Ah. This targets overnight use plus one cloudy-day margin."),
      c.length > 0 && m.push("Top consumer: " + c[0].name + " (" + c[0].dailyWh + "Wh/day = " + Math.round(c[0].dailyWh / h * 100) + "% of total)."),
      u > 3e3 ? m.push("High surge load detected. Ask installers to confirm inverter surge rating for pumps, AC, irons, or microwaves.") : m.push("A hybrid inverter keeps grid, solar, and battery available without oversizing the system."),
      {
        totalWatts: u + "W",
        dailyKWh: Math.round(100 * d) / 100 + " kWh",
        solarKW: p + " kW",
        batteryKWh: y + " kWh",
        batteryAh: g + " Ah (48V)",
        inverterKVA: W + " kVA",
        totalCostUSD: "$" + M.toLocaleString(),
        totalCostLocal: l + k.toLocaleString(),
        breakdown: {
          panels: "$" + A.toLocaleString(),
          batteries: "$" + w.toLocaleString(),
          inverter: "$" + v.toLocaleString(),
          installation: "$" + f.toLocaleString()
        },
        applianceList: c,
        sunHours: s,
        observations: m
      };
    }
  };
}();
