!function (window, document) {
  "use strict";

  var STORAGE_KEY = "afro_salary_reports_v1";
  var cfg = window.PAYE_CALC_SYNC_CONFIG || {};
  var toolSlug = cfg.toolSlug || cfg.storageSlug || "";
  var toolName = cfg.toolName || "PAYE calculator";
  var toolHref = cfg.toolHref || window.location.pathname;
  var countryCode = cfg.countryCode || "";
  var currency = cfg.currency || "";

  if (!toolSlug) return;

  function readJson(key, fallback) {
    try {
      var raw = window.localStorage && window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      if (window.localStorage) window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {}
  }

  function isSignedIn() {
    try {
      if (window.AfroWorkspace && typeof window.AfroWorkspace.isSignedIn === "function" && window.AfroWorkspace.isSignedIn()) return true;
    } catch (err) {}
    try {
      if (window.AfroAuth && typeof window.AfroAuth.isLoggedIn === "function" && window.AfroAuth.isLoggedIn()) return true;
    } catch (err) {}
    try {
      if (window.AfroAuth && typeof window.AfroAuth.getUser === "function") {
        var user = window.AfroAuth.getUser();
        if (user && user.id) return true;
      }
    } catch (err) {}
    return false;
  }

  function getSnapshotSummary() {
    var adapter = window.PAYE_CALC_SYNC_ADAPTER || {};
    try {
      if (typeof adapter.buildPayload === "function") {
        var payload = adapter.buildPayload();
        if (payload && payload.snapshot) return summarizeSnapshot(payload.snapshot);
      }
    } catch (err) {}
    try {
      if (window.RESULT) return summarizeSnapshot(window.RESULT);
    } catch (err) {}
    return "Generated PAYE report";
  }

  function summarizeSnapshot(snapshot) {
    var bits = [];
    var net = snapshot.netMonthly || snapshot.net || snapshot.takeHome || null;
    var tax = snapshot.taxMonthly || snapshot.tax || snapshot.paye || null;
    if (net != null) bits.push("Net " + formatMoney(net));
    if (tax != null) bits.push("Tax " + formatMoney(tax));
    if (snapshot.effectiveRate != null) bits.push("Rate " + formatPercent(snapshot.effectiveRate));
    return bits.length ? bits.join(" | ") : "Generated PAYE report";
  }

  function formatMoney(value) {
    var amount = Number(value);
    if (!Number.isFinite(amount)) return String(value || "");
    try {
      return new Intl.NumberFormat(cfg.locale || "en-US", { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(amount);
    } catch (err) {
      return (currency || "") + " " + Math.round(amount).toLocaleString();
    }
  }

  function formatPercent(value) {
    var rate = Number(value);
    if (!Number.isFinite(rate)) return "";
    if (rate > 0 && rate <= 1) rate *= 100;
    return rate.toFixed(1) + "%";
  }

  function buildRecord(detail) {
    detail = detail || {};
    if (detail.toolId && detail.toolId !== toolSlug) return null;
    var gate = detail.gateContext || readJson("afro_pdf_gate_context_v1", {}) || {};
    var generatedAt = new Date().toISOString();
    var id = "salary-report-" + toolSlug + "-" + Date.now().toString(36);
    var title = gate.reportTitle || detail.title || toolName + " PDF report";
    return {
      id: id,
      itemType: "salary-report",
      toolSlug: toolSlug,
      toolName: toolName,
      title: title,
      summary: getSnapshotSummary(),
      href: toolHref,
      fileName: detail.fileName || "",
      ref: detail.ref || "",
      countryCode: countryCode || detail.countryCode || gate.countryCode || "",
      country: detail.country || "",
      currency: currency || detail.currency || "",
      generatedAt: generatedAt,
      savedAt: generatedAt,
      pdfUnlocked: true,
      gate: {
        source: gate.source || "pdf-template",
        useCase: gate.useCase || "",
        company: gate.user && gate.user.company || "",
        role: gate.user && gate.user.role || ""
      }
    };
  }

  function saveLocal(record) {
    var items = readJson(STORAGE_KEY, []);
    if (!Array.isArray(items)) items = [];
    items = items.filter(function (item) {
      return item && item.id !== record.id;
    });
    items.unshift(record);
    writeJson(STORAGE_KEY, items.slice(0, 50));
    try {
      window.dispatchEvent(new CustomEvent("afro-salary-report-change", { detail: { action: "save", item: record, count: items.length } }));
    } catch (err) {}
  }

  async function syncWorkspace(record) {
    if (!isSignedIn() || !window.AfroWorkspace || typeof window.AfroWorkspace.upsert !== "function") return false;
    try {
      await window.AfroWorkspace.upsert({
        itemType: "salary-report",
        itemKey: record.id,
        toolSlug: record.toolSlug,
        title: record.title,
        summary: record.summary,
        href: record.href,
        payload: {
          version: 1,
          fileName: record.fileName,
          ref: record.ref,
          generatedAt: record.generatedAt,
          gate: record.gate
        },
        meta: {
          country: record.countryCode,
          currency: record.currency,
          pdfUnlocked: true,
          category: "salary-tax"
        }
      });
      return true;
    } catch (err) {
      console.warn("[PayeReportSync] Salary report sync failed:", err && err.message || err);
      return false;
    }
  }

  window.addEventListener("afro-pdf-generated", function (event) {
    var record = buildRecord(event.detail || {});
    if (!record) return;
    saveLocal(record);
    syncWorkspace(record);
    var status = document.getElementById("calcSaveStatus");
    if (status) {
      status.textContent = isSignedIn() ? "PDF report saved to your dashboard trail." : "PDF report saved on this device.";
      status.setAttribute("data-tone", "success");
    }
  });
}(window, document);
