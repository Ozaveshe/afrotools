!function () {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var DB = window.AfroTools.insuranceData;
  window.AfroTools.HealthContributionEngine = {
    calculate: function (inp, cc) {
      var C = DB && DB.countries && DB.countries[cc] ? DB.countries[cc] : null;
      if (!C) return { error: "Country data not available" };
      var sym = C.symbol || "", cur = C.currency || "";
      function fmt(v) { return v == null ? sym + "0" : sym + Math.round(v).toLocaleString(); }

      var health = C.health || {};
      var contrib = health.contribution || { rate: 0, unit: "N/A" };
      var salary = parseFloat(inp.grossSalary) || 0;
      var empType = inp.employmentType || "Formal / Employed";

      // Contribution data comes in four shapes:
      //   1. { employee, employer } split percentages — the only shape that can
      //      state an employer cost (Nigeria, Kenya, Tunisia, Tanzania, Egypt...).
      //   2. { rate } single published percentage — apply it to the salary, but do
      //      NOT invent an employer share.
      //   3. { rate } >= 100 — a flat periodic household amount (Ethiopia CBHI,
      //      Rwanda Mutuelle), not a percentage; no employer.
      //   4. { rate: 0 } — no statutory scheme (voluntary, e.g. South Africa).
      var eePct = parseFloat(contrib.employee);
      var erPct = parseFloat(contrib.employer);
      var rate = parseFloat(contrib.rate) || 0;
      var floor = parseFloat(contrib.min) || 0;
      var hasSplit = !isNaN(eePct) || !isNaN(erPct);
      var isPercent = hasSplit || (rate > 0 && rate < 100);

      // A percentage scheme needs a salary - defaulting a missing salary to 0
      // would render the contribution as a misleading "0", so force the input.
      if (isPercent && !(salary > 0)) {
        return { error: "Enter your gross salary to calculate your health contribution." };
      }

      var ee = 0, er = 0, erUnknown = false;
      if (hasSplit) {
        ee = Math.round(salary * (eePct || 0) / 100);
        er = Math.round(salary * (erPct || 0) / 100);
      } else if (rate > 0 && rate < 100) {
        // Only a single rate is published. The old code assumed employer = rate x 1.5,
        // which fabricated an employer cost that does not exist (Kenya's SHIF has no
        // employer match at all; Tunisia's real split is 2.75/4, not 6.75/10.125).
        ee = Math.round(salary * rate / 100);
        erUnknown = true;
      } else if (rate >= 100) {
        ee = Math.round(rate); // published flat amount, per its stated unit
      }

      // Statutory monthly floor (e.g. Kenya SHIF minimum KES 300/month).
      if (floor > 0 && ee > 0 && ee < floor) ee = floor;

      // Self-employed / informal workers carry the contribution themselves.
      if (empType.indexOf("Self") >= 0) {
        er = 0;
        erUnknown = false;
        if (!(ee > 0) && salary > 0) ee = Math.round(0.03 * salary);
        if (floor > 0 && ee > 0 && ee < floor) ee = floor;
      }

      var out = { country: C.name, currency: cur, symbol: sym };
      out.schemeName = health.scheme || "None";
      out.contributionBasis = contrib.unit || "N/A";
      out.employeeContribution = fmt(ee);
      out.employerContribution = erUnknown ? "Not published" : fmt(er);
      out.totalContribution = erUnknown ? fmt(ee) : fmt(ee + er);
      out.monthlyTotal = erUnknown ? fmt(ee) : fmt(ee + er);
      out.annualTotal = erUnknown ? fmt(12 * ee) : fmt(12 * (ee + er));
      out.providers = (health.hmos || []).join(", ");
      out.mandatory = (isPercent || rate >= 100) ? "Mandatory" : "Voluntary";
      return out;
    }
  };
}();
