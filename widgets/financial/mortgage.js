!function() {
  "use strict";
  window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.mortgage = function(e, a) {
    const fr = e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr";
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
    function t(a) {
      try {
        return new Intl.NumberFormat(fr ? "fr" : "en", {
          style: "currency",
          currency: e.querySelector("#aw-currency").value,
          maximumFractionDigits: 2
        }).format(a);
      } catch (t) {
        return e.querySelector("#aw-currency").value + " " + Number(a).toLocaleString(fr ? "fr" : "en", {
          maximumFractionDigits: 2
        });
      }
    }
    function n() {
      var a = e.querySelector("#aw-res"), n = e.querySelector("#aw-status");
      try {
        if (Array.from(e.querySelectorAll("input[type=number]")).some(field => field.value.trim() === "" || Number(field.value) < Number(field.min) || field.max !== "" && Number(field.value) > Number(field.max))) throw new Error("inputs");
        var l = Number(e.querySelector("#aw-loan").value), o = window.AfroTools && window.AfroTools.mortgagePlanner;
        if (!o) throw new Error("Calculator engine unavailable.");
        var i = o.calculate({
          propertyPrice: l,
          deposit: 0,
          annualRate: Number(e.querySelector("#aw-rate").value),
          termYears: Number(e.querySelector("#aw-term").value),
          confirmedAssumptions: e.querySelector("#aw-confirm").checked
        });
        a.hidden = !1, a.innerHTML = '<div class="aw-result-label">' + tr("Monthly principal + interest") + '</div><div class="aw-result-main">' + t(i.monthlyPrincipalInterest) + '</div><hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">' + tr("Total interest") + "</span><strong>" + t(i.totalInterest) + '</strong></div><div class="aw-result-row"><span class="aw-result-label">' + tr("Total paid") + "</span><strong>" + t(i.totalCorePayments) + '</strong></div><div class="aw-result-row"><span class="aw-result-label">' + tr("TIP") + "</span><strong>" + i.tip.toLocaleString(fr ? "fr" : "en", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + "%</strong></div>", n.textContent = tr("Planning estimate updated locally.");
      } catch (e) {
        a.hidden = !0, n.textContent = fr ? e.message.startsWith("Confirm") ? "Confirmez le taux retenu pour la simulation." : "Vérifiez le montant, le taux et la durée du prêt." : e.message === "inputs" ? "Check the amount, rate and term." : e.message;
      }
    }
    a = a || {}, e.innerHTML = '<div class="aw-title">' + tr("Mortgage planning estimate") + '</div><div class="aw-field"><label class="aw-label" for="aw-currency">' + tr("Currency") + '</label><select class="aw-input" id="aw-currency"><option>NGN</option><option>KES</option><option>ZAR</option><option>GHS</option><option>TZS</option><option>UGX</option><option>RWF</option><option>XOF</option><option>MAD</option><option>EGP</option><option>USD</option><option>EUR</option></select></div><div class="aw-field"><label class="aw-label" for="aw-loan">' + tr("Loan amount") + '</label><input class="aw-input" id="aw-loan" type="number" min="0" inputmode="decimal" value="20000000"></div><div class="aw-field"><label class="aw-label" for="aw-rate">' + tr("Your annual fixed rate (%)") + '</label><input class="aw-input" id="aw-rate" type="number" min="0" max="100" step="0.01" inputmode="decimal" value="12"><small class="aw-help">' + tr("Use a lender quote or a clearly marked scenario.") + '</small></div><div class="aw-field"><label class="aw-label" for="aw-term">' + tr("Loan term (years)") + '</label><input class="aw-input" id="aw-term" type="number" min="0.0833" max="50" step="0.0833" inputmode="decimal" value="20"></div><label class="aw-confirm"><input id="aw-confirm" type="checkbox"> ' + tr("I confirm this rate is my own planning assumption.") + '</label><button class="aw-btn aw-btn--primary" id="aw-calc" type="button">' + tr("Calculate") + '</button><div class="aw-status" id="aw-status" role="status" aria-live="polite">' + tr("No data is stored or sent.") + '</div><div class="aw-result-box" id="aw-res" hidden></div>' + (a.footerHTML || ""),
    e.addEventListener("input", () => {
      e.querySelector("#aw-res").hidden = true;
      e.querySelector("#aw-status").textContent = "";
    }), e.querySelector("#aw-calc").addEventListener("click", n), e.querySelectorAll("input,select").forEach(function(e) {
      e.addEventListener("keydown", function(e) {
        "Enter" === e.key && (e.preventDefault(), n());
      });
    });
  };
}();
