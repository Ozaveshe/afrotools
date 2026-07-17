/**
 * Reusable exports for Ask AfroTools AI workflow reports.
 *
 * Builds privacy-filtered reports that can be downloaded, copied, shared, or
 * handed to the existing AfroTools PDF template when available.
 */
(function initWorkflowExport(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.AfroToolsAIWorkflowExport = factory(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createWorkflowExport(root) {
  "use strict";

  var MAX_TEXT = 420;
  var MAX_LIST = 20;
  var BLOCKED_KEY_PATTERN = /(^|[_-])(raw|prompt|query|token|secret|password|diagnostic|debug|internal|session|cookie|authorization|auth|projectid|userid|requestid|traceid|runid|conversationid|provider|model)([_-]|$)/i;
  var PRIVATE_KEY_PATTERN = /^(email|phone|address|clientName|customerName|fullName|name|passport|nin|idNumber|identityNumber|resumeText|cvText|pdfContent|documentContent|profileText|coverLetterText)$/i;

  function text(value, limit) {
    var clean = String(value === undefined || value === null ? "" : value).replace(/\s+/g, " ").trim().normalize("NFC");
    if (root && root.AfroToolsLocalization && typeof root.AfroToolsLocalization.normalizeDisplay === "function") {
      clean = root.AfroToolsLocalization.normalizeDisplay(clean);
    }
    var max = limit || MAX_TEXT;
    return clean.length > max ? clean.slice(0, max - 3).trim() + "..." : clean;
  }

  function isBlockedKey(key) {
    var value = String(key || "");
    var compact = value.toLowerCase().replace(/[^a-z0-9]/g, "");
    return BLOCKED_KEY_PATTERN.test(value) ||
      PRIVATE_KEY_PATTERN.test(value) ||
      value.charAt(0) === "_" ||
      /raw|prompt|query|token|secret|password|diagnostic|debug|internal|session|authorization|cookie|projectid|userid|requestid|traceid|runid|conversationid/.test(compact);
  }

  function sanitizeValue(value, depth) {
    if (depth > 4) return undefined;
    if (value === undefined || value === null) return value;
    if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return text(value);
    if (Array.isArray(value)) {
      return value.slice(0, MAX_LIST).map(function (item) {
        return sanitizeValue(item, depth + 1);
      }).filter(function (item) {
        return item !== undefined && item !== "";
      });
    }
    if (typeof value === "object") {
      var out = {};
      Object.keys(value).forEach(function (key) {
        if (isBlockedKey(key)) return;
        var sanitized = sanitizeValue(value[key], depth + 1);
        if (sanitized !== undefined && sanitized !== "") out[key] = sanitized;
      });
      return out;
    }
    return undefined;
  }

  function toArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(function (item) { return text(item); }).filter(Boolean).slice(0, MAX_LIST);
    return [text(value)].filter(Boolean);
  }

  function metricSummary(metrics) {
    return (metrics || []).map(function (metric) {
      if (!metric) return "";
      return text(metric.label || "") + ": " + text(metric.value || "");
    }).filter(function (line) {
      return line.replace(/[:\s]/g, "") !== "";
    });
  }

  function sourceFromEnergy(sourceState) {
    var rows = [];
    if (!sourceState) return rows;
    [
      ["Tariff", sourceState.tariff],
      ["Fuel", sourceState.fuel],
      ["Solar yield", sourceState.solarYield],
      ["Install cost", sourceState.install]
    ].forEach(function (row) {
      var item = row[1] || {};
      if (!item.label && !item.confidence && !item.freshness) return;
      rows.push(row[0] + ": " + [item.label, item.confidence && item.confidence + " confidence", item.freshness && "reviewed " + item.freshness].filter(Boolean).join(" - "));
    });
    return rows;
  }

  function normalizeReport(input) {
    var report = input || {};
    return {
      title: text(report.title || "AfroTools AI workflow report", 120),
      userGoal: text(report.userGoal || report.goal || "", MAX_TEXT),
      inputsUsed: sanitizeValue(report.inputsUsed || report.inputs || {}, 0) || {},
      resultSummary: toArray(report.resultSummary || report.summary),
      assumptions: toArray(report.assumptions),
      sourceConfidence: toArray(report.sourceConfidence || report.sources),
      nextSteps: toArray(report.nextSteps || report.checklist),
      disclaimer: text(report.disclaimer || "Planning estimate only. Verify high-stakes decisions with official sources or qualified professionals.", MAX_TEXT),
      generatedAt: report.generatedAt || new Date().toISOString(),
      workflowType: text(report.workflowType || "", 80),
    };
  }

  function fromImportAdvisorPlan(plan) {
    var estimate = plan && plan.estimate || {};
    return normalizeReport({
      workflowType: "import_advisor",
      title: "Import Advisor Decision Brief",
      userGoal: plan && plan.goalSummary || "",
      inputsUsed: plan && plan.inputs || {},
      resultSummary: metricSummary(plan && plan.metrics).concat([
        estimate.totalUSD ? "Total landed cost estimate: USD " + Number(estimate.totalUSD || 0).toLocaleString("en-US") : "",
        plan && plan.estimateStatus ? "Estimate status: " + plan.estimateStatus : ""
      ].filter(Boolean)),
      assumptions: plan && plan.assumptions || [],
      sourceConfidence: plan && plan.sourceConfidence || [],
      nextSteps: plan && plan.checklist || [],
      disclaimer: plan && plan.warning || ""
    });
  }

  function fromEnergyAdvisorPlan(plan) {
    return normalizeReport({
      workflowType: "energy_advisor",
      title: "Solar and Generator Decision Brief",
      userGoal: plan && plan.goalSummary || "",
      inputsUsed: plan && plan.inputs || {},
      resultSummary: [
        plan && plan.decision && plan.decision.headline ? "Decision: " + plan.decision.headline : "",
        plan && plan.formatted ? "Monthly generator cost: " + plan.formatted.monthlyGeneratorCost : "",
        plan && plan.formatted ? "Annual fuel exposure: " + plan.formatted.annualFuelExposure : "",
        plan && plan.estimates ? "Rough solar system size: " + plan.estimates.roughSystemKw + " kW" : "",
        plan && plan.formatted ? "Payback estimate: " + plan.formatted.payback : ""
      ].filter(Boolean),
      assumptions: [
        "Uses country planning defaults where user bills, receipts, or quotes are missing.",
        "Fuel, tariff, FX, battery, and installer costs can change before purchase.",
        "A site visit is needed before final system sizing."
      ],
      sourceConfidence: sourceFromEnergy(plan && plan.sourceState),
      nextSteps: plan && plan.installerQuestions || [],
      disclaimer: plan && plan.warning || ""
    });
  }

  function section(title, lines) {
    var body = toArray(lines);
    return body.length ? "\n" + title + "\n" + body.map(function (line) { return "- " + line; }).join("\n") : "";
  }

  function inputsText(inputs) {
    var clean = sanitizeValue(inputs || {}, 0) || {};
    var keys = Object.keys(clean);
    if (!keys.length) return ["No structured inputs were saved in this report."];
    return keys.map(function (key) {
      var value = clean[key];
      return key + ": " + (Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : String(value));
    });
  }

  function toText(report) {
    var safe = normalizeReport(report);
    return [
      safe.title,
      "Generated: " + safe.generatedAt,
      safe.userGoal ? "\nUser goal\n" + safe.userGoal : "",
      section("Inputs used", inputsText(safe.inputsUsed)),
      section("Result summary", safe.resultSummary),
      section("Assumptions", safe.assumptions),
      section("Source, freshness, and confidence", safe.sourceConfidence),
      section("Next steps", safe.nextSteps),
      safe.disclaimer ? "\nDisclaimer\n" + safe.disclaimer : ""
    ].filter(Boolean).join("\n").trim();
  }

  function toChecklistText(report) {
    var safe = normalizeReport(report);
    return [
      safe.title,
      safe.userGoal ? "Goal: " + safe.userGoal : "",
      section("Checklist", safe.nextSteps),
      safe.disclaimer ? "\nNote\n" + safe.disclaimer : ""
    ].filter(Boolean).join("\n").trim();
  }

  function toWhatsAppText(report) {
    var safe = normalizeReport(report);
    return [
      safe.title,
      safe.userGoal ? "Goal: " + safe.userGoal : "",
      safe.resultSummary.slice(0, 4).join("\n"),
      safe.nextSteps.length ? "Next: " + safe.nextSteps.slice(0, 3).join("; ") : "",
      "AfroTools planning estimate. Verify before acting."
    ].filter(Boolean).join("\n").trim();
  }

  function toEmailText(report) {
    var safe = normalizeReport(report);
    return {
      subject: safe.title,
      body: toText(safe)
    };
  }

  function slug(value) {
    return text(value || "afrotools-ai-report", 80).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "afrotools-ai-report";
  }

  function downloadBlob(blob, fileName) {
    if (!root || !root.document || !root.URL) return false;
    var link = root.document.createElement("a");
    link.href = root.URL.createObjectURL(blob);
    link.download = fileName;
    root.document.body.appendChild(link);
    link.click();
    setTimeout(function () {
      root.URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
    return true;
  }

  function toJson(report) {
    return JSON.stringify(normalizeReport(report), null, 2);
  }

  function downloadJson(report, fileName) {
    var safe = normalizeReport(report);
    return downloadBlob(new Blob([toJson(safe)], { type: "application/json;charset=utf-8" }), fileName || slug(safe.title) + ".json");
  }

  function copyToClipboard(report, options) {
    var mode = options && options.mode || "checklist";
    var value = typeof report === "string" ? report : mode === "full" ? toText(report) : toChecklistText(report);
    if (!root || !root.navigator || !root.navigator.clipboard || typeof root.navigator.clipboard.writeText !== "function") {
      return Promise.resolve({ copied: false, text: value, reason: "clipboard_unavailable" });
    }
    return root.navigator.clipboard.writeText(value).then(function () {
      return { copied: true, text: value };
    }).catch(function () {
      return { copied: false, text: value, reason: "clipboard_failed" };
    });
  }

  function buildWhatsAppUrl(report) {
    return "https://wa.me/?text=" + encodeURIComponent(toWhatsAppText(report));
  }

  function buildEmailUrl(report) {
    var email = toEmailText(report);
    return "mailto:?subject=" + encodeURIComponent(email.subject) + "&body=" + encodeURIComponent(email.body);
  }

  function ensurePdfTemplate() {
    if (root.AfroTools && root.AfroTools.pdf && typeof root.AfroTools.pdf.generate === "function") return Promise.resolve(true);
    if (!root || !root.document) return Promise.resolve(false);
    return new Promise(function (resolve) {
      var existing = root.document.querySelector('script[src*="pdf-template.js"]');
      if (existing) {
        var tries = 0;
        (function waitForPdf() {
          tries += 1;
          if (root.AfroTools && root.AfroTools.pdf && typeof root.AfroTools.pdf.generate === "function") return resolve(true);
          if (tries > 50) return resolve(false);
          setTimeout(waitForPdf, 100);
        })();
        return;
      }
      var script = root.document.createElement("script");
      script.src = "/assets/js/lib/pdf-template.js?v=20260502";
      script.onload = function () { resolve(Boolean(root.AfroTools && root.AfroTools.pdf && typeof root.AfroTools.pdf.generate === "function")); };
      script.onerror = function () { resolve(false); };
      root.document.head.appendChild(script);
    });
  }

  function pdfRows(lines) {
    return toArray(lines).map(function (line, index) {
      return { label: String(index + 1), value: line };
    });
  }

  function downloadPdfReport(report, options) {
    var safe = normalizeReport(report);
    var opts = options || {};
    return ensurePdfTemplate().then(function (ready) {
      if (ready) {
        return root.AfroTools.pdf.generate({
          title: safe.title,
          subtitle: safe.userGoal,
          toolId: opts.toolId || safe.workflowType || "ai-workflow",
          category: opts.category || "ai-workflow",
          country: opts.country || safe.inputsUsed.country || safe.inputsUsed.destinationCountry || "",
          countryCode: opts.countryCode || safe.inputsUsed.countryCode || "",
          currency: opts.currency || safe.inputsUsed.currency || "",
          heroStats: safe.resultSummary.slice(0, 3).map(function (line) {
            var parts = line.split(":");
            return { label: text(parts.shift() || "Result", 28), value: text(parts.join(":") || line, 32) };
          }),
          sections: [
            { title: "Inputs used", rows: pdfRows(inputsText(safe.inputsUsed)) },
            { title: "Result summary", rows: pdfRows(safe.resultSummary) },
            { title: "Assumptions", rows: pdfRows(safe.assumptions) },
            { title: "Source and confidence", rows: pdfRows(safe.sourceConfidence) },
            { title: "Next steps", rows: pdfRows(safe.nextSteps) }
          ],
          source: safe.sourceConfidence.join("; "),
          disclaimer: safe.disclaimer,
          noGate: true
        });
      }
      downloadBlob(new Blob([toText(safe)], { type: "text/plain;charset=utf-8" }), (opts.fileName || slug(safe.title)) + ".txt");
      return { fallback: "text" };
    });
  }

  return {
    normalizeReport: normalizeReport,
    fromImportAdvisorPlan: fromImportAdvisorPlan,
    fromEnergyAdvisorPlan: fromEnergyAdvisorPlan,
    toText: toText,
    toChecklistText: toChecklistText,
    toWhatsAppText: toWhatsAppText,
    toEmailText: toEmailText,
    downloadJson: downloadJson,
    toJson: toJson,
    copyToClipboard: copyToClipboard,
    buildWhatsAppUrl: buildWhatsAppUrl,
    buildEmailUrl: buildEmailUrl,
    downloadPdfReport: downloadPdfReport,
    sanitizeValue: sanitizeValue,
  };
});
