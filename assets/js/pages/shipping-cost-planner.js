(function initShippingCostPlannerPage() {
  "use strict";

  var engine = window.AfroTools && window.AfroTools.ShippingCostPlanner;
  var root = document.getElementById("shippingPlannerRoot");
  if (!engine || !root) return;

  var locale = (root.dataset.locale || document.documentElement.lang || "en").slice(0, 2);
  var COPY = {
    en: {
      formTitle: "Build your shipping assumption", formHelp: "Use a carrier quote or your own scenario. AfroTools supplies no rate, route or carrier availability.",
      currency: "Display-only currency or unit", currencyHelp: "For example USD, KES or quote units. No FX conversion is performed.",
      count: "Package count", actual: "Actual kg per package", dims: "Package dimensions (cm)", length: "Length", width: "Width", height: "Height",
      divisor: "Confirmed volumetric divisor", choose: "Choose only after checking your carrier", d5000: "5000 — confirmed by me", d6000: "6000 — confirmed by me", custom: "Custom — confirmed by me",
      customDivisor: "Custom divisor", divisorNote: "Your carrier and service own this divisor. 5000 and 6000 are selectable examples, not universal defaults.",
      rate: "Your rate per chargeable kg", fixed: "Fixed or local fees", packaging: "Packaging fees", fuel: "Your fuel surcharge (%)",
      declared: "Declared value", insurance: "Your insurance assumption (%)", contingency: "Contingency (%)",
      calculate: "Calculate planning estimate", invalid: "Check the highlighted fields. A confirmed divisor and positive package measurements are required.",
      stale: "Inputs changed. Calculate again before exporting.", ready: "Estimate ready. Customs, duty and VAT are excluded.",
      actualTotal: "Actual total", volumeTotal: "Volumetric total", chargeable: "Chargeable weight", freight: "User-rate freight", fuelCost: "Fuel assumption",
      insuranceCost: "Insurance assumption", fixedCost: "Fixed/local fees", packagingCost: "Packaging", subtotal: "Subtotal", contingencyCost: "Contingency", total: "Planning total",
      copy: "Copy summary", csv: "Download CSV", json: "Download JSON", pdf: "Download PDF", print: "Print", copied: "Summary copied.", downloaded: "Export downloaded.",
      customsTitle: "Customs is a separate decision", customsText: "This planner excludes duty, import VAT, HS classification, brokerage and border fees.", customsLink: "Open Import Duty Calculator",
      privacyTitle: "Private by design", privacyText: "Calculations run in this browser. Inputs are not saved, sent, placed in URLs or recorded in analytics.",
      methodTitle: "Method and limits", methodText: "Chargeable weight is the greater of actual total weight and volumetric total weight. Every price and percentage is your assumption.",
      sourcesTitle: "Formula sources checked 23 July 2026", sourceText: "Official carrier references explain dimensional-weight concepts only. They do not validate a universal divisor, rate or route.",
      faq1: "Is this a carrier quote?", faq1a: "No. It is a planning worksheet using only the values you enter. Confirm the final divisor, rate, restrictions and terms with your provider.",
      faq2: "Are customs and taxes included?", faq2a: "No. Duty, import VAT, HS classification, brokerage and border charges are deliberately excluded.",
      faq3: "What can I export?", faq3a: "After a valid calculation you can copy a summary, download CSV, JSON or a text-readable PDF, and print locally.",
      pdfTitle: "Shipping Cost & Chargeable Weight Plan", assumption: "Planning estimate only. Customs, duty and VAT are excluded; provider quote, divisor, insurance and all fees require confirmation."
    },
    fr: {
      formTitle: "Construisez votre hypothèse d’expédition", formHelp: "Utilisez un devis transporteur ou votre propre scénario. AfroTools ne fournit aucun tarif, itinéraire ou disponibilité.",
      currency: "Devise ou unité d’affichage", currencyHelp: "Par exemple USD, XOF ou unités du devis. Aucune conversion FX.",
      count: "Nombre de colis", actual: "Poids réel par colis (kg)", dims: "Dimensions du colis (cm)", length: "Longueur", width: "Largeur", height: "Hauteur",
      divisor: "Diviseur volumétrique confirmé", choose: "Choisir après vérification", d5000: "5000 — confirmé par moi", d6000: "6000 — confirmé par moi", custom: "Personnalisé — confirmé par moi",
      customDivisor: "Diviseur personnalisé", divisorNote: "Le transporteur et le service déterminent ce diviseur. 5000 et 6000 sont des exemples, jamais des valeurs universelles.",
      rate: "Votre tarif par kg facturable", fixed: "Frais fixes ou locaux", packaging: "Frais d’emballage", fuel: "Votre surcharge carburant (%)",
      declared: "Valeur déclarée", insurance: "Votre hypothèse d’assurance (%)", contingency: "Marge de prudence (%)",
      calculate: "Calculer l’estimation", invalid: "Vérifiez les champs signalés. Un diviseur confirmé et des mesures positives sont requis.",
      stale: "Les données ont changé. Recalculez avant l’export.", ready: "Estimation prête. Douane, droits et TVA sont exclus.",
      actualTotal: "Poids réel total", volumeTotal: "Poids volumétrique", chargeable: "Poids facturable", freight: "Fret selon votre tarif", fuelCost: "Hypothèse carburant",
      insuranceCost: "Hypothèse assurance", fixedCost: "Frais fixes/locaux", packagingCost: "Emballage", subtotal: "Sous-total", contingencyCost: "Marge", total: "Total de planification",
      copy: "Copier le résumé", csv: "Télécharger CSV", json: "Télécharger JSON", pdf: "Télécharger PDF", print: "Imprimer", copied: "Résumé copié.", downloaded: "Export téléchargé.",
      customsTitle: "La douane est une décision séparée", customsText: "Ce planificateur exclut droits, TVA à l’importation, classement HS, courtage et frais frontaliers.", customsLink: "Ouvrir le calculateur de droits",
      privacyTitle: "Confidentiel par conception", privacyText: "Le calcul reste dans ce navigateur. Rien n’est enregistré, envoyé, ajouté à l’URL ou transmis à l’analytics.",
      methodTitle: "Méthode et limites", methodText: "Le poids facturable est le plus élevé entre le poids réel total et le poids volumétrique total. Tous les montants sont vos hypothèses.",
      sourcesTitle: "Sources de formule vérifiées le 23 juillet 2026", sourceText: "Les références officielles expliquent uniquement le poids dimensionnel. Elles ne valident aucun diviseur, tarif ou itinéraire universel.",
      faq1: "Est-ce un devis transporteur ?", faq1a: "Non. C’est une feuille de planification fondée uniquement sur vos valeurs. Confirmez diviseur, tarif, restrictions et conditions avec le prestataire.",
      faq2: "Douane et taxes incluses ?", faq2a: "Non. Droits, TVA à l’importation, classement HS, courtage et frais frontaliers sont exclus.",
      faq3: "Quels exports sont disponibles ?", faq3a: "Après un calcul valide : résumé copié, CSV, JSON, PDF lisible et impression locale.",
      pdfTitle: "Plan de coût et poids facturable", assumption: "Estimation de planification. Douane, droits et TVA sont exclus ; le devis, le diviseur, l’assurance et tous les frais doivent être confirmés."
    },
    sw: {
      formTitle: "Jenga makisio yako ya usafirishaji", formHelp: "Tumia nukuu ya mtoa huduma au hali yako. AfroTools haitoi kiwango, njia au upatikanaji wa mtoa huduma.",
      currency: "Sarafu au kitengo cha kuonyesha", currencyHelp: "Kwa mfano USD, KES au vitengo vya nukuu. Hakuna ubadilishaji wa FX.",
      count: "Idadi ya vifurushi", actual: "Kilo halisi kwa kifurushi", dims: "Vipimo vya kifurushi (cm)", length: "Urefu", width: "Upana", height: "Kimo",
      divisor: "Kigawanyo cha ujazo ulichothibitisha", choose: "Chagua baada ya kukagua mtoa huduma", d5000: "5000 — nimethibitisha", d6000: "6000 — nimethibitisha", custom: "Maalum — nimethibitisha",
      customDivisor: "Kigawanyo maalum", divisorNote: "Mtoa huduma na aina ya huduma huamua kigawanyo. 5000 na 6000 ni mifano ya kuchagua, si viwango vya wote.",
      rate: "Kiwango chako kwa kilo inayotozwa", fixed: "Ada maalum au za eneo", packaging: "Gharama za kufunga", fuel: "Ongezeko lako la mafuta (%)",
      declared: "Thamani iliyotangazwa", insurance: "Dhana yako ya bima (%)", contingency: "Akiba ya tahadhari (%)",
      calculate: "Kokotoa makisio", invalid: "Kagua sehemu zilizoonyeshwa. Kigawanyo kilichothibitishwa na vipimo chanya vinahitajika.",
      stale: "Taarifa zimebadilika. Kokotoa tena kabla ya kuhamisha.", ready: "Makisio yako tayari. Forodha, ushuru na VAT hazijajumuishwa.",
      actualTotal: "Uzito halisi wote", volumeTotal: "Uzito wa ujazo", chargeable: "Uzito unaotozwa", freight: "Usafirishaji kwa kiwango chako", fuelCost: "Dhana ya mafuta",
      insuranceCost: "Dhana ya bima", fixedCost: "Ada maalum/eneo", packagingCost: "Kufunga", subtotal: "Jumla ndogo", contingencyCost: "Tahadhari", total: "Jumla ya kupanga",
      copy: "Nakili muhtasari", csv: "Pakua CSV", json: "Pakua JSON", pdf: "Pakua PDF", print: "Chapisha", copied: "Muhtasari umenakiliwa.", downloaded: "Faili imepakuliwa.",
      customsTitle: "Forodha ni uamuzi tofauti", customsText: "Zana hii haijumuishi ushuru, VAT ya uagizaji, HS, udalali au ada za mpakani.", customsLink: "Fungua Kikokotoo cha Ushuru",
      privacyTitle: "Faragha kwa muundo", privacyText: "Hesabu hubaki kwenye kivinjari. Taarifa hazihifadhiwi, hazitumwi, haziwekwi kwenye URL wala analytics.",
      methodTitle: "Mbinu na mipaka", methodText: "Uzito unaotozwa ni mkubwa kati ya uzito halisi wote na uzito wa ujazo wote. Kila bei na asilimia ni dhana yako.",
      sourcesTitle: "Vyanzo vya fomula vimekaguliwa 23 Julai 2026", sourceText: "Marejeo rasmi yanaeleza dhana ya uzito wa ujazo tu. Hayathibitishi kigawanyo, kiwango au njia ya wote.",
      faq1: "Je, hii ni nukuu ya mtoa huduma?", faq1a: "Hapana. Ni karatasi ya kupanga kwa kutumia taarifa zako tu. Thibitisha kigawanyo, kiwango, vizuizi na masharti na mtoa huduma.",
      faq2: "Forodha na kodi zimejumuishwa?", faq2a: "Hapana. Ushuru, VAT ya uagizaji, HS, udalali na ada za mpakani zimeondolewa.",
      faq3: "Ninaweza kupakua nini?", faq3a: "Baada ya hesabu sahihi unaweza kunakili muhtasari, kupakua CSV, JSON au PDF inayosomeka, na kuchapisha.",
      pdfTitle: "Mpango wa gharama na uzito unaotozwa", assumption: "Makisio ya kupanga tu. Forodha, ushuru na VAT zimeondolewa; nukuu, kigawanyo, bima na ada zote lazima zithibitishwe."
    }
  };
  var c = COPY[locale] || COPY.en;
  var latest = null;

  root.innerHTML =
    '<div class="scp-grid"><section class="scp-card"><h2>' + c.formTitle + '</h2><p class="scp-help">' + c.formHelp + '</p>' +
    '<form id="scpForm" class="scp-form" novalidate><div class="scp-fields">' +
    field("currencyLabel", c.currency, "text", "USD", c.currencyHelp, "scp-span") +
    field("packageCount", c.count, "number", "1", "", "", 'min="1" max="10000" step="1"') +
    field("actualKgPerPackage", c.actual, "number", "2", "", "", 'min="0.001" max="1000000" step="any"') +
    '<div class="scp-field scp-span"><label>' + c.dims + '</label><div class="scp-dims">' +
    mini("lengthCm", c.length, "30") + mini("widthCm", c.width, "20") + mini("heightCm", c.height, "15") + '</div></div>' +
    '<div class="scp-field scp-span"><label for="divisorChoice">' + c.divisor + '</label><select id="divisorChoice" required><option value="">' + c.choose + '</option><option value="5000">' + c.d5000 + '</option><option value="6000">' + c.d6000 + '</option><option value="custom">' + c.custom + '</option></select><div class="scp-error" data-error="divisor"></div></div>' +
    '<div class="scp-field scp-span" id="customDivisorField" hidden><label for="customDivisor">' + c.customDivisor + '</label><input id="customDivisor" type="number" min="1" step="any"></div>' +
    '<p class="scp-divisor-note scp-span">' + c.divisorNote + '</p>' +
    field("ratePerKg", c.rate, "number", "0", "", "", 'min="0" step="any"') +
    field("fixedFees", c.fixed, "number", "0", "", "", 'min="0" step="any"') +
    field("packagingFees", c.packaging, "number", "0", "", "", 'min="0" step="any"') +
    field("fuelPct", c.fuel, "number", "0", "", "", 'min="0" max="100" step="any"') +
    field("declaredValue", c.declared, "number", "0", "", "", 'min="0" step="any"') +
    field("insurancePct", c.insurance, "number", "0", "", "", 'min="0" max="100" step="any"') +
    field("contingencyPct", c.contingency, "number", "0", "", "", 'min="0" max="100" step="any"') +
    '</div><div class="scp-actions"><button class="scp-btn scp-btn-primary" type="submit">' + c.calculate + '</button></div></form>' +
    '<p id="scpStatus" class="scp-status" role="status" aria-live="polite"></p>' +
    '<section id="scpResult" class="scp-result" tabindex="-1" aria-labelledby="scpResultTitle"><h2 id="scpResultTitle">' + c.total + '</h2><div id="scpMetrics" class="scp-metrics"></div><div id="scpBreakdown" class="scp-breakdown"></div>' +
    '<div class="scp-actions" id="scpExports">' + exportButton("copy", c.copy) + exportButton("csv", c.csv) + exportButton("json", c.json) + exportButton("pdf", c.pdf) + exportButton("print", c.print) + '</div></section></section>' +
    '<aside class="scp-aside"><section class="scp-note"><h2>' + c.customsTitle + '</h2><p>' + c.customsText + '</p><a class="scp-link" href="/tools/import-duty/">' + c.customsLink + '</a></section>' +
    '<section class="scp-note"><h2>' + c.privacyTitle + '</h2><p>' + c.privacyText + '</p></section>' +
    '<section class="scp-note scp-span"><h2>' + c.methodTitle + '</h2><p>' + c.methodText + '</p><h2>' + c.sourcesTitle + '</h2><p>' + c.sourceText + '</p><ul><li><a href="https://aviationcargo.dhl.com/business-tools/volume-calculator" target="_blank" rel="noopener noreferrer">DHL Aviation Cargo dimensional weight</a></li><li><a href="https://www.fedex.com/en-us/shipping/packaging/what-is-dimensional-weight.html" target="_blank" rel="noopener noreferrer">FedEx dimensional weight guide</a></li></ul><div class="scp-method"><details><summary>' + c.faq1 + '</summary><p>' + c.faq1a + '</p></details><details><summary>' + c.faq2 + '</summary><p>' + c.faq2a + '</p></details><details><summary>' + c.faq3 + '</summary><p>' + c.faq3a + '</p></details></div></section></aside></div>';

  function field(id, label, type, value, help, extraClass, attrs) {
    return '<div class="scp-field ' + (extraClass || "") + '"><label for="' + id + '">' + label + '</label><input id="' + id + '" name="' + id + '" type="' + type + '" value="' + value + '" ' + (attrs || "") + '><div class="scp-error" data-error="' + id + '"></div>' + (help ? '<small>' + help + '</small>' : "") + '</div>';
  }
  function mini(id, label, value) {
    return '<div><label for="' + id + '">' + label + '</label><input id="' + id + '" name="' + id + '" type="number" value="' + value + '" min="0.001" max="100000" step="any"><div class="scp-error" data-error="' + id + '"></div></div>';
  }
  function exportButton(action, text) { return '<button class="scp-btn" type="button" data-export="' + action + '" disabled>' + text + '</button>'; }
  function el(id) { return document.getElementById(id); }
  function number(id) { return el(id).value; }
  function getInput() {
    var choice = el("divisorChoice").value;
    return {
      currencyLabel: el("currencyLabel").value,
      packageCount: number("packageCount"), actualKgPerPackage: number("actualKgPerPackage"),
      lengthCm: number("lengthCm"), widthCm: number("widthCm"), heightCm: number("heightCm"),
      divisor: choice === "custom" ? number("customDivisor") : choice,
      ratePerKg: number("ratePerKg"), fixedFees: number("fixedFees"), packagingFees: number("packagingFees"),
      fuelPct: number("fuelPct"), declaredValue: number("declaredValue"), insurancePct: number("insurancePct"), contingencyPct: number("contingencyPct")
    };
  }
  function money(value) {
    var label = latest && latest.inputs.currencyLabel ? latest.inputs.currencyLabel + " " : "";
    return label + value.toLocaleString(locale, { maximumFractionDigits: 2 });
  }
  function kg(value) { return value.toLocaleString(locale, { maximumFractionDigits: 3 }) + " kg"; }
  function setExports(enabled) { root.querySelectorAll("[data-export]").forEach(function (button) { button.disabled = !enabled; }); }
  function clearErrors() { root.querySelectorAll("[aria-invalid]").forEach(function (node) { node.removeAttribute("aria-invalid"); }); root.querySelectorAll(".scp-error").forEach(function (node) { node.textContent = ""; }); }
  function showErrors(errors) {
    clearErrors();
    errors.forEach(function (fieldName) {
      var target = fieldName === "divisor" ? (el("divisorChoice").value === "custom" ? el("customDivisor") : el("divisorChoice")) : el(fieldName);
      if (target) target.setAttribute("aria-invalid", "true");
    });
  }
  function invalidate() {
    if (!latest) return;
    latest = null; setExports(false); el("scpResult").classList.remove("is-visible"); el("scpStatus").textContent = c.stale;
  }
  function render(result) {
    latest = result;
    var o = result.outputs;
    el("scpMetrics").innerHTML = metric(c.actualTotal, kg(o.actualTotalKg)) + metric(c.volumeTotal, kg(o.volumetricTotalKg)) + metric(c.chargeable, kg(o.chargeableKg));
    var rows = [[c.freight, o.freight], [c.fuelCost, o.fuel], [c.insuranceCost, o.insurance], [c.fixedCost, o.fixedFees], [c.packagingCost, o.packagingFees], [c.subtotal, o.subtotal], [c.contingencyCost, o.contingency], [c.total, o.total]];
    el("scpBreakdown").innerHTML = rows.map(function (row) { return '<div class="scp-row"><span>' + row[0] + '</span><strong>' + money(row[1]) + '</strong></div>'; }).join("");
    el("scpResult").classList.add("is-visible"); setExports(true); el("scpStatus").textContent = c.ready; el("scpResult").focus({ preventScroll: true });
  }
  function metric(label, value) { return '<div class="scp-metric"><span>' + label + '</span><strong>' + value + '</strong></div>'; }
  function summary() {
    var o = latest.outputs;
    return [c.pdfTitle, c.actualTotal + ": " + kg(o.actualTotalKg), c.volumeTotal + ": " + kg(o.volumetricTotalKg), c.chargeable + ": " + kg(o.chargeableKg), c.freight + ": " + money(o.freight), c.fuelCost + ": " + money(o.fuel), c.insuranceCost + ": " + money(o.insurance), c.fixedCost + ": " + money(o.fixedFees), c.packagingCost + ": " + money(o.packagingFees), c.contingencyCost + ": " + money(o.contingency), c.total + ": " + money(o.total), c.assumption].join("\n");
  }
  function safeCsv(value) {
    var text = String(value == null ? "" : value);
    if (/^[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function download(blob, filename) {
    var url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000); el("scpStatus").textContent = c.downloaded;
  }
  function exportCsv() {
    var rows = [["field", "value"], ["engine_version", latest.version]];
    Object.keys(latest.inputs).forEach(function (key) { rows.push([key, latest.inputs[key]]); });
    Object.keys(latest.outputs).forEach(function (key) { rows.push([key, latest.outputs[key]]); });
    rows.push(["scope_note", c.assumption]);
    download(new Blob([rows.map(function (row) { return row.map(safeCsv).join(","); }).join("\r\n")], { type: "text/csv;charset=utf-8" }), "afrotools-shipping-plan.csv");
  }
  function exportJson() {
    download(new Blob([JSON.stringify({ schemaVersion: 1, tool: "shipping-calc", result: latest, scopeNote: c.assumption }, null, 2)], { type: "application/json" }), "afrotools-shipping-plan.json");
  }
  function exportPdf() {
    var JsPdf = window.jspdf && window.jspdf.jsPDF;
    if (!JsPdf) { el("scpStatus").textContent = "PDF library unavailable."; return; }
    var doc = new JsPdf({ unit: "pt", format: "a4" });
    doc.setProperties({ title: c.pdfTitle, subject: c.assumption, creator: "AfroTools" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text(c.pdfTitle, 44, 52);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    var lines = doc.splitTextToSize(summary(), 500); doc.text(lines, 44, 78);
    download(doc.output("blob"), "afrotools-shipping-plan.pdf");
  }

  el("divisorChoice").addEventListener("change", function () { el("customDivisorField").hidden = this.value !== "custom"; invalidate(); });
  el("scpForm").addEventListener("input", invalidate);
  el("scpForm").addEventListener("change", invalidate);
  el("scpForm").addEventListener("submit", function (event) {
    event.preventDefault(); var result = engine.calculate(getInput());
    if (!result.valid) { latest = null; setExports(false); showErrors(result.errors); el("scpStatus").textContent = c.invalid; return; }
    clearErrors(); render(result);
  });
  root.addEventListener("click", function (event) {
    var button = event.target.closest("[data-export]"); if (!button || button.disabled || !latest) return;
    if (button.dataset.export === "copy") {
      navigator.clipboard.writeText(summary()).then(function () { el("scpStatus").textContent = c.copied; }, function () { el("scpStatus").textContent = summary(); });
    } else if (button.dataset.export === "csv") exportCsv();
    else if (button.dataset.export === "json") exportJson();
    else if (button.dataset.export === "pdf") exportPdf();
    else if (button.dataset.export === "print") window.print();
  });
})();
