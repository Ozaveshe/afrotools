(function initDiscountPlannerPage() {
  "use strict";

  var engine = window.AfroTools && window.AfroTools.DiscountPlanner;
  var root = document.getElementById("discountPlannerRoot");
  if (!engine || !root) return;

  var locale = (root.dataset.locale || document.documentElement.lang || "en").slice(0, 2);
  var COPY = {
    en: {
      title: "Build a discount scenario", help: "Compare up to five sequential discounts. The optional tax percentage is your post-discount scenario, never an AfroTools-supplied VAT or tax rate.",
      currency: "Display-only currency or unit", currencyHelp: "For example NGN, KES, ZAR or USD. No currency conversion is performed.",
      price: "Original unit price", quantity: "Quantity", discounts: "Sequential discounts", add: "Add discount", remove: "Remove discount",
      discount: "Discount", tax: "Your post-discount tax scenario (%)", taxHelp: "Enter a percentage only if you want to model tax after discounts. Confirm the applicable rate and treatment yourself.",
      calculate: "Calculate discount plan", invalid: "Check the highlighted fields. Use finite values within the stated limits.", stale: "Inputs changed. Calculate again before exporting.",
      ready: "Discount plan ready. Savings and effective discount are shown before tax.", original: "Original subtotal", unit: "Discounted unit price",
      discounted: "Discounted subtotal", savings: "Pre-tax savings", effective: "Effective discount", taxAmount: "Entered tax amount", final: "Final total",
      copy: "Copy summary", csv: "Download CSV", json: "Download JSON", pdf: "Download PDF", print: "Print", copied: "Summary copied.", downloaded: "Export downloaded.",
      methodTitle: "Formula and scope", method: "Each discount applies to the already-discounted price. Quantity scales the subtotal. Tax, when entered, applies only after all discounts and never changes the pre-tax savings figure.",
      privacyTitle: "Private by default", privacy: "Calculations stay in this browser. Inputs are not saved, sent, placed in URLs or recorded as analytics values.",
      limitsTitle: "Important limits", limits: "This is a deterministic price worksheet, not a retailer offer, tax opinion, invoice or currency converter. Confirm promotion rules, rounding and tax treatment.",
      faq1: "Do 20% and 10% equal 30% off?", faq1a: "No. Sequential discounts produce 28% off because the second discount applies to the reduced price.",
      faq2: "Does AfroTools provide the tax rate?", faq2a: "No. Tax is optional and entirely user-entered. The tool does not choose a VAT rate or determine whether tax applies.",
      faq3: "What do exports contain?", faq3a: "A valid current result can be copied or exported as formula-safe CSV, JSON, text-readable PDF, or a local print view.",
      pdfTitle: "Discount Scenario", scope: "User-input planning scenario only. No supplied tax rate, retailer offer, price feed or currency conversion."
    },
    fr: {
      title: "Construire un scénario de remise", help: "Comparez jusqu’à cinq remises successives. Le pourcentage de taxe facultatif est votre scénario après remise, jamais un taux de TVA ou de taxe fourni par AfroTools.",
      currency: "Devise ou unité d’affichage", currencyHelp: "Par exemple XOF, XAF, EUR ou USD. Aucune conversion de devise.",
      price: "Prix unitaire d’origine", quantity: "Quantité", discounts: "Remises successives", add: "Ajouter une remise", remove: "Supprimer la remise",
      discount: "Remise", tax: "Votre scénario de taxe après remise (%)", taxHelp: "Saisissez un pourcentage uniquement pour modéliser une taxe après remise. Confirmez vous-même le taux et son traitement.",
      calculate: "Calculer le scénario", invalid: "Vérifiez les champs signalés. Utilisez des valeurs finies dans les limites indiquées.", stale: "Les données ont changé. Recalculez avant l’export.",
      ready: "Scénario prêt. L’économie et la remise effective sont affichées avant taxe.", original: "Sous-total d’origine", unit: "Prix unitaire remisé",
      discounted: "Sous-total remisé", savings: "Économie avant taxe", effective: "Remise effective", taxAmount: "Montant de taxe saisi", final: "Total final",
      copy: "Copier le résumé", csv: "Télécharger CSV", json: "Télécharger JSON", pdf: "Télécharger PDF", print: "Imprimer", copied: "Résumé copié.", downloaded: "Export téléchargé.",
      methodTitle: "Formule et périmètre", method: "Chaque remise s’applique au prix déjà réduit. La quantité multiplie le sous-total. La taxe saisie s’applique après toutes les remises et ne modifie jamais l’économie avant taxe.",
      privacyTitle: "Confidentiel par défaut", privacy: "Les calculs restent dans ce navigateur. Les données ne sont ni enregistrées, ni envoyées, ni ajoutées à l’URL, ni utilisées comme valeurs analytics.",
      limitsTitle: "Limites importantes", limits: "C’est une feuille de prix déterministe, pas une offre commerciale, un avis fiscal, une facture ou un convertisseur de devises. Confirmez les règles, arrondis et taxes.",
      faq1: "20 % et 10 % donnent-ils 30 % ?", faq1a: "Non. Deux remises successives donnent 28 %, car la seconde s’applique au prix déjà réduit.",
      faq2: "AfroTools fournit-il le taux de taxe ?", faq2a: "Non. La taxe est facultative et entièrement saisie par vous. L’outil ne choisit aucun taux de TVA et ne décide pas si une taxe s’applique.",
      faq3: "Que contiennent les exports ?", faq3a: "Un résultat valide peut être copié ou exporté en CSV protégé, JSON, PDF textuel lisible, ou imprimé localement.",
      pdfTitle: "Scénario de remise", scope: "Scénario de planification fondé sur vos données. Aucun taux fiscal, offre commerciale, flux de prix ou conversion de devise n’est fourni."
    },
    sw: {
      title: "Jenga hali ya punguzo", help: "Linganisha hadi mapunguzo matano yanayofuatana. Asilimia ya kodi ya hiari ni hali yako baada ya punguzo, si kiwango cha VAT au kodi kinachotolewa na AfroTools.",
      currency: "Sarafu au kitengo cha kuonyesha", currencyHelp: "Kwa mfano KES, TZS, UGX au USD. Hakuna ubadilishaji wa sarafu.",
      price: "Bei ya awali kwa bidhaa", quantity: "Idadi", discounts: "Mapunguzo yanayofuatana", add: "Ongeza punguzo", remove: "Ondoa punguzo",
      discount: "Punguzo", tax: "Hali yako ya kodi baada ya punguzo (%)", taxHelp: "Weka asilimia tu ukitaka kuonyesha kodi baada ya punguzo. Thibitisha kiwango na utaratibu wake mwenyewe.",
      calculate: "Kokotoa mpango wa punguzo", invalid: "Kagua sehemu zilizoonyeshwa. Tumia namba sahihi ndani ya mipaka.", stale: "Taarifa zimebadilika. Kokotoa tena kabla ya kupakua.",
      ready: "Mpango uko tayari. Akiba na punguzo halisi vinaonyeshwa kabla ya kodi.", original: "Jumla ya awali", unit: "Bei kwa bidhaa baada ya punguzo",
      discounted: "Jumla baada ya punguzo", savings: "Akiba kabla ya kodi", effective: "Punguzo halisi", taxAmount: "Kiasi cha kodi ulichoingiza", final: "Jumla ya mwisho",
      copy: "Nakili muhtasari", csv: "Pakua CSV", json: "Pakua JSON", pdf: "Pakua PDF", print: "Chapisha", copied: "Muhtasari umenakiliwa.", downloaded: "Faili imepakuliwa.",
      methodTitle: "Fomula na mipaka", method: "Kila punguzo hutumika kwenye bei iliyopunguzwa tayari. Idadi huzidisha jumla. Kodi uliyoingiza hutumika baada ya mapunguzo yote na haibadilishi akiba ya kabla ya kodi.",
      privacyTitle: "Faragha kwa chaguo-msingi", privacy: "Hesabu hubaki kwenye kivinjari. Taarifa hazihifadhiwi, hazitumwi, haziwekwi kwenye URL wala kurekodiwa kama thamani za analytics.",
      limitsTitle: "Mipaka muhimu", limits: "Hii ni karatasi ya bei ya fomula, si ofa ya duka, ushauri wa kodi, ankara au kibadilishaji sarafu. Thibitisha masharti, mzunguko wa namba na kodi.",
      faq1: "Je, 20% na 10% ni punguzo la 30%?", faq1a: "Hapana. Mapunguzo yanayofuatana hutoa 28%, kwa sababu la pili hutumika kwenye bei iliyopunguzwa.",
      faq2: "AfroTools inatoa kiwango cha kodi?", faq2a: "Hapana. Kodi ni ya hiari na unaingiza mwenyewe. Zana haichagui kiwango cha VAT wala kuamua kama kodi inatumika.",
      faq3: "Faili zina nini?", faq3a: "Matokeo sahihi yanaweza kunakiliwa au kupakuliwa kama CSV salama, JSON, PDF inayosomeka, au kuchapishwa.",
      pdfTitle: "Mpango wa punguzo", scope: "Hali ya kupanga kwa taarifa zako tu. Hakuna kiwango cha kodi, ofa ya duka, bei hai au ubadilishaji wa sarafu."
    }
  };
  var c = COPY[locale] || COPY.en;
  var latest = null;
  var discountSequence = 1;

  root.innerHTML =
    '<div class="dcp-grid"><section class="dcp-card"><h2>' + c.title + '</h2><p class="dcp-help">' + c.help + '</p>' +
    '<form id="dcpForm" novalidate><div class="dcp-fields">' +
    field("currencyLabel", c.currency, "text", locale === "fr" ? "XOF" : locale === "sw" ? "KES" : "NGN", c.currencyHelp, 'maxlength="16"') +
    field("unitPrice", c.price, "number", "10000", "", 'min="0" max="1000000000000000" step="any" inputmode="decimal"') +
    field("quantity", c.quantity, "number", "1", "", 'min="1" max="10000" step="1" inputmode="numeric"') +
    '<fieldset class="dcp-discounts"><legend>' + c.discounts + '</legend><div id="discountRows"></div><button class="dcp-btn dcp-btn-secondary" id="addDiscount" type="button">' + c.add + '</button></fieldset>' +
    field("taxPct", c.tax, "number", "0", c.taxHelp, 'min="0" max="100" step="any" inputmode="decimal"') +
    '</div><button class="dcp-btn dcp-btn-primary" type="submit">' + c.calculate + '</button></form>' +
    '<p id="dcpStatus" class="dcp-status" role="status" aria-live="polite"></p>' +
    '<section id="dcpResult" class="dcp-result" tabindex="-1" aria-labelledby="dcpResultTitle"><h2 id="dcpResultTitle">' + c.final + '</h2><div id="dcpMetrics" class="dcp-metrics"></div>' +
    '<div class="dcp-actions">' + exportButton("copy", c.copy) + exportButton("csv", c.csv) + exportButton("json", c.json) + exportButton("pdf", c.pdf) + exportButton("print", c.print) + '</div></section></section>' +
    '<aside class="dcp-aside"><section class="dcp-note"><h2>' + c.methodTitle + '</h2><p>' + c.method + '</p></section><section class="dcp-note"><h2>' + c.privacyTitle + '</h2><p>' + c.privacy + '</p></section>' +
    '<section class="dcp-note dcp-wide"><h2>' + c.limitsTitle + '</h2><p>' + c.limits + '</p><details><summary>' + c.faq1 + '</summary><p>' + c.faq1a + '</p></details><details><summary>' + c.faq2 + '</summary><p>' + c.faq2a + '</p></details><details><summary>' + c.faq3 + '</summary><p>' + c.faq3a + '</p></details></section></aside></div>';

  function field(id, label, type, value, help, attrs) {
    return '<div class="dcp-field"><label for="' + id + '">' + label + '</label><input id="' + id + '" name="' + id + '" type="' + type + '" value="' + value + '" ' + (attrs || "") + '><div class="dcp-error" data-error="' + id + '"></div>' + (help ? '<small>' + help + '</small>' : "") + '</div>';
  }
  function exportButton(action, text) {
    return '<button class="dcp-btn dcp-btn-secondary" type="button" data-export="' + action + '" disabled>' + text + '</button>';
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }
  function el(id) { return document.getElementById(id); }
  function addDiscount(value) {
    if (el("discountRows").children.length >= engine.LIMITS.discounts) return;
    var index = discountSequence++;
    var row = document.createElement("div");
    row.className = "dcp-discount-row";
    row.innerHTML = '<div class="dcp-field"><label for="discount-' + index + '">' + c.discount + " " + (el("discountRows").children.length + 1) + '</label><input id="discount-' + index + '" data-discount type="number" value="' + value + '" min="0" max="100" step="any" inputmode="decimal"><div class="dcp-error" data-error="discount-' + index + '"></div></div><button class="dcp-remove" type="button" aria-label="' + c.remove + '">×</button>';
    row.querySelector(".dcp-remove").addEventListener("click", function () {
      if (el("discountRows").children.length === 1) return;
      row.remove(); renumberDiscounts(); invalidate();
    });
    el("discountRows").appendChild(row);
    renumberDiscounts();
  }
  function renumberDiscounts() {
    Array.from(el("discountRows").children).forEach(function (row, index) {
      row.querySelector("label").textContent = c.discount + " " + (index + 1);
      row.querySelector(".dcp-remove").hidden = el("discountRows").children.length === 1;
    });
    el("addDiscount").disabled = el("discountRows").children.length >= engine.LIMITS.discounts;
  }
  function getInput() {
    return {
      currencyLabel: el("currencyLabel").value,
      unitPrice: el("unitPrice").value,
      quantity: el("quantity").value,
      discounts: Array.from(root.querySelectorAll("[data-discount]")).map(function (input) { return input.value; }),
      taxPct: el("taxPct").value
    };
  }
  function number(value, digits) {
    return value.toLocaleString(locale, { maximumFractionDigits: digits == null ? 2 : digits });
  }
  function money(value) {
    var label = latest && latest.inputs.currencyLabel ? latest.inputs.currencyLabel + " " : "";
    return label + number(value, 2);
  }
  function metric(label, value) {
    return '<div class="dcp-metric"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></div>';
  }
  function setExports(enabled) {
    root.querySelectorAll("[data-export]").forEach(function (button) { button.disabled = !enabled; });
  }
  function clearErrors() {
    root.querySelectorAll("[aria-invalid]").forEach(function (node) { node.removeAttribute("aria-invalid"); });
    root.querySelectorAll(".dcp-error").forEach(function (node) { node.textContent = ""; });
  }
  function showErrors(errors) {
    clearErrors();
    errors.forEach(function (name) {
      var target = name.indexOf("discount-") === 0
        ? root.querySelectorAll("[data-discount]")[Number(name.split("-")[1])]
        : el(name);
      if (!target) return;
      target.setAttribute("aria-invalid", "true");
      var error = target.parentElement.querySelector(".dcp-error");
      if (error) error.textContent = c.invalid;
    });
  }
  function invalidate() {
    if (!latest) return;
    latest = null; setExports(false); el("dcpResult").classList.remove("is-visible"); el("dcpStatus").textContent = c.stale;
  }
  function render(result) {
    latest = result;
    var o = result.outputs;
    el("dcpMetrics").innerHTML =
      metric(c.original, money(o.originalSubtotal)) +
      metric(c.unit, money(o.discountedUnitPrice)) +
      metric(c.discounted, money(o.discountedSubtotal)) +
      metric(c.savings, money(o.savings)) +
      metric(c.effective, number(o.effectiveDiscountPct, 2) + "%") +
      metric(c.taxAmount, money(o.taxAmount)) +
      metric(c.final, money(o.finalTotal));
    el("dcpResult").classList.add("is-visible"); setExports(true); el("dcpStatus").textContent = c.ready;
    el("dcpResult").focus({ preventScroll: true });
  }
  function summary() {
    var o = latest.outputs;
    return [
      c.pdfTitle,
      c.original + ": " + money(o.originalSubtotal),
      c.unit + ": " + money(o.discountedUnitPrice),
      c.discounted + ": " + money(o.discountedSubtotal),
      c.savings + ": " + money(o.savings),
      c.effective + ": " + number(o.effectiveDiscountPct, 2) + "%",
      c.taxAmount + ": " + money(o.taxAmount),
      c.final + ": " + money(o.finalTotal),
      c.scope
    ].join("\n");
  }
  function safeCsv(value) {
    var text = String(value == null ? "" : value);
    if (/^[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    el("dcpStatus").textContent = c.downloaded;
  }
  function exportCsv() {
    var rows = [["field", "value"], ["engine_version", latest.version], ["currency_display_label", latest.inputs.currencyLabel], ["unit_price", latest.inputs.unitPrice], ["quantity", latest.inputs.quantity]];
    latest.inputs.discounts.forEach(function (discount, index) { rows.push(["discount_" + (index + 1) + "_pct", discount]); });
    rows.push(["entered_post_discount_tax_pct", latest.inputs.taxPct]);
    Object.keys(latest.outputs).forEach(function (key) { rows.push([key, latest.outputs[key]]); });
    rows.push(["scope_note", c.scope]);
    download(new Blob([rows.map(function (row) { return row.map(safeCsv).join(","); }).join("\r\n")], { type: "text/csv;charset=utf-8" }), "afrotools-discount-plan.csv");
  }
  function exportJson() {
    download(new Blob([JSON.stringify({ schemaVersion: 1, tool: "discount-calc", result: latest, scopeNote: c.scope }, null, 2)], { type: "application/json" }), "afrotools-discount-plan.json");
  }
  function exportPdf() {
    var JsPdf = window.jspdf && window.jspdf.jsPDF;
    if (!JsPdf) { el("dcpStatus").textContent = "PDF library unavailable."; return; }
    var doc = new JsPdf({ unit: "pt", format: "a4" });
    doc.setProperties({ title: c.pdfTitle, subject: c.scope, creator: "AfroTools" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text(c.pdfTitle, 44, 52);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(doc.splitTextToSize(summary(), 500), 44, 78);
    download(doc.output("blob"), "afrotools-discount-plan.pdf");
  }

  addDiscount(20);
  el("addDiscount").addEventListener("click", function () { addDiscount(10); invalidate(); });
  el("dcpForm").addEventListener("input", invalidate);
  el("dcpForm").addEventListener("change", invalidate);
  el("dcpForm").addEventListener("submit", function (event) {
    event.preventDefault();
    var result = engine.calculate(getInput());
    if (!result.valid) {
      latest = null; setExports(false); el("dcpResult").classList.remove("is-visible"); showErrors(result.errors); el("dcpStatus").textContent = c.invalid; return;
    }
    clearErrors(); render(result);
  });
  root.addEventListener("click", function (event) {
    var button = event.target.closest("[data-export]");
    if (!button || button.disabled || !latest) return;
    if (button.dataset.export === "copy") {
      navigator.clipboard.writeText(summary()).then(function () { el("dcpStatus").textContent = c.copied; }, function () { el("dcpStatus").textContent = summary(); });
    } else if (button.dataset.export === "csv") exportCsv();
    else if (button.dataset.export === "json") exportJson();
    else if (button.dataset.export === "pdf") exportPdf();
    else if (button.dataset.export === "print") window.print();
  });
})();
