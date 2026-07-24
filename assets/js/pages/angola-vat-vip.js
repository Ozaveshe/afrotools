(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.AOVatEngine,
    locale = window.AOVatLocale || {};
  if (!engine) return;
  var state = { mode: "add", rateKind: "standard", result: null },
    byId = function (id) { return document.getElementById(id); },
    amount = byId("aovAmount"), status = byId("aovStatus"), error = byId("aovError");
  function text(key, fallback) { return locale[key] || fallback; }
  function money(value) {
    return new Intl.NumberFormat(locale.numberLocale || "pt-AO", {
      style: "currency", currency: "AOA", minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(value);
  }
  function pressed(selector, active) {
    document.querySelectorAll(selector).forEach(function (button) {
      button.setAttribute("aria-pressed", String(button === active));
    });
  }
  function calculate() {
    try {
      state.result = engine.calculate({ amount: amount.value, mode: state.mode, rateKind: state.rateKind });
      error.textContent = "";
      byId("aovMain").textContent = money(state.mode === "add" ? state.result.gross : state.result.net);
      byId("aovNet").textContent = money(state.result.net);
      byId("aovVat").textContent = money(state.result.vat);
      byId("aovGross").textContent = money(state.result.gross);
      byId("aovRate").textContent = state.result.rate + "%";
      byId("aovResultLabel").textContent = state.mode === "add" ? text("grossResult", "Total including VAT") : text("netResult", "Amount before VAT");
      byId("aovResultNote").textContent = text("note_" + state.rateKind, "Confirm that the selected statutory treatment applies before invoicing.");
      byId("aovResult").classList.add("on");
      status.textContent = text("calculated", "Angola VAT estimate updated.");
    } catch (caught) {
      state.result = null;
      byId("aovResult").classList.remove("on");
      error.textContent = text("invalid", "Enter a non-negative amount.");
      status.textContent = error.textContent;
    }
  }
  document.querySelectorAll("[data-mode]").forEach(function (button) {
    button.addEventListener("click", function () { state.mode = button.dataset.mode; pressed("[data-mode]", button); calculate(); });
  });
  document.querySelectorAll("[data-rate-kind]").forEach(function (button) {
    button.addEventListener("click", function () { state.rateKind = button.dataset.rateKind; pressed("[data-rate-kind]", button); calculate(); });
  });
  byId("aovForm").addEventListener("submit", function (event) { event.preventDefault(); calculate(); });
  amount.addEventListener("input", calculate);
  byId("aovInvoiceForm").addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      var invoice = engine.calculateInvoice([{ description: byId("aovDescription").value, quantity: byId("aovQuantity").value, unitPrice: byId("aovUnitPrice").value }], { rateKind: state.rateKind });
      byId("aovInvoiceError").textContent = "";
      byId("aovInvoiceNet").textContent = money(invoice.net);
      byId("aovInvoiceVat").textContent = money(invoice.vat);
      byId("aovInvoiceGross").textContent = money(invoice.gross);
      byId("aovInvoiceResult").classList.add("on");
    } catch (caught) {
      byId("aovInvoiceResult").classList.remove("on");
      byId("aovInvoiceError").textContent = text("invalidInvoice", "Enter a non-negative quantity and unit price.");
    }
  });
  byId("aovClassification").addEventListener("change", function (event) {
    var result = engine.classify(event.target.value), box = byId("aovClassificationResult");
    box.className = "aov-treatment " + result.treatment;
    box.textContent = text("classification_" + event.target.value, "Confirm the exact Code provision before relying on this treatment.");
  });
  function checkRegime() {
    try {
      var result = engine.regime(byId("aovTurnover").value, byId("aovManufacturing").checked, byId("aovVoluntary").checked);
      byId("aovRegimeError").textContent = "";
      byId("aovRegimeResult").textContent = text("regime_" + result.status, result.status);
    } catch (caught) {
      byId("aovRegimeError").textContent = text("invalid", "Enter a non-negative amount.");
    }
  }
  byId("aovRegimeForm").addEventListener("submit", function (event) { event.preventDefault(); checkRegime(); });
  byId("aovCaptive").addEventListener("change", function (event) {
    if (!state.result) calculate();
    var result = engine.captive(state.result ? state.result.vat : 0, event.target.value);
    byId("aovCaptiveResult").textContent = result.eligible
      ? text("captiveEligible", "Statutory captive share of the calculated VAT: ") + money(result.captive) + " (" + result.percent + "%)."
      : text("captiveReview", "Do not apply imposto cativo unless the customer is an Article 21 entity and the operation is eligible.");
  });
  byId("aovShare").addEventListener("click", async function () {
    var route = location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url: route });
      else if (navigator.clipboard) await navigator.clipboard.writeText(route);
      status.textContent = text("shared", "Tool link shared. No amounts were included.");
    } catch (caught) {
      if (caught && caught.name !== "AbortError") status.textContent = text("shareFailed", "Could not share the tool link.");
    }
  });
  byId("aovPdf").addEventListener("click", function () {
    if (!state.result) calculate();
    if (!state.result || !window.jspdf || !window.jspdf.jsPDF) return;
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" }), rows;
    doc.setFont("helvetica", "bold"); doc.setFontSize(20);
    doc.text(text("pdfTitle", "Angola VAT planning estimate"), 48, 62);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(text("pdfSource", "Angola VAT Code (Lei 14/23); reviewed 22 July 2026."), 48, 82);
    rows = [[text("net", "Amount before VAT"), "AOA " + state.result.net.toFixed(2)], [text("vat", "VAT"), "AOA " + state.result.vat.toFixed(2)], [text("gross", "Total including VAT"), "AOA " + state.result.gross.toFixed(2)], [text("rateUsed", "Rate used"), state.result.rate.toFixed(2) + "%"]];
    doc.setFontSize(11);
    rows.forEach(function (row, index) { var y = 120 + index * 27; doc.setFont("helvetica", "normal"); doc.text(row[0], 48, y); doc.setFont("helvetica", "bold"); doc.text(row[1], 280, y); });
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(doc.splitTextToSize(text("pdfDisclaimer", "Planning estimate only. Confirm rate, regime, imposto cativo, invoicing and filing with AGT or a qualified tax adviser."), 500), 48, 255);
    doc.save("angola-vat-estimate.pdf");
    status.textContent = text("pdfReady", "PDF downloaded locally.");
  });
  window.AOVatApp = { calculate: calculate, getResult: function () { return state.result; } };
  calculate();
})();
