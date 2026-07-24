(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.CMVatEngine;
  var locale = window.CMVatLocale || {};
  if (!engine) return;

  var byId = function (id) {
    return document.getElementById(id);
  };
  var state = { mode: "add", rateKind: "standard", result: null };

  function text(key, fallback) {
    return locale[key] || fallback;
  }

  function money(value) {
    return new Intl.NumberFormat(locale.numberLocale || "en-CM", {
      style: "currency",
      currency: "XAF",
      maximumFractionDigits: 2,
    }).format(value);
  }

  function pressed(selector, active) {
    document.querySelectorAll(selector).forEach(function (button) {
      button.setAttribute("aria-pressed", String(button === active));
    });
  }

  function updateWithholding() {
    if (!state.result) return;
    var result = engine.calculateWithholding(
      state.result,
      byId("cmvAuthorizedBuyer").checked,
    );
    byId("cmvWithheld").textContent = money(result.withheldVat);
    byId("cmvSupplierReceives").textContent = money(result.supplierReceives);
    byId("cmvWithholdingNote").textContent =
      result.status === "full-vat-withholding"
        ? text(
            "withholdingConfirmed",
            "Full VAT withholding shown. Keep the DGI system-generated withholding certificate.",
          )
        : text(
            "withholdingUnconfirmed",
            "No withholding assumed. Select this only after confirming the buyer is on the current DGI authorization list.",
          );
  }

  function calculate() {
    try {
      state.result = engine.calculate({
        amount: byId("cmvAmount").value,
        mode: state.mode,
        rateKind: state.rateKind,
      });
      byId("cmvError").textContent = "";
      byId("cmvMain").textContent = money(
        state.mode === "add" ? state.result.gross : state.result.net,
      );
      byId("cmvNet").textContent = money(state.result.net);
      byId("cmvVat").textContent = money(state.result.vat);
      byId("cmvGross").textContent = money(state.result.gross);
      byId("cmvRate").textContent = state.result.rate + "%";
      byId("cmvResultLabel").textContent =
        state.mode === "add"
          ? text("grossResult", "Total including VAT")
          : text("netResult", "Amount before VAT");
      byId("cmvResultNote").textContent =
        state.rateKind === "social-housing"
          ? text(
              "housingNote",
              "The 10% rate is only for qualifying social-housing operations under the 2026 rules.",
            )
          : text(
              "standardNote",
              "Standard estimate: 17.5% base VAT plus 1.75 percentage points of CAC = 19.25%.",
            );
      byId("cmvResult").classList.add("on");
      byId("cmvStatus").textContent = text(
        "calculated",
        "Cameroon VAT estimate updated locally.",
      );
      updateWithholding();
    } catch (caught) {
      state.result = null;
      byId("cmvResult").classList.remove("on");
      byId("cmvError").textContent = text(
        "invalid",
        "Enter a non-negative amount.",
      );
      byId("cmvStatus").textContent = byId("cmvError").textContent;
    }
  }

  document.querySelectorAll("[data-cmv-mode]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.mode = button.dataset.cmvMode;
      pressed("[data-cmv-mode]", button);
      calculate();
    });
  });

  document.querySelectorAll("[data-cmv-rate]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.rateKind = button.dataset.cmvRate;
      pressed("[data-cmv-rate]", button);
      calculate();
    });
  });

  byId("cmvForm").addEventListener("submit", function (event) {
    event.preventDefault();
    calculate();
  });
  byId("cmvAmount").addEventListener("input", calculate);
  byId("cmvAuthorizedBuyer").addEventListener("change", updateWithholding);

  byId("cmvInvoiceForm").addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      var invoice = engine.calculateInvoice(
        {
          description: byId("cmvDescription").value,
          quantity: byId("cmvQuantity").value,
          unitPrice: byId("cmvUnitPrice").value,
        },
        { rateKind: state.rateKind },
      );
      byId("cmvInvoiceError").textContent = "";
      byId("cmvInvoiceNet").textContent = money(invoice.net);
      byId("cmvInvoiceVat").textContent = money(invoice.vat);
      byId("cmvInvoiceGross").textContent = money(invoice.gross);
      byId("cmvInvoiceResult").classList.add("on");
    } catch (caught) {
      byId("cmvInvoiceResult").classList.remove("on");
      byId("cmvInvoiceError").textContent = text(
        "invalidInvoice",
        "Enter a non-negative quantity and unit price.",
      );
    }
  });

  byId("cmvClassification").addEventListener("change", function (event) {
    var result = engine.classify(event.target.value);
    byId("cmvClassificationResult").className =
      "cmv-treatment " + result.treatment;
    byId("cmvClassificationResult").textContent = text(
      "classification_" + event.target.value,
      result.source,
    );
  });

  byId("cmvTurnoverForm").addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      var result = engine.registrationScreen(byId("cmvTurnover").value);
      byId("cmvTurnoverError").textContent = "";
      byId("cmvTurnoverResult").textContent = text(
        "turnover_" + result.status,
        result.status === "review-real-regime"
          ? "At or above XAF 50,000,000: review real-regime and VAT obligations with DGI. This is not automatic registration proof."
          : "Below XAF 50,000,000: review the IGS regime and any activity-specific VAT rules with DGI. This is not an exemption verdict.",
      );
    } catch (caught) {
      byId("cmvTurnoverError").textContent = text(
        "invalidTurnover",
        "Enter non-negative annual turnover.",
      );
    }
  });

  byId("cmvShare").addEventListener("click", async function () {
    var route = location.origin + location.pathname;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: route });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(route);
      }
      byId("cmvStatus").textContent = text(
        "shared",
        "Tool link shared. No amounts were included.",
      );
    } catch (caught) {
      if (caught && caught.name !== "AbortError") {
        byId("cmvStatus").textContent = text(
          "shareFailed",
          "Could not share the tool link.",
        );
      }
    }
  });

  byId("cmvPdf").addEventListener("click", function () {
    if (!state.result) calculate();
    if (!state.result || !window.jspdf || !window.jspdf.jsPDF) {
      byId("cmvStatus").textContent = text(
        "pdfFailed",
        "PDF export is unavailable in this browser.",
      );
      return;
    }
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(text("pdfTitle", "Cameroon VAT planning estimate"), 48, 62);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      text(
        "pdfSource",
        "DGI and MINFI official sources reviewed 22 July 2026.",
      ),
      48,
      82,
    );
    [
      [text("net", "Amount before VAT"), "XAF " + state.result.net.toFixed(2)],
      [text("vat", "VAT"), "XAF " + state.result.vat.toFixed(2)],
      [
        text("gross", "Total including VAT"),
        "XAF " + state.result.gross.toFixed(2),
      ],
      [text("rateUsed", "Rate used"), state.result.rate.toFixed(2) + "%"],
    ].forEach(function (row, index) {
      var y = 120 + index * 27;
      doc.setFont("helvetica", "normal");
      doc.text(row[0], 48, y);
      doc.setFont("helvetica", "bold");
      doc.text(row[1], 280, y);
    });
    doc.setFont("helvetica", "normal");
    doc.text(
      doc.splitTextToSize(
        text(
          "pdfDisclaimer",
          "Planning estimate only. Confirm classification, invoicing, deduction, registration, withholding, filing and payment with DGI or a qualified adviser.",
        ),
        500,
      ),
      48,
      255,
    );
    doc.save("cameroon-vat-estimate.pdf");
    byId("cmvStatus").textContent = text(
      "pdfReady",
      "PDF downloaded locally.",
    );
  });

  window.CMVatApp = {
    calculate: calculate,
    getResult: function () {
      return state.result;
    },
  };
  calculate();
})();
