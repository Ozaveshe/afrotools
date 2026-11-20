!function() {
  "use strict";
  window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.discount_calc = function(a, t) {
    var locale = a && a.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
    function translate(label) {
      return locale === "fr-FR" && french[label] || label;
    }
    var french = {
      "Discount Calculator": "Calculateur de remise",
      "Display currency/unit": "Devise ou unité à afficher",
      "Original unit price": "Prix unitaire initial",
      Quantity: "Quantité",
      "Discount 1 (%)": "Première remise (%)",
      "Discount 2 (%)": "Deuxième remise (%)",
      "Your post-discount tax scenario (%)": "Taxe à appliquer après remise (%)",
      "Optional; AfroTools supplies no tax rate.": "Facultatif. Saisissez le taux applicable à votre achat.",
      Calculate: "Calculer",
      "Final total": "Total à payer",
      "Original subtotal": "Sous-total initial",
      "Discounted subtotal": "Sous-total après remise",
      "Pre-tax savings": "Économies avant taxe",
      "Effective discount": "Remise effective",
      "Entered tax amount": "Montant de la taxe saisie",
      "Check the highlighted values.": "Vérifiez les valeurs signalées.",
      "Result ready.": "Résultat disponible.",
      "Values changed. Calculate again.": "Les valeurs ont changé. Relancez le calcul."
    };
    var i = window.AfroTools && window.AfroTools.DiscountPlanner;
    function e(t) {
      return a.querySelector(t).value;
    }
    function n(a, t) {
      return (t ? t + " " : "") + a.toLocaleString(locale, {
        maximumFractionDigits: 2
      });
    }
    function l() {
      var t = i.calculate({
        currencyLabel: e("#aw-currency"),
        unitPrice: e("#aw-orig"),
        quantity: e("#aw-qty"),
        discounts: [ e("#aw-d1"), e("#aw-d2") ],
        taxPct: e("#aw-tax")
      }), l = a.querySelector("#aw-status"), s = a.querySelector("#aw-res");
      if (a.querySelectorAll("[aria-invalid]").forEach(function(a) {
        a.removeAttribute("aria-invalid");
      }), !t.valid) return t.errors.forEach(function(t) {
        var i = a.querySelector({
          unitPrice: "#aw-orig",
          quantity: "#aw-qty",
          taxPct: "#aw-tax",
          "discount-0": "#aw-d1",
          "discount-1": "#aw-d2"
        }[t] || "");
        i && i.setAttribute("aria-invalid", "true");
      }), s.hidden = !0, void (l.textContent = translate("Check the highlighted values."));
      var r = t.outputs, o = t.inputs.currencyLabel;
      s.innerHTML = '<div class="aw-result-label">' + translate("Final total") + '</div><div class="aw-result-main">' + n(r.finalTotal, o) + '</div><hr class="aw-divider"><div class="aw-result-row"><span>' + translate("Original subtotal") + "</span><strong>" + n(r.originalSubtotal, o) + '</strong></div><div class="aw-result-row"><span>' + translate("Discounted subtotal") + "</span><strong>" + n(r.discountedSubtotal, o) + '</strong></div><div class="aw-result-row"><span>' + translate("Pre-tax savings") + "</span><strong>" + n(r.savings, o) + '</strong></div><div class="aw-result-row"><span>' + translate("Effective discount") + "</span><strong>" + r.effectiveDiscountPct.toLocaleString(locale, {
        maximumFractionDigits: 2
      }) + '%</strong></div><div class="aw-result-row"><span>' + translate("Entered tax amount") + "</span><strong>" + n(r.taxAmount, o) + "</strong></div>",
      s.hidden = !1, l.textContent = translate("Result ready.");
    }
    function s() {
      a.querySelector("#aw-res").hidden = !0, a.querySelector("#aw-status").textContent = translate("Values changed. Calculate again.");
    }
    a && i && (t = t || {}, a.innerHTML = '<div class="aw-title">' + translate("Discount Calculator") + '</div><div class="aw-field"><label class="aw-label" for="aw-currency">' + translate("Display currency/unit") + '</label><input class="aw-input" id="aw-currency" maxlength="16" value="USD"></div><div class="aw-row"><div class="aw-field"><label class="aw-label" for="aw-orig">' + translate("Original unit price") + '</label><input class="aw-input" id="aw-orig" type="number" min="0" max="1000000000000000" step="any" inputmode="decimal" value="100"></div><div class="aw-field"><label class="aw-label" for="aw-qty">' + translate("Quantity") + '</label><input class="aw-input" id="aw-qty" type="number" min="1" max="10000" step="1" inputmode="numeric" value="1"></div></div><div class="aw-row"><div class="aw-field"><label class="aw-label" for="aw-d1">' + translate("Discount 1 (%)") + '</label><input class="aw-input" id="aw-d1" type="number" min="0" max="100" step="any" inputmode="decimal" value="20"></div><div class="aw-field"><label class="aw-label" for="aw-d2">' + translate("Discount 2 (%)") + '</label><input class="aw-input" id="aw-d2" type="number" min="0" max="100" step="any" inputmode="decimal" value="0"></div></div><div class="aw-field"><label class="aw-label" for="aw-tax">' + translate("Your post-discount tax scenario (%)") + '</label><input class="aw-input" id="aw-tax" type="number" min="0" max="100" step="any" inputmode="decimal" value="0"><small>' + translate("Optional; AfroTools supplies no tax rate.") + '</small></div><button class="aw-btn aw-btn--primary" id="aw-calc" type="button">' + translate("Calculate") + '</button><p id="aw-status" class="aw-status" role="status" aria-live="polite"></p><div class="aw-result-box" id="aw-res" hidden></div>' + (t.footerHTML || ""),
    a.querySelector("#aw-calc").addEventListener("click", l), a.querySelectorAll("input").forEach(function(a) {
      a.addEventListener("input", s), a.addEventListener("keydown", function(a) {
        "Enter" === a.key && l();
      });
    }), l());
  };
}();
