!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {}, window.AfroTools.BillVerifierEngine = {
    calculate: function(e, r) {
      var t = ENERGY_DATA.countries[r];
      if (!t) {
        return {
          error: "Country data not available."
        };
      }
      var a = parseFloat(e.prevReading) || 0, n = parseFloat(e.currReading) || 0, o = parseFloat(e.billedAmount) || 0, i = e.customerType || "residential";
      if (n <= a) {
        return {
          error: "Current reading must be greater than previous reading."
        };
      }
      var l = t.currencySymbol, u = t.electricityTariff, s = n - a, d = 0, c = 0, g = [];
      if ("commercial" === i) {
        c = s * (d = u.commercial);
      } else if ("industrial" === i) {
        c = s * (d = u.industrial);
      } else if (u.bands && u.bands.length && null != u.bands[0].max) {
        for (var m = s, h = 0, b = 0; b < u.bands.length; b++) {
          var v = u.bands[b], p = null == v.max ? m : v.max - h, f = Math.min(m, p);
          if (f <= 0) {
            break;
          }
          var L = f * v.rate;
          if (c += L, g.push({
            band: v.label || "Band " + (b + 1),
            units: f.toFixed(0),
            rate: l + v.rate.toFixed(2),
            cost: l + Math.round(L).toLocaleString()
          }), h = v.max || h, (m -= f) <= 0) {
            break;
          }
        }
        d = c / s;
      } else {
        c = s * (d = u.residential);
      }
      var y = Math.round(.1 * c), S = Math.round(c + y), E = o > 0 ? Math.abs(o - S) : null, A = o > 0 && S > 0 ? Math.round(E / S * 100) : null, x = "";
      o > 0 && (x = A <= 5 ? "BILL LOOKS CORRECT" : o > 1.2 * S ? "OVERBILLED — Dispute Advised" : o < .8 * S ? "UNDERBILLED — May be estimated read" : "MINOR VARIANCE — Acceptable");
      var C = [];
      return C.push("Units consumed: " + s + " kWh at avg " + l + d.toFixed(2) + "/kWh (" + i + ")."),
      C.push("Expected bill: " + l + S.toLocaleString() + " (energy: " + l + Math.round(c).toLocaleString() + " + service charge: " + l + y.toLocaleString() + ")."),
      o > 0 && null !== A && (C.push("Your billed amount: " + l + o.toLocaleString() + " — variance: " + A + "% (" + x + ")."),
      A > 20 && C.push("Large variance detected. Check for estimated reading, meter tampering, or billing errors. Contact your utility provider.")),
      s > 500 && C.push("High consumption month. Consider energy audit to identify top consumers."),
      {
        unitsConsumed: s + " kWh",
        expectedEnergy: l + Math.round(c).toLocaleString(),
        serviceCharge: l + y.toLocaleString(),
        expectedTotal: l + S.toLocaleString(),
        billedAmount: o > 0 ? l + o.toLocaleString() : "Not entered",
        variance: null !== E ? l + E.toLocaleString() : "—",
        variancePct: null !== A ? A + "%" : "—",
        status: x || "Enter billed amount to verify",
        tierBreakdown: g,
        observations: C,
        countryName: t.name,
        currencySymbol: l
      };
    }
  };
}();
