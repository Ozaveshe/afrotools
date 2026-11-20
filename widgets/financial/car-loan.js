!function() {
  "use strict";
  window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.car_loan = function(e, a) {
    var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
    function translate(label) {
      return locale === "fr-FR" && french[label] || label;
    }
    var french = {
      "Car loan offer check": "Simulation de prêt automobile",
      "Enter one current offer. No lender rate is bundled.": "Saisissez les conditions et la date de l’offre que vous souhaitez comparer.",
      "Vehicle price": "Prix du véhicule",
      Deposit: "Apport initial",
      "Nominal annual rate (%)": "Taux annuel nominal (%)",
      Months: "Nombre de mois",
      "Final balloon": "Dernière échéance majorée",
      Currency: "Devise",
      "Offer source": "Source de l’offre",
      "Date checked": "Date de vérification",
      "Calculate sourced offer": "Calculer les échéances",
      "Check price, structure, term, rate, offer source and a checked date within 365 days.": "Vérifiez le prix, l’apport, la dernière échéance, la durée, le taux, la source et la date de vérification dans les 365 derniers jours.",
      "Monthly loan payment": "Mensualité du prêt",
      "Finance cost: ": "Coût du financement : ",
      " · user-entered offer": " · offre saisie par vos soins"
    };
    a = a || {};
    var l = window.AfroTools && window.AfroTools.CarLoanPlan;
    e.innerHTML = '<div class="aw-title">' + translate("Car loan offer check") + '</div><p class="aw-note">' + translate("Enter one current offer. No lender rate is bundled.") + '</p><div class="aw-row"><div class="aw-field"><label class="aw-label" for="aw-price">' + translate("Vehicle price") + '</label><input class="aw-input" id="aw-price" type="number" min="0.01"></div><div class="aw-field"><label class="aw-label" for="aw-deposit">' + translate("Deposit") + '</label><input class="aw-input" id="aw-deposit" type="number" min="0" value="0"></div></div><div class="aw-row"><div class="aw-field"><label class="aw-label" for="aw-rate">' + translate("Nominal annual rate (%)") + '</label><input class="aw-input" id="aw-rate" type="number" min="0" max="1000" step="0.01"></div><div class="aw-field"><label class="aw-label" for="aw-months">' + translate("Months") + '</label><input class="aw-input" id="aw-months" type="number" min="1" max="360" value="48"></div></div><div class="aw-row"><div class="aw-field"><label class="aw-label" for="aw-balloon">' + translate("Final balloon") + '</label><input class="aw-input" id="aw-balloon" type="number" min="0" value="0"></div><div class="aw-field"><label class="aw-label" for="aw-currency">' + translate("Currency") + '</label><input class="aw-input" id="aw-currency" value="KES" maxlength="8"></div></div><div class="aw-field"><label class="aw-label" for="aw-source">' + translate("Offer source") + '</label><input class="aw-input" id="aw-source" maxlength="180"></div><div class="aw-field"><label class="aw-label" for="aw-date">' + translate("Date checked") + '</label><input class="aw-input" id="aw-date" type="date"></div><p class="aw-error" id="aw-error" role="alert"></p><button class="aw-btn aw-btn--primary" id="aw-calc">' + translate("Calculate sourced offer") + '</button><div class="aw-result-box" id="aw-result" hidden aria-live="polite"></div>' + (a.footerHTML || "");
    var t = e.querySelector("#aw-result"), n = e.querySelector("#aw-error");
    e.querySelector("#aw-calc").addEventListener("click", function() {
      var a = l && l.calculate({
        vehiclePrice: e.querySelector("#aw-price").value,
        deposit: e.querySelector("#aw-deposit").value,
        tradeIn: 0,
        financedFees: 0,
        annualRate: e.querySelector("#aw-rate").value,
        months: e.querySelector("#aw-months").value,
        balloon: e.querySelector("#aw-balloon").value,
        currency: e.querySelector("#aw-currency").value,
        monthlyNetIncome: 0,
        otherMonthlyDebt: 0,
        monthlyInsurance: 0,
        monthlyFuel: 0,
        monthlyMaintenance: 0,
        otherMonthlyVehicleCost: 0,
        offerSource: e.querySelector("#aw-source").value,
        sourceDate: e.querySelector("#aw-date").value
      });
      if (!a || !a.ok) return t.hidden = !0, void (n.textContent = translate("Check price, structure, term, rate, offer source and a checked date within 365 days."));
      n.textContent = "", t.hidden = !1, t.replaceChildren();
      var r = document.createElement("div"), i = document.createElement("strong"), o = document.createElement("p"), c = document.createElement("small");
      r.className = "aw-result-label", r.textContent = translate("Monthly loan payment"),
      i.className = "aw-result-main", i.textContent = a.currency + " " + a.monthlyPayment.toLocaleString(locale, {
        maximumFractionDigits: 2
      }), o.textContent = translate("Finance cost: ") + a.currency + " " + a.totalFinanceCost.toLocaleString(locale, {
        maximumFractionDigits: 2
      }), c.textContent = a.offerSource + " · " + a.sourceDate + translate(" · user-entered offer"),
      t.append(r, i, o, c);
    }), e.querySelectorAll("input").forEach(function(e) {
      e.addEventListener("input", function() {
        t.hidden = !0, n.textContent = "";
      });
    });
  };
}();
