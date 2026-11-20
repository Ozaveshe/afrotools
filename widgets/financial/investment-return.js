!function() {
  "use strict";
  window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.investment_return = function(a, e) {
    const fr = a.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr";
    const words = {
      "Mortgage planning estimate": "Simulation de prêt immobilier",
      Currency: "Devise",
      "Loan amount": "Montant emprunté",
      "Your annual fixed rate (%)": "Taux annuel fixe (%)",
      "Use a lender quote or a clearly marked scenario.": "Indiquez le taux proposé par votre prêteur ou celui de votre simulation.",
      "Loan term (years)": "Durée du prêt (années)",
      Calculate: "Calculer",
      "Monthly principal + interest": "Mensualité (capital et intérêts)",
      "Total interest": "Total des intérêts",
      "Total paid": "Total remboursé",
      TIP: "Intérêts en pourcentage du capital initial",
      "No data is stored or sent.": "Les montants sont calculés sur votre appareil.",
      "Planning estimate updated locally.": "Simulation mise à jour.",
      "I confirm this rate is my own planning assumption.": "Je confirme le taux retenu pour cette simulation.",
      "Investment Return Calculator": "Simulation de rendement",
      "Initial investment": "Capital initial",
      "Monthly contribution": "Versement mensuel",
      "Annual return (%)": "Rendement annuel (%)",
      Years: "Durée (années)",
      Compounding: "Capitalisation",
      Monthly: "Mensuelle",
      Quarterly: "Trimestrielle",
      Annually: "Annuelle",
      "Contribution timing": "Date du versement",
      "End of month": "Fin de mois",
      "Beginning of month": "Début de mois",
      "Inflation (%)": "Inflation (%)",
      "Calculate projection": "Calculer la projection",
      "Final projected value": "Capital final estimé",
      "Total contributed": "Total des versements",
      "Projected gain / loss": "Gain ou perte estimé",
      "Effective annual return": "Rendement annuel effectif",
      "Real annual return": "Rendement annuel réel",
      "Today-money value": "Valeur en pouvoir d’achat actuel"
    };
    const tr = k => fr ? words[k] || k : k;
    e = e || {};
    var n = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.investmentReturn;
    function l(e) {
      return Number(a.querySelector(e).value);
    }
    function i(a) {
      return a.toLocaleString(fr ? "fr" : "en", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    function t() {
      var e = a.querySelector("#aw-status"), t = a.querySelector("#aw-res");
      if (n) try {
        if (Array.from(a.querySelectorAll("input[type=number]")).some(field => field.value.trim() === "" || Number(field.value) < Number(field.min) || field.max !== "" && Number(field.value) > Number(field.max))) throw new Error("inputs");
        var s = n.project({
          initialInvestment: l("#aw-initial"),
          monthlyContribution: l("#aw-monthly"),
          annualRatePercent: l("#aw-rate"),
          years: l("#aw-years"),
          compoundsPerYear: l("#aw-compound"),
          contributionTiming: a.querySelector("#aw-timing").value,
          inflationRatePercent: l("#aw-inflation")
        });
        t.hidden = !1, t.innerHTML = '<div class="aw-result-label">' + tr("Final projected value") + '</div><div class="aw-result-main">' + i(s.finalValue) + '</div><hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">' + tr("Total contributed") + "</span><span>" + i(s.totalContributed) + '</span></div><div class="aw-result-row"><span class="aw-result-label">' + tr("Projected gain / loss") + "</span><span>" + i(s.projectedGain) + '</span></div><div class="aw-result-row"><span class="aw-result-label">' + tr("Effective annual return") + "</span><span>" + (100 * s.effectiveAnnualRate).toLocaleString(fr ? "fr" : "en", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + '%</span></div><div class="aw-result-row"><span class="aw-result-label">' + tr("Real annual return") + "</span><span>" + (100 * s.realEffectiveAnnualRate).toLocaleString(fr ? "fr" : "en", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + '%</span></div><div class="aw-result-row"><span class="aw-result-label">' + tr("Today-money value") + "</span><span>" + i(s.purchasingPowerValue) + '</span></div><p class="aw-result-label" style="margin-top:10px">' + (fr ? "Versements en " + (s.input.contributionTiming === "end" ? "fin" : "début") + " de mois. Estimation hors frais et fiscalité." : "Uses " + s.input.contributionTiming + "-of-month contributions. Planning estimate only; fees and taxes are not modelled.") + "</p>",
        e.textContent = "";
      } catch (a) {
        t.hidden = !0, e.textContent = fr ? "Vérifiez les montants, les taux et la durée de la simulation." : a.message === "inputs" ? "Check the amounts, rates and investment period." : a.message;
      } else e.textContent = "Calculator engine unavailable.";
    }
    a.innerHTML = '<div class="aw-title">' + tr("Investment Return Calculator") + '</div><div class="aw-field"><label class="aw-label" for="aw-initial">' + tr("Initial investment") + '</label><input class="aw-input" id="aw-initial" type="number" min="0" step="0.01" inputmode="decimal" value="100000"></div><div class="aw-field"><label class="aw-label" for="aw-monthly">' + tr("Monthly contribution") + '</label><input class="aw-input" id="aw-monthly" type="number" min="0" step="0.01" inputmode="decimal" value="0"></div><div class="aw-row"><div class="aw-field"><label class="aw-label" for="aw-rate">' + tr("Annual return (%)") + '</label><input class="aw-input" id="aw-rate" type="number" min="-99.99" max="1000" step="0.01" inputmode="decimal" value="10"></div><div class="aw-field"><label class="aw-label" for="aw-years">' + tr("Years") + '</label><input class="aw-input" id="aw-years" type="number" min="0.083333" max="100" step="0.083333" inputmode="decimal" value="10"></div></div><div class="aw-field"><label class="aw-label" for="aw-compound">' + tr("Compounding") + '</label><select class="aw-select" id="aw-compound"><option value="12">' + tr("Monthly") + '</option><option value="4">' + tr("Quarterly") + '</option><option value="1">' + tr("Annually") + '</option></select></div><div class="aw-row"><div class="aw-field"><label class="aw-label" for="aw-timing">' + tr("Contribution timing") + '</label><select class="aw-select" id="aw-timing"><option value="end">' + tr("End of month") + '</option><option value="beginning">' + tr("Beginning of month") + '</option></select></div><div class="aw-field"><label class="aw-label" for="aw-inflation">' + tr("Inflation (%)") + '</label><input class="aw-input" id="aw-inflation" type="number" min="-99.99" max="1000" step="0.01" inputmode="decimal" value="0"></div></div><button class="aw-btn aw-btn--primary" id="aw-calc" type="button">' + tr("Calculate projection") + '</button><p id="aw-status" role="status" aria-live="polite"></p><div class="aw-result-box" id="aw-res" hidden></div>' + (e.footerHTML || ""),
    a.addEventListener("input", () => {
      a.querySelector("#aw-res").hidden = true;
      a.querySelector("#aw-status").textContent = "";
    }), a.querySelector("#aw-calc").addEventListener("click", t), a.querySelectorAll("input,select").forEach(function(a) {
      a.addEventListener("keydown", function(a) {
        "Enter" === a.key && t();
      });
    }), t();
  };
}();
