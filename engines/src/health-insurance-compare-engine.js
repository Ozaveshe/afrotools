!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var n = window.AfroTools.insuranceData;
  window.AfroTools.HealthCompareEngine = {
    calculate: function(a, e) {
      var r = n && n.countries && n.countries[e] ? n.countries[e] : null;
      if (!r) {
        return {
          error: "Country data not available"
        };
      }
      var i = r.symbol || "", o = r.currency || "";
      function t(n) {
        return null == n ? i + "0" : i + Math.round(n).toLocaleString();
      }
      var u = {
        country: r.name,
        currency: o,
        symbol: i
      }, l = a.coverType || "Individual", m = parseFloat(a.age) || 35, d = parseInt(a.dependents) || 0, s = a.budgetLevel || "Standard / Mid-Range", c = r.health || {}, h = c.premium || {
        individual: {
          min: 5e4,
          max: 25e4
        },
        family: {
          min: 15e4,
          max: 8e5
        }
      }, M = l.indexOf("Family") >= 0 ? h.family : h.individual, v = M.min || 5e4, f = M.max || 25e4, y = m > 55 ? 1.4 : m > 45 ? 1.2 : m > 35 ? 1.05 : 1, x = s.indexOf("Basic") >= 0 ? .6 : s.indexOf("Premium") >= 0 ? 1.5 : 1, p = 1 + .15 * d, b = a.preExisting || "None", w = "None" == b ? 1 : b.indexOf("Mild") >= 0 ? 1.15 : 1.35, g = Math.round(v * y * x * p * w), P = Math.round(f * y * x * p * w);
      u.annualPremiumMin = t(g), u.annualPremiumMax = t(P), u.monthlyPremiumMin = t(Math.round(g / 12)),
      u.monthlyPremiumMax = t(Math.round(P / 12)), u.schemeName = c.scheme || "Private Health Insurance",
      u.schemeContribution = c.contribution ? c.contribution.rate + " " + c.contribution.unit : "Varies",
      u.providers = (c.hmos || []).join(", "), u.coverLevel = s, u.plans = [];
      for (var T = c.hmos || [], A = 0; A < Math.min(T.length, 5); A++) {
        var O = P - g, C = g + Math.round(O * A * .15), I = C + Math.round(.3 * O);
        u.plans.push({
          name: T[A],
          annualMin: t(C),
          annualMax: t(I),
          monthlyMin: t(Math.round(C / 12)),
          monthlyMax: t(Math.round(I / 12))
        });
      }
      return u;
    }
  };
}();
