!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var r = window.AfroTools.insuranceData;
  window.AfroTools.MarineInsuranceEngine = {
    calculate: function(e, n) {
      var a = r && r.countries && r.countries[n] ? r.countries[n] : null;
      if (!a) {
        return {
          error: "Country data not available"
        };
      }
      if (!(parseFloat(e.cifValue) > 0)) {
        return {
          error: "Enter the CIF cargo value to estimate the premium."
        };
      }
      var i = a.symbol || "", t = a.currency || "";
      function o(r) {
        return null == r ? i + "0" : i + Math.round(r).toLocaleString();
      }
      function u(r) {
        return (r || 0).toFixed(1) + "%";
      }
      var d = {
        country: a.name,
        currency: t,
        symbol: i
      }, c = parseFloat(e.cifValue) || 0, s = e.cargoType || "Containerised (general)", f = e.coverType || "ICC(A) — All Risks", l = e.route || "Intra-Africa", x = r.marineRates || {}, m = s.indexOf("Container") >= 0 ? x.containerised : s.indexOf("Bulk") >= 0 ? x.bulk : s.indexOf("Break") >= 0 ? x.breakBulk : s.indexOf("Refriger") >= 0 ? x.refrigerated : x.hazardous;
      m || (m = {
        rateMin: .3,
        rateMax: .8
      });
      var M = f.indexOf("ICC(A)") >= 0 ? 1.3 : f.indexOf("ICC(B)") >= 0 ? 1 : .7, A = l.indexOf("Intra-Africa") >= 0 ? 1.1 : l.indexOf("Europe") >= 0 ? 1 : l.indexOf("Asia") >= 0 ? 1.05 : l.indexOf("America") >= 0 ? 1.1 : 1.15, O = l.indexOf("Intra-Africa") >= 0 ? .05 : .02, w = Math.round(c * m.rateMin / 100 * M * A), C = Math.round(c * m.rateMax / 100 * M * A), y = Math.round(c * O / 100);
      return d.estimatedPremiumMin = o(w + y), d.estimatedPremiumMax = o(C + y), d.basePremiumMin = o(w),
      d.basePremiumMax = o(C), d.warRiskSurcharge = o(y), d.rateApplied = u(m.rateMin * M * A) + " - " + u(m.rateMax * M * A),
      d.sumInsured = o(1.1 * c), d.cifValue = o(c), d;
    }
  };
}();
