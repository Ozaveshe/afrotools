!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var o = window.AfroTools.insuranceData;
  window.AfroTools.HealthContributionEngine = {
    calculate: function(n, r) {
      var t = o && o.countries && o.countries[r] ? o.countries[r] : null;
      if (!t) {
        return {
          error: "Country data not available"
        };
      }
      var a = t.symbol || "", e = t.currency || "";
      function i(o) {
        return null == o ? a + "0" : a + Math.round(o).toLocaleString();
      }
      var l = {
        country: t.name,
        currency: e,
        symbol: a
      }, u = parseFloat(n.grossSalary) || 0, s = n.employmentType || "Formal / Employed", c = t.health || {}, y = c.scheme || "None", m = c.contribution || {
        rate: 0,
        unit: "N/A"
      }, d = parseFloat(m.rate) || 0, h = 0, f = 0;
      return d > 0 && d < 100 ? (h = Math.round(u * d / 100), f = Math.round(u * d * 1.5 / 100)) : d >= 100 && (h = d,
      f = 0), s.indexOf("Self") >= 0 && (f = 0, h = h || Math.round(.03 * u)), l.schemeName = y,
      l.contributionBasis = m.unit || "N/A", l.employeeContribution = i(h), l.employerContribution = i(f),
      l.totalContribution = i(h + f), l.monthlyTotal = i(h + f), l.annualTotal = i(12 * (h + f)),
      l.providers = (c.hmos || []).join(", "), l.mandatory = d > 0 ? "Mandatory" : "Voluntary",
      l;
    }
  };
}();
