(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.BWVatEngine;
  var locale = window.BWVatLocale || {};
  if (!engine) return;
  var byId = function (id) { return document.getElementById(id); };
  var state = { mode: "add", rateKind: "standard", result: null };

  function text(key, fallback) { return locale[key] || fallback; }
  function money(value) {
    return new Intl.NumberFormat(locale.numberLocale || "en-BW", { style: "currency", currency: "BWP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
  function pressed(selector, active) {
    document.querySelectorAll(selector).forEach(function (button) { button.setAttribute("aria-pressed", String(button === active)); });
  }
  function calculate() {
    try {
      state.result = engine.calculate({ amount: byId("bwvAmount").value, mode: state.mode, rateKind: state.rateKind });
      byId("bwvError").textContent = "";
      byId("bwvMain").textContent = money(state.mode === "add" ? state.result.gross : state.result.net);
      byId("bwvNet").textContent = money(state.result.net);
      byId("bwvVat").textContent = money(state.result.vat);
      byId("bwvGross").textContent = money(state.result.gross);
      byId("bwvRate").textContent = state.result.rate.toFixed(state.result.rate % 1 ? 2 : 0) + "%";
      byId("bwvResultLabel").textContent = state.mode === "add" ? text("grossResult", "Total including VAT") : text("netResult", "Amount before VAT");
      byId("bwvResultNote").textContent = state.rateKind === "confirmed-zero" ? text("zeroNote", "Use 0% only after confirming that the supply is zero-rated under the current law.") : text("standardNote", "Botswana standard-rate estimate at 14%.");
      byId("bwvResult").classList.add("on");
      byId("bwvStatus").textContent = text("calculated", "Botswana VAT estimate updated locally.");
    } catch (caught) {
      state.result = null;
      byId("bwvResult").classList.remove("on");
      byId("bwvError").textContent = text("invalid", "Enter a non-negative amount.");
      byId("bwvStatus").textContent = byId("bwvError").textContent;
    }
  }
  document.querySelectorAll("[data-bwv-mode]").forEach(function (button) {
    button.addEventListener("click", function () { state.mode = button.dataset.bwvMode; pressed("[data-bwv-mode]", button); calculate(); });
  });
  document.querySelectorAll("[data-bwv-rate]").forEach(function (button) {
    button.addEventListener("click", function () { state.rateKind = button.dataset.bwvRate; pressed("[data-bwv-rate]", button); calculate(); });
  });
  byId("bwvForm").addEventListener("submit", function (event) { event.preventDefault(); calculate(); });
  byId("bwvAmount").addEventListener("input", calculate);
  byId("bwvInvoiceForm").addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      var invoice = engine.calculateInvoice([{ description: byId("bwvDescription").value, quantity: byId("bwvQuantity").value, unitPrice: byId("bwvUnitPrice").value }], { rateKind: state.rateKind });
      byId("bwvInvoiceError").textContent = "";
      byId("bwvInvoiceNet").textContent = money(invoice.net);
      byId("bwvInvoiceVat").textContent = money(invoice.vat);
      byId("bwvInvoiceGross").textContent = money(invoice.gross);
      byId("bwvInvoiceResult").classList.add("on");
    } catch (caught) {
      byId("bwvInvoiceResult").classList.remove("on");
      byId("bwvInvoiceError").textContent = text("invalidInvoice", "Enter a non-negative quantity and unit price.");
    }
  });
  byId("bwvRegistrationForm").addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      var result = engine.registration(byId("bwvTurnover").value);
      byId("bwvRegistrationError").textContent = "";
      byId("bwvRegistrationResult").textContent = text("registration_" + result.status, result.status);
    } catch (caught) {
      byId("bwvRegistrationError").textContent = text("invalid", "Enter a non-negative amount.");
    }
  });
  byId("bwvClassification").addEventListener("change", function (event) {
    var result = engine.classify(event.target.value);
    byId("bwvClassificationResult").className = "bwv-treatment " + result.treatment;
    byId("bwvClassificationResult").textContent = text("classification_" + event.target.value, result.source);
  });
  byId("bwvShare").addEventListener("click", async function () {
    var route = location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url: route });
      else if (navigator.clipboard) await navigator.clipboard.writeText(route);
      byId("bwvStatus").textContent = text("shared", "Tool link shared. No amounts were included.");
    } catch (caught) {
      if (caught && caught.name !== "AbortError") byId("bwvStatus").textContent = text("shareFailed", "Could not share the tool link.");
    }
  });
  byId("bwvPdf").addEventListener("click", function () {
    if (!state.result) calculate();
    if (!state.result || !window.jspdf || !window.jspdf.jsPDF) return;
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.text(text("pdfTitle", "Botswana VAT planning estimate"), 48, 62);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(text("pdfSource", "BURS and Botswana Government sources reviewed 22 July 2026."), 48, 82);
    [[text("net", "Amount before VAT"), "BWP " + state.result.net.toFixed(2)], [text("vat", "VAT"), "BWP " + state.result.vat.toFixed(2)], [text("gross", "Total including VAT"), "BWP " + state.result.gross.toFixed(2)], [text("rateUsed", "Rate used"), state.result.rate.toFixed(2) + "%"]].forEach(function (row, index) {
      var y = 120 + index * 27; doc.setFont("helvetica", "normal"); doc.text(row[0], 48, y); doc.setFont("helvetica", "bold"); doc.text(row[1], 280, y);
    });
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(doc.splitTextToSize(text("pdfDisclaimer", "Planning estimate only. Confirm classification, registration, invoicing, digital-services treatment, filing and payment with BURS or a qualified adviser."), 500), 48, 255);
    doc.save("botswana-vat-estimate.pdf");
    byId("bwvStatus").textContent = text("pdfReady", "PDF downloaded locally.");
  });
  window.BWVatApp = { calculate: calculate, getResult: function () { return state.result; } };
  calculate();
})();
