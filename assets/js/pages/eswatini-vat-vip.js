(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.SZVatEngine;
  if (!engine) return;
  var locale = window.SZVatLocale || {};
  var state = { mode: "add", rateKind: "standard", result: null };
  function id(value) { return document.getElementById(value); }
  function t(key, fallback) { return locale[key] || fallback; }
  function money(value) {
    return "E " + new Intl.NumberFormat(locale.numberLocale || "en-SZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
  function showEvidence() {
    var needed = state.rateKind !== "standard";
    id("szvEvidenceWrap").hidden = !needed;
    if (!needed) id("szvEvidence").checked = false;
  }
  function clearResult(message) {
    state.result = null;
    id("szvResult").classList.remove("on");
    id("szvError").textContent = message;
    id("szvStatus").textContent = message;
  }
  function calculate() {
    try {
      state.result = engine.calculate({
        amount: id("szvAmount").value,
        mode: state.mode,
        rateKind: state.rateKind,
        rateEvidenceConfirmed: id("szvEvidence").checked,
        rateEvidenceType: state.rateKind === "second-schedule-zero-confirmed" ? engine.ZERO_EVIDENCE : null,
      });
      id("szvError").textContent = "";
      id("szvMain").textContent = money(state.mode === "add" ? state.result.gross : state.result.net);
      id("szvNet").textContent = money(state.result.net);
      id("szvVat").textContent = money(state.result.vat);
      id("szvGross").textContent = money(state.result.gross);
      id("szvRate").textContent = state.result.rate + "%";
      id("szvResult").classList.add("on");
      id("szvStatus").textContent = t("calculated", "Estimate updated locally.");
    } catch (error) {
      clearResult(error && error.code === "RATE_EVIDENCE_REQUIRED"
        ? t("evidenceRequired", "Confirm an exact current Second Schedule match before using 0%.")
        : t("invalid", "Enter a non-negative amount."));
    }
  }
  document.querySelectorAll("[data-szv-mode]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.mode = button.dataset.szvMode;
      document.querySelectorAll("[data-szv-mode]").forEach(function (item) { item.setAttribute("aria-pressed", String(item === button)); });
      calculate();
    });
  });
  document.querySelectorAll("[data-szv-rate]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.rateKind = button.dataset.szvRate;
      document.querySelectorAll("[data-szv-rate]").forEach(function (item) { item.setAttribute("aria-pressed", String(item === button)); });
      showEvidence();
      calculate();
    });
  });
  id("szvForm").addEventListener("submit", function (event) { event.preventDefault(); calculate(); });
  id("szvAmount").addEventListener("input", calculate);
  id("szvEvidence").addEventListener("change", calculate);
  id("szvClassification").addEventListener("change", function (event) {
    var result = engine.classify(event.target.value);
    id("szvClassificationResult").className = "szv-treatment " + result.treatment;
    id("szvClassificationResult").textContent = t("classification_" + event.target.value, result.note);
  });
  id("szvShare").addEventListener("click", async function () {
    try {
      var url = location.origin + location.pathname;
      if (navigator.share) await navigator.share({ title: document.title, url: url });
      else if (navigator.clipboard) await navigator.clipboard.writeText(url);
      id("szvStatus").textContent = t("shared", "Tool link shared without amounts.");
    } catch (error) {
      if (error && error.name !== "AbortError") id("szvStatus").textContent = t("shareFailed", "Could not share the link.");
    }
  });
  id("szvPdf").addEventListener("click", function () {
    if (!state.result) calculate();
    if (!state.result || !window.jspdf || !window.jspdf.jsPDF) {
      id("szvStatus").textContent = t("pdfFailed", "PDF export is unavailable.");
      return;
    }
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(18); doc.text(t("pdfTitle", "Eswatini VAT estimate"), 48, 60);
    doc.setFontSize(11);
    doc.text(t("net", "Amount before tax") + ": " + money(state.result.net), 48, 105);
    doc.text("VAT: " + money(state.result.vat), 48, 130);
    doc.text(t("gross", "Total including tax") + ": " + money(state.result.gross), 48, 155);
    doc.text(t("rate", "Applied rate") + ": " + state.result.rate + "%", 48, 180);
    doc.text(doc.splitTextToSize(t("pdfDisclaimer", "Planning estimate only. Confirm classification, evidence, registration, invoice, filing and payment with ERS or a qualified adviser."), 500), 48, 225);
    doc.save("eswatini-vat-estimate.pdf");
    id("szvStatus").textContent = t("pdfReady", "PDF downloaded locally.");
  });
  window.SZVatApp = { calculate: calculate, getResult: function () { return state.result; } };
  showEvidence(); calculate(); id("szvStatus").textContent = "";
})();
