!function (window, document) {
  "use strict";

  var GATE_SRC = "/assets/js/lib/pdf-download-gate.js?v=20260502";
  var loadingGate = null;

  function getToolSlug(trigger) {
    if (trigger && trigger.dataset && trigger.dataset.toolSlug) return trigger.dataset.toolSlug;
    var meta = document.querySelector('meta[name="tool-id"], meta[name="afrotools:tool-slug"]');
    if (meta && meta.content) return meta.content;
    var parts = window.location.pathname.replace(/\/$/, "").replace(/\.html$/i, "").split("/").filter(Boolean);
    return parts[parts.length - 1] || parts[parts.length - 2] || "report";
  }

  function getCountryCode() {
    var meta = document.querySelector('meta[name="country-code"], meta[name="afrotools:country"]');
    if (meta && meta.content) return meta.content.toUpperCase();
    var match = window.location.pathname.match(/\/([a-z]{2})-[a-z]/i);
    return match ? match[1].toUpperCase() : "";
  }

  function loadGate() {
    if (window.AfroPdfDownloadGate && typeof window.AfroPdfDownloadGate.guard === "function") {
      return Promise.resolve(window.AfroPdfDownloadGate);
    }
    if (loadingGate) return loadingGate;
    loadingGate = new Promise(function (resolve) {
      var existing = document.querySelector('script[src*="pdf-download-gate.js"]');
      if (existing) {
        var tries = 0;
        (function wait() {
          tries += 1;
          if (window.AfroPdfDownloadGate && typeof window.AfroPdfDownloadGate.guard === "function") return resolve(window.AfroPdfDownloadGate);
          if (tries > 50) return resolve(null);
          window.setTimeout(wait, 100);
        }());
        return;
      }
      var script = document.createElement("script");
      script.src = GATE_SRC;
      script.onload = function () { resolve(window.AfroPdfDownloadGate || null); };
      script.onerror = function () { resolve(null); };
      document.head.appendChild(script);
    });
    return loadingGate;
  }

  function guard(callback, options) {
    loadGate().then(function (gate) {
      if (gate && typeof gate.guard === "function") {
        gate.guard(callback, options || {});
      } else if (typeof callback === "function") {
        callback();
      }
    });
  }

  function runInlineHandler(trigger, code) {
    try {
      new Function(code).call(trigger);
    } catch (err) {
      console.error("[AutoEmailGate] Download handler failed:", err);
    }
  }

  function gateOptions(trigger, source) {
    var slug = getToolSlug(trigger);
    return {
      source: source || "auto-email-gate",
      toolSlug: slug,
      countryCode: getCountryCode(),
      category: /paye|salary|tax|vat|payroll/i.test(slug + " " + window.location.pathname) ? "salary-tax" : "generated-report"
    };
  }

  class AfroEmailGate extends HTMLElement {
    get toolName() {
      return this.getAttribute("tool-name") || getToolSlug(this);
    }

    connectedCallback() {
      var self = this;
      this.addEventListener("click", function (event) {
        var trigger = event.target.closest('button,a,[role="button"]');
        if (!trigger) return;
        event.preventDefault();
        event.stopPropagation();
        guard(function () {
          self._triggerActualDownload();
        }, Object.assign(gateOptions(trigger, "afro-email-gate"), { toolSlug: self.toolName }));
      });
    }

    _triggerActualDownload() {
      if (typeof window.generatePdf === "function") window.generatePdf();
      else if (typeof window.downloadPdf === "function") window.downloadPdf();
      else if (typeof window.exportPdf === "function") window.exportPdf();
      else if (typeof window.openPdfModal === "function") window.openPdfModal();
      else window.print();
    }
  }

  class EmailGateModal extends HTMLElement {
    show(callback, options) {
      return guard(callback, Object.assign({ source: "email-gate-modal" }, options || {}));
    }
  }

  if (window.customElements && !window.customElements.get("afro-email-gate")) {
    window.customElements.define("afro-email-gate", AfroEmailGate);
  }
  if (window.customElements && !window.customElements.get("email-gate-modal")) {
    window.customElements.define("email-gate-modal", EmailGateModal);
  }

  function wireLegacyButtons() {
    document.querySelectorAll('[onclick*="download" i],[onclick*="export" i],[onclick*="print" i],.pdf-btn,.download-pdf,[data-action="pdf"],.act-pdf').forEach(function (trigger) {
      if (trigger.dataset.noGate === "true" || trigger.dataset.afroGateBound === "true") return;
      if (trigger.classList.contains("mode-btn") || /^mode/i.test(trigger.id || "")) return;
      var code = trigger.getAttribute("onclick");
      if (!code) return;
      trigger.dataset.afroGateBound = "true";
      trigger.dataset.origPdf = code;
      trigger.removeAttribute("onclick");
      trigger.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        guard(function () {
          runInlineHandler(trigger, code);
        }, gateOptions(trigger, "legacy-pdf-button"));
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wireLegacyButtons);
  else wireLegacyButtons();

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.captureLeadEnriched = function (profile, context) {
    loadGate().then(function (gate) {
      if (gate && typeof gate.captureLead === "function") gate.captureLead(profile || {}, context || gateOptions(null, "capture-lead"));
    });
  };
  window.AfroTools.ensurePdfDownloadGate = loadGate;
}(window, document);
