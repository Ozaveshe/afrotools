(function () {
  "use strict";
  var e = window.AfroTools && window.AfroTools.TDVatEngine,
    l = window.TDVatLocale || {};
  if (!e) return;
  var id = function (v) {
      return document.getElementById(v);
    },
    s = { mode: "add", rateKind: "standard", result: null };
  function t(k, f) {
    return l[k] || f;
  }
  function money(v) {
    return new Intl.NumberFormat(l.numberLocale || "fr-TD", {
      style: "currency",
      currency: "XAF",
      maximumFractionDigits: 2,
    }).format(v);
  }
  function pressed(q, a) {
    document.querySelectorAll(q).forEach(function (b) {
      b.setAttribute("aria-pressed", String(b === a));
    });
  }
  function calc() {
    try {
      s.result = e.calculate({
        amount: id("tdvAmount").value,
        mode: s.mode,
        rateKind: s.rateKind,
      });
      id("tdvError").textContent = "";
      id("tdvMain").textContent = money(
        s.mode === "add" ? s.result.gross : s.result.net,
      );
      id("tdvNet").textContent = money(s.result.net);
      id("tdvVat").textContent = money(s.result.vat);
      id("tdvGross").textContent = money(s.result.gross);
      id("tdvRate").textContent = s.result.rate + "%";
      id("tdvResult").classList.add("on");
      id("tdvStatus").textContent = t(
        "calculated",
        "VAT estimate updated locally.",
      );
    } catch (x) {
      s.result = null;
      id("tdvResult").classList.remove("on");
      id("tdvError").textContent = t("invalid", "Enter a non-negative amount.");
      id("tdvStatus").textContent = id("tdvError").textContent;
    }
  }
  document.querySelectorAll("[data-tdv-mode]").forEach(function (b) {
    b.addEventListener("click", function () {
      s.mode = b.dataset.tdvMode;
      pressed("[data-tdv-mode]", b);
      calc();
    });
  });
  document.querySelectorAll("[data-tdv-rate]").forEach(function (b) {
    b.addEventListener("click", function () {
      s.rateKind = b.dataset.tdvRate;
      pressed("[data-tdv-rate]", b);
      calc();
    });
  });
  id("tdvForm").addEventListener("submit", function (x) {
    x.preventDefault();
    calc();
  });
  id("tdvAmount").addEventListener("input", calc);
  id("tdvInvoiceForm").addEventListener("submit", function (x) {
    x.preventDefault();
    try {
      var r = e.calculateInvoice(
        {
          description: id("tdvDescription").value,
          quantity: id("tdvQuantity").value,
          unitPrice: id("tdvUnitPrice").value,
        },
        { rateKind: s.rateKind },
      );
      id("tdvInvoiceError").textContent = "";
      id("tdvInvoiceNet").textContent = money(r.net);
      id("tdvInvoiceVat").textContent = money(r.vat);
      id("tdvInvoiceGross").textContent = money(r.gross);
      id("tdvInvoiceResult").classList.add("on");
    } catch (y) {
      id("tdvInvoiceResult").classList.remove("on");
      id("tdvInvoiceError").textContent = t(
        "invalidInvoice",
        "Enter a non-negative quantity and price.",
      );
    }
  });
  id("tdvClassification").addEventListener("change", function (x) {
    var r = e.classify(x.target.value);
    id("tdvClassificationResult").className = "tdv-treatment " + r.treatment;
    id("tdvClassificationResult").textContent = t(
      "classification_" + x.target.value,
      r.note,
    );
  });
  id("tdvBoundaryForm").addEventListener("submit", function (x) {
    x.preventDefault();
    try {
      var annual = e.annualRegimeScreen(
          id("tdvTurnover").value,
          id("tdvNaturalPerson").checked,
        ),
        operation = e.largeOperationScreen(
          id("tdvOperation").value,
          id("tdvIglConfirmed").checked,
        ),
        annualFallback = {
          "vat-regime-review":
            "At or above XAF 50,000,000: review the applicable VAT regime and filing cadence with DGI.",
          "igl-review":
            "Below XAF 50,000,000 for a confirmed natural person: review IGL status and any current exceptions.",
          "legal-form-review":
            "Below XAF 50,000,000: confirm legal form before applying the IGL rule.",
        },
        operationFallback = {
          "regime-unconfirmed":
            "Confirm current IGL status before applying the single-operation override.",
          "vat-due-review":
            "A confirmed IGL taxpayer has one operation above XAF 50,000,000: VAT is due for review under the 2026 Article 229 V rule.",
          "no-large-operation-override":
            "This operation does not exceed XAF 50,000,000, so the strict single-operation override is not triggered.",
        };
      id("tdvBoundaryError").textContent = "";
      id("tdvAnnualResult").textContent = t(
        "annual_" + annual.status,
        annualFallback[annual.status],
      );
      id("tdvOperationResult").textContent = t(
        "operation_" + operation.status,
        operationFallback[operation.status],
      );
    } catch (y) {
      id("tdvBoundaryError").textContent = t(
        "invalidBoundary",
        "Enter non-negative turnover and operation amounts.",
      );
    }
  });
  id("tdvShare").addEventListener("click", async function () {
    try {
      var u = location.origin + location.pathname;
      if (navigator.share)
        await navigator.share({ title: document.title, url: u });
      else if (navigator.clipboard) await navigator.clipboard.writeText(u);
      id("tdvStatus").textContent = t(
        "shared",
        "Tool link shared; no amounts were included.",
      );
    } catch (x) {
      if (x && x.name !== "AbortError")
        id("tdvStatus").textContent = t(
          "shareFailed",
          "Could not share the link.",
        );
    }
  });
  id("tdvPdf").addEventListener("click", function () {
    if (!s.result) calc();
    if (!s.result || !window.jspdf || !window.jspdf.jsPDF) {
      id("tdvStatus").textContent = t(
        "pdfFailed",
        "PDF export is unavailable.",
      );
      return;
    }
    var d = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    d.setFont("helvetica", "bold");
    d.setFontSize(19);
    d.text(t("pdfTitle", "Chad VAT planning estimate"), 48, 62);
    d.setFont("helvetica", "normal");
    d.setFontSize(10);
    d.text(
      t(
        "pdfSource",
        "Effective rate includes centimes additionnels. Official 2024 application circular, CGI 2025 and 2026 circular reviewed 22 July 2026.",
      ),
      48,
      82,
    );
    [
      [t("net", "Amount before VAT"), "XAF " + s.result.net.toFixed(2)],
      ["VAT", "XAF " + s.result.vat.toFixed(2)],
      [t("gross", "Total including VAT"), "XAF " + s.result.gross.toFixed(2)],
      [t("rate", "Rate used"), s.result.rate.toFixed(2) + "%"],
    ].forEach(function (r, i) {
      d.text(r[0], 48, 120 + i * 27);
      d.setFont("helvetica", "bold");
      d.text(r[1], 280, 120 + i * 27);
      d.setFont("helvetica", "normal");
    });
    d.text(
      d.splitTextToSize(
        t(
          "pdfDisclaimer",
          "Planning estimate only. Confirm classification, base rounding, exemption certificate, regime, filing and payment with DGI.",
        ),
        500,
      ),
      48,
      250,
    );
    d.save("chad-vat-estimate.pdf");
    id("tdvStatus").textContent = t("pdfReady", "PDF downloaded locally.");
  });
  window.TDVatApp = {
    calculate: calc,
    getResult: function () {
      return s.result;
    },
  };
  calc();
})();
