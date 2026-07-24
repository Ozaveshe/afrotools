(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.ERSalesTaxEngine;
  var locale = window.ERVatLocale || {};
  if (!engine) return;
  var id = function (value) { return document.getElementById(value); };
  var state = { mode: "add", result: null };
  function t(key, fallback) { return locale[key] || fallback; }
  function money(value) {
    return new Intl.NumberFormat(locale.numberLocale || "en-ER", {
      style: "currency", currency: "ERN", maximumFractionDigits: 2,
    }).format(value);
  }
  function evidenceType() {
    var treatment = engine.TREATMENTS[id("ervTreatment").value];
    return treatment ? treatment.evidenceType : null;
  }
  function calculate() {
    try {
      state.result = engine.calculate({
        amount: id("ervAmount").value,
        mode: state.mode,
        rateKind: id("ervTreatment").value,
        rateEvidenceConfirmed: id("ervEvidence").checked,
        rateEvidenceType: evidenceType(),
      });
      id("ervError").textContent = "";
      id("ervMain").textContent = money(state.mode === "add" ? state.result.gross : state.result.net);
      id("ervNet").textContent = money(state.result.net);
      id("ervTax").textContent = money(state.result.tax);
      id("ervGross").textContent = money(state.result.gross);
      id("ervRate").textContent = state.result.rate + "%";
      id("ervResult").classList.add("on");
      id("ervStatus").textContent = t("calculated", "Historical reference estimate updated locally.");
    } catch (error) {
      state.result = null;
      id("ervResult").classList.remove("on");
      id("ervError").textContent = error && error.code === "RATE_EVIDENCE_REQUIRED"
        ? t("evidenceRequired", "Confirm an exact schedule or service-list match before calculating.")
        : t("invalid", "Enter a non-negative amount.");
      id("ervStatus").textContent = id("ervError").textContent;
    }
  }
  document.querySelectorAll("[data-erv-mode]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.mode = button.dataset.ervMode;
      document.querySelectorAll("[data-erv-mode]").forEach(function (item) {
        item.setAttribute("aria-pressed", String(item === button));
      });
      calculate();
    });
  });
  id("ervForm").addEventListener("submit", function (event) { event.preventDefault(); calculate(); });
  id("ervAmount").addEventListener("input", calculate);
  id("ervTreatment").addEventListener("change", function () { id("ervEvidence").checked = false; calculate(); });
  id("ervEvidence").addEventListener("change", calculate);
  id("ervShare").addEventListener("click", async function () {
    try {
      var url = location.origin + location.pathname;
      if (navigator.share) await navigator.share({ title: document.title, url: url });
      else if (navigator.clipboard) await navigator.clipboard.writeText(url);
      id("ervStatus").textContent = t("shared", "Tool link shared without amounts.");
    } catch (error) {
      if (!error || error.name !== "AbortError") id("ervStatus").textContent = t("shareFailed", "Could not share the link.");
    }
  });
  id("ervPdf").addEventListener("click", function () {
    if (!state.result) calculate();
    if (!state.result || !window.jspdf || !window.jspdf.jsPDF) {
      id("ervStatus").textContent = t("pdfFailed", "PDF export is unavailable until exact evidence is confirmed.");
      return;
    }
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(19);
    doc.text(t("pdfTitle", "Eritrea sales-tax historical reference"), 48, 62);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(t("pdfSource", "Authoritative public summary as of December 2002; reviewed 22 July 2026."), 48, 82);
    [[t("net", "Amount before tax"), state.result.net], [t("tax", "Sales tax"), state.result.tax], [t("gross", "Total"), state.result.gross]].forEach(function (row, index) {
      doc.text(row[0], 48, 120 + index * 28); doc.setFont("helvetica", "bold");
      doc.text("ERN " + row[1].toFixed(2), 300, 120 + index * 28); doc.setFont("helvetica", "normal");
    });
    doc.text(doc.splitTextToSize(t("pdfDisclaimer", "Historical planning reference only. This does not confirm a current rate, liability, filing or payment. Check current law with Eritrea's Ministry of Finance or a qualified adviser."), 500), 48, 225);
    doc.save("eritrea-sales-tax-reference.pdf");
    id("ervStatus").textContent = t("pdfReady", "PDF downloaded locally.");
  });
  window.ERVatApp = { calculate: calculate, getResult: function () { return state.result; } };
  calculate();
})();
