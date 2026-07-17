#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const failures = [];

const expectedControlIds = [
  "payroll",
  "tax-compliance",
  "books",
  "hr",
  "trade-desk",
  "legal-desk",
  "grants-tenders",
  "creator-studio",
  "stream-intelligence",
  "property-projects",
  "seo-studio"
];

const expectedDailyIds = [
  "seller",
  "events",
  "beauty",
  "food-kitchen",
  "field-service",
  "school-academy",
  "clinic-desk",
  "faith-community",
  "agri-farmops",
  "life-admin"
];

function rel(file) {
  return path.join(root, file);
}

function addFailure(message) {
  failures.push(message);
}

function read(file) {
  return fs.readFileSync(rel(file), "utf8");
}

function routeToFile(route) {
  if (!route || !route.startsWith("/")) return null;
  const clean = route.replace(/^\/+/, "").replace(/\/+$/, "");
  if (/\.html$/i.test(clean)) return rel(clean);
  return rel(path.join(clean, "index.html"));
}

function hasProGate(file) {
  const html = fs.readFileSync(file, "utf8");
  return /<meta\s+name=["']pro-required["']\s+content=["']afrotools-pro["']/i.test(html) && /\/assets\/js\/pro-gate\.js/.test(html);
}

function runScript(file, context) {
  const code = read(file);
  vm.runInContext(code, context, { filename: file });
}

const context = { console };
context.window = context;
context.globalThis = context;
vm.createContext(context);

[
  "assets/js/lib/pro-app-registry.js",
  "assets/js/lib/pro-daily-os-registry.js",
  "assets/js/lib/pro-faith-community-route-state.js",
  "assets/js/lib/pro-architecture.js"
].forEach((file) => {
  try {
    runScript(file, context);
  } catch (err) {
    addFailure(`${file} failed to execute: ${err.message}`);
  }
});

const control = context.AfroProAppRegistry;
const daily = context.AfroProDailyOsRegistry;
const architecture = context.AfroProArchitecture;

if (!control) addFailure("AfroProAppRegistry was not exported");
if (!daily) addFailure("AfroProDailyOsRegistry was not exported");
if (!architecture) addFailure("AfroProArchitecture was not exported");

const controlApps = control && control.getApps ? control.getApps() : [];
const dailyApps = daily && daily.getApps ? daily.getApps() : [];
const allApps = architecture && architecture.getApps ? architecture.getApps() : [];
const summary = architecture && architecture.getSummary ? architecture.getSummary() : {};
const faithApp = daily && daily.getApp ? daily.getApp("faith-community") : null;

function assertIds(label, actual, expected) {
  const actualIds = actual.map((app) => app.id).sort();
  const expectedIds = expected.slice().sort();
  if (actualIds.join("|") !== expectedIds.join("|")) {
    addFailure(`${label} ids mismatch. Expected ${expectedIds.join(", ")}, got ${actualIds.join(", ")}`);
  }
}

assertIds("control app", controlApps, expectedControlIds);
assertIds("daily app", dailyApps, expectedDailyIds);

if (allApps.length !== 21) addFailure(`architecture expected 21 apps, got ${allApps.length}`);
if (summary.totalApps !== 21) addFailure(`summary.totalApps expected 21, got ${summary.totalApps}`);
if (summary.controlApps !== 11) addFailure(`summary.controlApps expected 11, got ${summary.controlApps}`);
if (summary.dailyApps !== 10) addFailure(`summary.dailyApps expected 10, got ${summary.dailyApps}`);
if (summary.appRoutesReady !== 21) addFailure(`summary.appRoutesReady expected 21, got ${summary.appRoutesReady}`);

const idSet = new Set();
allApps.forEach((app) => {
  if (idSet.has(app.id)) addFailure(`duplicate app id ${app.id}`);
  idSet.add(app.id);
});

if (!faithApp) {
  addFailure("Faith Community app metadata was not found");
} else {
  const requiredFaithLabels = [
    "Local preview only",
    "Device-only records",
    "No live reminders",
    "No account sync"
  ];
  const requiredFaithGaps = [
    "Event reminders",
    "Volunteer rota gaps",
    "Welfare follow-up gaps",
    "Giving and zakat ledger CSV exports",
    "Certificate packets",
    "Outreach exports"
  ];
  const requiredFaithSliceTerms = [
    "afrofaith_community_os_device_v1",
    "Member roster",
    "Giving and zakat ledger",
    "Event reminder queue",
    "Welfare follow-up queue",
    "Export CSV",
    "Need summary, no confidential details",
    "Device-only export. Not receipt, payment proof, tax proof, or account sync.",
    "does not sync records, send reminders, process payments, issue receipts, or contact members"
  ];
  const faithPrompt = daily.buildAgentPrompt ? daily.buildAgentPrompt(faithApp) : "";
  const faithHtml = read("pro/apps/faith-community/index.html");
  const faithRouteStateJs = read("assets/js/lib/pro-faith-community-route-state.js");

  requiredFaithLabels.forEach((label) => {
    if (!faithPrompt.includes(label)) addFailure(`Faith launch brief missing route-state label: ${label}`);
  });
  requiredFaithGaps.forEach((gap) => {
    if (!faithPrompt.includes(gap)) addFailure(`Faith launch brief missing workflow gap: ${gap}`);
  });
  if (!/member, giving\/zakat, volunteer, welfare, certificate, and outreach records stay on this device/i.test(faithPrompt)) {
    addFailure("Faith launch brief missing device-only privacy boundary");
  }
  if (!/pro-faith-community-route-state\.js/.test(faithHtml)) {
    addFailure("Faith route does not load pro-faith-community-route-state.js");
  }
  if (/&amp;amp;/.test(faithHtml)) {
    addFailure("Faith route has double-escaped ampersand text");
  }
  if (!/local preview Pro workspace/i.test(faithHtml)) {
    addFailure("Faith route description does not disclose local preview status");
  }
  requiredFaithSliceTerms.forEach((term) => {
    if (!faithRouteStateJs.includes(term)) addFailure(`Faith local slice missing required term: ${term}`);
  });
  if (/fetch\s*\(|AfroWorkspace|supabase\.|getSupabase|\/api\/workspace|\/api\/faith/i.test(faithRouteStateJs)) {
    addFailure("Faith local slice must not call network, workspace sync, or Supabase APIs");
  }
}

const legalHtml = read("pro/apps/legal/index.html");
[
  "storageBoundary",
  "reviewBoundary",
  "signatureBoundary",
  "reminderBoundary",
  "packetContents"
].forEach((token) => {
  if (!legalHtml.includes(token)) addFailure(`Legal Desk export packet missing boundary token: ${token}`);
});
if (/ready\/signed rows/i.test(legalHtml)) {
  addFailure("Legal Desk metric must not imply signed rows without e-signature proof");
}
if (!/legalTablesPresent:false/.test(legalHtml)) {
  addFailure("Legal Desk export packet must disclose that dedicated Legal Desk tables are not present");
}
if (!/lawyerReviewIncluded:false/.test(legalHtml)) {
  addFailure("Legal Desk export packet must disclose that lawyer review is not included");
}
if (!/serverReminderJobs:false/.test(legalHtml)) {
  addFailure("Legal Desk export packet must disclose that reminder delivery is not server-backed");
}

allApps.forEach((app) => {
  const file = routeToFile(app.route);
  if (!file || !fs.existsSync(file)) {
    addFailure(`missing route file for ${app.id}: ${app.route}`);
    return;
  }
  if (!hasProGate(file)) addFailure(`route is not Pro-gated: ${app.route}`);
  if (app.aliasRoute) {
    const aliasFile = routeToFile(app.aliasRoute);
    if (!aliasFile || !fs.existsSync(aliasFile)) addFailure(`missing alias route for ${app.id}: ${app.aliasRoute}`);
  }
});

const supportRoutes = control && control.getSupportRoutes ? control.getSupportRoutes() : [];
["vault", "team", "settings", "payroll-pack-support"].forEach((id) => {
  const route = supportRoutes.find((item) => item.id === id);
  if (!route) {
    addFailure(`missing support route ${id}`);
    return;
  }
  const file = routeToFile(route.route);
  if (!file || !fs.existsSync(file)) addFailure(`missing support route file for ${id}: ${route.route}`);
});

[
  "pro/workspace/index.html",
  "pro/apps/index.html"
].forEach((file) => {
  const html = read(file);
  if (!/pro-app-registry\.js/.test(html)) addFailure(`${file} does not load pro-app-registry.js`);
  if (!/pro-daily-os-registry\.js/.test(html)) addFailure(`${file} does not load pro-daily-os-registry.js`);
  if (!/pro-architecture\.js/.test(html)) addFailure(`${file} does not load pro-architecture.js`);
});

if (failures.length) {
  console.error("Pro architecture verification failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Pro architecture verification passed");
console.log(`- control apps: ${summary.controlApps}`);
console.log(`- daily apps: ${summary.dailyApps}`);
console.log(`- total apps: ${summary.totalApps}`);
console.log(`- app routes ready: ${summary.appRoutesReady}/${summary.totalApps}`);
console.log(`- backbone routes: ${summary.backboneReady}/${summary.backboneRoutes}`);
