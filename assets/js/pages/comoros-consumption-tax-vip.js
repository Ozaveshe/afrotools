(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.KMConsumptionTaxEngine;
  var locale = window.KMConsumptionTaxLocale || {};
  if (!engine) return;
  var byId = function (id) {
    return document.getElementById(id);
  };
  var state = { mode: "add", rateKind: "standard", result: null };
  function text(key, fallback) {
    return locale[key] || fallback;
  }
  function money(value) {
    return new Intl.NumberFormat(locale.numberLocale || "fr-KM", {
      style: "currency",
      currency: "KMF",
      maximumFractionDigits: 2,
    }).format(value);
  }
  function pressed(selector, active) {
    document.querySelectorAll(selector).forEach(function (button) {
      button.setAttribute("aria-pressed", String(button === active));
    });
  }
  function isSpecialRate() {
    return state.rateKind !== "standard";
  }
  function rateEvidence() {
    return {
      rateEvidenceConfirmed:
        isSpecialRate() && byId("kmEvidenceConfirmed").checked,
      rateEvidenceType: engine.EVIDENCE_TYPES[state.rateKind] || null,
    };
  }
  function updateEvidenceGate(reset) {
    var gate = byId("kmEvidenceGate");
    var checkbox = byId("kmEvidenceConfirmed");
    if (reset) checkbox.checked = false;
    gate.hidden = !isSpecialRate();
    checkbox.required = isSpecialRate();
    byId("kmEvidenceTreatment").textContent = isSpecialRate()
      ? byId("kmRateChoice").selectedOptions[0].textContent.trim()
      : "";
  }
  function calculate() {
    try {
      var evidence = rateEvidence();
      state.result = engine.calculate({
        amount: byId("kmAmount").value,
        mode: state.mode,
        rateKind: state.rateKind,
        rateEvidenceConfirmed: evidence.rateEvidenceConfirmed,
        rateEvidenceType: evidence.rateEvidenceType,
      });
      byId("kmError").textContent = "";
      byId("kmMain").textContent = money(
        state.mode === "add" ? state.result.gross : state.result.net,
      );
      byId("kmNet").textContent = money(state.result.net);
      byId("kmTax").textContent = money(state.result.tax);
      byId("kmGross").textContent = money(state.result.gross);
      byId("kmRate").textContent = state.result.rate + "%";
      byId("kmResult").classList.add("on");
      byId("kmStatus").textContent = text(
        "calculated",
        "Consumption-tax estimate updated locally.",
      );
    } catch (error) {
      state.result = null;
      byId("kmResult").classList.remove("on");
      byId("kmError").textContent =
        error && error.code === "RATE_EVIDENCE_REQUIRED"
          ? text(
              "evidenceRequired",
              "Confirm that the selected supply exactly matches Article 152 and that you hold current evidence.",
            )
          : text("invalid", "Enter a non-negative amount.");
    }
  }
  document.querySelectorAll("[data-km-mode]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.mode = button.dataset.kmMode;
      pressed("[data-km-mode]", button);
      calculate();
    });
  });
  document.querySelectorAll("[data-km-rate]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.rateKind = button.dataset.kmRate;
      pressed("[data-km-rate]", button);
      updateEvidenceGate(true);
      calculate();
    });
  });
  byId("kmEvidenceConfirmed").addEventListener("change", calculate);
  byId("kmForm").addEventListener("submit", function (event) {
    event.preventDefault();
    calculate();
  });
  byId("kmAmount").addEventListener("input", calculate);
  byId("kmInvoiceForm").addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      var evidence = rateEvidence();
      var result = engine.calculateInvoice(
        {
          description: byId("kmDescription").value,
          quantity: byId("kmQuantity").value,
          unitPrice: byId("kmUnitPrice").value,
        },
        {
          rateKind: state.rateKind,
          rateEvidenceConfirmed: evidence.rateEvidenceConfirmed,
          rateEvidenceType: evidence.rateEvidenceType,
        },
      );
      byId("kmInvoiceError").textContent = "";
      byId("kmInvoiceNet").textContent = money(result.net);
      byId("kmInvoiceTax").textContent = money(result.tax);
      byId("kmInvoiceGross").textContent = money(result.gross);
      byId("kmInvoiceResult").classList.add("on");
    } catch (error) {
      byId("kmInvoiceResult").classList.remove("on");
      byId("kmInvoiceError").textContent =
        error && error.code === "RATE_EVIDENCE_REQUIRED"
          ? text(
              "evidenceRequired",
              "Confirm that the selected supply exactly matches Article 152 and that you hold current evidence.",
            )
          : text("invalidInvoice", "Enter a non-negative quantity and price.");
    }
  });
  byId("kmClassification").addEventListener("change", function (event) {
    var result = engine.classify(event.target.value);
    byId("kmClassificationResult").className =
      "kmv-treatment " + result.treatment;
    byId("kmClassificationResult").textContent = text(
      "classification_" + event.target.value,
      result.note,
    );
  });
  byId("kmThresholdForm").addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      var result = engine.thresholdScreen(
        byId("kmTurnover").value,
        byId("kmImporter").checked,
      );
      var fallbacks = {
        "taxable-review":
          "At or above KMF 20m: review TC obligations with DGI.",
        "importer-exception-review":
          "Confirmed importer from KMF 15m to below KMF 20m: Article 141 exception requires TC review.",
        "below-threshold-review":
          "Below KMF 20m and outside the confirmed importer exception: review the Article 141 exemption and current status.",
      };
      byId("kmThresholdError").textContent = "";
      byId("kmThresholdResult").textContent = text(
        "threshold_" + result.status,
        fallbacks[result.status],
      );
    } catch (error) {
      byId("kmThresholdError").textContent = text(
        "invalidThreshold",
        "Enter non-negative annual turnover.",
      );
    }
  });
  byId("kmShare").addEventListener("click", async function () {
    try {
      var url = location.origin + location.pathname;
      if (navigator.share)
        await navigator.share({ title: document.title, url: url });
      else if (navigator.clipboard) await navigator.clipboard.writeText(url);
      byId("kmStatus").textContent = text(
        "shared",
        "Tool link shared without entered amounts.",
      );
    } catch (error) {
      if (error && error.name !== "AbortError")
        byId("kmStatus").textContent = text(
          "shareFailed",
          "Could not share the link.",
        );
    }
  });
  byId("kmPdf").addEventListener("click", function () {
    if (!state.result) calculate();
    if (!state.result || !window.jspdf || !window.jspdf.jsPDF) {
      byId("kmStatus").textContent = text(
        "pdfFailed",
        "PDF export is unavailable.",
      );
      return;
    }
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(text("pdfTitle", "Comoros consumption-tax estimate"), 48, 62);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      text(
        "pdfSource",
        "Official Comoros CGI 2023 and Ministry 2024 fiscal-expenditure report published in 2026.",
      ),
      48,
      82,
    );
    [
      [text("net", "Amount before tax"), state.result.net],
      [text("tax", "Consumption tax"), state.result.tax],
      [text("gross", "Total including tax"), state.result.gross],
    ].forEach(function (row, index) {
      doc.text(row[0], 48, 120 + index * 27);
      doc.setFont("helvetica", "bold");
      doc.text("KMF " + row[1].toFixed(2), 280, 120 + index * 27);
      doc.setFont("helvetica", "normal");
    });
    doc.text(
      text("rate", "Rate used") + ": " + state.result.rate + "%",
      48,
      212,
    );
    doc.text(
      doc.splitTextToSize(
        text(
          "pdfDisclaimer",
          "Planning estimate only. Confirm the exact treatment, exemption, threshold, declaration and payment with DGI.",
        ),
        500,
      ),
      48,
      250,
    );
    doc.save("comoros-consumption-tax-estimate.pdf");
    byId("kmStatus").textContent = text("pdfReady", "PDF downloaded locally.");
  });
  window.KMConsumptionTaxApp = {
    calculate: calculate,
    getResult: function () {
      return state.result;
    },
  };
  updateEvidenceGate(false);
  calculate();
})();
