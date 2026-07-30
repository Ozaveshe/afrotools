(function (window, document) {
  "use strict";

  var root = document.querySelector("[data-creator-money]");
  var engine = window.CreatorMoneyEngine;
  if (!root || !engine || typeof engine.calculatePlan !== "function") return;

  var fr = root.getAttribute("data-locale") === "fr";
  var form = root.querySelector("form");
  var results = root.querySelector("[data-results]");
  var status = root.querySelector("[data-status]");
  var lastReport = null;
  var copy = {
    invalid: fr ? "Vérifiez les montants, les heures et les pourcentages." : "Check the amounts, hours and percentages.",
    ready: fr ? "Plan mensuel calculé localement." : "Monthly plan calculated locally.",
    copied: fr ? "Plan copié." : "Plan copied.",
    fallback: fr ? "Copie impossible. Le plan reste affiché." : "Copy failed. The plan remains visible.",
    exported: fr ? "Export téléchargé." : "Export downloaded.",
    profit: fr ? "Résultat d’exploitation" : "Operating profit",
    margin: fr ? "Marge" : "Margin",
    hourly: fr ? "Résultat par heure" : "Profit per hour",
    tax: fr ? "Réserve fiscale indicative" : "Indicative tax reserve",
    owner: fr ? "Rémunération du créateur" : "Creator pay",
    reinvest: fr ? "Réinvestissement" : "Reinvestment",
    buffer: fr ? "Trésorerie restante" : "Remaining cash buffer",
    disclaimer: fr
      ? "Plan de trésorerie indicatif. Le taux fiscal n’est pas calculé selon une juridiction : saisissez votre propre hypothèse et vérifiez-la auprès d’une source officielle."
      : "Indicative cash plan. The tax rate is not jurisdiction-calculated: enter your own assumption and verify it with an official source."
  };

  function money(value, currency) {
    try {
      return new Intl.NumberFormat(fr ? "fr-FR" : "en", {
        style: "currency",
        currency: currency,
        maximumFractionDigits: 2
      }).format(value);
    } catch (error) {
      return currency + " " + Number(value).toFixed(2);
    }
  }

  function metric(label, value) {
    return '<div class="cf-metric"><span>' + label + '</span><strong>' + value + "</strong></div>";
  }

  function read() {
    return {
      currency: form.elements.currency.value,
      income: Number(form.elements.income.value),
      expenses: Number(form.elements.expenses.value),
      monthlyHours: Number(form.elements.monthlyHours.value),
      taxRate: Number(form.elements.taxRate.value),
      ownerPayRate: Number(form.elements.ownerPayRate.value),
      reinvestmentRate: Number(form.elements.reinvestmentRate.value)
    };
  }

  function reportText(report) {
    return [
      fr ? "Plan de revenus du créateur AfroTools" : "AfroTools creator money plan",
      (fr ? "Revenus : " : "Income: ") + money(report.result.income, report.result.currency),
      (fr ? "Dépenses : " : "Expenses: ") + money(report.result.expenses, report.result.currency),
      copy.profit + ": " + money(report.result.operatingProfit, report.result.currency),
      copy.tax + ": " + money(report.result.taxReserve, report.result.currency),
      copy.owner + ": " + money(report.result.ownerPay, report.result.currency),
      copy.reinvest + ": " + money(report.result.reinvestment, report.result.currency),
      copy.buffer + ": " + money(report.result.cashBuffer, report.result.currency),
      copy.disclaimer
    ].join("\n");
  }

  function calculate(event) {
    if (event) event.preventDefault();
    var input = read();
    var result = engine.calculatePlan(input);
    if (!result.valid) {
      lastReport = null;
      results.hidden = true;
      status.textContent = copy.invalid;
      status.classList.add("cf-error");
      return;
    }
    lastReport = {
      schemaVersion: 1,
      tool: "creator-money",
      locale: fr ? "fr" : "en",
      generatedAt: new Date().toISOString(),
      input: input,
      result: result,
      disclaimer: copy.disclaimer
    };
    results.hidden = false;
    results.querySelector("[data-metrics]").innerHTML =
      metric(copy.profit, money(result.operatingProfit, result.currency)) +
      metric(copy.margin, result.margin.toFixed(1) + "%") +
      metric(copy.hourly, money(result.effectiveHourly, result.currency)) +
      metric(copy.tax, money(result.taxReserve, result.currency)) +
      metric(copy.owner, money(result.ownerPay, result.currency)) +
      metric(copy.reinvest, money(result.reinvestment, result.currency)) +
      metric(copy.buffer, money(result.cashBuffer, result.currency));
    results.querySelector("[data-disclaimer]").textContent = copy.disclaimer;
    status.textContent = copy.ready;
    status.classList.remove("cf-error");
  }

  function download(type) {
    if (!lastReport) calculate();
    if (!lastReport) return;
    var content = type === "json" ? JSON.stringify(lastReport, null, 2) : reportText(lastReport);
    var blob = new Blob([content], { type: type === "json" ? "application/json" : "text/plain" });
    var href = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "creator-money-plan." + type;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(href); }, 0);
    status.textContent = copy.exported;
  }

  form.addEventListener("submit", calculate);
  root.querySelector("[data-json]").addEventListener("click", function () { download("json"); });
  root.querySelector("[data-txt]").addEventListener("click", function () { download("txt"); });
  root.querySelector("[data-copy]").addEventListener("click", function () {
    if (!lastReport) calculate();
    if (!lastReport) return;
    var text = reportText(lastReport);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        status.textContent = copy.copied;
      }).catch(function () {
        status.textContent = copy.fallback + "\n" + text;
      });
    } else {
      status.textContent = copy.fallback + "\n" + text;
    }
  });
})(window, document);
