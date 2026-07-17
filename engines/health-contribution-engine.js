!function () {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var DB = window.AfroTools.insuranceData;
  window.AfroTools.HealthContributionEngine = {
    calculate: function (inp, cc) {
      var C = DB && DB.countries && DB.countries[cc] ? DB.countries[cc] : null;
      if (!C) return { error: "Country data not available." };
      var sym = C.symbol || "", cur = C.currency || "";
      function fmt(v) { return v == null ? sym + "0" : sym + Math.round(v).toLocaleString(); }

      var health = C.health || {};
      var contrib = health.contribution || { rate: 0, unit: "N/A" };
      var salary = parseFloat(inp.grossSalary) || 0;
      var empType = inp.employmentType || "Formal / Employed";

      // Contribution data comes in three shapes:
      //   1. { employee, employer } split percentages (Nigeria, Egypt, Morocco...)
      //   2. { rate } single percentage of salary (Kenya, Ghana, Tunisia...)
      //   3. { rate } as a flat periodic amount when rate >= 100 (Ethiopia CBHI,
      //      Rwanda Mutuelle - published as a fixed sum, not a percentage).
      var eePct = parseFloat(contrib.employee);
      var erPct = parseFloat(contrib.employer);
      var rate = parseFloat(contrib.rate) || 0;
      var hasSplit = !isNaN(eePct) || !isNaN(erPct);
      var isPercent = hasSplit || (rate > 0 && rate < 100);

      // A percentage scheme needs a salary - defaulting a missing salary to 0
      // would render the contribution as a misleading "0", so force the input.
      if (isPercent && !(salary > 0)) {
        return { error: "Enter your gross salary to calculate your health contribution." };
      }

      var ee = 0, er = 0;
      if (hasSplit) {
        ee = Math.round(salary * (eePct || 0) / 100);
        er = Math.round(salary * (erPct || 0) / 100);
      } else if (rate > 0 && rate < 100) {
        ee = Math.round(salary * rate / 100);
        er = Math.round(salary * rate * 1.5 / 100); // employer share heuristic where only a single rate is published
      } else if (rate >= 100) {
        ee = Math.round(rate); // published flat amount, per its stated unit
        er = 0;
      }
      // Self-employed / informal workers carry the full contribution themselves.
      if (empType.indexOf("Self") >= 0) {
        er = 0;
        if (!(ee > 0) && salary > 0) ee = Math.round(0.03 * salary);
      }

      var out = { country: C.name, currency: cur, symbol: sym };
      out.schemeName = health.scheme || "None";
      out.contributionBasis = contrib.unit || "N/A";
      out.employeeContribution = fmt(ee);
      out.employerContribution = fmt(er);
      out.totalContribution = fmt(ee + er);
      out.monthlyTotal = fmt(ee + er);
      out.annualTotal = fmt(12 * (ee + er));
      out.providers = (health.hmos || []).join(", ");
      out.mandatory = (isPercent || rate >= 100) ? "Mandatory" : "Voluntary";
      return out;
    }
  };
}();
