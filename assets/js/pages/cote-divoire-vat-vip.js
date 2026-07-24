(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.CIVatEngine;
  var locale = window.CIVatLocale || {};
  if (!engine) return;
  var id = function (value) { return document.getElementById(value); };
  var state = { mode: "add", rateKind: "standard", result: null };
  function t(key, fallback) { return locale[key] || fallback; }
  function money(value) { return new Intl.NumberFormat(locale.numberLocale || "fr-CI", { style: "currency", currency: "XOF", maximumFractionDigits: 2 }).format(value); }
  function evidenceFor(kind) {
    if (kind === "article-359-reduced-confirmed") return "cgi-article-359-item";
    if (kind === "ordinance-2026-reduced-confirmed") return "ordinance-2026-03-item";
    if (kind === "article-355-exempt-confirmed") return "cgi-article-355-item";
    return null;
  }
  function showEvidence() { var needed = state.rateKind !== "standard"; id("civEvidenceWrap").hidden = !needed; if (!needed) id("civEvidence").checked = false; }
  function calculate() {
    try {
      state.result = engine.calculate({ amount: id("civAmount").value, mode: state.mode, rateKind: state.rateKind,
        rateEvidenceConfirmed: id("civEvidence").checked, rateEvidenceType: evidenceFor(state.rateKind) });
      id("civError").textContent = ""; id("civMain").textContent = money(state.mode === "add" ? state.result.gross : state.result.net);
      id("civNet").textContent = money(state.result.net); id("civVat").textContent = money(state.result.vat);
      id("civGross").textContent = money(state.result.gross); id("civRate").textContent = state.result.rate + "%";
      id("civResult").classList.add("on"); id("civStatus").textContent = t("calculated", "Estimate updated locally.");
    } catch (error) {
      state.result = null; id("civResult").classList.remove("on");
      id("civError").textContent = error && error.code === "RATE_EVIDENCE_REQUIRED" ? t("evidenceRequired", "Confirm the exact legal item before using this treatment.") : t("invalid", "Enter a non-negative amount.");
      id("civStatus").textContent = id("civError").textContent;
    }
  }
  document.querySelectorAll("[data-civ-mode]").forEach(function (button) { button.addEventListener("click", function () { state.mode = button.dataset.civMode; document.querySelectorAll("[data-civ-mode]").forEach(function (item) { item.setAttribute("aria-pressed", String(item === button)); }); calculate(); }); });
  document.querySelectorAll("[data-civ-rate]").forEach(function (button) { button.addEventListener("click", function () { state.rateKind = button.dataset.civRate; document.querySelectorAll("[data-civ-rate]").forEach(function (item) { item.setAttribute("aria-pressed", String(item === button)); }); showEvidence(); calculate(); }); });
  id("civForm").addEventListener("submit", function (event) { event.preventDefault(); calculate(); }); id("civAmount").addEventListener("input", calculate); id("civEvidence").addEventListener("change", calculate);
  id("civClassification").addEventListener("change", function (event) { var result = engine.classify(event.target.value); id("civClassificationResult").className = "civ-treatment " + result.treatment; id("civClassificationResult").textContent = t("classification_" + event.target.value, result.note); });
  id("civTurnoverForm").addEventListener("submit", function (event) { event.preventDefault(); try { var result = engine.regimeScreen(id("civTurnover").value); id("civTurnoverError").textContent = ""; id("civTurnoverResult").textContent = t(result.status, result.status); } catch (error) { id("civTurnoverError").textContent = t("invalidTurnover", "Enter non-negative annual turnover."); } });
  id("civShare").addEventListener("click", async function () { try { var url = location.origin + location.pathname; if (navigator.share) await navigator.share({ title: document.title, url: url }); else if (navigator.clipboard) await navigator.clipboard.writeText(url); id("civStatus").textContent = t("shared", "Tool link shared without amounts."); } catch (error) { if (error && error.name !== "AbortError") id("civStatus").textContent = t("shareFailed", "Could not share the link."); } });
  id("civPdf").addEventListener("click", function () {
    if (!state.result) calculate(); if (!state.result || !window.jspdf || !window.jspdf.jsPDF) { id("civStatus").textContent = t("pdfFailed", "PDF export is unavailable."); return; }
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" }); doc.setFont("helvetica", "bold"); doc.setFontSize(19); doc.text(t("pdfTitle", "Côte d'Ivoire VAT planning estimate"), 48, 62);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(t("pdfSource", "DGI 2026 sources reviewed 22 July 2026."), 48, 82);
    [[t("net", "Amount before tax"), state.result.net], ["VAT " + state.result.rate + "%", state.result.vat], [t("gross", "Total including tax"), state.result.gross]].forEach(function (row, index) { doc.text(row[0], 48, 120 + index * 28); doc.setFont("helvetica", "bold"); doc.text("XOF " + row[1].toFixed(2), 300, 120 + index * 28); doc.setFont("helvetica", "normal"); });
    doc.text(doc.splitTextToSize(t("pdfDisclaimer", "Planning estimate only. Confirm classification, regime, invoice, filing and payment with DGI."), 500), 48, 225); doc.save("cote-divoire-vat-estimate.pdf"); id("civStatus").textContent = t("pdfReady", "PDF downloaded locally.");
  });
  window.CIVatApp = { calculate: calculate, getResult: function () { return state.result; } }; showEvidence(); calculate();
})();
