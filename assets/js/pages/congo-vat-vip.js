(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.CGVatEngine;
  var locale = window.CGVatLocale || {};
  if (!engine) return;
  if (!document.querySelector('link[href="/assets/css/congo-vat-reflow.css"]')) {
    var reflowStyles = document.createElement("link");
    reflowStyles.rel = "stylesheet";
    reflowStyles.href = "/assets/css/congo-vat-reflow.css";
    document.head.appendChild(reflowStyles);
  }
  var id = function (value) { return document.getElementById(value); };
  var state = { mode: "add", rateKind: "standard", result: null };
  function t(key, fallback) { return locale[key] || fallback; }
  function money(value) { return new Intl.NumberFormat(locale.numberLocale || "fr-CG", { style: "currency", currency: "XAF", maximumFractionDigits: 2 }).format(value); }
  function evidenceFor(kind) {
    if (kind === "annex-5-confirmed") return "annex-5-tariff-line";
    if (kind === "article-22-zero-confirmed") return "article-22-zero-case";
    return null;
  }
  function showEvidence() {
    var needed = state.rateKind !== "standard";
    id("cgvEvidenceWrap").hidden = !needed;
    if (!needed) id("cgvEvidence").checked = false;
  }
  function calculate() {
    try {
      state.result = engine.calculate({ amount: id("cgvAmount").value, mode: state.mode, rateKind: state.rateKind,
        rateEvidenceConfirmed: id("cgvEvidence").checked, rateEvidenceType: evidenceFor(state.rateKind) });
      id("cgvError").textContent = "";
      id("cgvMain").textContent = money(state.mode === "add" ? state.result.gross : state.result.net);
      id("cgvNet").textContent = money(state.result.net);
      id("cgvVat").textContent = money(state.result.vat);
      id("cgvCentimes").textContent = money(state.result.centimes);
      id("cgvTax").textContent = money(state.result.totalTax);
      id("cgvGross").textContent = money(state.result.gross);
      id("cgvRate").textContent = state.result.effectiveRate + "%";
      id("cgvResult").classList.add("on");
      id("cgvStatus").textContent = t("calculated", "Estimate updated locally.");
    } catch (error) {
      state.result = null; id("cgvResult").classList.remove("on");
      id("cgvError").textContent = error && error.code === "RATE_EVIDENCE_REQUIRED" ? t("evidenceRequired", "Confirm the exact legal evidence before using this treatment.") : t("invalid", "Enter a non-negative amount.");
      id("cgvStatus").textContent = id("cgvError").textContent;
    }
  }
  document.querySelectorAll("[data-cgv-mode]").forEach(function (button) {
    button.addEventListener("click", function () { state.mode = button.dataset.cgvMode; document.querySelectorAll("[data-cgv-mode]").forEach(function (item) { item.setAttribute("aria-pressed", String(item === button)); }); calculate(); });
  });
  document.querySelectorAll("[data-cgv-rate]").forEach(function (button) {
    button.addEventListener("click", function () { state.rateKind = button.dataset.cgvRate; document.querySelectorAll("[data-cgv-rate]").forEach(function (item) { item.setAttribute("aria-pressed", String(item === button)); }); showEvidence(); calculate(); });
  });
  id("cgvForm").addEventListener("submit", function (event) { event.preventDefault(); calculate(); });
  id("cgvAmount").addEventListener("input", calculate);
  id("cgvEvidence").addEventListener("change", calculate);
  id("cgvClassification").addEventListener("change", function (event) { var result = engine.classify(event.target.value); id("cgvClassificationResult").className = "cgv-treatment " + result.treatment; id("cgvClassificationResult").textContent = t("classification_" + event.target.value, result.note); });
  id("cgvTurnoverForm").addEventListener("submit", function (event) {
    event.preventDefault();
    try { var result = engine.registrationScreen(id("cgvTurnover").value); id("cgvTurnoverError").textContent = ""; id("cgvTurnoverResult").textContent = result.status === "real-regime-review" ? t("realReview", "At or above XAF 100m: review the real regime and VAT obligations with DGI.") : t("forfaitReview", "Below XAF 100m: review the forfait and activity-specific rules with DGI. This is not an exemption verdict."); }
    catch (error) { id("cgvTurnoverError").textContent = t("invalidTurnover", "Enter non-negative annual turnover."); }
  });
  id("cgvShare").addEventListener("click", async function () { try { var url = location.origin + location.pathname; if (navigator.share) await navigator.share({ title: document.title, url: url }); else if (navigator.clipboard) await navigator.clipboard.writeText(url); id("cgvStatus").textContent = t("shared", "Tool link shared without amounts."); } catch (error) { if (error && error.name !== "AbortError") id("cgvStatus").textContent = t("shareFailed", "Could not share the link."); } });
  id("cgvPdf").addEventListener("click", function () {
    if (!state.result) calculate();
    if (!state.result || !window.jspdf || !window.jspdf.jsPDF) { id("cgvStatus").textContent = t("pdfFailed", "PDF export is unavailable."); return; }
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(19); doc.text(t("pdfTitle", "Congo VAT planning estimate"), 48, 62);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(t("pdfSource", "Official Journal finance-law sources reviewed 22 July 2026."), 48, 82);
    [[t("net", "Amount before tax"), state.result.net], ["VAT " + state.result.vatRate + "%", state.result.vat], [t("centimes", "Additional centimes (5% of VAT)"), state.result.centimes], [t("totalTax", "Total tax"), state.result.totalTax], [t("gross", "Total including tax"), state.result.gross]].forEach(function (row, index) { doc.text(row[0], 48, 120 + index * 27); doc.setFont("helvetica", "bold"); doc.text("XAF " + row[1].toFixed(2), 300, 120 + index * 27); doc.setFont("helvetica", "normal"); });
    doc.text(doc.splitTextToSize(t("pdfDisclaimer", "Planning estimate only. Confirm tariff classification, evidence, registration, filing and payment with DGI."), 500), 48, 285);
    doc.save("congo-vat-estimate.pdf"); id("cgvStatus").textContent = t("pdfReady", "PDF downloaded locally.");
  });
  window.CGVatApp = { calculate: calculate, getResult: function () { return state.result; } };
  showEvidence(); calculate();
})();
