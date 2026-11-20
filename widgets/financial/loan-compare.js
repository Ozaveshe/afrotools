!function() {
  "use strict";
  window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.loan_compare = function(e, a) {
    a = a || {};
    const fr = e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr";
    const words = {
      "Offer label": "Nom de l’offre",
      "Rate method": "Mode de calcul des intérêts",
      "Reducing balance": "Sur le capital restant dû",
      "Flat rate": "Sur le capital initial",
      "Loan amount": "Montant du prêt",
      "Nominal annual rate (%)": "Taux annuel nominal (%)",
      "Term (months)": "Durée (mois)",
      "Fees paid upfront": "Frais payés au départ",
      "Loan offer comparison": "Comparaison de deux offres de prêt",
      "Use figures from two written offers. A rate is not APR.": "Utilisez les montants de deux offres écrites et la même devise. Le taux nominal diffère du taux annuel effectif global.",
      "I checked these figures and understand this is a planning comparison.": "J’ai vérifié les montants saisis et je comprends qu’il s’agit d’une estimation.",
      "Compare offers": "Comparer les offres",
      "Entered costs are equal": "Les coûts saisis sont identiques",
      " has the lower entered cost": " présente le coût total le plus bas",
      "Review different amounts or terms": "Les montants ou les durées diffèrent. Comparez les offres à conditions égales.",
      " monthly / total": " · Mensualité / total",
      "Calculator unavailable.": "Ouvrir le comparateur de prêts",
      "Confirm that every figure comes from an offer or your own scenario.": "Vérifiez les chiffres saisis puis cochez la case de confirmation.",
      "Loan amount must be greater than zero.": "Saisissez un montant de prêt supérieur à zéro.",
      "Term must be between 1 and 600 months.": "Saisissez une durée de 1 à 600 mois.",
      "Review the annual rate.": "Vérifiez le taux annuel.",
      "Offer ": "Offre "
    };
    const tr = key => fr ? words[key] || key : key;
    var t = window.AfroTools && window.AfroTools.loanCompare;
    function n(e) {
      return '<fieldset class="aw-offer"><legend>' + tr("Offer ") + "" + e + '</legend><div class="aw-field"><label class="aw-label" for="aw-name' + e + '">' + tr("Offer label") + '</label><input class="aw-input" id="aw-name' + e + '" value="' + tr("Offer ") + "" + e + '" maxlength="40"></div><div class="aw-field"><label class="aw-label" for="aw-method' + e + '">' + tr("Rate method") + '</label><select class="aw-select" id="aw-method' + e + '"><option value="reducing">' + tr("Reducing balance") + '</option><option value="flat">' + tr("Flat rate") + '</option></select></div><div class="aw-field"><label class="aw-label" for="aw-amt' + e + '">' + tr("Loan amount") + '</label><input class="aw-input" id="aw-amt' + e + '" type="number" min="0" step="0.01" value="100000" inputmode="decimal"></div><div class="aw-field"><label class="aw-label" for="aw-rate' + e + '">' + tr("Nominal annual rate (%)") + '</label><input class="aw-input" id="aw-rate' + e + '" type="number" min="0" max="500" step="0.01" value="12" inputmode="decimal"></div><div class="aw-field"><label class="aw-label" for="aw-term' + e + '">' + tr("Term (months)") + '</label><input class="aw-input" id="aw-term' + e + '" type="number" min="1" max="600" value="12" inputmode="numeric"></div><div class="aw-field"><label class="aw-label" for="aw-fees' + e + '">' + tr("Fees paid upfront") + '</label><input class="aw-input" id="aw-fees' + e + '" type="number" min="0" step="0.01" value="0" inputmode="decimal"></div></fieldset>';
    }
    function l(a) {
      return e.querySelector(a).value;
    }
    function i(a) {
      return {
        name: l("#aw-name" + a),
        rateMethod: l("#aw-method" + a),
        amount: l("#aw-amt" + a),
        annualRate: l("#aw-rate" + a),
        termMonths: l("#aw-term" + a),
        paidUpfront: l("#aw-fees" + a),
        deductedFees: 0,
        monthlyFees: 0,
        finalPayment: 0,
        confirmedAssumptions: e.querySelector("#aw-confirm").checked
      };
    }
    function o(e) {
      return Number(e).toLocaleString(fr ? "fr" : "en", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    t ? (e.innerHTML = '<div class="aw-title">' + tr("Loan offer comparison") + '</div><p class="aw-note">' + tr("Use figures from two written offers. A rate is not APR.") + '</p><div class="aw-loans">' + n(1) + n(2) + '</div><label class="aw-confirm"><input id="aw-confirm" type="checkbox"> <span>' + tr("I checked these figures and understand this is a planning comparison.") + '</span></label><button class="aw-btn aw-btn--primary" id="aw-calc">' + tr("Compare offers") + '</button><div class="aw-result-box" id="aw-verdict" role="status" aria-live="polite" hidden></div>' + (a.footerHTML || ""),
    e.addEventListener("input", () => {
      e.querySelector("#aw-verdict").hidden = true;
    }), e.querySelector("#aw-calc").addEventListener("click", function() {
      var a = e.querySelector("#aw-verdict");
      try {
        if (Array.from(e.querySelectorAll("input[type=number]")).some(field => field.value === "" || !field.validity.valid)) throw new Error(fr ? "Vérifiez les montants, les frais et la durée des deux offres." : "Check the amounts, fees and term for both offers.");
        var n = t.compareOffers([ i(1), i(2) ]);
        a.hidden = !1, a.textContent = "";
        var l = document.createElement("div");
        l.className = "aw-result-main", l.textContent = n.directlyComparable ? null === n.winnerIndex ? tr("Entered costs are equal") : n.offers[n.winnerIndex].name + tr(" has the lower entered cost") : tr("Review different amounts or terms"),
        a.appendChild(l), n.offers.forEach(function(e) {
          var t = document.createElement("div");
          t.className = "aw-result-row";
          var n = document.createElement("span");
          n.textContent = e.name + tr(" monthly / total");
          var l = document.createElement("strong");
          l.textContent = o(e.monthlyDue) + " / " + o(e.totalCashOut), t.append(n, l), a.appendChild(t);
        });
      } catch (e) {
        a.hidden = !1, a.textContent = fr && !words[e.message] ? "Vérifiez les montants, les frais et la durée des deux offres." : tr(e.message);
      }
    })) : (() => {
      const a = document.createElement("a");
      a.href = fr ? "https://afrotools.com/fr/tools/comparateur-prets/" : "https://afrotools.com/tools/loan-compare/";
      a.textContent = fr ? "Ouvrir le comparateur de prêts" : "Open the loan comparison calculator";
      e.replaceChildren(a);
    })();
  };
}();
