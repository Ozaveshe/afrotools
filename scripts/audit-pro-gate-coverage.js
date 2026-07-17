#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "admin", "data", "pro-gate-coverage.json");

function walk(dir, files) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function hasProRequired(html) {
  return /<meta\s+name=["']pro-required["']/i.test(html) || /data-pro-required=/i.test(html);
}

function hasProGate(html) {
  return /\/assets\/js\/pro-gate\.js/i.test(html);
}

function hasNoindex(html) {
  return /<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
}

const files = walk(path.join(ROOT, "pro"), []).sort();
const routes = files.map(function (file) {
  const html = fs.readFileSync(file, "utf8");
  const route = rel(file);
  const publicMarketingPage = route === "pro/index.html";
  const successOrCancel = route === "pro/success/index.html" || route === "pro/cancel/index.html";
  const expectedGate = !publicMarketingPage && !successOrCancel;
  const item = {
    file: route,
    expectedGate,
    proRequired: hasProRequired(html),
    proGateScript: hasProGate(html),
    noindex: hasNoindex(html),
    status: "ok"
  };
  const issues = [];
  if (expectedGate && !item.proRequired) issues.push("missing pro-required meta");
  if (expectedGate && !item.proGateScript) issues.push("missing pro-gate script");
  if (!publicMarketingPage && !item.noindex) issues.push("missing noindex");
  if (issues.length) item.status = "fail";
  item.issues = issues;
  return item;
});

const summary = {
  generatedAt: new Date().toISOString(),
  totalRoutes: routes.length,
  gatedExpected: routes.filter((item) => item.expectedGate).length,
  passing: routes.filter((item) => item.status === "ok").length,
  failing: routes.filter((item) => item.status !== "ok").length
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ summary, routes }, null, 2) + "\n");

if (summary.failing) {
  console.error("Pro gate coverage has " + summary.failing + " failing routes. See " + rel(OUT));
  process.exit(1);
}

console.log("Pro gate coverage OK: " + summary.passing + "/" + summary.totalRoutes + " routes.");
