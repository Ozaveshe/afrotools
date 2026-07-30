(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.ETVatEngine;
  if (!engine) return;
  var locale = window.ETVatLocale || {};
  var state = { mode: "add", rateKind: "standard", result: null };
  function id(value) { return document.getElementById(value); }
  function t(key, fallback) { return locale[key] || fallback; }
  function money(value) {
    return new Intl.NumberFormat(locale.numberLocale || "en-ET", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + " ETB";
  }
  function showEvidence() {
    var needed = state.rateKind !== "standard";
    id("etvEvidenceWrap").hidden = !needed;
    if (!needed) id("etvEvidence").checked = false;
  }
  function calculate() {
    try {
      state.result = engine.calculate({
        amount: id("etvAmount").value,
        mode: state.mode,
        rateKind: state.rateKind,
        rateEvidenceConfirmed: id("etvEvidence").checked,
        rateEvidenceType: state.rateKind === "schedule-one-zero-confirmed" ? engine.ZERO_EVIDENCE : null,
      });
      id("etvError").textContent = "";
      id("etvMain").textContent = money(state.mode === "add" ? state.result.gross : state.result.net);
      id("etvNet").textContent = money(state.result.net);
      id("etvVat").textContent = money(state.result.vat);
      id("etvGross").textContent = money(state.result.gross);
      id("etvRate").textContent = state.result.rate + "%";
      id("etvResult").classList.add("on");
      id("etvStatus").textContent = t("calculated", "Estimate updated locally.");
    } catch (error) {
      state.result = null;
      id("etvResult").classList.remove("on");
      id("etvError").textContent = error && error.code === "RATE_EVIDENCE_REQUIRED"
        ? t("evidenceRequired", "Confirm the exact Schedule 1 match before using 0%.")
        : t("invalid", "Enter a non-negative amount.");
      id("etvStatus").textContent = id("etvError").textContent;
    }
  }
  document.querySelectorAll("[data-etv-mode]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.mode = button.dataset.etvMode;
      document.querySelectorAll("[data-etv-mode]").forEach(function (item) { item.setAttribute("aria-pressed", String(item === button)); });
      calculate();
    });
  });
  document.querySelectorAll("[data-etv-rate]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.rateKind = button.dataset.etvRate;
      document.querySelectorAll("[data-etv-rate]").forEach(function (item) { item.setAttribute("aria-pressed", String(item === button)); });
      showEvidence();
      calculate();
    });
  });
  id("etvForm").addEventListener("submit", function (event) { event.preventDefault(); calculate(); });
  id("etvAmount").addEventListener("input", calculate);
  id("etvEvidence").addEventListener("change", calculate);
  id("etvClassification").addEventListener("change", function (event) {
    var result = engine.classify(event.target.value);
    id("etvClassificationResult").className = "etv-treatment " + result.treatment;
    id("etvClassificationResult").textContent = t("classification_" + event.target.value, result.note);
  });
  id("etvShare").addEventListener("click", async function () {
    try {
      var url = location.origin + location.pathname;
      if (navigator.share) await navigator.share({ title: document.title, url: url });
      else if (navigator.clipboard) await navigator.clipboard.writeText(url);
      id("etvStatus").textContent = t("shared", "Tool link shared without amounts.");
    } catch (error) {
      if (error && error.name !== "AbortError") id("etvStatus").textContent = t("shareFailed", "Could not share the link.");
    }
  });
  id("etvPdf").addEventListener("click", function () {
    if (!state.result) calculate();
    if (!state.result || !window.AfroTools || !window.AfroTools.localVatPdf) {
      id("etvStatus").textContent = t("pdfFailed", "PDF export is unavailable.");
      return;
    }
    window.AfroTools.localVatPdf({
      title: t("pdfTitle", "Ethiopia VAT estimate"),
      rows: [
        { label: t("net", "Amount before tax"), value: money(state.result.net) },
        { label: "VAT", value: money(state.result.vat) },
        { label: t("gross", "Total including tax"), value: money(state.result.gross) },
        { label: t("rate", "Applied rate"), value: state.result.rate + "%" },
      ],
      disclaimer: t("pdfDisclaimer", "Planning estimate only. Confirm classification, evidence, invoice treatment, registration, filing and payment with the Ministry of Revenue or a qualified adviser."),
      fileName: "ethiopia-vat-estimate.pdf",
    });
    id("etvStatus").textContent = t("pdfReady", "PDF downloaded locally.");
  });
  window.ETVatApp = { calculate: calculate, getResult: function () { return state.result; } };
  showEvidence();
  calculate();
  id("etvStatus").textContent = "";
})();
