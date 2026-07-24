(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.UGVatEngine,
    locale = window.UGVatLocale || {};
  if (!engine) return;
  var state = {
      mode: "add",
      rateKind: "standard",
      classification: "review",
      result: null,
    },
    byId = function (id) {
      return document.getElementById(id);
    },
    amount = byId("ugvAmount"),
    custom = byId("ugvCustomRate"),
    status = byId("ugvStatus"),
    error = byId("ugvError");
  function text(key, fallback) {
    return locale[key] || fallback;
  }
  function money(value) {
    return new Intl.NumberFormat(locale.numberLocale || "en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  function pressed(selector, active) {
    document.querySelectorAll(selector).forEach(function (button) {
      button.setAttribute("aria-pressed", String(button === active));
    });
  }
  function input() {
    return {
      amount: amount.value,
      mode: state.mode,
      rateKind: state.rateKind,
      rate: state.rateKind === "scenario" ? custom.value : undefined,
    };
  }
  function calculate() {
    try {
      state.result = engine.calculate(input());
      error.textContent = "";
      byId("ugvResultMain").textContent = money(
        state.mode === "add" ? state.result.gross : state.result.net,
      );
      byId("ugvNet").textContent = money(state.result.net);
      byId("ugvVat").textContent = money(state.result.vat);
      byId("ugvGross").textContent = money(state.result.gross);
      byId("ugvRateUsed").textContent =
        state.result.rate.toFixed(state.result.rate % 1 ? 2 : 0) + "%";
      byId("ugvResultLabel").textContent =
        state.mode === "add"
          ? text("grossResult", "Total including VAT")
          : text("netResult", "Amount before VAT");
      byId("ugvResultNote").textContent =
        state.rateKind === "scenario"
          ? text(
              "scenarioNote",
              "Planning scenario only. Confirm the legal treatment before use.",
            )
          : state.rateKind === "zero"
            ? text(
                "zeroNote",
                "Use 0% only after confirming the Third Schedule applies to this supply.",
              )
            : text("standardNote", "Uganda standard-rate estimate at 18%.");
      byId("ugvResult").classList.add("on");
      status.textContent = text("calculated", "Uganda VAT estimate updated.");
    } catch (caught) {
      state.result = null;
      byId("ugvResult").classList.remove("on");
      error.textContent = text(
        "invalid",
        "Enter a non-negative amount and a rate from 0% to 100%.",
      );
      status.textContent = error.textContent;
    }
  }
  document.querySelectorAll("[data-mode]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.mode = button.dataset.mode;
      pressed("[data-mode]", button);
      calculate();
    });
  });
  document.querySelectorAll("[data-rate-kind]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.rateKind = button.dataset.rateKind;
      byId("ugvScenario").classList.toggle("on", state.rateKind === "scenario");
      pressed("[data-rate-kind]", button);
      calculate();
    });
  });
  byId("ugvForm").addEventListener("submit", function (event) {
    event.preventDefault();
    calculate();
  });
  amount.addEventListener("input", calculate);
  custom.addEventListener("input", function () {
    if (state.rateKind === "scenario") calculate();
  });
  byId("ugvClassification").addEventListener("change", function (event) {
    state.classification = event.target.value;
    var treatment = engine.classify(state.classification),
      box = byId("ugvClassificationResult"),
      strong = document.createElement("strong"),
      span = document.createElement("span");
    box.className = "ugv-treatment " + treatment.treatment;
    box.replaceChildren();
    strong.textContent = text(
      "treatment_" + treatment.treatment,
      treatment.treatment,
    );
    span.textContent =
      text("source_" + event.target.value, treatment.source) +
      " · " +
      text(
        "classificationCaveat",
        "Confirm the exact provision before relying on this guide.",
      );
    box.append(strong, span);
  });
  byId("ugvInvoiceForm").addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      var invoice = engine.calculateInvoice(
        [
          {
            description: byId("ugvInvoiceDescription").value,
            quantity: byId("ugvInvoiceQty").value,
            unitPrice: byId("ugvInvoiceUnit").value,
          },
        ],
        input(),
      );
      byId("ugvInvoiceError").textContent = "";
      byId("ugvInvoiceNet").textContent = money(invoice.net);
      byId("ugvInvoiceVat").textContent = money(invoice.vat);
      byId("ugvInvoiceGross").textContent = money(invoice.gross);
      byId("ugvInvoiceOutput").classList.add("on");
    } catch (caught) {
      byId("ugvInvoiceOutput").classList.remove("on");
      byId("ugvInvoiceError").textContent = text(
        "invalidInvoice",
        "Enter a non-negative quantity and unit price.",
      );
    }
  });
  function updateRegistration() {
    try {
      var result = engine.registrationBand({
        pastThreeMonths: byId("ugvPastThree").value,
        expectedNextThreeMonths: byId("ugvExpectedThree").value,
      });
      byId("ugvRegistrationResult").textContent =
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
    } catch (caught) {
      byId("ugvRegistrationResult").textContent = text(
        "invalid",
        "Enter non-negative turnover amounts.",
      );
    }
  }
  ["ugvPastThree", "ugvExpectedThree"].forEach(function (id) {
    byId(id).addEventListener("input", updateRegistration);
  });
  byId("ugvShare").addEventListener("click", async function () {
    var route = location.origin + location.pathname;
    try {
      if (navigator.share)
        await navigator.share({ title: document.title, url: route });
      else if (navigator.clipboard) await navigator.clipboard.writeText(route);
      status.textContent = text(
        "shared",
        "Tool link shared. No amounts were included.",
      );
    } catch (caught) {
      if (caught && caught.name !== "AbortError")
        status.textContent = text(
          "shareFailed",
          "Could not share the tool link.",
        );
    }
  });
  byId("ugvPdf").addEventListener("click", function () {
    if (!state.result) calculate();
    if (!state.result || !window.jspdf || !window.jspdf.jsPDF) return;
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" }),
      classification = engine.classify(state.classification),
      rows,
      disclaimerY;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(text("pdfTitle", "Uganda VAT planning estimate"), 48, 62);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      text(
        "pdfSource",
        "URA VAT guidance and Value Added Tax Act schedules; reviewed 22 July 2026.",
      ),
      48,
      82,
    );
    rows = [
      [
        text("pdfMode", "Mode"),
        state.mode === "add"
          ? text("addVat", "Add VAT")
          : text("extractVat", "Extract VAT"),
      ],
      [text("net", "Amount before VAT"), "UGX " + state.result.net.toFixed(2)],
      [text("vat", "VAT"), "UGX " + state.result.vat.toFixed(2)],
      [
        text("gross", "Total including VAT"),
        "UGX " + state.result.gross.toFixed(2),
      ],
      [text("rateUsed", "Rate used"), state.result.rate.toFixed(2) + "%"],
      [
        text("pdfClassification", "Classification guide"),
        text("treatment_" + classification.treatment, classification.treatment),
      ],
    ];
    doc.setFontSize(11);
    rows.forEach(function (row, index) {
      var y = 120 + index * 27;
      doc.setFont("helvetica", "normal");
      doc.text(row[0], 48, y);
      doc.setFont("helvetica", "bold");
      doc.text(row[1], 280, y);
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    disclaimerY = 315;
    if (state.classification === "confirmed-designated-withholding") {
      doc.text(
        doc.splitTextToSize(
          text(
            "pdfWithholding",
            "Confirmed section 5 VAT withholding is 6% of taxable value, not a VAT rate. This tool does not calculate the amount because payer designation, supplier or supply eligibility, and current exemption status must all be confirmed.",
          ),
          500,
        ),
        48,
        290,
      );
      disclaimerY = 365;
    }
    doc.text(
      doc.splitTextToSize(
        text(
          "pdfDisclaimer",
          "Planning estimate only. Confirm classification, registration, invoicing and filing with URA or a qualified tax adviser.",
        ),
        500,
      ),
      48,
      disclaimerY,
    );
    doc.save("uganda-vat-estimate.pdf");
    status.textContent = text("pdfReady", "PDF downloaded locally.");
  });
  window.UGVatApp = {
    calculate: calculate,
    getResult: function () {
      return state.result;
    },
  };
  updateRegistration();
  calculate();
})();
