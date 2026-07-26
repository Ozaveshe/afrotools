#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const REGISTRY = path.join(ROOT, "assets", "js", "components", "tool-registry.js");
const ARTIFACT_DIR = path.join(ROOT, "artifacts", "day5-health-release-audit");
const REPORT_JSON = path.join(ARTIFACT_DIR, "report.json");
const REPORT_MD = path.join(ARTIFACT_DIR, "report.md");
const BASE_URL = "http://127.0.0.1:4182";

// Individual VIP receipts exist for these routes. Generic release failures here are
// regressions against an accepted route; all other route failures remain expected
// unreviewed gaps. This list does not grant or replace individual acceptance.
const ACCEPTED_ROUTES = new Set([
  "/tools/medical-report/",
  "/tools/drug-dosage/",
  "/tools/maternal-mortality/",
  "/tools/sickle-cell/",
  "/tools/genotype-checker/",
  "/tools/blood-group/",
  "/tools/vaccine-schedule/",
  "/tools/child-growth/",
  "/health/pregnancy-due-date/",
  "/tools/due-date/",
  "/tools/ovulation-calc/",
  "/tools/pregnancy-nutrition/",
  "/tools/breastfeeding-tracker/",
  "/tools/csection-vs-natural/",
  "/tools/childbirth-cost/",
  "/tools/blood-pressure/",
  "/tools/diabetes-risk/",
  "/health/bmi-calculator/",
  "/tools/bmi-calculator/",
  "/tools/waist-hip-ratio/",
  "/tools/water-intake/",
  "/tools/malaria-risk/",
  "/tools/cholera-risk/",
  "/tools/ebola-checklist/",
  "/tools/water-quality/",
  "/tools/hiv-treatment-cost/",
  "/tools/tb-tracker/",
  "/tools/hep-b-screening/",
  "/tools/african-meal-plan/",
  "/tools/home-workout/",
  "/tools/gym-cost-compare/",
  "/tools/pharmacy-prices/",
  "/tools/drug-price-compare/",
  "/tools/dental-cost/",
  "/tools/eye-care-cost/",
  "/tools/mental-health-cost/",
  "/tools/traditional-vs-western/",
  "/tools/medical-tourism/",
  "/health/calorie-counter/",
  "/tools/calorie-counter/",
  "/tools/hospital-cost/",
  "/tools/clinic-costs/"
]);

function field(line, key) {
  const match = line.match(new RegExp("\\b" + key + ":\\s*(['\"])(.*?)\\1"));
  return match ? match[2] : "";
}

function registryHealthRoutes() {
  const source = fs.readFileSync(REGISTRY, "utf8");
  const rows = source.split(/\r?\n/).filter(function (line) {
    return /category:\s*['"]health['"]/.test(line) && !/\blang:\s*['"]/.test(line);
  }).map(function (line) {
    return {
      id: field(line, "id"),
      name: field(line, "name"),
      route: field(line, "href")
    };
  });
  const ids = new Set(rows.map(row => row.id));
  const routes = new Set(rows.map(row => row.route));
  if (rows.length !== 42 || ids.size !== 42 || routes.size !== 42 || rows.some(row => !row.id || !row.name || !row.route)) {
    throw new Error("Expected exactly 42 unique English Health registry routes; found rows=" + rows.length + ", ids=" + ids.size + ", routes=" + routes.size + ".");
  }
  return rows;
}

function routeFile(route) {
  const clean = route.replace(/^\/+|\/+$/g, "");
  return path.join(ROOT, clean, "index.html");
}

function textContent(value) {
  return String(value || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function attr(html, tag, name) {
  const tagMatch = html.match(new RegExp("<" + tag + "\\b[^>]*>", "i"));
  if (!tagMatch) return "";
  const valueMatch = tagMatch[0].match(new RegExp("\\b" + name + "\\s*=\\s*(['\"])(.*?)\\1", "i"));
  return valueMatch ? valueMatch[2].trim() : "";
}

function addFailure(list, code, message, evidence) {
  list.push({ code, message, evidence: evidence || "" });
}

function staticAudit(row) {
  const file = routeFile(row.route);
  const failures = [];
  if (!fs.existsSync(file)) {
    addFailure(failures, "STATIC_ENTRY_MISSING", "Registry route has no local index.html.", path.relative(ROOT, file));
    return { file: path.relative(ROOT, file), failures };
  }
  const html = fs.readFileSync(file, "utf8");
  const visibleText = textContent(html);
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = textContent(titleMatch && titleMatch[1]);
  const descriptionTag = html.match(/<meta\b[^>]*\bname\s*=\s*(['"])description\1[^>]*>/i);
  const description = descriptionTag ? attr(descriptionTag[0], "meta", "content") : "";
  const canonicalTag = html.match(/<link\b[^>]*\brel\s*=\s*(['"])canonical\1[^>]*>/i);
  const canonical = canonicalTag ? attr(canonicalTag[0], "link", "href") : "";
  const expectedCanonical = "https://afrotools.com" + row.route;
  const mainCount = (html.match(/<main\b/gi) || []).length;
  const controlCount = (html.match(/<(?:button|input|select|textarea)\b/gi) || []).length;
  const hasGoogleFont = /fonts\.(?:googleapis|gstatic)\.com/i.test(html);
  const hasLocalTypography = !hasGoogleFont && (
    /<link\b[^>]*href\s*=\s*(['"])\/assets\/(?:css|fonts)\/[^'"]+\.css(?:\?[^'"]*)?\1/i.test(html) ||
    /(?:font-family\s*:|html\s*\{[^}]*\bfont\s*:)[^;}]*(?:DM Sans|system-ui|Segoe UI|-apple-system)/i.test(html)
  );
  const hasPrivacyBoundary = /(stays?|remains?|kept|runs?)\s+(?:in|on)\s+(?:this\s+)?(?:browser|device)|(stays?|remains?)\s+local|local[- ]first|(?:not|no|nothing)\b.{0,120}\b(?:sent|uploaded|shared|stored|saved|transmitted)|\blocal(?:ly)?\b.{0,80}\b(?:browser|export|download|private|privacy|saved|stored|transmitted)|privacy|explicit\s+consent/i.test(visibleText);
  const hasExportSurface = /\b(?:pdf|download|export|save)\b/i.test(visibleText);
  const hasStaleGateClaim = /email[- ]gated|unlock(?:ed)?\s+(?:a\s+)?pdf|capture[- ]lead|lead\s+gate/i.test(visibleText + " " + html);

  if (mainCount !== 1) addFailure(failures, "STATIC_MAIN_COUNT", "Expected exactly one <main> landmark.", String(mainCount));
  if (title.length < 10 || title.length > 65) addFailure(failures, "STATIC_TITLE_BOUNDS", "Title length must be 10–65 characters.", title.length + ": " + title);
  if (description.length < 50 || description.length > 170) addFailure(failures, "STATIC_DESCRIPTION_BOUNDS", "Meta description length must be 50–170 characters.", description.length + ": " + description);
  if (canonical !== expectedCanonical) addFailure(failures, "STATIC_CANONICAL", "Canonical must exactly match the English registry route.", canonical || "(missing)");
  if (!hasLocalTypography || hasGoogleFont) addFailure(failures, "STATIC_TYPOGRAPHY", "Page must load local CSS typography and contain no Google Fonts reference.", "local=" + hasLocalTypography + ", google=" + hasGoogleFont);
  if (controlCount < 1) addFailure(failures, "STATIC_PRIMARY_CONTROL", "No native primary form/button control was found.", String(controlCount));
  if (!hasPrivacyBoundary || !hasExportSurface || hasStaleGateClaim) {
    addFailure(
      failures,
      "STATIC_PRIVACY_EXPORT_BOUNDARY",
      "Page needs a truthful local/consented privacy and export boundary without stale gate claims.",
      "privacy=" + hasPrivacyBoundary + ", export=" + hasExportSurface + ", staleGate=" + hasStaleGateClaim
    );
  }
  return {
    file: path.relative(ROOT, file).replace(/\\/g, "/"),
    metrics: {
      titleLength: title.length,
      descriptionLength: description.length,
      canonical,
      mainCount,
      controlCount,
      hasLocalTypography,
      hasGoogleFont,
      hasPrivacyBoundary,
      hasExportSurface,
      hasStaleGateClaim
    },
    failures
  };
}

function waitForServer(url, timeoutMs) {
  const started = Date.now();
  return new Promise(function (resolve, reject) {
    (function poll() {
      fetch(url, { redirect: "manual" }).then(function (response) {
        if (response.status >= 200 && response.status < 500) return resolve();
        throw new Error("HTTP " + response.status);
      }).catch(function () {
        if (Date.now() - started > timeoutMs) return reject(new Error("Timed out waiting for " + url));
        setTimeout(poll, 150);
      });
    })();
  });
}

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function browserFailure(code, message, evidence) {
  return { code, message, evidence: evidence || "" };
}

async function browserAudit(rows) {
  const { chromium } = require("@playwright/test");
  const server = spawn(process.execPath, ["tests/support/static-server.js"], {
    cwd: ROOT,
    env: Object.assign({}, process.env, {
      PORT: "4182",
      AFROTOOLS_LOCAL_SKIP_DATA_STORE_WRITES: "1"
    }),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
  let serverError = "";
  server.stderr.on("data", chunk => { serverError += chunk.toString(); });
  let browser;
  try {
    await waitForServer(BASE_URL + "/health/", 20000);
    browser = await chromium.launch({ headless: true });
    const results = [];
    for (const row of rows) {
      const context = await browser.newContext({
        viewport: { width: 320, height: 760 },
        colorScheme: "dark",
        serviceWorkers: "block"
      });
      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];
      const local404s = [];
      const googleFontRequests = [];
      page.on("console", message => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", error => pageErrors.push(error.message));
      page.on("request", request => {
        if (/fonts\.(?:googleapis|gstatic)\.com/i.test(request.url())) googleFontRequests.push(request.url());
      });
      page.on("response", response => {
        try {
          const url = new URL(response.url());
          if (url.origin === BASE_URL && response.status() === 404) local404s.push(url.pathname);
        } catch (_) {}
      });
      const failures = [];
      let response = null;
      try {
        response = await page.goto(BASE_URL + row.route, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(450);
      } catch (error) {
        addFailure(failures, "BROWSER_NAVIGATION", "Route did not render within the browser audit timeout.", error.message);
      }
      if (!response || response.status() !== 200) {
        addFailure(failures, "BROWSER_HTTP", "Expected a 200 document response.", response ? String(response.status()) : "(no response)");
      }
      if (response) {
        const runtime = await page.evaluate(function () {
          function visible(element) {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
          }
          function accessibleName(element) {
            if (element.getAttribute("aria-label")) return element.getAttribute("aria-label").trim();
            if (element.getAttribute("aria-labelledby")) {
              return element.getAttribute("aria-labelledby").split(/\s+/).map(function (id) {
                const owner = document.getElementById(id);
                return owner ? owner.textContent.trim() : "";
              }).join(" ").trim();
            }
            if (element.id) {
              const label = document.querySelector('label[for="' + CSS.escape(element.id) + '"]');
              if (label) return label.textContent.trim();
            }
            if (element.closest("label")) return element.closest("label").textContent.trim();
            if (element.tagName === "INPUT" && element.type === "submit") return element.value.trim();
            return element.textContent.trim();
          }
          function rgbLight(value) {
            const match = String(value || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
            if (!match || match[4] === "0") return null;
            return (Number(match[1]) + Number(match[2]) + Number(match[3])) / 3;
          }
          const controls = Array.from(document.querySelectorAll("button,input:not([type=hidden]),select,textarea,[role=button]")).filter(function (element) {
            return visible(element) && !element.closest("afro-navbar,afro-footer,afro-related-tools,.health-action-kit,.related-tools-ssr");
          });
          const unnamed = controls.filter(element => !accessibleName(element));
          const surfaces = [document.body, document.querySelector("main"), document.querySelector(".tool-main,.app-main,.cgv-main,.bgv-main")].filter(Boolean);
          return {
            mainCount: document.querySelectorAll("main").length,
            visiblePrimaryControls: controls.length,
            unnamedPrimaryControls: unnamed.length,
            unnamedSamples: unnamed.slice(0, 5).map(element => element.outerHTML.slice(0, 180)),
            overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            theme: document.documentElement.getAttribute("data-theme") || "",
            surfaceLightness: surfaces.map(element => rgbLight(getComputedStyle(element).backgroundColor)).filter(value => value !== null),
            title: document.title,
            textLength: (document.body.innerText || "").trim().length
          };
        });
        if (runtime.textLength < 80) addFailure(failures, "BROWSER_RENDER", "Rendered body text is unexpectedly empty.", String(runtime.textLength));
        if (runtime.mainCount !== 1) addFailure(failures, "BROWSER_MAIN_COUNT", "Expected exactly one rendered main landmark.", String(runtime.mainCount));
        if (runtime.visiblePrimaryControls < 1) addFailure(failures, "BROWSER_PRIMARY_CONTROL", "No visible app-owned primary control was found.", String(runtime.visiblePrimaryControls));
        if (runtime.unnamedPrimaryControls > 0) addFailure(failures, "BROWSER_UNNAMED_CONTROL", "Visible app-owned controls need accessible names.", JSON.stringify(runtime.unnamedSamples));
        if (runtime.overflowPx > 1) addFailure(failures, "BROWSER_320_OVERFLOW", "Page has horizontal overflow at 320px.", runtime.overflowPx + "px");
        if (runtime.theme !== "dark" && !runtime.surfaceLightness.some(value => value < 160)) {
          addFailure(failures, "BROWSER_DARK_SURFACE", "Dark preference did not produce a dark page surface.", "theme=" + runtime.theme + ", lightness=" + runtime.surfaceLightness.join(","));
        }
      }
      for (const message of unique(consoleErrors).slice(0, 10)) failures.push(browserFailure("BROWSER_CONSOLE_ERROR", "Console error.", message));
      for (const message of unique(pageErrors).slice(0, 10)) failures.push(browserFailure("BROWSER_PAGE_ERROR", "Uncaught page error.", message));
      for (const url of unique(local404s).slice(0, 10)) failures.push(browserFailure("BROWSER_LOCAL_404", "Local asset or route returned 404.", url));
      for (const url of unique(googleFontRequests).slice(0, 10)) failures.push(browserFailure("BROWSER_GOOGLE_FONT", "Page requested Google Fonts instead of local typography.", url));
      results.push({ id: row.id, route: row.route, failures });
      await context.close();
    }
    return results;
  } finally {
    if (browser) await browser.close();
    if (!server.killed) server.kill();
    if (serverError && /EADDRINUSE|uncaught/i.test(serverError)) process.stderr.write(serverError);
  }
}

function countBy(items, selector) {
  return items.reduce(function (counts, item) {
    const key = selector(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function finalize(rows, staticResults, browserResults, mode) {
  const browserByRoute = new Map((browserResults || []).map(result => [result.route, result]));
  const routeResults = rows.map(function (row, index) {
    const staticResult = staticResults[index];
    const browserResult = browserByRoute.get(row.route);
    const failures = staticResult.failures.concat(browserResult ? browserResult.failures : []);
    const acceptanceScope = ACCEPTED_ROUTES.has(row.route) ? "accepted-vip-route" : "unreviewed-route";
    let verdict;
    if (!failures.length) verdict = acceptanceScope === "accepted-vip-route" ? "accepted-generic-pass" : "unreviewed-generic-pass";
    else verdict = acceptanceScope === "accepted-vip-route" ? "accepted-route-regression" : "expected-unreviewed-gap";
    return {
      id: row.id,
      name: row.name,
      route: row.route,
      file: staticResult.file,
      acceptanceScope,
      verdict,
      staticMetrics: staticResult.metrics || {},
      failures
    };
  });
  const summary = {
    registryRoutes: rows.length,
    acceptedRoutes: routeResults.filter(row => row.acceptanceScope === "accepted-vip-route").length,
    unreviewedRoutes: routeResults.filter(row => row.acceptanceScope === "unreviewed-route").length,
    genericPasses: routeResults.filter(row => row.failures.length === 0).length,
    routesWithFailures: routeResults.filter(row => row.failures.length > 0).length,
    acceptedRegressions: routeResults.filter(row => row.verdict === "accepted-route-regression").length,
    expectedUnreviewedGaps: routeResults.filter(row => row.verdict === "expected-unreviewed-gap").length,
    failureCodes: countBy(routeResults.flatMap(row => row.failures), failure => failure.code)
  };
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    mode,
    sourceOfTruth: "assets/js/components/tool-registry.js English rows with category=health",
    genericAuditBoundary: "These checks are cross-route release signals only. A generic pass does not accept an unreviewed app and does not replace an individual functional, clinical, privacy or export receipt.",
    acceptedRouteBasis: ACCEPTED_ROUTES.size + " routes already carrying individual Day 5 VIP receipts are classified as accepted only for regression triage.",
    acceptedRouteList: Array.from(ACCEPTED_ROUTES),
    summary,
    routes: routeResults
  };
}

function markdown(report) {
  const lines = [
    "# Day 5 Health release audit",
    "",
    "Generated: " + report.generatedAt,
    "",
    "## Proof boundary",
    "",
    report.genericAuditBoundary,
    "",
    "Route inventory is derived at runtime from `" + report.sourceOfTruth + "`. The harness requires exactly 42 unique English Health routes.",
    "",
    "## Summary",
    "",
    "- Mode: `" + report.mode + "`",
    "- Registry routes: **" + report.summary.registryRoutes + "**",
    "- Previously accepted VIP routes: **" + report.summary.acceptedRoutes + "**",
    "- Unreviewed routes: **" + report.summary.unreviewedRoutes + "**",
    "- Generic passes: **" + report.summary.genericPasses + "**",
    "- Routes with failures: **" + report.summary.routesWithFailures + "**",
    "- Regressions in accepted routes: **" + report.summary.acceptedRegressions + "**",
    "- Expected gaps in unreviewed routes: **" + report.summary.expectedUnreviewedGaps + "**",
    "",
    "## Route matrix",
    "",
    "| Route | Scope | Verdict | Failures |",
    "|---|---|---|---:|"
  ];
  for (const row of report.routes) {
    lines.push("| `" + row.route + "` | " + row.acceptanceScope + " | " + row.verdict + " | " + row.failures.length + " |");
  }
  lines.push("", "## Failures by route", "");
  for (const row of report.routes.filter(row => row.failures.length)) {
    lines.push("### `" + row.route + "` — " + row.verdict, "");
    for (const failure of row.failures) {
      lines.push("- `" + failure.code + "`: " + failure.message + (failure.evidence ? " Evidence: `" + failure.evidence.replace(/`/g, "'").slice(0, 500) + "`" : ""));
    }
    lines.push("");
  }
  lines.push("## Failure-code totals", "");
  for (const [code, count] of Object.entries(report.summary.failureCodes).sort()) {
    lines.push("- `" + code + "`: " + count);
  }
  lines.push("", "## Interpretation", "", "- `accepted-route-regression`: a generic release check failed on one of the " + ACCEPTED_ROUTES.size + " routes that already has an individual VIP receipt; investigate before grouped release.", "- `expected-unreviewed-gap`: a generic check failed on a route that has not received individual VIP treatment; this is backlog evidence, not a regression.", "- `unreviewed-generic-pass`: the route passed this harness only; it remains unaccepted until its individual functionality, medical boundaries, privacy and export behavior are reviewed.", "");
  return lines.join("\n");
}

function writeReport(report) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2) + "\n");
  fs.writeFileSync(REPORT_MD, markdown(report));
}

async function main() {
  const staticOnly = process.argv.includes("--static-only");
  const rows = registryHealthRoutes();
  const staticResults = rows.map(staticAudit);
  const browserResults = staticOnly ? [] : await browserAudit(rows);
  const report = finalize(rows, staticResults, browserResults, staticOnly ? "static-only" : "static-and-browser-320-dark");
  writeReport(report);
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(path.relative(ROOT, REPORT_JSON));
  console.log(path.relative(ROOT, REPORT_MD));
  // Audit findings are evidence, not a harness execution failure. Infrastructure
  // errors still throw and return non-zero.
}

if (require.main === module) {
  main().catch(function (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  ACCEPTED_ROUTES,
  registryHealthRoutes,
  staticAudit,
  finalize,
  markdown
};
