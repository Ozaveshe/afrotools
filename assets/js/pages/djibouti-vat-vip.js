(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.DJVatEngine;
  var locale = window.DJVatLocale || {};
  if (!engine) return;
  var id = function (value) { return document.getElementById(value); };
  var state = { mode: "add", rateKind: "standard", result: null };
  function t(key, fallback) { return locale[key] || fallback; }
  function money(value) { return new Intl.NumberFormat(locale.numberLocale || "fr-DJ", { style: "currency", currency: "DJF", maximumFractionDigits: 0 }).format(value); }
  function evidenceFor(kind) {
    if (kind === "article-19-export-confirmed") return "customs-export-declaration";
    if (kind === "article-19-trade-confirmed") return "article-19-international-trade-proof";
    if (kind === "article-8-exempt-confirmed") return "article-8-exemption-item";
    return null;
  }
  function showEvidence() { var needed = state.rateKind !== "standard"; id("djvEvidenceWrap").hidden = !needed; if (!needed) id("djvEvidence").checked = false; }
  function calculate() {
    try {
      state.result = engine.calculate({ amount: id("djvAmount").value, mode: state.mode, rateKind: state.rateKind, rateEvidenceConfirmed: id("djvEvidence").checked, rateEvidenceType: evidenceFor(state.rateKind) });
      id("djvError").textContent = ""; id("djvMain").textContent = money(state.mode === "add" ? state.result.gross : state.result.net);
      id("djvNet").textContent = money(state.result.net); id("djvVat").textContent = money(state.result.vat); id("djvGross").textContent = money(state.result.gross); id("djvRate").textContent = state.result.rate + "%"; id("djvResult").classList.add("on"); id("djvStatus").textContent = t("calculated", "Estimate updated locally.");
    } catch (error) {
      state.result = null; id("djvResult").classList.remove("on"); id("djvError").textContent = error && error.code === "RATE_EVIDENCE_REQUIRED" ? t("evidenceRequired", "Confirm the exact statutory evidence before using this treatment.") : t("invalid", "Enter a non-negative amount."); id("djvStatus").textContent = id("djvError").textContent;
    }
  }
  document.querySelectorAll("[data-djv-mode]").forEach(function (button) { button.addEventListener("click", function () { state.mode = button.dataset.djvMode; document.querySelectorAll("[data-djv-mode]").forEach(function (item) { item.setAttribute("aria-pressed", String(item === button)); }); calculate(); }); });
  document.querySelectorAll("[data-djv-rate]").forEach(function (button) { button.addEventListener("click", function () { state.rateKind = button.dataset.djvRate; document.querySelectorAll("[data-djv-rate]").forEach(function (item) { item.setAttribute("aria-pressed", String(item === button)); }); showEvidence(); calculate(); }); });
  id("djvForm").addEventListener("submit", function (event) { event.preventDefault(); calculate(); }); id("djvAmount").addEventListener("input", calculate); id("djvEvidence").addEventListener("change", calculate);
  id("djvClassification").addEventListener("change", function (event) { var result = engine.classify(event.target.value); id("djvClassificationResult").className = "djv-treatment " + result.treatment; id("djvClassificationResult").textContent = t("classification_" + event.target.value, result.note); });
  id("djvTurnoverForm").addEventListener("submit", function (event) { event.preventDefault(); try { var result = engine.thresholdScreen(id("djvTurnover").value); id("djvTurnoverError").textContent = ""; id("djvTurnoverResult").textContent = t(result.status, result.status); } catch (error) { id("djvTurnoverError").textContent = t("invalidTurnover", "Enter non-negative annual turnover."); } });
  id("djvShare").addEventListener("click", async function () { try { var url = location.origin + location.pathname; if (navigator.share) await navigator.share({ title: document.title, url: url }); else if (navigator.clipboard) await navigator.clipboard.writeText(url); id("djvStatus").textContent = t("shared", "Tool link shared without amounts."); } catch (error) { if (error && error.name !== "AbortError") id("djvStatus").textContent = t("shareFailed", "Could not share the link."); } });
  id("djvPdf").addEventListener("click", function () {
    if (!state.result) calculate(); if (!state.result || !window.jspdf || !window.jspdf.jsPDF) { id("djvStatus").textContent = t("pdfFailed", "PDF export is unavailable."); return; }
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" }); doc.setFont("helvetica", "bold"); doc.setFontSize(19); doc.text(t("pdfTitle", "Djibouti VAT planning estimate"), 48, 62); doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(t("pdfSource", "Official Journal sources reviewed 22 July 2026."), 48, 82);
    [[t("net", "Amount before tax"), state.result.net], ["VAT " + state.result.rate + "%", state.result.vat], [t("gross", "Total including tax"), state.result.gross]].forEach(function (row, index) { doc.text(row[0], 48, 120 + index * 28); doc.setFont("helvetica", "bold"); doc.text("FDJ " + row[1].toFixed(0), 300, 120 + index * 28); doc.setFont("helvetica", "normal"); });
    doc.text(doc.splitTextToSize(t("pdfDisclaimer", "Planning estimate only. Confirm classification, evidence, registration, invoicing, filing and payment with DGI."), 500), 48, 225); doc.save("djibouti-vat-estimate.pdf"); id("djvStatus").textContent = t("pdfReady", "PDF downloaded locally.");
  });
  window.DJVatApp = { calculate: calculate, getResult: function () { return state.result; } }; showEvidence(); calculate();
})();
