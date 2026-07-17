#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const manifestApi = require("../assets/js/ai/tool-manifest.js");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_INPUT = path.join(ROOT, "data", "ai", "drift-intake", "sample-router-feedback-report.json");
const DEFAULT_OUTPUT = path.join(ROOT, "data", "ai", "drift-intake", "router-drift-intake-report.json");
const RAW_TEXT_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:\+?\d[\s().-]*){7,}\b/,
  /\b(?:raw_query|originalQuery|private solar question|person@example\.com|555-0100)\b/i
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function text(value, fallback) {
  if (value === undefined || value === null) return fallback || "";
  const normalized = String(value).trim();
  return normalized || fallback || "";
}

function count(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function slug(value) {
  return text(value, "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
}

function topItems(report, key) {
  return array(report[key]).map((item) => ({
    name: text(item && item.name, "unknown"),
    count: count(item && item.count)
  })).filter((item) => item.count > 0);
}

function byId(manifest) {
  const map = new Map();
  array(manifest).forEach((entry) => {
    if (entry && entry.id) map.set(entry.id, entry);
  });
  return map;
}

function hasRawText(value) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  return RAW_TEXT_PATTERNS.some((pattern) => pattern.test(serialized || ""));
}

function priorityFor(signal, itemCount, totals) {
  const negative = count(totals.routerFeedbackNegative);
  const drift = count(totals.routerDriftSignals);
  if (signal === "route_mismatch" && (itemCount >= 3 || negative >= 3)) return "high";
  if (signal === "fallback_or_no_match" && (itemCount >= 2 || drift >= 4)) return "high";
  if (itemCount >= 2 || negative >= 2 || drift >= 2) return "medium";
  return "low";
}

function actionForSignal(signal) {
  if (signal === "route_mismatch") return "Add a synthetic routing fixture or manifest synonym for the reviewed bucket.";
  if (signal === "fallback_or_no_match") return "Review full-catalog retrieval coverage and add a synthetic no-match regression fixture.";
  if (signal === "missing_context") return "Review clarification fields and required-input copy for this workflow.";
  return "Review the aggregate bucket before changing prompt, manifest, or deterministic routing rules.";
}

function fixtureStubFor(signal, tool, category) {
  const safeCategory = text(category, tool && tool.category || "unknown");
  return {
    id: "drift-" + slug(signal) + "-" + slug(tool && tool.id || safeCategory) + "-review",
    prompt: "[REDACTED: create synthetic prompt from sanitized feedback bucket]",
    expected: {
      selectedToolId: text(tool && tool.id, "review-needed"),
      selectedRoute: text(tool && tool.route, "/search/"),
      intentCategory: safeCategory
    },
    privacy: {
      source: "sanitized_feedback_bucket",
      containsRealUserData: false,
      rawPromptUnavailable: true
    }
  };
}

function buildToolQueue(report, toolMap, signalItems, categoryItems) {
  const categories = categoryItems.filter((item) => item.name !== "unknown");
  const defaultSignal = signalItems[0] && signalItems[0].name || "route_mismatch";
  return topItems(report, "topSelectedTools")
    .filter((item) => item.name !== "tool-search")
    .slice(0, 8)
    .map((item, index) => {
      const tool = toolMap.get(item.name) || null;
      const category = tool && tool.category || categories[index % Math.max(categories.length, 1)] && categories[index % Math.max(categories.length, 1)].name || "unknown";
      const signal = defaultSignal === "fallback_or_no_match" ? "route_mismatch" : defaultSignal;
      return {
        id: "drift:" + slug(signal) + ":" + slug(item.name),
        priority: priorityFor(signal, item.count, report.totals || {}),
        signal,
        selectedToolId: item.name,
        selectedRoute: text(tool && tool.route, "/search/"),
        title: text(tool && tool.title, item.name),
        category,
        count: item.count,
        recommendedAction: actionForSignal(signal),
        fixtureStub: fixtureStubFor(signal, tool || { id: item.name, route: "/search/", category }, category)
      };
    });
}

function buildNoMatchQueue(report) {
  return topItems(report, "noMatchCategories").slice(0, 6).map((item) => {
    const signal = "fallback_or_no_match";
    const fixtureStub = fixtureStubFor(signal, { id: "tool-search", route: "/search/", category: "search" }, "unknown");
    fixtureStub.id = "drift-" + slug(signal) + "-" + slug(item.name) + "-review";
    return {
      id: "drift:" + slug(signal) + ":" + slug(item.name),
      priority: priorityFor(signal, item.count, report.totals || {}),
      signal,
      noMatchCategory: item.name,
      selectedToolId: "tool-search",
      selectedRoute: "/search/",
      title: "Search AfroTools",
      category: "search",
      count: item.count,
      recommendedAction: actionForSignal(signal),
      fixtureStub
    };
  });
}

function buildMissingInputQueue(report) {
  return topItems(report, "topMissingInputs").slice(0, 6).map((item) => {
    const signal = "missing_context";
    const fixtureStub = fixtureStubFor(signal, { id: "review-needed", route: "/ai/", category: "router" }, "unknown");
    fixtureStub.id = "drift-" + slug(signal) + "-" + slug(item.name) + "-review";
    return {
      id: "drift:" + slug(signal) + ":" + slug(item.name),
      priority: priorityFor(signal, item.count, report.totals || {}),
      signal,
      missingInput: item.name,
      selectedToolId: "review-needed",
      selectedRoute: "/ai/",
      title: "Clarification review",
      category: "router",
      count: item.count,
      recommendedAction: actionForSignal(signal),
      fixtureStub
    };
  });
}

function uniqueQueue(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  }).sort((a, b) => {
    const weights = { high: 3, medium: 2, low: 1 };
    return (weights[b.priority] || 0) - (weights[a.priority] || 0) || b.count - a.count || a.id.localeCompare(b.id);
  });
}

function buildReport(options = {}) {
  const inputPath = path.resolve(options.input || DEFAULT_INPUT);
  const sourceReport = readJson(inputPath);
  const manifest = manifestApi.getToolManifestForRouter();
  const toolMap = byId(manifest);
  const driftSignals = topItems(sourceReport, "driftSignals");
  const categories = topItems(sourceReport, "topRoutedCategories");
  const reviewQueue = uniqueQueue([
    ...buildToolQueue(sourceReport, toolMap, driftSignals, categories),
    ...buildNoMatchQueue(sourceReport),
    ...buildMissingInputQueue(sourceReport)
  ]);
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    task: "afrotools_ai_drift_to_eval_intake",
    scope: "sanitized_aggregate_feedback_not_raw_prompts",
    source: {
      inputPath: path.relative(ROOT, inputPath).replace(/\\/g, "/"),
      rawPromptRequired: false,
      rawPromptIncluded: false,
      containsRealUserData: false
    },
    gate: {
      passed: reviewQueue.length > 0 && !hasRawText(reviewQueue),
      needsHumanReview: true,
      reviewQueueCount: reviewQueue.length,
      warnings: []
    },
    signalSummary: {
      totals: Object.assign({}, sourceReport.totals || {}),
      feedbackReasons: topItems(sourceReport, "feedbackReasons"),
      driftSignals,
      noMatchCategories: topItems(sourceReport, "noMatchCategories"),
      topSelectedTools: topItems(sourceReport, "topSelectedTools"),
      topRoutedCategories: categories,
      topMissingInputs: topItems(sourceReport, "topMissingInputs"),
      confidenceBuckets: topItems(sourceReport, "confidenceBuckets")
    },
    reviewQueue,
    privacy: {
      syntheticPromptsOnly: true,
      rawPromptRequired: false,
      rawPromptIncluded: false,
      sourceReportRawPromptDetected: hasRawText(sourceReport),
      generatedQueueRawPromptDetected: hasRawText(reviewQueue),
      safeForEvalSeedReview: !hasRawText(reviewQueue)
    },
    nextActions: [
      "Review high-priority queue items.",
      "Replace each redacted prompt placeholder with a synthetic prompt written from the aggregate bucket.",
      "Add approved cases to data/ai/routing-eval-fixtures.json or manifest synonyms.",
      "Run npm run test:ai and eval:ai-tool-calls before prompt or provider promotion."
    ]
  };
  if (report.privacy.sourceReportRawPromptDetected) {
    report.gate.passed = false;
    report.gate.warnings.push("Input report appears to contain raw or private text; export only sanitized aggregate analytics before generating eval intake.");
  }
  if (!reviewQueue.length) {
    report.gate.warnings.push("No drift queue items were generated from the supplied aggregate report.");
  }
  return report;
}

function writeReport(filePath, report) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2) + "\n");
}

function main() {
  const args = process.argv.slice(2);
  const inputIndex = args.indexOf("--input");
  const outputIndex = args.indexOf("--output");
  const input = inputIndex >= 0 && args[inputIndex + 1] ? args[inputIndex + 1] : DEFAULT_INPUT;
  const output = outputIndex >= 0 && args[outputIndex + 1] ? path.resolve(args[outputIndex + 1]) : DEFAULT_OUTPUT;
  const report = buildReport({ input });
  if (args.includes("--write")) writeReport(output, report);
  if (args.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("AfroTools AI drift intake: " + (report.gate.passed ? "passed" : "failed"));
    console.log("Review queue: " + report.gate.reviewQueueCount + " items");
    console.log("Input: " + report.source.inputPath);
    console.log("Output: " + output);
  }
  if (!report.gate.passed) process.exitCode = 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  buildReport,
  hasRawText,
  priorityFor,
  uniqueQueue
};
