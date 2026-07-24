(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.GQVatEngine;
  if (!engine) return;
  var locale = window.GQVatLocale || {};
  var state = { mode: "add", rateKind: "standard", result: null };
  function id(value) {
    return document.getElementById(value);
  }
  function t(key, fallback) {
    return locale[key] || fallback;
  }
  function money(value) {
    return new Intl.NumberFormat(locale.numberLocale || "es-GQ", {
      maximumFractionDigits: 0,
    }).format(value) + " XAF";
  }
  function evidenceFor(kind) {
    if (kind === "lpge-2026-reduced-import-confirmed") {
      return "lpge-2026-article-13-five-import-line";
    }
    if (kind === "lpge-2026-zero-import-confirmed") {
      return "lpge-2026-article-13-zero-import-line";
    }
    return null;
  }
  function showEvidence() {
    var needed = state.rateKind !== "standard";
    id("gqvEvidenceWrap").hidden = !needed;
    if (!needed) id("gqvEvidence").checked = false;
  }
  function calculate() {
    try {
      state.result = engine.calculate({
        amount: id("gqvAmount").value,
        mode: state.mode,
        rateKind: state.rateKind,
        rateEvidenceConfirmed: id("gqvEvidence").checked,
        rateEvidenceType: evidenceFor(state.rateKind),
      });
      id("gqvError").textContent = "";
      id("gqvMain").textContent = money(
        state.mode === "add" ? state.result.gross : state.result.net,
      );
      id("gqvNet").textContent = money(state.result.net);
      id("gqvVat").textContent = money(state.result.vat);
      id("gqvGross").textContent = money(state.result.gross);
      id("gqvRate").textContent = state.result.rate + "%";
      id("gqvResult").classList.add("on");
      id("gqvStatus").textContent = t(
        "calculated",
        "Estimate updated locally.",
      );
    } catch (error) {
      state.result = null;
      id("gqvResult").classList.remove("on");
      id("gqvError").textContent =
        error && error.code === "RATE_EVIDENCE_REQUIRED"
          ? t(
              "evidenceRequired",
              "Confirm the exact Article 13 product line before using this rate.",
            )
          : t("invalid", "Enter a non-negative amount.");
      id("gqvStatus").textContent = id("gqvError").textContent;
    }
  }
  document.querySelectorAll("[data-gqv-mode]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.mode = button.dataset.gqvMode;
      document.querySelectorAll("[data-gqv-mode]").forEach(function (item) {
        item.setAttribute("aria-pressed", String(item === button));
      });
      calculate();
    });
  });
  document.querySelectorAll("[data-gqv-rate]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.rateKind = button.dataset.gqvRate;
      document.querySelectorAll("[data-gqv-rate]").forEach(function (item) {
        item.setAttribute("aria-pressed", String(item === button));
      });
      showEvidence();
      calculate();
    });
  });
  id("gqvForm").addEventListener("submit", function (event) {
    event.preventDefault();
    calculate();
  });
  id("gqvAmount").addEventListener("input", calculate);
  id("gqvEvidence").addEventListener("change", calculate);
  id("gqvClassification").addEventListener("change", function (event) {
    var result = engine.classify(event.target.value);
    id("gqvClassificationResult").className =
      "gqv-treatment " + result.treatment;
    id("gqvClassificationResult").textContent = t(
      "classification_" + event.target.value,
      result.note,
    );
  });
  id("gqvShare").addEventListener("click", async function () {
    try {
      var url = location.origin + location.pathname;
      if (navigator.share) {
        await navigator.share({ title: document.title, url: url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      id("gqvStatus").textContent = t(
        "shared",
        "Tool link shared without amounts.",
      );
    } catch (error) {
      if (error && error.name !== "AbortError") {
        id("gqvStatus").textContent = t(
          "shareFailed",
          "Could not share the link.",
        );
      }
    }
  });
  id("gqvPdf").addEventListener("click", function () {
    if (!state.result) calculate();
    if (!state.result || !window.jspdf || !window.jspdf.jsPDF) {
      id("gqvStatus").textContent = t(
        "pdfFailed",
        "PDF export is unavailable.",
      );
      return;
    }
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(18);
    doc.text(t("pdfTitle", "Equatorial Guinea IVA estimate"), 48, 60);
    doc.setFontSize(11);
    doc.text(t("net", "Amount before tax") + ": " + money(state.result.net), 48, 105);
    doc.text("IVA: " + money(state.result.vat), 48, 130);
    doc.text(t("gross", "Total including tax") + ": " + money(state.result.gross), 48, 155);
    doc.text(t("rate", "Applied rate") + ": " + state.result.rate + "%", 48, 180);
    doc.text(
      doc.splitTextToSize(
        t(
          "pdfDisclaimer",
          "Planning estimate only. Confirm exact classification, invoice treatment, filing and payment with DGIC or a qualified adviser.",
        ),
        500,
      ),
      48,
      225,
    );
    doc.save("equatorial-guinea-iva-estimate.pdf");
    id("gqvStatus").textContent = t(
      "pdfReady",
      "PDF downloaded locally.",
    );
  });
  window.GQVatApp = {
    calculate: calculate,
    getResult: function () {
      return state.result;
    },
  };
  showEvidence();
  calculate();
  id("gqvStatus").textContent = "";
})();
