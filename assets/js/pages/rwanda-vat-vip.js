(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.RWVatEngine,
    locale = window.RWVatLocale || {};
  if (!engine) return;
  var state = { mode: "add", rateKind: "standard", result: null },
    byId = function (id) { return document.getElementById(id); },
    amount = byId("rwvAmount"),
    custom = byId("rwvCustomRate"),
    status = byId("rwvStatus"),
    error = byId("rwvError");
  function text(key, fallback) { return locale[key] || fallback; }
  function money(value) {
    return new Intl.NumberFormat(locale.numberLocale || "en-RW", {
      style: "currency", currency: "RWF", minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(value);
  }
  function pressed(selector, active) {
    document.querySelectorAll(selector).forEach(function (button) {
      button.setAttribute("aria-pressed", String(button === active));
    });
  }
  function input() {
    return { amount: amount.value, mode: state.mode, rateKind: state.rateKind, rate: state.rateKind === "scenario" ? custom.value : undefined };
  }
  function calculate() {
    try {
      state.result = engine.calculate(input());
      error.textContent = "";
      byId("rwvResultMain").textContent = money(state.mode === "add" ? state.result.gross : state.result.net);
      byId("rwvNet").textContent = money(state.result.net);
      byId("rwvVat").textContent = money(state.result.vat);
      byId("rwvGross").textContent = money(state.result.gross);
      byId("rwvRateUsed").textContent = state.result.rate.toFixed(state.result.rate % 1 ? 2 : 0) + "%";
      byId("rwvResultLabel").textContent = state.mode === "add" ? text("grossResult", "Total including VAT") : text("netResult", "Amount before VAT");
      byId("rwvResultNote").textContent = state.rateKind === "scenario"
        ? text("scenarioNote", "Planning scenario only. Confirm the legal treatment before use.")
        : state.rateKind === "zero"
          ? text("zeroNote", "Use 0% only after confirming Article 7 applies to this supply.")
          : text("standardNote", "Rwanda standard-rate estimate at 18%.");
      byId("rwvResult").classList.add("on");
      status.textContent = text("calculated", "Rwanda VAT estimate updated.");
    } catch (caught) {
      state.result = null;
      byId("rwvResult").classList.remove("on");
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
      byId("rwvScenario").classList.toggle("on", state.rateKind === "scenario");
      pressed("[data-rate-kind]", button);
      calculate();
    });
  });
  byId("rwvForm").addEventListener("submit", function (event) { event.preventDefault(); calculate(); });
  amount.addEventListener("input", calculate);
  custom.addEventListener("input", function () { if (state.rateKind === "scenario") calculate(); });
  byId("rwvClassification").addEventListener("change", function (event) {
    var treatment = engine.classify(event.target.value), box = byId("rwvClassificationResult"), strong = document.createElement("strong"), span = document.createElement("span");
    box.className = "rwv-treatment " + treatment.treatment;
    box.replaceChildren();
    strong.textContent = text("treatment_" + treatment.treatment, treatment.treatment);
    span.textContent = treatment.source + " · " + text("classificationCaveat", "Confirm the exact provision before relying on this guide.");
    box.append(strong, span);
  });
  byId("rwvInvoiceForm").addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      var invoice = engine.calculateInvoice([{ description: byId("rwvInvoiceDescription").value, quantity: byId("rwvInvoiceQty").value, unitPrice: byId("rwvInvoiceUnit").value }], input());
      byId("rwvInvoiceError").textContent = "";
      byId("rwvInvoiceNet").textContent = money(invoice.net);
      byId("rwvInvoiceVat").textContent = money(invoice.vat);
      byId("rwvInvoiceGross").textContent = money(invoice.gross);
      byId("rwvInvoiceOutput").classList.add("on");
    } catch (caught) {
      byId("rwvInvoiceOutput").classList.remove("on");
      byId("rwvInvoiceError").textContent = text("invalidInvoice", "Enter a non-negative quantity and unit price.");
    }
  });
  function updateRegistration() {
    try {
      var result = engine.registrationBand({ previousFiscalYear: byId("rwvAnnual").value, previousQuarter: byId("rwvQuarter").value });
      byId("rwvRegistrationResult").textContent = text("registration_" + result.band, result.band) + (result.triggers.length ? " (" + result.triggers.map(function (trigger) { return text("trigger_" + trigger, trigger); }).join(", ") + ")" : "");
    } catch (caught) { byId("rwvRegistrationResult").textContent = text("invalid", "Enter non-negative turnover amounts."); }
  }
  ["rwvAnnual", "rwvQuarter"].forEach(function (id) { byId(id).addEventListener("input", updateRegistration); });
  byId("rwvShare").addEventListener("click", async function () {
    var route = location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url: route });
      else if (navigator.clipboard) await navigator.clipboard.writeText(route);
      status.textContent = text("shared", "Tool link shared. No amounts were included.");
    } catch (caught) { if (caught && caught.name !== "AbortError") status.textContent = text("shareFailed", "Could not share the tool link."); }
  });
  byId("rwvPdf").addEventListener("click", function () {
    if (!state.result) calculate();
    if (!state.result || !window.jspdf || !window.jspdf.jsPDF) return;
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" }), rows;
    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.text(text("pdfTitle", "Rwanda VAT planning estimate"), 48, 62);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(text("pdfSource", "RRA guidance; Laws No. 049/2023 and No. 009/2025; reviewed 22 July 2026."), 48, 82);
    rows = [[text("pdfMode", "Mode"), state.mode === "add" ? text("addVat", "Add VAT") : text("extractVat", "Extract VAT")], [text("net", "Amount before VAT"), "RWF " + state.result.net.toFixed(2)], [text("vat", "VAT"), "RWF " + state.result.vat.toFixed(2)], [text("gross", "Total including VAT"), "RWF " + state.result.gross.toFixed(2)], [text("rateUsed", "Rate used"), state.result.rate.toFixed(2) + "%"]];
    doc.setFontSize(11); rows.forEach(function (row, index) { var y = 120 + index * 27; doc.setFont("helvetica", "normal"); doc.text(row[0], 48, y); doc.setFont("helvetica", "bold"); doc.text(row[1], 280, y); });
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(doc.splitTextToSize(text("pdfDisclaimer", "Planning estimate only. Confirm classification, registration, invoicing and filing with RRA or a qualified tax adviser."), 500), 48, 285);
    doc.save("rwanda-vat-estimate.pdf"); status.textContent = text("pdfReady", "PDF downloaded locally.");
  });
  window.RWVatApp = { calculate: calculate, getResult: function () { return state.result; } };
  updateRegistration(); calculate();
})();
