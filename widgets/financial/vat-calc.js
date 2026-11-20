!function() {
  "use strict";
  window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.vat_calc = function(a) {
    const fr = a.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr";
    const words = {
      "Local planning widget": "Simulation locale",
      "Pan-African VAT workspace": "Calcul de la TVA",
      "Enter the rate shown by your tax authority or invoice. No country rate is assumed, and nothing is stored or sent.": "Utilisez le taux indiqué sur votre facture ou par l’administration fiscale. Le calcul reste sur votre appareil.",
      "VAT amount": "Montant de la TVA",
      Invoice: "Facture",
      Withholding: "Retenue",
      Compare: "Comparer",
      "Add VAT": "Ajouter la TVA",
      "Extract VAT": "Extraire la TVA",
      Amount: "Montant",
      "VAT rate (%)": "Taux de TVA (%)",
      "Calculate locally": "Calculer",
      "Classify each line yourself. Zero-rated and exempt lines use 0% in this planning total.": "Choisissez le régime de chaque ligne. Les lignes exonérées et à taux zéro ne génèrent pas de TVA dans cette simulation.",
      "Line 1": "Ligne 1",
      "Line 2 · optional": "Ligne 2 · facultative",
      "Net amount": "Montant hors taxes",
      Treatment: "Régime",
      Standard: "Normal",
      "Zero-rated": "Taux zéro",
      Exempt: "Exonéré",
      "Rate (%)": "Taux (%)",
      "Total invoice": "Calculer le total",
      "Neutral cash-flow scenario only. Confirm whether withholding applies and who remits it.": "Vérifiez si une retenue s’applique et qui doit la reverser.",
      "Share of VAT retained (%)": "Part de la TVA retenue (%)",
      "Model cash flow": "Simuler les flux",
      "Compare three user-supplied rates against the same net amount. This is not a country recommendation.": "Comparez trois taux de votre choix sur le même montant hors taxes.",
      "Rate A (%)": "Taux A (%)",
      "Rate B (%)": "Taux B (%)",
      "Rate C (%)": "Taux C (%)",
      "Compare rates": "Comparer les taux",
      "Planning estimate only. Confirm current rules with the relevant authority.": "Vérifiez les règles applicables auprès de l’administration fiscale.",
      "VAT-inclusive total": "Total TTC",
      "Net amount extracted": "Montant hors taxes extrait",
      Total: "Total",
      "VAT estimate updated locally.": "TVA calculée.",
      "Invoice total": "Total de la facture",
      Subtotal: "Sous-total",
      VAT: "TVA",
      "User-classified lines": "Lignes renseignées",
      "Invoice planning total updated locally.": "Total de la facture calculé.",
      "Supplier receives in scenario": "Montant perçu par le fournisseur",
      "Gross invoice": "Facture TTC",
      "VAT retained": "TVA retenue",
      "VAT remaining": "TVA restante",
      "Neutral withholding scenario updated locally.": "Simulation de retenue mise à jour.",
      "Rate spread": "Écart entre les taux",
      "Rate scenarios compared locally.": "Comparaison des taux mise à jour.",
      "Calculation engine unavailable.": "Calcul indisponible."
    };
    const tr = k => fr ? words[k] || k : k;
    var e = window.AfroTools && window.AfroTools.panAfricanVat;
    function t(a) {
      return Number(a).toLocaleString(fr ? "fr" : "en", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    a.innerHTML = '<div class="aw-kicker">Local planning widget</div><div class="aw-title">Pan-African VAT workspace</div><p class="aw-intro">Enter the rate shown by your tax authority or invoice. No country rate is assumed, and nothing is stored or sent.</p><div class="aw-tabs" role="tablist" aria-label="VAT workflows"><button class="aw-tab is-active" id="awVatTabSingle" type="button" role="tab" aria-selected="true" aria-controls="awVatSingle" data-panel="single">VAT amount</button><button class="aw-tab" id="awVatTabInvoice" type="button" role="tab" aria-selected="false" aria-controls="awVatInvoice" tabindex="-1" data-panel="invoice">Invoice</button><button class="aw-tab" id="awVatTabWithholding" type="button" role="tab" aria-selected="false" aria-controls="awVatWithholding" tabindex="-1" data-panel="withholding">Withholding</button><button class="aw-tab" id="awVatTabCompare" type="button" role="tab" aria-selected="false" aria-controls="awVatCompare" tabindex="-1" data-panel="compare">Compare</button></div><section class="aw-panel" id="awVatSingle" role="tabpanel" aria-labelledby="awVatTabSingle" data-workflow="single"><div class="aw-segment" aria-label="Calculation direction"><button class="aw-segment-btn is-active" type="button" data-mode="add" aria-pressed="true">Add VAT</button><button class="aw-segment-btn" type="button" data-mode="extract" aria-pressed="false">Extract VAT</button></div><div class="aw-grid"><div class="aw-field"><label for="awVatAmount">Amount</label><input id="awVatAmount" type="number" min="0" step="0.01" inputmode="decimal" placeholder="1,000"></div><div class="aw-field"><label for="awVatRate">VAT rate (%)</label><input id="awVatRate" type="number" min="0" max="100" step="0.01" inputmode="decimal" placeholder="e.g. 15"></div></div><button class="aw-btn" id="awVatCalculate" type="button">Calculate locally</button><div id="awVatSingleResult"></div></section><section class="aw-panel" id="awVatInvoice" role="tabpanel" aria-labelledby="awVatTabInvoice" data-workflow="invoice" hidden><p class="aw-panel-note">Classify each line yourself. Zero-rated and exempt lines use 0% in this planning total.</p><div class="aw-line"><span class="aw-line-name">Line 1</span><div class="aw-grid aw-grid--invoice"><div class="aw-field"><label for="awVatLineAmount1">Net amount</label><input id="awVatLineAmount1" type="number" min="0" step="0.01" inputmode="decimal" placeholder="1,000"></div><div class="aw-field"><label for="awVatLineTreatment1">Treatment</label><select id="awVatLineTreatment1"><option value="standard">Standard</option><option value="zero-rated">Zero-rated</option><option value="exempt">Exempt</option></select></div><div class="aw-field aw-line-rate"><label for="awVatLineRate1">Rate (%)</label><input id="awVatLineRate1" type="number" min="0" max="100" step="0.01" inputmode="decimal" placeholder="15"></div></div></div><div class="aw-line"><span class="aw-line-name">Line 2 · optional</span><div class="aw-grid aw-grid--invoice"><div class="aw-field"><label for="awVatLineAmount2">Net amount</label><input id="awVatLineAmount2" type="number" min="0" step="0.01" inputmode="decimal" placeholder="500"></div><div class="aw-field"><label for="awVatLineTreatment2">Treatment</label><select id="awVatLineTreatment2"><option value="standard">Standard</option><option value="zero-rated">Zero-rated</option><option value="exempt">Exempt</option></select></div><div class="aw-field aw-line-rate"><label for="awVatLineRate2">Rate (%)</label><input id="awVatLineRate2" type="number" min="0" max="100" step="0.01" inputmode="decimal" placeholder="15"></div></div></div><button class="aw-btn" id="awVatInvoiceCalculate" type="button">Total invoice</button><div id="awVatInvoiceResult"></div></section><section class="aw-panel" id="awVatWithholding" role="tabpanel" aria-labelledby="awVatTabWithholding" data-workflow="withholding" hidden><p class="aw-panel-note">Neutral cash-flow scenario only. Confirm whether withholding applies and who remits it.</p><div class="aw-grid"><div class="aw-field"><label for="awVatWithholdingAmount">Net amount</label><input id="awVatWithholdingAmount" type="number" min="0" step="0.01" inputmode="decimal" placeholder="1,000"></div><div class="aw-field"><label for="awVatWithholdingRate">VAT rate (%)</label><input id="awVatWithholdingRate" type="number" min="0" max="100" step="0.01" inputmode="decimal" placeholder="20"></div></div><div class="aw-field"><label for="awVatWithholdingPercent">Share of VAT retained (%)</label><input id="awVatWithholdingPercent" type="number" min="0" max="100" step="0.01" inputmode="decimal" placeholder="25"></div><button class="aw-btn" id="awVatWithholdingCalculate" type="button">Model cash flow</button><div id="awVatWithholdingResult"></div></section><section class="aw-panel" id="awVatCompare" role="tabpanel" aria-labelledby="awVatTabCompare" data-workflow="compare" hidden><p class="aw-panel-note">Compare three user-supplied rates against the same net amount. This is not a country recommendation.</p><div class="aw-field"><label for="awVatCompareAmount">Net amount</label><input id="awVatCompareAmount" type="number" min="0" step="0.01" inputmode="decimal" placeholder="1,000"></div><div class="aw-grid aw-grid--three"><div class="aw-field"><label for="awVatScenario1">Rate A (%)</label><input id="awVatScenario1" type="number" min="0" max="100" step="0.01" inputmode="decimal" placeholder="7.5"></div><div class="aw-field"><label for="awVatScenario2">Rate B (%)</label><input id="awVatScenario2" type="number" min="0" max="100" step="0.01" inputmode="decimal" placeholder="15"></div><div class="aw-field"><label for="awVatScenario3">Rate C (%)</label><input id="awVatScenario3" type="number" min="0" max="100" step="0.01" inputmode="decimal" placeholder="20"></div></div><button class="aw-btn" id="awVatCompareCalculate" type="button">Compare rates</button><div id="awVatCompareResult"></div></section><p class="aw-status" id="awVatStatus" role="status" aria-live="polite">Planning estimate only. Confirm current rules with the relevant authority.</p>';
    if (fr) {
      const walker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const n = walker.currentNode;
        n.nodeValue = tr(n.nodeValue);
      }
      a.querySelector("[role=tablist]").setAttribute("aria-label", "Calculs de TVA");
      a.querySelector(".aw-segment").setAttribute("aria-label", "Sens du calcul");
      a.querySelectorAll("input[placeholder]").forEach(el => el.placeholder = el.placeholder.replace("e.g. ", "Ex. ").replace("1,000", "1 000"));
    }
    function clear(panel) {
      panel.querySelector("[id$=Result]").replaceChildren();
      i.textContent = "";
    }
    a.addEventListener("input", event => {
      const panel = event.target.closest("[role=tabpanel]");
      if (panel) clear(panel);
    });
    var i = a.querySelector("#awVatStatus"), n = Array.prototype.slice.call(a.querySelectorAll('[role="tab"]')), l = Array.prototype.slice.call(a.querySelectorAll('[role="tabpanel"]'));
    function o(a, e, t) {
      return '<div class="aw-result-box"><div class="aw-result-label">' + tr(a) + '</div><div class="aw-result-main">' + e + "</div>" + t.map(function(a) {
        return '<div class="aw-result-row"><span>' + tr(a[0]) + "</span><strong>" + a[1] + "</strong></div>";
      }).join("") + "</div>";
    }
    function r(a, e) {
      i.textContent = a && a.error ? fr ? "Vérifiez les montants et taux renseignés dans cet onglet." : a.error : tr(e);
    }
    function d(a, e) {
      n.forEach(function(e) {
        var t = e === a;
        e.classList.toggle("is-active", t), e.setAttribute("aria-selected", t ? "true" : "false"),
        e.tabIndex = t ? 0 : -1;
      }), l.forEach(function(e) {
        e.hidden = e.dataset.workflow !== a.dataset.panel;
      }), e && a.focus();
    }
    n.forEach(function(a, e) {
      a.addEventListener("click", function() {
        d(a, !1);
      }), a.addEventListener("keydown", function(a) {
        var t = null;
        "ArrowRight" !== a.key && "ArrowDown" !== a.key || (t = (e + 1) % n.length), "ArrowLeft" !== a.key && "ArrowUp" !== a.key || (t = (e - 1 + n.length) % n.length),
        "Home" === a.key && (t = 0), "End" === a.key && (t = n.length - 1), null !== t && (a.preventDefault(),
        d(n[t], !0));
      });
    });
    var s = "add";
    a.querySelectorAll("[data-mode]").forEach(function(e) {
      e.addEventListener("click", function() {
        s = e.dataset.mode, clear(e.closest("[role=tabpanel]")), a.querySelectorAll("[data-mode]").forEach(function(a) {
          var t = a === e;
          a.classList.toggle("is-active", t), a.setAttribute("aria-pressed", t ? "true" : "false");
        });
      });
    }), a.querySelector("#awVatCalculate").addEventListener("click", function() {
      var n = e && e.calculateSingle({
        amount: a.querySelector("#awVatAmount").value,
        rate: a.querySelector("#awVatRate").value,
        mode: s
      });
      if (!n || !n.ok) return r(n, "Calculation engine unavailable.");
      a.querySelector("#awVatSingleResult").innerHTML = o("add" === s ? "VAT-inclusive total" : "Net amount extracted", t("add" === s ? n.total : n.net), [ [ "Net amount", t(n.net) ], [ "VAT amount", t(n.vat) ], [ "Total", t(n.total) ] ]),
      i.textContent = tr("VAT estimate updated locally.");
    }), [ 1, 2 ].forEach(function(e) {
      var t = a.querySelector("#awVatLineTreatment" + e), i = a.querySelector("#awVatLineRate" + e);
      t.addEventListener("change", function() {
        i.disabled = "standard" !== t.value, i.disabled && (i.value = "");
      });
    }), a.querySelector("#awVatInvoiceCalculate").addEventListener("click", function() {
      var n = [ 1, 2 ].map(function(e) {
        return {
          amount: a.querySelector("#awVatLineAmount" + e).value,
          treatment: a.querySelector("#awVatLineTreatment" + e).value,
          rate: a.querySelector("#awVatLineRate" + e).value
        };
      }).filter(function(a) {
        return "" !== String(a.amount).trim();
      }), l = e && e.calculateInvoice({
        items: n
      });
      if (!l || !l.ok) return r(l, "Calculation engine unavailable.");
      a.querySelector("#awVatInvoiceResult").innerHTML = o("Invoice total", t(l.total), [ [ "Subtotal", t(l.subtotal) ], [ "VAT", t(l.vat) ], [ "User-classified lines", String(l.lines.length) ] ]),
      i.textContent = tr("Invoice planning total updated locally.");
    }), a.querySelector("#awVatWithholdingCalculate").addEventListener("click", function() {
      var n = e && e.calculateWithholdingScenario({
        netAmount: a.querySelector("#awVatWithholdingAmount").value,
        vatRate: a.querySelector("#awVatWithholdingRate").value,
        withholdingPercent: a.querySelector("#awVatWithholdingPercent").value
      });
      if (!n || !n.ok) return r(n, "Calculation engine unavailable.");
      a.querySelector("#awVatWithholdingResult").innerHTML = o("Supplier receives in scenario", t(n.supplierReceives), [ [ "Gross invoice", t(n.total) ], [ "VAT retained", t(n.retainedVat) ], [ "VAT remaining", t(n.remainingVat) ] ]),
      i.textContent = tr("Neutral withholding scenario updated locally.");
    }), a.querySelector("#awVatCompareCalculate").addEventListener("click", function() {
      var n = e && e.compareRateScenarios({
        amount: a.querySelector("#awVatCompareAmount").value,
        scenarios: [ {
          label: "Rate A",
          rate: a.querySelector("#awVatScenario1").value
        }, {
          label: "Rate B",
          rate: a.querySelector("#awVatScenario2").value
        }, {
          label: "Rate C",
          rate: a.querySelector("#awVatScenario3").value
        } ]
      });
      if (!n || !n.ok) return r(n, "Calculation engine unavailable.");
      a.querySelector("#awVatCompareResult").innerHTML = o("Rate spread", t(n.percentagePointSpread) + " points", n.scenarios.map(function(a) {
        return [ (fr ? a.label.replace("Rate", "Taux") : a.label) + " (" + t(a.rate) + "%)", tr("VAT") + " " + t(a.vat) ];
      })), i.textContent = tr("Rate scenarios compared locally.");
    });
  };
}();
