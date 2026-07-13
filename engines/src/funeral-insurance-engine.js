!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var n = window.AfroTools.insuranceData;
  window.AfroTools.FuneralInsuranceEngine = {
    calculate: function(r, e) {
      var a = n && n.countries && n.countries[e] ? n.countries[e] : null;
      if (!a) {
        return {
          error: "Country data not available"
        };
      }
      var o = a.symbol || "", t = a.currency || "";
      function i(n) {
        return null == n ? o + "0" : o + Math.round(n).toLocaleString();
      }
      var l = {
        country: a.name,
        currency: t,
        symbol: o
      }, u = r.funeralType || "Standard / Traditional", m = parseFloat(r.coverAmount) || 0, c = parseFloat(r.age) || 40, s = parseInt(r.familyMembers) || 1, d = (a.life || {}).funeral || {
        monthlyMin: 1e3,
        monthlyMax: 5e3,
        coverMin: 2e5,
        coverMax: 2e6
      }, M = u.indexOf("Simple") >= 0 ? .6 : u.indexOf("Premium") >= 0 ? 1.8 : 1, f = (d.coverMin + d.coverMax) / 2 * M;
      m <= 0 && (m = f);
      var y = c > 60 ? 2 : c > 50 ? 1.5 : c > 40 ? 1.2 : 1, v = 1 + .3 * (s - 1), h = Math.round(d.monthlyMin * y * v * (m / d.coverMin)), w = Math.round(d.monthlyMax * y * v * (m / d.coverMax));
      return l.estimatedFuneralCost = i(f), l.coverAmount = i(m), l.monthlyPremiumMin = i(h),
      l.monthlyPremiumMax = i(w), l.annualPremiumMin = i(12 * h), l.annualPremiumMax = i(12 * w),
      l.waitingPeriod = "6-12 months (natural death); immediate for accidental death",
      l.familyMembers = s, l;
    }
  };
}();
