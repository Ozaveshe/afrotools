(function () {
  "use strict";
  var engine = window.AfroToolsTutoringRateEngine;
  var form = document.getElementById("tutoringRateForm");
  var results = document.getElementById("tutoringResults");
  var current = null;

  function value(id) { return document.getElementById(id).value; }
  function money(amount) {
    var label = (value("currency") || "units").trim();
    return label + " " + Number(amount).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  function metric(label, amount, note) {
    return "<article><span>" + label + "</span><strong>" + amount + "</strong><small>" + note + "</small></article>";
  }
  function row(term, description) {
    return "<div><dt>" + term + "</dt><dd>" + description + "</dd></div>";
  }
  function read() {
    return {
      targetIncome: value("targetIncome"), monthlyCosts: value("monthlyCosts"),
      sessionsPerWeek: value("sessionsPerWeek"), weeksPerMonth: value("weeksPerMonth"),
      lessonMinutes: value("lessonMinutes"), groupSize: value("groupSize"),
      prepMinutes: value("prepMinutes"), adminMinutes: value("adminMinutes"),
      travelMinutes: value("travelMinutes"), sessionCost: value("sessionCost"),
      taxReserve: value("taxReserve"), riskReserve: value("riskReserve"),
      packageSessions: value("packageSessions"), packageDiscount: value("packageDiscount"),
      proposedPrice: value("proposedPrice")
    };
  }
  function render(result) {
    current = result;
    document.getElementById("resultContext").textContent =
      result.sessionsMonthly.toFixed(2) + " sessions/month · " + result.input.groupSize +
      (result.input.groupSize === 1 ? " learner" : " learners") + " · " +
      result.workMinutesSession + " total work minutes/session";
    document.getElementById("metricGrid").innerHTML =
      metric("Required session revenue", money(result.requiredSessionRevenue), "Across all learners") +
      metric("Per-learner session quote", money(result.perLearnerSession), "At entered group size") +
      metric("Client hourly equivalent", money(result.clientHourlyEquivalent), "Per 60 billed minutes") +
      metric("Monthly revenue required", money(result.requiredRevenueMonthly), "Before entered reserves") +
      metric("Package per learner", money(result.packagePrice), result.input.packageSessions + " sessions; " + result.input.packageDiscount + "% discount");
    document.getElementById("monthlyBreakdown").innerHTML =
      row("Target personal income", money(result.input.targetIncome)) +
      row("Fixed monthly costs", money(result.input.monthlyCosts)) +
      row("Variable session costs", money(result.variableCostsMonthly)) +
      row("Reserve provision", money(result.reserveAmountMonthly)) +
      row("Required collected revenue", money(result.requiredRevenueMonthly));
    document.getElementById("workloadBreakdown").innerHTML =
      row("Monthly sessions", result.sessionsMonthly.toFixed(2)) +
      row("Total work time/session", result.workMinutesSession + " minutes") +
      row("Total work hours/month", result.workHoursMonthly.toFixed(2)) +
      row("Effective personal income/work hour", money(result.effectiveWorkHourIncome)) +
      row("Package discount value", money(result.packageRevenueLoss) + " per learner/package");
    var comparison = document.getElementById("comparison");
    if (result.comparison) {
      var direction = result.comparison.monthlyGap >= 0 ? "above" : "below";
      comparison.innerHTML = "<strong>Proposed-price comparison:</strong> at full attendance, the proposed price produces " +
        money(result.comparison.proposedMonthlyRevenue) + "/month, " + money(Math.abs(result.comparison.monthlyGap)) +
        " " + direction + " the revenue required by these assumptions. This is a capacity comparison, not a market verdict.";
    } else {
      comparison.innerHTML = "<strong>No proposed price compared.</strong> Enter one if you want to test whether an existing quote supports this plan.";
    }
    results.hidden = false;
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function report() {
    if (!current) return "";
    var c = current;
    return [
      "Tutoring cost-based quote brief — AfroTools",
      "Generated from user-entered assumptions; not a market benchmark.",
      "",
      "Currency/unit label: " + (value("currency") || "units"),
      "Target personal income/month: " + money(c.input.targetIncome),
      "Fixed costs/month: " + money(c.input.monthlyCosts),
      "Sessions/week: " + c.input.sessionsPerWeek,
      "Weeks/month: " + c.input.weeksPerMonth,
      "Monthly sessions: " + c.sessionsMonthly.toFixed(2),
      "Group size: " + c.input.groupSize,
      "Billed lesson minutes: " + c.input.lessonMinutes,
      "Prep/admin/travel minutes: " + [c.input.prepMinutes, c.input.adminMinutes, c.input.travelMinutes].join("/"),
      "Per-session expense: " + money(c.input.sessionCost),
      "Tax/savings reserve: " + c.input.taxReserve + "%",
      "Cancellation/non-payment reserve: " + c.input.riskReserve + "%",
      "",
      "Required revenue/month: " + money(c.requiredRevenueMonthly),
      "Required revenue/session: " + money(c.requiredSessionRevenue),
      "Per-learner session quote: " + money(c.perLearnerSession),
      "Client hourly equivalent: " + money(c.clientHourlyEquivalent),
      "Effective personal income/work hour: " + money(c.effectiveWorkHourIncome),
      c.input.packageSessions + "-session package per learner: " + money(c.packagePrice) + " (" + c.input.packageDiscount + "% user-entered discount)",
      "",
      "Boundary: This result does not measure local demand, affordability or competitor prices. Verify current comparable quotes and applicable tax rules."
    ].join("\n");
  }
  function status(message) {
    document.getElementById("actionStatus").textContent = message;
  }
  function download() {
    var blob = new Blob([report()], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url; anchor.download = "tutoring-cost-based-quote.txt"; anchor.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    status("TXT quote brief downloaded.");
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var result = engine.calculate(read());
    var error = document.getElementById("tutoringError");
    if (!result.ok) {
      error.textContent = result.errors[0];
      results.hidden = true;
      return;
    }
    error.textContent = "";
    render(result);
  });
  document.getElementById("copyReport").addEventListener("click", function () {
    navigator.clipboard.writeText(report()).then(function () { status("Quote brief copied."); });
  });
  document.getElementById("downloadReport").addEventListener("click", download);
  document.getElementById("printReport").addEventListener("click", function () { window.print(); });
  window.AFROTOOLS_TUTORING_RATE_VIP = true;
})();
