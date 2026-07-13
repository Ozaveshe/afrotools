!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var r = window.AfroTools.insuranceData;
  window.AfroTools.CarInsuranceEngine = {
    calculate: function(e, a) {
      var n = r && r.countries && r.countries[a] ? r.countries[a] : null;
      if (!n) {
        return {
          error: "Country data not available"
        };
      }
      var o = n.symbol || "", t = n.currency || "";
      function i(r) {
        return null == r ? o + "0" : o + Math.round(r).toLocaleString();
      }
      var s = {
        country: n.name,
        currency: t,
        symbol: o
      }, c = parseFloat(e.vehicleValue) || 0, u = parseFloat(e.vehicleAge) || 0, d = parseFloat(e.driverAge) || 30, l = parseFloat(e.yearsLicensed) || 1, h = parseInt(e.claimHistory) || 0, v = n.motor || {}, y = v.thirdParty ? v.thirdParty.min : 5e3, m = v.thirdParty ? v.thirdParty.max : 15e3, p = (v.comprehensive ? v.comprehensive.rateMin : 3) / 100, M = (v.comprehensive ? v.comprehensive.rateMax : 8) / 100, P = (u > 10 ? 1.3 : u > 5 ? 1.15 : u > 2 ? 1 : .95) * (d < 25 ? 1.25 : d > 55 ? 1.1 : 1) * (l < 2 ? 1.2 : l < 5 ? 1.05 : .95) * (0 == h ? .9 : 1 == h ? 1 : 2 == h ? 1.2 : 1.4), f = Math.round(c * p * P), w = Math.round(c * M * P), g = Math.round(y * P), A = Math.round(m * P);
      return s.thirdPartyMin = i(g), s.thirdPartyMax = i(A), s.comprehensiveMin = i(f),
      s.comprehensiveMax = i(w), s.thirdPartyMandatory = !v.thirdParty || !!v.thirdParty.mandatory,
      s.providers = (v.providers || []).join(", "), s.excess = i(.01 * c), s.savingTip = 0 == h ? "Your clean record saves you ~10% (No Claim Discount)." : "Consider defensive driving courses to reduce premiums.",
      s.annualThirdParty = i((g + A) / 2), s.annualComprehensive = i((f + w) / 2), s;
    }
  };
}();
