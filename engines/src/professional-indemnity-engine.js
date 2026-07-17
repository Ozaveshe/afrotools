!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var n = window.AfroTools.insuranceData;
  window.AfroTools.ProfessionalIndemnityEngine = {
    calculate: function(e, o) {
      var r = n && n.countries && n.countries[o] ? n.countries[o] : null;
      if (!r) {
        return {
          error: "Country data not available"
        };
      }
      if (!((parseFloat(e.annualRevenue) || 0) > 0 || (parseFloat(e.coverLimit) || 0) > 0)) {
        return {
          error: "Enter your annual revenue or desired cover limit to estimate the premium."
        };
      }
      var i = r.symbol || "", t = r.currency || "";
      function a(n) {
        return null == n ? i + "0" : i + Math.round(n).toLocaleString();
      }
      function s(n) {
        return (n || 0).toFixed(1) + "%";
      }
      var u = {
        country: r.name,
        currency: t,
        symbol: i
      }, l = e.profession || "Other Professional", c = parseFloat(e.annualRevenue) || 0, d = parseFloat(e.coverLimit) || 0, m = parseFloat(e.yearsExperience) || 5, f = e.priorClaims || "None", x = (r.business || {}).professionalIndemnityRate || {
        min: .8,
        max: 3
      }, y = l.indexOf("Doctor") >= 0 || l.indexOf("Medical") >= 0 ? 1.5 : l.indexOf("Lawyer") >= 0 ? 1.3 : l.indexOf("Engineer") >= 0 || l.indexOf("Architect") >= 0 ? 1.2 : 1, M = m > 15 ? .85 : m > 10 ? .9 : m > 5 ? 1 : 1.15, h = "None" == f ? .9 : f.indexOf("1") >= 0 ? 1.2 : 1.5, p = d > 0 ? d : 3 * c, w = Math.round(p * x.min / 100 * y * M * h), v = Math.round(p * x.max / 100 * y * M * h);
      return u.estimatedPremiumMin = a(w), u.estimatedPremiumMax = a(v), u.monthlyMin = a(Math.round(w / 12)),
      u.monthlyMax = a(Math.round(v / 12)), u.rateApplied = s(x.min) + " - " + s(x.max),
      u.coverLimit = a(p), u.excess = a(Math.round(.02 * p)), u;
    }
  };
}();
