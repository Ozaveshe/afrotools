!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var n = window.AfroTools.insuranceData;
  window.AfroTools.BusinessInsuranceEngine = {
    calculate: function(a, i) {
      var r = n && n.countries && n.countries[i] ? n.countries[i] : null;
      if (!r) {
        return {
          error: "Country data not available"
        };
      }
      if (!((parseFloat(a.annualRevenue) || 0) > 0 || (parseFloat(a.propertyValue) || 0) > 0 || (parseFloat(a.stockValue) || 0) > 0)) {
        return {
          error: "Enter your revenue, property, or stock value to estimate cover."
        };
      }
      var o = r.symbol || "", t = r.currency || "";
      function e(n) {
        return null == n ? o + "0" : o + Math.round(n).toLocaleString();
      }
      var u = {
        country: r.name,
        currency: t,
        symbol: o
      }, s = a.businessType || "Office / Professional", m = parseFloat(a.annualRevenue) || 0, l = parseFloat(a.propertyValue) || 0, d = (parseInt(a.employees),
      parseFloat(a.stockValue) || 0), M = r.business || {}, c = M.fireRate || {
        min: .1,
        max: .5
      }, f = M.burglaryRate || {
        min: .4,
        max: 1.5
      }, x = M.publicLiabilityRate || {
        min: .25,
        max: .8
      }, y = M.professionalIndemnityRate || {
        min: .8,
        max: 3
      }, h = M.goodsInTransitRate || {
        min: .4,
        max: 1.2
      }, b = s.indexOf("Construction") >= 0 || s.indexOf("Manufacturing") >= 0 ? 1.4 : s.indexOf("Retail") >= 0 || s.indexOf("Restaurant") >= 0 ? 1.15 : 1, p = Math.round(l * c.min / 100 * b), g = Math.round(l * c.max / 100 * b), w = Math.round((l + d) * f.min / 100 * b), I = Math.round((l + d) * f.max / 100 * b), R = Math.round(m * x.min / 100), T = Math.round(m * x.max / 100), P = Math.round(m * y.min / 100), v = Math.round(m * y.max / 100), O = Math.round(d * h.min / 100), A = Math.round(d * h.max / 100), L = p + w + R, F = g + I + T;
      return u.firePremiumMin = e(p), u.firePremiumMax = e(g), u.burglaryPremiumMin = e(w),
      u.burglaryPremiumMax = e(I), u.publicLiabilityMin = e(R), u.publicLiabilityMax = e(T),
      u.professionalIndemnityMin = e(P), u.professionalIndemnityMax = e(v), u.goodsInTransitMin = e(O),
      u.goodsInTransitMax = e(A), u.totalPremiumMin = e(L), u.totalPremiumMax = e(F),
      u.monthlyMin = e(Math.round(L / 12)), u.monthlyMax = e(Math.round(F / 12)), u;
    }
  };
}();
