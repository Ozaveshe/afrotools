(function () {
  "use strict";

  const engine = window.AfroTools && window.AfroTools.helbEngine;
  if (!engine) return;

  const byId = (id) => document.getElementById(id);
  const money = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0
  });
  let currentPlan = null;

  function fmt(value) {
    return money
      .format(Number.isFinite(value) ? value : 0)
      .replace(/^Ksh/i, "KSh")
      .replace(/\u00a0/g, " ");
  }

  function payoffDate(months) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + months);
    return date.toLocaleDateString("en-KE", { month: "long", year: "numeric" });
  }

  function setStatus(message) {
    byId("helbActionStatus").textContent = message;
  }

  function report() {
    if (!currentPlan) return "";
    const result = currentPlan;
    return [
      "Kenya HELB repayment planning worksheet - AfroTools",
      "",
      "Inputs",
      `Current statement balance: ${fmt(result.openingBalance)}`,
      `Annual interest assumption: ${result.annualRate}%`,
      `Monthly payment: ${fmt(result.plannedPayment)}`,
      "",
      "Estimate",
      `Outcome: ${result.clears ? "Clears within model" : "Does not clear within model"}`,
      `Time to clear: ${result.clears ? `${result.months} months` : "Not calculated"}`,
      `Projected payoff month: ${result.clears ? payoffDate(result.months) : "Not calculated"}`,
      `Total interest modelled: ${result.clears ? fmt(result.totalInterest) : "Not calculated"}`,
      `Total paid: ${result.clears ? fmt(result.totalPaid) : "Not calculated"}`,
      "",
      "Important checks",
      "Use the current balance and deduction schedule from your HELB statement or portal.",
      "Confirm your product's interest rate, penalties, ledger charges and repayment start date with HELB.",
      "This worksheet is not an official statement, billing schedule, compliance decision or clearance certificate.",
      "Official repayment information: https://www.helb.co.ke/repay-loan/"
    ].join("\n");
  }

  function render(result) {
    const grid = byId("resultGrid");
    const warnings = byId("warningStack");
    const rows = byId("scheduleBody");

    if (!result.clears) {
      grid.innerHTML = `
        <article class="metric primary">
          <div class="metric-label">Monthly payment tested</div>
          <div class="metric-value">${fmt(result.plannedPayment)}</div>
          <div class="metric-sub">First-month interest is approximately ${fmt(result.firstMonthInterest)}.</div>
        </article>
        <article class="metric">
          <div class="metric-label">Outcome</div>
          <div class="metric-value">Not clearing</div>
          <div class="metric-sub">The payment does not reduce the balance, or payoff exceeds 50 years.</div>
        </article>`;
      warnings.innerHTML = `<div class="warning warning-danger"><strong>Revise this plan.</strong> Use the monthly deduction on your HELB billing schedule. If you are in arrears, contact HELB because penalties and account-specific charges are not guessed here.</div>`;
      rows.innerHTML = `<tr><td colspan="5">No reliable repayment schedule can be shown for this input.</td></tr>`;
    } else {
      grid.innerHTML = `
        <article class="metric primary">
          <div class="metric-label">Projected payoff month</div>
          <div class="metric-value">${payoffDate(result.months)}</div>
          <div class="metric-sub">${result.months} monthly payments in this unchanged-payment scenario.</div>
        </article>
        <article class="metric">
          <div class="metric-label">Monthly payment tested</div>
          <div class="metric-value">${fmt(result.plannedPayment)}</div>
          <div class="metric-sub">Use HELB's issued deduction amount, plus only a top-up you intend to make.</div>
        </article>
        <article class="metric">
          <div class="metric-label">Total interest modelled</div>
          <div class="metric-value">${fmt(result.totalInterest)}</div>
          <div class="metric-sub">Based on the editable annual rate; excludes penalties and ledger charges.</div>
        </article>
        <article class="metric">
          <div class="metric-label">Total paid</div>
          <div class="metric-value">${fmt(result.totalPaid)}</div>
          <div class="metric-sub">Final payment is capped to the remaining balance plus that month's interest.</div>
        </article>`;
      warnings.innerHTML = `<div class="warning warning-neutral"><strong>Scenario, not a HELB instruction.</strong> Real deductions come from HELB's billing schedule. Confirm the live statement before changing a payment.</div>`;
      rows.innerHTML = result.schedule.map((row) => `
        <tr>
          <td>Month ${row.month}</td>
          <td>${fmt(row.payment)}</td>
          <td>${fmt(row.interest)}</td>
          <td>${fmt(row.principal)}</td>
          <td>${fmt(row.balance)}</td>
        </tr>`).join("");
    }
    byId("results").classList.add("show");
    byId("results").focus();
  }

  function calculate() {
    const result = engine.calculate({
      balance: byId("statementBalance").value,
      annualRate: byId("annualRate").value,
      monthlyPayment: byId("monthlyPayment").value,
      extraPayment: byId("topUp").value
    });
    const error = byId("helbError");
    if (!result.valid) {
      currentPlan = null;
      error.textContent = result.error;
      byId("results").classList.remove("show");
      byId("statementBalance").focus();
      return;
    }
    error.textContent = "";
    currentPlan = result;
    render(result);
  }

  byId("calculateBtn").addEventListener("click", calculate);
  byId("copyHelbReport").addEventListener("click", async function () {
    if (!currentPlan) return setStatus("Calculate a plan first.");
    try {
      await navigator.clipboard.writeText(report());
      setStatus("Worksheet copied.");
    } catch (_error) {
      setStatus("Copy failed. Download the TXT worksheet instead.");
    }
  });
  byId("downloadHelbReport").addEventListener("click", function () {
    if (!currentPlan) return setStatus("Calculate a plan first.");
    const url = URL.createObjectURL(new Blob([report()], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "kenya-helb-repayment-worksheet.txt";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("TXT worksheet downloaded.");
  });
  byId("printHelbReport").addEventListener("click", function () {
    if (!currentPlan) return setStatus("Calculate a plan first.");
    setStatus("Opening the print dialog. Choose Save as PDF to create a PDF.");
    window.print();
  });
  window.AFROTOOLS_HELB_VIP = true;
})();
