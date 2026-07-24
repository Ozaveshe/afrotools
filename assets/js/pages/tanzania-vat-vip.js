(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.TZVatEngine,
    locale = window.TZVatLocale || {};
  if (!engine) return;
  var state = {
      mode: "add",
      rateKind: "standard",
      rate: engine.STANDARD_RATE,
      result: null,
    },
    byId = function (id) {
      return document.getElementById(id);
    },
    amount = byId("tzvAmount"),
    custom = byId("tzvCustomRate"),
    status = byId("tzvStatus"),
    error = byId("tzvError");
  function text(k, f) {
    return locale[k] || f;
  }
  function money(v) {
    return new Intl.NumberFormat(locale.numberLocale || "en-TZ", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v);
  }
  function pressed(s, a) {
    document.querySelectorAll(s).forEach(function (b) {
      b.setAttribute("aria-pressed", String(b === a));
    });
  }
  function currentRate() {
    return state.rateKind === "scenario" ? Number(custom.value) : state.rate;
  }
  function calculate() {
    try {
      state.result = engine.calculate({
        amount: amount.value,
        mode: state.mode,
        rate: currentRate(),
        rateKind: state.rateKind,
      });
      error.textContent = "";
      byId("tzvResultMain").textContent = money(
        state.mode === "add" ? state.result.gross : state.result.net,
      );
      byId("tzvNet").textContent = money(state.result.net);
      byId("tzvVat").textContent = money(state.result.vat);
      byId("tzvGross").textContent = money(state.result.gross);
      byId("tzvRateUsed").textContent =
        state.result.rate.toFixed(state.result.rate % 1 ? 2 : 0) + "%";
      byId("tzvResultLabel").textContent =
        state.mode === "add"
          ? text("grossResult", "Total including VAT")
          : text("netResult", "Amount before VAT");
      byId("tzvResultNote").textContent =
        state.rateKind === "scenario"
          ? text(
              "scenarioNote",
              "Planning scenario only. Confirm the legal rate before use.",
            )
          : state.rateKind === "epayment"
            ? text(
                "epaymentNote",
                "Use 16% only after confirming customer, payment-channel and current TRA public-notice eligibility.",
              )
            : state.rateKind === "zero"
              ? text(
                  "zeroNote",
                  "Use 0% only after confirming the exact zero-rate schedule entry.",
                )
              : text(
                  "standardNote",
                  "Mainland Tanzania standard-rate estimate at 18%.",
                );
      byId("tzvResult").classList.add("on");
      status.textContent = text("calculated", "VAT estimate updated.");
    } catch (e) {
      state.result = null;
      byId("tzvResult").classList.remove("on");
      error.textContent = text(
        "invalid",
        "Enter a non-negative amount and a rate from 0% to 100%.",
      );
      status.textContent = error.textContent;
    }
  }
  document.querySelectorAll("[data-mode]").forEach(function (b) {
    b.addEventListener("click", function () {
      state.mode = b.dataset.mode;
      pressed("[data-mode]", b);
      calculate();
    });
  });
  document.querySelectorAll("[data-rate-kind]").forEach(function (b) {
    b.addEventListener("click", function () {
      state.rateKind = b.dataset.rateKind;
      state.rate =
        state.rateKind === "epayment"
          ? engine.CONDITIONAL_EPAYMENT_RATE
          : state.rateKind === "zero"
            ? 0
            : engine.STANDARD_RATE;
      byId("tzvScenario").classList.toggle("on", state.rateKind === "scenario");
      pressed("[data-rate-kind]", b);
      calculate();
    });
  });
  byId("tzvForm").addEventListener("submit", function (e) {
    e.preventDefault();
    calculate();
  });
  amount.addEventListener("input", calculate);
  custom.addEventListener("input", function () {
    if (state.rateKind === "scenario") calculate();
  });
  byId("tzvClassification").addEventListener("change", function (e) {
    var treatment = engine.classify(e.target.value),
      box = byId("tzvClassificationResult"),
      strong = document.createElement("strong"),
      span = document.createElement("span");
    box.className = "tzv-treatment " + treatment.treatment;
    box.replaceChildren();
    strong.textContent = text(
      "treatment_" + treatment.treatment,
      treatment.treatment,
    );
    span.textContent =
      treatment.source +
      " · " +
      text(
        "classificationCaveat",
        "Confirm the exact provision before relying on this guide.",
      );
    box.append(strong, span);
  });
  byId("tzvInvoiceForm").addEventListener("submit", function (e) {
    e.preventDefault();
    try {
      var invoice = engine.calculateInvoice(
        [
          {
            description: byId("tzvInvoiceDescription").value,
            quantity: byId("tzvInvoiceQty").value,
            unitPrice: byId("tzvInvoiceUnit").value,
          },
        ],
        currentRate(),
        state.rateKind,
      );
      byId("tzvInvoiceError").textContent = "";
      byId("tzvInvoiceNet").textContent = money(invoice.net);
      byId("tzvInvoiceVat").textContent = money(invoice.vat);
      byId("tzvInvoiceGross").textContent = money(invoice.gross);
      byId("tzvInvoiceOutput").classList.add("on");
    } catch (err) {
      byId("tzvInvoiceOutput").classList.remove("on");
      byId("tzvInvoiceError").textContent = text(
        "invalidInvoice",
        "Enter a non-negative quantity and unit price.",
      );
    }
  });
  function updateRegistration() {
    var result = engine.registrationBand({
      prospective12: byId("tzvProspective12").value,
      prior12: byId("tzvPrior12").value,
      prior6: byId("tzvPrior6").value,
    });
    byId("tzvRegistrationResult").textContent =
      text("registration_" + result.band, result.band) +
      (result.triggers.length
        ? " (" +
          result.triggers
            .map(function (trigger) {
              return text("trigger_" + trigger, trigger);
            })
            .join(", ") +
          ")"
        : "");
  }
  ["tzvProspective12", "tzvPrior12", "tzvPrior6"].forEach(function (id) {
    byId(id).addEventListener("input", updateRegistration);
  });
  updateRegistration();
  byId("tzvWithholdingForm").addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      var result = engine.calculateWithholdingAgent(
        byId("tzvWithholdingAmount").value,
      );
      byId("tzvWithholdingVat").textContent = money(result.vat);
      byId("tzvWithholdingRetained").textContent = money(result.retained);
      byId("tzvWithholdingSupplier").textContent = money(
        result.supplierPayment,
      );
      byId("tzvWithholdingOutput").classList.add("on");
      byId("tzvWithholdingError").textContent = "";
    } catch (error) {
      byId("tzvWithholdingOutput").classList.remove("on");
      byId("tzvWithholdingError").textContent = text(
        "invalid",
        "Enter a non-negative amount.",
      );
    }
  });
  byId("tzvShare").addEventListener("click", async function () {
    var route = location.origin + location.pathname;
    try {
      if (navigator.share)
        await navigator.share({ title: document.title, url: route });
      else if (navigator.clipboard) await navigator.clipboard.writeText(route);
      status.textContent = text(
        "shared",
        "Tool link shared. No amounts were included.",
      );
    } catch (e) {
      if (e && e.name !== "AbortError")
        status.textContent = text(
          "shareFailed",
          "Could not share the tool link.",
        );
    }
  });
  byId("tzvPdf").addEventListener("click", function () {
    if (!state.result) calculate();
    if (!state.result || !window.jspdf || !window.jspdf.jsPDF) return;
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(text("pdfTitle", "Tanzania VAT planning estimate"), 48, 62);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      text(
        "pdfSource",
        "Tanzania VAT Act and Finance Act 2025; reviewed 22 July 2026.",
      ),
      48,
      82,
    );
    var rows = [
      [
        text("pdfMode", "Mode"),
        state.mode === "add"
          ? text("addVat", "Add VAT")
          : text("extractVat", "Extract VAT"),
      ],
      [text("net", "Amount before VAT"), "TZS " + state.result.net.toFixed(2)],
      [text("vat", "VAT"), "TZS " + state.result.vat.toFixed(2)],
      [
        text("gross", "Total including VAT"),
        "TZS " + state.result.gross.toFixed(2),
      ],
      [text("rateUsed", "Rate used"), state.result.rate.toFixed(2) + "%"],
    ];
    doc.setFontSize(12);
    rows.forEach(function (row, i) {
      var y = 125 + i * 28;
      doc.setFont("helvetica", "normal");
      doc.text(row[0], 48, y);
      doc.setFont("helvetica", "bold");
      doc.text(row[1], 250, y);
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      doc.splitTextToSize(
        text(
          "pdfDisclaimer",
          "Planning estimate only. Confirm classification, eligibility, registration, invoicing and filing with TRA or a qualified tax practitioner.",
        ),
        500,
      ),
      48,
      290,
    );
    doc.save("tanzania-vat-estimate.pdf");
    status.textContent = text("pdfReady", "PDF downloaded locally.");
  });
  window.TZVatApp = {
    calculate: calculate,
    getResult: function () {
      return state.result;
    },
  };
  calculate();
})();
