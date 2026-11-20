!function() {
  "use strict";
  window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.inflation_calc = function(e, a) {
    var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
    function translate(label) {
      return locale === "fr-FR" && french[label] || label;
    }
    var french = {
      "Inflation scenario": "Simulation de l’inflation",
      "Enter your own recent annual rate. No country rate is bundled.": "Saisissez un taux annuel récent et indiquez sa source.",
      "Starting amount": "Montant initial",
      Currency: "Devise",
      "Annual rate (%)": "Taux annuel (%)",
      Years: "Nombre d’années",
      "Rate source": "Source du taux",
      "Date checked": "Date de vérification",
      "Calculate sourced scenario": "Calculer le scénario",
      "Check the amount, rate, period, source and a checked date within 365 days.": "Vérifiez le montant, le taux, la durée, la source et la date de vérification dans les 365 derniers jours.",
      "Price equivalent": "Montant équivalent après inflation",
      "Purchasing power: ": "Pouvoir d’achat : ",
      " · constant-rate scenario, not a forecast": " · simulation à taux constant"
    };
    a = a || {};
    var t = window.AfroTools && window.AfroTools.InflationScenario;
    e.innerHTML = '<div class="aw-title">' + translate("Inflation scenario") + '</div><p class="aw-note">' + translate("Enter your own recent annual rate. No country rate is bundled.") + '</p><div class="aw-field"><label class="aw-label" for="aw-amount">' + translate("Starting amount") + '</label><input class="aw-input" id="aw-amount" type="number" min="0.01" step="0.01"></div><div class="aw-row"><div class="aw-field"><label class="aw-label" for="aw-currency">' + translate("Currency") + '</label><input class="aw-input" id="aw-currency" maxlength="8" value="KES"></div><div class="aw-field"><label class="aw-label" for="aw-rate">' + translate("Annual rate (%)") + '</label><input class="aw-input" id="aw-rate" type="number" min="-99.99" max="1000" step="0.01"></div></div><div class="aw-field"><label class="aw-label" for="aw-years">' + translate("Years") + '</label><input class="aw-input" id="aw-years" type="number" min="0.01" max="100" step="0.01" value="5"></div><div class="aw-field"><label class="aw-label" for="aw-source">' + translate("Rate source") + '</label><input class="aw-input" id="aw-source" maxlength="180"></div><div class="aw-field"><label class="aw-label" for="aw-date">' + translate("Date checked") + '</label><input class="aw-input" id="aw-date" type="date"></div><p class="aw-error" id="aw-error" role="alert"></p><button class="aw-btn aw-btn--primary" id="aw-calc">' + translate("Calculate sourced scenario") + '</button><div class="aw-result-box" id="aw-result" hidden aria-live="polite"></div>' + (a.footerHTML || "");
    var l = e.querySelector("#aw-result"), r = e.querySelector("#aw-error");
    e.querySelector("#aw-calc").addEventListener("click", function() {
      var a = t && t.calculate({
        amount: e.querySelector("#aw-amount").value,
        currency: e.querySelector("#aw-currency").value,
        annualRate: e.querySelector("#aw-rate").value,
        years: e.querySelector("#aw-years").value,
        sourceLabel: e.querySelector("#aw-source").value,
        sourceDate: e.querySelector("#aw-date").value
      });
      if (!a || !a.ok) return l.hidden = !0, void (r.textContent = translate("Check the amount, rate, period, source and a checked date within 365 days."));
      r.textContent = "", l.hidden = !1, l.replaceChildren();
      var n = document.createElement("div"), i = document.createElement("strong"), c = document.createElement("p"), o = document.createElement("small");
      n.className = "aw-result-label", n.textContent = translate("Price equivalent"),
      i.className = "aw-result-main", i.textContent = a.currency + " " + a.priceEquivalent.toLocaleString(locale, {
        maximumFractionDigits: 2
      }), c.textContent = translate("Purchasing power: ") + a.currency + " " + a.purchasingPower.toLocaleString(locale, {
        maximumFractionDigits: 2
      }), o.textContent = a.sourceLabel + " · " + a.sourceDate + translate(" · constant-rate scenario, not a forecast"),
      l.append(n, i, c, o);
    }), e.querySelectorAll("input").forEach(function(e) {
      e.addEventListener("input", function() {
        l.hidden = !0, r.textContent = "";
      });
    });
  };
}();
