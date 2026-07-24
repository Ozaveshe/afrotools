(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.CDVatEngine;
  if (!engine) return;
  var locale = window.CDVatLocale || {};
  var state = { mode: "add", rateKind: "standard", result: null };
  function id(value) {
    return document.getElementById(value);
  }
  function t(key, fallback) {
    return locale[key] || fallback;
  }
  function money(value) {
    return (
      new Intl.NumberFormat(locale.numberLocale || "fr-CD", {
        maximumFractionDigits: 0,
      }).format(value) + " CDF"
    );
  }
  function evidenceFor(kind) {
    if (kind === "current-reduced-item-confirmed")
      return "current-dgi-eight-percent-item";
    if (kind === "qualifying-export-confirmed")
      return "customs-export-declaration";
    return null;
  }
  function showEvidence() {
    var needed = state.rateKind !== "standard";
    id("cdvEvidenceWrap").hidden = !needed;
    if (!needed) id("cdvEvidence").checked = false;
  }
  function calculate() {
    try {
      state.result = engine.calculate({
        amount: id("cdvAmount").value,
        mode: state.mode,
        rateKind: state.rateKind,
        rateEvidenceConfirmed: id("cdvEvidence").checked,
        rateEvidenceType: evidenceFor(state.rateKind),
      });
      id("cdvError").textContent = "";
      id("cdvMain").textContent = money(
        state.mode === "add" ? state.result.gross : state.result.net,
      );
      id("cdvNet").textContent = money(state.result.net);
      id("cdvVat").textContent = money(state.result.vat);
      id("cdvGross").textContent = money(state.result.gross);
      id("cdvRate").textContent = state.result.rate + "%";
      id("cdvResult").classList.add("on");
      id("cdvStatus").textContent = t(
        "calculated",
        "Estimate updated locally.",
      );
    } catch (error) {
      state.result = null;
      id("cdvResult").classList.remove("on");
      id("cdvError").textContent =
        error && error.code === "RATE_EVIDENCE_REQUIRED"
          ? t(
              "evidenceRequired",
              "Confirm the exact legal evidence before using this treatment.",
            )
          : t("invalid", "Enter a non-negative amount.");
      id("cdvStatus").textContent = id("cdvError").textContent;
    }
  }
  document.querySelectorAll("[data-cdv-mode]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.mode = button.dataset.cdvMode;
      document.querySelectorAll("[data-cdv-mode]").forEach(function (item) {
        item.setAttribute("aria-pressed", String(item === button));
      });
      calculate();
    });
  });
  document.querySelectorAll("[data-cdv-rate]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.rateKind = button.dataset.cdvRate;
      document.querySelectorAll("[data-cdv-rate]").forEach(function (item) {
        item.setAttribute("aria-pressed", String(item === button));
      });
      showEvidence();
      calculate();
    });
  });
  id("cdvForm").addEventListener("submit", function (event) {
    event.preventDefault();
    calculate();
  });
  id("cdvAmount").addEventListener("input", calculate);
  id("cdvEvidence").addEventListener("change", calculate);
  id("cdvClassification").addEventListener("change", function (event) {
    var result = engine.classify(event.target.value);
    id("cdvClassificationResult").className =
      "cdv-treatment " + result.treatment;
    id("cdvClassificationResult").textContent = t(
      "classification_" + event.target.value,
      result.note,
    );
  });
  id("cdvRegistrationForm").addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      var result = engine.registrationScreen(
        id("cdvTurnover").value,
        id("cdvLiberalProfession").checked,
      );
      id("cdvRegistrationError").textContent = "";
      id("cdvRegistrationResult").textContent = t(result.status, result.status);
    } catch (error) {
      id("cdvRegistrationError").textContent = t(
        "invalidTurnover",
        "Enter non-negative annual turnover.",
      );
    }
  });
  id("cdvShare").addEventListener("click", async function () {
    try {
      var url = location.origin + location.pathname;
      if (navigator.share)
        await navigator.share({ title: document.title, url: url });
      else if (navigator.clipboard) await navigator.clipboard.writeText(url);
      id("cdvStatus").textContent = t(
        "shared",
        "Tool link shared without amounts.",
      );
    } catch (error) {
      if (error && error.name !== "AbortError")
        id("cdvStatus").textContent = t(
          "shareFailed",
          "Could not share the link.",
        );
    }
  });
  id("cdvPdf").addEventListener("click", function () {
    if (!state.result) calculate();
    if (!state.result || !window.jspdf || !window.jspdf.jsPDF) {
      id("cdvStatus").textContent = t(
        "pdfFailed",
        "PDF export is unavailable.",
      );
      return;
    }
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(18);
    doc.text(t("pdfTitle", "DR Congo TVA estimate"), 48, 60);
    doc.setFontSize(11);
    doc.text(
      t("net", "Amount before tax") + ": " + money(state.result.net),
      48,
      105,
    );
    doc.text("TVA: " + money(state.result.vat), 48, 130);
    doc.text(
      t("gross", "Total including tax") + ": " + money(state.result.gross),
      48,
      155,
    );
    doc.text(
      t("rate", "Applied rate") + ": " + state.result.rate + "%",
      48,
      180,
    );
    doc.text(
      doc.splitTextToSize(
        t(
          "pdfDisclaimer",
          "Planning estimate only. Confirm classification, registration, invoicing, filing and payment with DGI or a qualified adviser.",
        ),
        500,
      ),
      48,
      225,
    );
    doc.save("dr-congo-tva-estimate.pdf");
    id("cdvStatus").textContent = t("pdfReady", "PDF downloaded locally.");
  });
  window.CDVatApp = {
    calculate: calculate,
    getResult: function () {
      return state.result;
    },
  };
  showEvidence();
  calculate();
  id("cdvStatus").textContent = "";
})();
