!function () {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var DB = window.AfroTools.insuranceData;
  window.AfroTools.FuneralInsuranceEngine = {
    calculate: function (inp, cc) {
      var C = DB && DB.countries && DB.countries[cc] ? DB.countries[cc] : null;
      if (!C) return { error: "Country data not available" };
      var sym = C.symbol || "", cur = C.currency || "";
      function fmt(v) { return v == null ? sym + "0" : sym + Math.round(v).toLocaleString(); }

      var type = inp.funeralType || "Standard / Traditional";
      var cover = parseFloat(inp.coverAmount) || 0;
      var age = parseFloat(inp.age) || 40;
      var family = parseInt(inp.familyMembers) || 1;
      var d = (C.life || {}).funeral || { monthlyMin: 1e3, monthlyMax: 5e3, coverMin: 2e5, coverMax: 2e6 };
      var typeMult = type.indexOf("Simple") >= 0 ? .6 : type.indexOf("Premium") >= 0 ? 1.8 : 1;
      var estCost = (d.coverMin + d.coverMax) / 2 * typeMult;
      // A blank cover amount falls back to the estimated funeral cost, never 0.
      if (cover <= 0) cover = estCost;

      var ageF = age > 60 ? 2 : age > 50 ? 1.5 : age > 40 ? 1.2 : 1;
      var familyF = 1 + .3 * (family - 1);
      // Premium scales with the chosen cover relative to the mid of the published
      // cover band, so the min/max premiums stay a proper [low, high] range.
      // The old code divided monthlyMin by coverMin and monthlyMax by coverMax,
      // which inverted the range (min > max) for any mid-band cover amount.
      var refCover = (d.coverMin + d.coverMax) / 2 || 1;
      var scale = ageF * familyF * (cover / refCover);
      var pMin = Math.round(d.monthlyMin * scale);
      var pMax = Math.round(d.monthlyMax * scale);

      var out = { country: C.name, currency: cur, symbol: sym };
      out.estimatedFuneralCost = fmt(estCost);
      out.coverAmount = fmt(cover);
      out.monthlyPremiumMin = fmt(pMin);
      out.monthlyPremiumMax = fmt(pMax);
      out.annualPremiumMin = fmt(12 * pMin);
      out.annualPremiumMax = fmt(12 * pMax);
      out.waitingPeriod = "6-12 months (natural death); immediate for accidental death";
      out.familyMembers = family;
      return out;
    }
  };
}();
