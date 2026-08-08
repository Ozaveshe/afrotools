(function () {
  "use strict";

  var root = document.querySelector("[data-za-transfer-duty]");
  var engine = window.ZA_TRANSFER_DUTY;
  if (!root || !engine) return;

  var locale = root.dataset.locale || "en";
  var copy = {
    en: {
      consideration: "Enter a positive purchase consideration.", fair: "Fair market value must be positive or left blank.", other: "Other consideration must be blank, zero or positive.", date: "This verified calculator supports agreements from 1 April through 9 August 2026. Use the SARS rate archive for another date.", ready: "Transfer-duty estimate ready. No input left this browser.", changed: "Inputs changed. Calculate again.", copied: "Estimate copied locally.", exported: "Local export created.", reset: "Calculator reset.", vat: "Marked as subject to VAT: transfer duty is shown as zero. Confirm VAT treatment with the conveyancer and SARS.", boundary: "Transfer duty only. Conveyancing, deeds, bond, valuation, municipal, VAT and finance costs are excluded.", agreement: "agreement", vatNot: "not subject to VAT", vatYes: "subject to VAT", item: "item", value: "value", privacy: "Local South Africa transfer-duty estimate.", csvName: "south-africa-transfer-duty-estimate.csv", jsonName: "south-africa-transfer-duty-estimate.json"
    },
    fr: {
      consideration: "Saisissez une contrepartie d’achat positive.", fair: "La valeur marchande doit être positive ou laissée vide.", other: "Toute autre contrepartie doit être vide, nulle ou positive.", date: "Ce calculateur vérifié couvre les contrats du 1er avril au 9 août 2026. Consultez les archives SARS pour une autre date.", ready: "Estimation prête. Aucune donnée n’a quitté ce navigateur.", changed: "Données modifiées. Recalculez.", copied: "Estimation copiée localement.", exported: "Export local créé.", reset: "Calculateur réinitialisé.", vat: "Transaction indiquée comme soumise à la TVA : les droits sont affichés à zéro. Confirmez le traitement avec le conveyancer et SARS.", boundary: "Droits de mutation uniquement. Les frais de conveyancing, d’enregistrement, de garantie, d’évaluation, municipaux, de TVA et de financement sont exclus.", agreement: "contrat", vatNot: "non soumise à la TVA", vatYes: "soumise à la TVA", item: "élément", value: "valeur", privacy: "Estimation locale des droits de mutation sud-africains.", csvName: "estimation-droits-mutation-afrique-du-sud.csv", jsonName: "estimation-droits-mutation-afrique-du-sud.json"
    },
    sw: {
      consideration: "Weka malipo chanya ya ununuzi.", fair: "Thamani ya soko lazima iwe chanya au iachwe tupu.", other: "Malipo mengine lazima yaachwe tupu, yawe sifuri au chanya.", date: "Kikokotoo hiki kilichokaguliwa kinaunga mikataba ya 1 Aprili hadi 9 Agosti 2026. Tumia kumbukumbu za viwango vya SARS kwa tarehe nyingine.", ready: "Makadirio yako tayari. Hakuna taarifa iliyoondoka kwenye kivinjari hiki.", changed: "Taarifa imebadilika. Kokotoa tena.", copied: "Makadirio yamenakiliwa ndani ya kifaa.", exported: "Faili ya ndani imetengenezwa.", reset: "Kikokotoo kimerudishwa mwanzo.", vat: "Umechagua muamala ulio chini ya VAT, hivyo ushuru unaonyeshwa sifuri. Thibitisha hali ya VAT na wakili wa uhamisho pamoja na SARS.", boundary: "Hesabu ni ya ushuru wa uhamisho pekee. Ada za wakili wa uhamisho, usajili, dhamana, uthamini, manispaa, VAT na ufadhili hazijajumuishwa.", agreement: "mkataba", vatNot: "hauko chini ya VAT", vatYes: "uko chini ya VAT", item: "kipengele", value: "thamani", privacy: "Makadirio binafsi ya ushuru wa uhamisho Afrika Kusini.", csvName: "makadirio-ushuru-uhamisho-afrika-kusini.csv", jsonName: "makadirio-ushuru-uhamisho-afrika-kusini.json"
    }
  }[locale];
  if (!copy) return;

  var form = document.getElementById("td-form");
  var results = document.getElementById("td-results");
  var error = document.getElementById("td-error");
  var status = document.getElementById("td-status");
  var actions = document.querySelectorAll("[data-td-action]");
  var current = null;

  function value(id) { return document.getElementById(id).value; }
  function input() { return { consideration: value("td-consideration"), fairValue: value("td-fair"), otherConsideration: value("td-other"), agreementDate: value("td-date"), vatStatus: value("td-vat") }; }
  function money(amount) { return new Intl.NumberFormat(locale === "sw" ? "sw-ZA" : locale, { style: "currency", currency: "ZAR", maximumFractionDigits: 2 }).format(amount); }
  function percent(amount) { return new Intl.NumberFormat(locale === "sw" ? "sw-ZA" : locale, { style: "percent", maximumFractionDigits: 3 }).format(amount); }
  function enable(on) { actions.forEach(function (button) { button.disabled = !on; }); }
  function clear(message) { current = null; results.hidden = true; enable(false); if (message) status.textContent = message; }
  function summary() { return root.dataset.pdfTitle + "\n" + root.dataset.basisLabel + ": " + money(current.taxableBasis) + "\n" + root.dataset.dutyLabel + ": " + money(current.duty) + "\n" + root.dataset.rateLabel + ": " + percent(current.effectiveRate); }
  function focusFor(code) {
    var id = code === "invalid_fair_value" ? "td-fair" : code === "invalid_other" ? "td-other" : code === "unsupported_date" ? "td-date" : "td-consideration";
    document.getElementById(id).focus();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var result = engine.calculate(input());
    if (!result.ok) {
      clear();
      error.textContent = result.error === "invalid_consideration" ? copy.consideration : result.error === "invalid_fair_value" ? copy.fair : result.error === "invalid_other" ? copy.other : result.error === "unsupported_date" ? copy.date : copy.consideration;
      focusFor(result.error);
      return;
    }
    current = result;
    error.textContent = "";
    [["td-duty", money(result.duty)], ["td-basis", money(result.taxableBasis)], ["td-rate", percent(result.effectiveRate)], ["td-total", money(result.totalCashIncludingDuty)], ["td-consideration-total", money(result.totalConsideration)], ["td-fair-result", money(result.fairValue)], ["td-bracket", percent(result.bracket.rate)], ["td-offset", money(result.bracket.offset)]].forEach(function (pair) { document.getElementById(pair[0]).textContent = pair[1]; });
    document.getElementById("td-boundary").textContent = result.vatStatus === "vat" ? copy.vat : copy.boundary;
    results.hidden = false;
    enable(true);
    status.textContent = copy.ready;
    results.focus({ preventScroll: true });
  });
  form.addEventListener("input", function () { if (current) clear(copy.changed); });
  form.addEventListener("change", function () { if (current) clear(copy.changed); });
  document.getElementById("td-reset").addEventListener("click", function () { form.reset(); clear(); error.textContent = ""; status.textContent = copy.reset; document.getElementById("td-date").focus(); });

  function csvCell(cell) { var text = String(cell); if (/^[=+\-@]/.test(text)) text = "'" + text; return '"' + text.replace(/"/g, '""') + '"'; }
  function download(name, type, content) { var url = URL.createObjectURL(new Blob([content], { type: type })); var anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url); status.textContent = copy.exported; }
  document.getElementById("td-copy").addEventListener("click", function () { var done = function () { status.textContent = copy.copied; }; navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(summary()).then(done).catch(function () { window.prompt(root.dataset.copyPrompt, summary()); done(); }) : (window.prompt(root.dataset.copyPrompt, summary()), done()); });
  document.getElementById("td-csv").addEventListener("click", function () { download(copy.csvName, "text/csv;charset=utf-8", [[copy.item, copy.value], ["agreement_date", current.agreementDate], ["consideration", current.consideration], ["other_consideration", current.otherConsideration], ["fair_value", current.fairValue], ["taxable_basis", current.taxableBasis], ["transfer_duty", current.duty], ["effective_rate", current.effectiveRate], ["vat_status", current.vatStatus]].map(function (row) { return row.map(csvCell).join(","); }).join("\n")); });
  document.getElementById("td-json").addEventListener("click", function () { download(copy.jsonName, "application/json", JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), privacy: copy.privacy, estimate: current }, null, 2)); });
  document.getElementById("td-pdf").addEventListener("click", async function () { if (window.AfroTools && window.AfroTools.pdf) { await window.AfroTools.pdf.generate({ toolId: "za-transfer-duty", category: "finance", title: root.dataset.pdfTitle, subtitle: engine.RULES.scheme + " · " + copy.agreement + " " + current.agreementDate, noGate: true, skipGate: true, heroStats: [[root.dataset.dutyLabel, money(current.duty)], [root.dataset.basisLabel, money(current.taxableBasis)], [root.dataset.rateLabel, percent(current.effectiveRate)]], sections: [{ title: root.dataset.inputTitle, rows: [[root.dataset.considerationLabel, money(current.consideration)], [root.dataset.otherLabel, money(current.otherConsideration)], [root.dataset.fairLabel, money(current.fairValue)], [root.dataset.vatLabel, current.vatStatus === "vat" ? copy.vatYes : copy.vatNot]] }], source: engine.RULES.source + " · reviewed " + engine.RULES.verifiedThrough, disclaimer: root.dataset.pdfDisclaimer }); status.textContent = copy.exported; } else window.print(); });
  results.setAttribute("tabindex", "-1");
  clear();
})();
