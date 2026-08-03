"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(ROOT, "assets", "js", "lib", "analytics.js"), "utf8");

function createContext({ consent = "accepted", pathname = "/tools/budget-planner/", toolId = "" } = {}) {
  const calls = [];
  const inputListeners = {};
  const windowListeners = {};
  const documentListeners = {};
  const inputCard = {
    querySelector(selector) {
      return selector === "input, select, textarea" ? { tagName: "INPUT" } : null;
    },
    querySelectorAll() { return []; },
    addEventListener(type, handler) { inputListeners[type] = handler; }
  };
  const document = {
    readyState: "complete",
    referrer: "",
    visibilityState: "visible",
    documentElement: { scrollHeight: 1000 },
    body: { classList: { contains(name) { return name === "tool-page"; } } },
    getElementById(id) { return id === "inputCard" ? inputCard : null; },
    querySelector(selector) {
      if (selector === 'meta[name="tool-id"]' && toolId) return { getAttribute() { return toolId; } };
      if (selector === 'meta[name="country-code"]') return null;
      return null;
    },
    addEventListener(type, handler) { documentListeners[type] = handler; }
  };
  const window = {
    location: { pathname, search: "" },
    innerHeight: 800,
    scrollY: 0,
    localStorage: { getItem(key) { return key === "afrotools_cookie_consent" ? consent : null; } },
    sessionStorage: { getItem() { return null; }, setItem() {} },
    gtag() { calls.push(Array.from(arguments)); },
    setTimeout(handler) { handler(); return 1; },
    clearTimeout() {},
    setInterval() { return 1; },
    clearInterval() {},
    addEventListener(type, handler) { windowListeners[type] = handler; }
  };
  const sandbox = { window, document, URL, URLSearchParams, Set, Date, console };
  vm.runInNewContext(source, sandbox, { filename: "analytics.js" });
  return { window, document, calls, inputListeners, windowListeners, documentListeners };
}

function events(context, name) {
  return context.calls.filter((call) => call[0] === "event" && (!name || call[1] === name));
}

const declined = createContext({ consent: "declined" });
declined.window.AfroTools.analytics.trackCalculation("budget-planner", "Nigeria", 750000, "NGN");
assert.deepStrictEqual(events(declined), [], "product events remain opt-in when analytics storage is denied");

const accepted = createContext();
accepted.window.AfroTools.analytics.trackCalculation("budget-planner", "Nigeria", 750000, "NGN");
const calculation = events(accepted, "calculation_complete")[0][2];
assert.strictEqual(calculation.value_bucket, "500k-2M", "financial inputs are reduced to a bounded bucket");
assert.strictEqual(calculation.currency, "NGN", "currency is retained as safe segmentation metadata");
assert.ok(!("value" in calculation), "raw financial values never enter analytics payloads");
assert.ok(!("salary_bucket" in calculation), "the legacy salary-specific parameter is retired for non-salary calculators");

accepted.window.AfroTools.analytics.trackError("budget-planner", "validation", "private@example.com failed");
const error = events(accepted, "tool_error")[0][2];
assert.strictEqual(error.error_message_length, 26, "errors retain only their length");
assert.ok(!JSON.stringify(error).includes("private@example.com"), "raw error content never enters analytics payloads");

accepted.window.AfroTools.analytics.trackSearch("private@example.com", 3, "navbar");
const search = events(accepted, "search_query")[0][2];
assert.strictEqual(search.query_length, 19, "searches retain only query length");
assert.ok(!("query" in search), "raw search terms never enter analytics payloads");
assert.strictEqual(accepted.window.AfroTools.analytics.track("Invalid Event Name!", {}), false, "invalid GA4 event names are rejected");

const genericTool = createContext({ pathname: "/tools/budget-planner/" });
genericTool.inputListeners.focus({ target: { tagName: "INPUT", type: "text", value: "" } });
const genericStart = events(genericTool, "calculation_started")[0][2];
assert.strictEqual(genericStart.tool_slug, "budget-planner", "generic tool routes use the actual tool slug");
assert.strictEqual(genericStart.country_code, "unknown", "the /tools segment is never misreported as country TO");

const localizedTool = createContext({ pathname: "/sw/kenya/kikokotoo-kodi-mshahara/", toolId: "ke-paye-sw" });
localizedTool.inputListeners.focus({ target: { tagName: "INPUT", type: "text", value: "" } });
const localizedStart = events(localizedTool, "calculation_started")[0][2];
assert.strictEqual(localizedStart.tool_slug, "ke-paye-sw", "tool metadata wins over translated route slugs");
assert.strictEqual(localizedStart.country_code, "KE", "localized country routes resolve to ISO country codes");

console.log("analytics-library.test.js passed");
