(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.DZVatEngine,
    locale = window.DZVatLocale || {};
  if (!engine) return;
  var state = { mode: "add", rateKind: "standard", result: null },
    byId = function (id) { return document.getElementById(id); },
    amount = byId("dzvAmount"),
    custom = byId("dzvCustomRate"),
    status = byId("dzvStatus"),
    error = byId("dzvError");
  function text(key, fallback) { return locale[key] || fallback; }
  function money(value) {
    return new Intl.NumberFormat(locale.numberLocale || "en-DZ", {
      style: "currency", currency: "DZD", minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  function pressed(selector, active) {
    document.querySelectorAll(selector).forEach(function (button) {
      button.setAttribute("aria-pressed", String(button === active));
    });
  }
  function currentInput() {
    return { amount: amount.value, mode: state.mode, rateKind: state.rateKind,
      rate: state.rateKind === "scenario" ? custom.value : undefined };
  }
  function calculate() {
    try {
      state.result = engine.calculate(currentInput());
      error.textContent = "";
      byId("dzvMain").textContent = money(state.mode === "add" ? state.result.gross : state.result.net);
      byId("dzvNet").textContent = money(state.result.net);
      byId("dzvVat").textContent = money(state.result.vat);
      byId("dzvGross").textContent = money(state.result.gross);
      byId("dzvRate").textContent = state.result.rate.toFixed(state.result.rate % 1 ? 2 : 0) + "%";
      byId("dzvResultLabel").textContent = state.mode === "add" ? text("grossResult", "Total including VAT") : text("netResult", "Amount before VAT");
      byId("dzvResultNote").textContent = state.rateKind === "scenario"
        ? text("scenarioNote", "Planning scenario only; this is not a statutory rate claim.")
        : state.rateKind === "reduced"
          ? text("reducedNote", "Use 9% only after confirming article 23 applies to the operation.")
          : text("standardNote", "Algeria normal-rate estimate at 19%.");
      byId("dzvResult").classList.add("on");
      status.textContent = text("calculated", "Algeria VAT estimate updated.");
    } catch (caught) {
      state.result = null;
      byId("dzvResult").classList.remove("on");
      error.textContent = text("invalid", "Enter a non-negative amount and a rate from 0% to 100%.");
      status.textContent = error.textContent;
    }
  }
  document.querySelectorAll("[data-mode]").forEach(function (button) {
    button.addEventListener("click", function () { state.mode = button.dataset.mode; pressed("[data-mode]", button); calculate(); });
  });
  document.querySelectorAll("[data-rate-kind]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.rateKind = button.dataset.rateKind;
      byId("dzvScenario").classList.toggle("on", state.rateKind === "scenario");
      pressed("[data-rate-kind]", button); calculate();
    });
  });
  byId("dzvForm").addEventListener("submit", function (event) { event.preventDefault(); calculate(); });
  amount.addEventListener("input", calculate);
  custom.addEventListener("input", function () { if (state.rateKind === "scenario") calculate(); });
  byId("dzvInvoiceForm").addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      var invoice = engine.calculateInvoice([{ description: byId("dzvDescription").value,
        quantity: byId("dzvQuantity").value, unitPrice: byId("dzvUnitPrice").value }], currentInput());
      byId("dzvInvoiceError").textContent = "";
      byId("dzvInvoiceNet").textContent = money(invoice.net);
      byId("dzvInvoiceVat").textContent = money(invoice.vat);
      byId("dzvInvoiceGross").textContent = money(invoice.gross);
      byId("dzvInvoiceResult").classList.add("on");
    } catch (caught) {
      byId("dzvInvoiceResult").classList.remove("on");
      byId("dzvInvoiceError").textContent = text("invalidInvoice", "Enter a non-negative quantity and unit price.");
    }
  });
  byId("dzvClassification").addEventListener("change", function (event) {
    var treatment = engine.classify(event.target.value), box = byId("dzvClassificationResult");
    box.className = "dzv-treatment " + treatment.treatment;
    box.innerHTML = "";
    var strong = document.createElement("strong"), span = document.createElement("span");
    strong.textContent = text("treatment_" + treatment.treatment, treatment.treatment);
    span.textContent = text("source_" + event.target.value, treatment.source) + " · " + text("classificationCaveat", "Confirm the exact provision before relying on this guide.");
    box.append(strong, span);
  });
  byId("dzvRegime").addEventListener("change", function (event) {
    var result = engine.regime(event.target.value);
    byId("dzvRegimeResult").textContent = text("regime_" + result.status, result.status);
  });
  byId("dzvShare").addEventListener("click", async function () {
    var route = location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url: route });
      else if (navigator.clipboard) await navigator.clipboard.writeText(route);
      status.textContent = text("shared", "Tool link shared. No amounts were included.");
    } catch (caught) { if (caught && caught.name !== "AbortError") status.textContent = text("shareFailed", "Could not share the tool link."); }
  });
  byId("dzvPdf").addEventListener("click", function () {
    if (!state.result) calculate();
    if (!state.result || !window.jspdf || !window.jspdf.jsPDF) return;
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" }), rows;
    doc.setFont("helvetica", "bold"); doc.setFontSize(20);
    doc.text(text("pdfTitle", "Algeria VAT planning estimate"), 48, 62);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(text("pdfSource", "DGI Algeria VAT guidance and 2026 TCA Code; reviewed 22 July 2026."), 48, 82);
    rows = [[text("pdfMode", "Mode"), state.mode === "add" ? text("addVat", "Add VAT") : text("extractVat", "Extract VAT")],
      [text("net", "Amount before VAT"), "DZD " + state.result.net.toFixed(2)],
      [text("vat", "VAT"), "DZD " + state.result.vat.toFixed(2)],
      [text("gross", "Total including VAT"), "DZD " + state.result.gross.toFixed(2)],
      [text("rateUsed", "Rate used"), state.result.rate.toFixed(2) + "%"]];
    doc.setFontSize(11);
    rows.forEach(function (row, index) { var y = 120 + index * 27; doc.setFont("helvetica", "normal"); doc.text(row[0], 48, y); doc.setFont("helvetica", "bold"); doc.text(row[1], 280, y); });
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(doc.splitTextToSize(text("pdfDisclaimer", "Planning estimate only. Confirm the applicable rate, regime, deductions, invoicing and filing with DGI or a qualified tax adviser."), 500), 48, 285);
    doc.save("algeria-vat-estimate.pdf");
    status.textContent = text("pdfReady", "PDF downloaded locally.");
  });
  window.DZVatApp = { calculate: calculate, getResult: function () { return state.result; } };
  calculate();
})();
