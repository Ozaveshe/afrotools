!function() {
  "use strict";
  window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.savings_goal = function(e, a) {
    var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
    function translate(label) {
      return locale === "fr-FR" && french[label] || label;
    }
    var french = {
      "Savings goal plan": "Objectif d’épargne",
      "Enter your own current return assumption. No product rate is bundled.": "Indiquez le rendement que vous souhaitez simuler et la date de cette hypothèse.",
      Goal: "Objectif à atteindre",
      "Current savings": "Épargne actuelle",
      "Monthly contribution": "Versement mensuel",
      Months: "Nombre de mois",
      Currency: "Devise",
      "Effective annual return (%)": "Rendement annuel effectif (%)",
      "Rate source or assumption": "Source du taux ou hypothèse",
      "Date checked": "Date de vérification",
      "Calculate sourced plan": "Calculer le plan d’épargne",
      "Check goal, amounts, months, rate, source and a checked date within 365 days.": "Vérifiez l’objectif, les montants, la durée, le taux, la source et la date de vérification dans les 365 derniers jours.",
      "Modeled ending balance": "Solde final estimé",
      "Monthly contribution required: ": "Versement mensuel nécessaire : ",
      " · constant-return plan, not a guarantee": " · simulation à rendement constant, sans garantie"
    };
    a = a || {};
    var t = window.AfroTools && window.AfroTools.SavingsGoalPlan;
    e.innerHTML = '<div class="aw-title">' + translate("Savings goal plan") + '</div><p class="aw-note">' + translate("Enter your own current return assumption. No product rate is bundled.") + '</p><div class="aw-row"><div class="aw-field"><label class="aw-label" for="aw-goal">' + translate("Goal") + '</label><input class="aw-input" id="aw-goal" type="number" min="0.01"></div><div class="aw-field"><label class="aw-label" for="aw-current">' + translate("Current savings") + '</label><input class="aw-input" id="aw-current" type="number" min="0" value="0"></div></div><div class="aw-row"><div class="aw-field"><label class="aw-label" for="aw-deposit">' + translate("Monthly contribution") + '</label><input class="aw-input" id="aw-deposit" type="number" min="0"></div><div class="aw-field"><label class="aw-label" for="aw-months">' + translate("Months") + '</label><input class="aw-input" id="aw-months" type="number" min="1" max="1200" value="24"></div></div><div class="aw-row"><div class="aw-field"><label class="aw-label" for="aw-currency">' + translate("Currency") + '</label><input class="aw-input" id="aw-currency" value="KES" maxlength="8"></div><div class="aw-field"><label class="aw-label" for="aw-rate">' + translate("Effective annual return (%)") + '</label><input class="aw-input" id="aw-rate" type="number" min="-99.99" max="1000" step="0.01"></div></div><div class="aw-field"><label class="aw-label" for="aw-source">' + translate("Rate source or assumption") + '</label><input class="aw-input" id="aw-source" maxlength="180"></div><div class="aw-field"><label class="aw-label" for="aw-date">' + translate("Date checked") + '</label><input class="aw-input" id="aw-date" type="date"></div><p class="aw-error" id="aw-error" role="alert"></p><button class="aw-btn aw-btn--primary" id="aw-calc">' + translate("Calculate sourced plan") + '</button><div class="aw-result-box" id="aw-result" hidden aria-live="polite"></div>' + (a.footerHTML || "");
    var l = e.querySelector("#aw-result"), n = e.querySelector("#aw-error");
    e.querySelector("#aw-calc").addEventListener("click", function() {
      var a = t && t.calculate({
        goal: e.querySelector("#aw-goal").value,
        currentSavings: e.querySelector("#aw-current").value,
        monthlyContribution: e.querySelector("#aw-deposit").value,
        months: e.querySelector("#aw-months").value,
        currency: e.querySelector("#aw-currency").value,
        annualRate: e.querySelector("#aw-rate").value,
        rateSource: e.querySelector("#aw-source").value,
        sourceDate: e.querySelector("#aw-date").value
      });
      if (!a || !a.ok) return l.hidden = !0, void (n.textContent = translate("Check goal, amounts, months, rate, source and a checked date within 365 days."));
      n.textContent = "", l.hidden = !1, l.replaceChildren();
      var r = document.createElement("div"), i = document.createElement("strong"), o = document.createElement("p"), s = document.createElement("small");
      r.className = "aw-result-label", r.textContent = translate("Modeled ending balance"),
      i.className = "aw-result-main", i.textContent = a.currency + " " + a.endingBalance.toLocaleString(locale, {
        maximumFractionDigits: 2
      }), o.textContent = translate("Monthly contribution required: ") + a.currency + " " + a.requiredMonthlyContribution.toLocaleString(locale, {
        maximumFractionDigits: 2
      }), s.textContent = a.rateSource + " · " + a.sourceDate + translate(" · constant-return plan, not a guarantee"),
      l.append(r, i, o, s);
    }), e.querySelectorAll("input").forEach(function(e) {
      e.addEventListener("input", function() {
        l.hidden = !0, n.textContent = "";
      });
    });
  };
}();
