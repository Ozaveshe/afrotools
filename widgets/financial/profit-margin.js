(function () {
  "use strict";

  const copy = {
    en: {
      title: "Gross Margin Calculator", unit: "Currency or unit label (optional)", example: "e.g. USD, NGN",
      revenue: "Revenue", cost: "Cost of goods sold", calculate: "Calculate", profit: "Gross profit",
      margin: "Gross margin", markup: "Markup on COGS", notApplicable: "N/A",
      loss: "Loss result calculated.", ready: "Result updated.",
      invalid: "Enter revenue greater than zero and a non-negative cost.", unavailable: "Calculator unavailable."
    },
    fr: {
      title: "Calculateur de marge brute", unit: "Devise ou unité (facultatif)", example: "p. ex. EUR, XOF",
      revenue: "Chiffre d’affaires", cost: "Coût des marchandises vendues", calculate: "Calculer", profit: "Bénéfice brut",
      margin: "Marge brute", markup: "Marge sur coût d’achat", notApplicable: "Sans objet",
      loss: "Le calcul indique une perte.", ready: "Résultat mis à jour.",
      invalid: "Saisissez un chiffre d’affaires supérieur à zéro et un coût positif ou nul.", unavailable: "Calculateur indisponible."
    }
  };
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.profit_margin = function (root, options) {
    options = options || {};
    const ownIframe = window.location.pathname.replace(/\.html$/, "") === "/widgets/iframe/financial-profit-margin";
    const language = options.lang || (ownIframe && new URLSearchParams(window.location.search).get("lang"));
    const locale = language === "fr" ? "fr" : "en";
    if (ownIframe && locale === "fr") {
      document.documentElement.lang = "fr";
      document.title = "Calculateur de marge brute - AfroTools";
      const fullTool = document.querySelector(".aw-footer a");
      if (fullTool) {
        fullTool.textContent = "Ouvrir le calculateur complet sur AfroTools";
        fullTool.href = "https://afrotools.com/fr/tools/marge-beneficiaire/?utm_source=widget&utm_medium=embed&utm_campaign=profit-margin";
      }
    }
    const text = copy[locale];
    const number = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    root.innerHTML =
      '<div class="aw-title">' + text.title + '</div>' +
      '<div class="aw-field"><label class="aw-label" for="aw-unit">' + text.unit + '</label>' +
      '<input class="aw-input" id="aw-unit" maxlength="12" autocomplete="off" placeholder="' + text.example + '"></div>' +
      '<div class="aw-row"><div class="aw-field"><label class="aw-label" for="aw-revenue">' + text.revenue + '</label>' +
      '<input class="aw-input" id="aw-revenue" type="number" min="0" step="0.01" inputmode="decimal" autocomplete="off"></div>' +
      '<div class="aw-field"><label class="aw-label" for="aw-cogs">' + text.cost + '</label>' +
      '<input class="aw-input" id="aw-cogs" type="number" min="0" step="0.01" inputmode="decimal" autocomplete="off"></div></div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc" type="button">' + text.calculate + '</button>' +
      '<div id="aw-status" role="status" aria-live="polite"></div><div class="aw-result-box" id="aw-res" hidden></div>' +
      (options.footerHTML || "");

    const result = root.querySelector("#aw-res");
    const status = root.querySelector("#aw-status");
    function clearResult(message) {
      result.hidden = true;
      result.replaceChildren();
      status.textContent = message;
    }
    function percentage(value) {
      return locale === "fr" ? number.format(value) + " %" : value.toFixed(2) + "%";
    }
    function calculate() {
      const engine = window.AfroTools && window.AfroTools.ProfitMarginEngine;
      if (!engine) {
        clearResult(text.unavailable);
        return;
      }
      const unit = root.querySelector("#aw-unit").value.trim();
      let output;
      try {
        output = engine.calculate({
          mode: "gross", unit,
          revenue: root.querySelector("#aw-revenue").value,
          cogs: root.querySelector("#aw-cogs").value
        });
      } catch (error) {
        clearResult(text.invalid);
        return;
      }
      result.innerHTML = '<div class="aw-result-label">' + text.profit + '</div><div class="aw-result-main"></div>' +
        '<hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">' + text.margin + '</span><span></span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">' + text.markup + '</span><span></span></div>';
      result.querySelector(".aw-result-main").textContent = (unit ? unit + " " : "") + number.format(output.grossProfit);
      const percentages = result.querySelectorAll(".aw-result-row span:last-child");
      percentages[0].textContent = percentage(output.grossMargin);
      percentages[1].textContent = output.markup === null ? text.notApplicable : percentage(output.markup);
      result.hidden = false;
      status.textContent = output.grossProfit < 0 ? text.loss : text.ready;
    }
    root.querySelector("#aw-calc").addEventListener("click", calculate);
    root.querySelectorAll("input").forEach(function (input) {
      input.addEventListener("input", function () { if (!result.hidden) calculate(); });
      input.addEventListener("keydown", function (event) { if (event.key === "Enter") calculate(); });
    });
  };
}());
