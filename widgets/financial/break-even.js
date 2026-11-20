!function() {
  "use strict";
  function e(e, t) {
    var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
    function translate(label) {
      return locale === "fr-FR" && french[label] || label;
    }
    var french = {
      "Break-Even Calculator": "Seuil de rentabilité",
      "Formula-only. Your values stay in this browser.": "Les valeurs sont calculées sur cet appareil.",
      "Fixed costs": "Coûts fixes",
      "Variable cost / unit": "Coût variable unitaire",
      "Selling price / unit": "Prix de vente unitaire",
      "Planned units (optional)": "Quantité prévue (facultatif)",
      Calculate: "Calculer",
      "Whole units to sell": "Quantité entière à vendre",
      "Exact break-even units": "Quantité exacte au seuil",
      "Exact threshold revenue": "Chiffre d’affaires au seuil exact",
      "Revenue at whole units": "Chiffre d’affaires pour la quantité entière",
      "Contribution / unit": "Marge sur coût variable unitaire",
      "Contribution ratio": "Taux de marge sur coût variable",
      "Planned profit/loss": "Résultat prévu",
      "Enter non-negative costs. Selling price must be greater than zero and greater than variable cost.": "Saisissez des coûts positifs ou nuls. Le prix doit être positif et supérieur au coût variable unitaire."
    };
    t = t || {};
    var n = window.AfroTools && window.AfroTools.BreakEvenPlanner;
    if (n && e) {
      var i = "aw-be-" + Math.random().toString(36).slice(2, 7), a = function(e) {
        return i + "-" + e;
      };
      e.innerHTML = '<div class="aw-title">' + translate("Break-Even Calculator") + '</div><p class="aw-result-label" style="margin:-8px 0 14px">' + translate("Formula-only. Your values stay in this browser.") + "</p>" + l(a("fixed"), translate("Fixed costs"), "0") + l(a("variable"), translate("Variable cost / unit"), "0") + l(a("price"), translate("Selling price / unit"), "") + (t.lite ? "" : l(a("planned"), translate("Planned units (optional)"), "")) + '<button class="aw-btn aw-btn--primary" type="button">' + translate("Calculate") + '</button><p class="aw-result-label" role="alert" data-error style="display:none;color:#b42318;margin-top:10px;font-weight:700"></p><div class="aw-result-box" data-result style="display:none" aria-live="polite"></div>',
      e.querySelector(".aw-btn").addEventListener("click", u), e.querySelectorAll("input").forEach(function(e) {
        e.addEventListener("keyup", function(e) {
          "Enter" === e.key && u();
        });
      });
    }
    function l(e, t, n) {
      return '<div class="aw-field"><label class="aw-label" for="' + e + '">' + t + '</label><input class="aw-input" id="' + e + '" type="number" min="0" step="any" inputmode="decimal" value="' + n + '"></div>';
    }
    function r(t) {
      var n = e.querySelector("#" + a(t));
      return n ? n.value : "";
    }
    function o(e, t) {
      return Number(e).toLocaleString(locale, {
        minimumFractionDigits: t || 0,
        maximumFractionDigits: null == t ? 2 : t
      });
    }
    function s(e, t) {
      return '<div class="aw-result-row"><span class="aw-result-label">' + e + "</span><strong>" + t + "</strong></div>";
    }
    function u() {
      var t = e.querySelector("[data-result]"), i = e.querySelector("[data-error]");
      try {
        var a = n.calculate({
          fixedCosts: r("fixed"),
          variableCost: r("variable"),
          sellingPrice: r("price"),
          plannedUnits: r("planned")
        });
        i.style.display = "none", i.textContent = "", t.style.display = "block", t.innerHTML = '<div class="aw-result-label">' + translate("Whole units to sell") + '</div><div class="aw-result-main">' + o(a.wholeBreakEvenUnits, 0) + (locale === "fr-FR" ? " unités" : " units") + '</div><hr class="aw-divider">' + s(translate("Exact break-even units"), o(a.exactBreakEvenUnits, 2)) + s(translate("Exact threshold revenue"), o(a.exactBreakEvenRevenue, 2)) + s(translate("Revenue at whole units"), o(a.wholeUnitRevenue, 2)) + s(translate("Contribution / unit"), o(a.contributionPerUnit, 2)) + s(translate("Contribution ratio"), o(100 * a.contributionRatio, 2) + "%") + (null === a.plannedProfitLoss ? "" : s(translate("Planned profit/loss"), (a.plannedProfitLoss > 0 ? "+" : "") + o(a.plannedProfitLoss, 2)));
      } catch (e) {
        t.style.display = "none", t.textContent = "", i.style.display = "block", i.textContent = translate("Enter non-negative costs. Selling price must be greater than zero and greater than variable cost.");
      }
    }
  }
  window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.break_even = function(t, n) {
    e(t, n);
  }, window.AfroWidgets.break_even_lite = function(t, n) {
    e(t, n = Object.assign({}, n || {}, {
      lite: !0
    }));
  };
}();
