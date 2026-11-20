!function() {
  "use strict";
  window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.markup_calc = function(a, t) {
    var locale = a && a.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
    function translate(label) {
      return locale === "fr-FR" && french[label] || label;
    }
    var french = {
      "Markup calculator": "Calculateur de majoration",
      "Currency or unit (optional)": "Devise ou unité (facultatif)",
      Cost: "Coût",
      "Markup (%)": "Majoration (%)",
      Calculate: "Calculer",
      "Selling price": "Prix de vente",
      Profit: "Bénéfice",
      Markup: "Majoration sur le coût",
      Margin: "Marge sur le prix de vente",
      "Result updated. Values stay in this browser.": "Résultat actualisé. Les valeurs restent dans ce navigateur.",
      "Enter a cost greater than zero and a markup greater than -100%.": "Saisissez un coût positif et une majoration supérieure à −100 %."
    };
    t = t || {};
    var e = window.AfroTools && window.AfroTools.MarkupSellingPriceEngine;
    if (a && e) {
      a.innerHTML = '<div class="aw-title">' + translate("Markup calculator") + '</div><div class="aw-field"><label class="aw-label" for="aw-unit">' + translate("Currency or unit (optional)") + '</label><input class="aw-input" id="aw-unit" maxlength="12" autocomplete="off"></div><div class="aw-row"><div class="aw-field"><label class="aw-label" for="aw-cost">' + translate("Cost") + '</label><input class="aw-input" id="aw-cost" type="number" step="0.01" inputmode="decimal" autocomplete="off"></div><div class="aw-field"><label class="aw-label" for="aw-markup">' + translate("Markup (%)") + '</label><input class="aw-input" id="aw-markup" type="number" step="0.1" inputmode="decimal" autocomplete="off"></div></div><button class="aw-btn aw-btn--primary" id="aw-calc" type="button">' + translate("Calculate") + '</button><div class="aw-result-box" id="aw-res" style="display:none"></div><div id="aw-status" role="status" aria-live="polite" style="min-height:1.4em;margin-top:8px;font-size:13px;color:var(--muted)"></div>' + (t.footerHTML || "");
      var i = a.querySelector("#aw-res"), l = a.querySelector("#aw-status");
      a.querySelector("#aw-calc").addEventListener("click", s), a.querySelectorAll("input").forEach(function(a) {
        a.addEventListener("input", function() {
          "none" !== i.style.display && s();
        }), a.addEventListener("keydown", function(a) {
          "Enter" === a.key && (a.preventDefault(), s());
        });
      });
    }
    function n(t) {
      return a.querySelector(t).value;
    }
    function r(a) {
      var t = n("#aw-unit").trim();
      return (t ? t + " " : "") + Number(a).toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    function s() {
      try {
        var a = e.calculate({
          mode: "markup",
          cost: n("#aw-cost"),
          percentage: n("#aw-markup"),
          unit: n("#aw-unit")
        });
        i.innerHTML = '<div class="aw-result-label">' + translate("Selling price") + '</div><div class="aw-result-main"></div><hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">' + translate("Profit") + '</span><span data-profit></span></div><div class="aw-result-row"><span class="aw-result-label">' + translate("Markup") + '</span><span data-markup></span></div><div class="aw-result-row"><span class="aw-result-label">' + translate("Margin") + "</span><span data-margin></span></div>",
        i.querySelector(".aw-result-main").textContent = r(a.sellingPrice), i.querySelector("[data-profit]").textContent = r(a.profit),
        i.querySelector("[data-markup]").textContent = a.markup.toLocaleString(locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          useGrouping: false
        }) + "%", i.querySelector("[data-margin]").textContent = a.margin.toLocaleString(locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          useGrouping: false
        }) + "%", i.style.display = "block", l.textContent = translate("Result updated. Values stay in this browser.");
      } catch (a) {
        i.style.display = "none", i.replaceChildren(), l.textContent = translate("Enter a cost greater than zero and a markup greater than -100%.");
      }
    }
  };
}();
