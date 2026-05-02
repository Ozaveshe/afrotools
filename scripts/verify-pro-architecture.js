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
  "property-projects"
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

function assertIds(label, actual, expected) {
  const actualIds = actual.map((app) => app.id).sort();
  const expectedIds = expected.slice().sort();
  if (actualIds.join("|") !== expectedIds.join("|")) {
    addFailure(`${label} ids mismatch. Expected ${expectedIds.join(", ")}, got ${actualIds.join(", ")}`);
  }
}

assertIds("control app", controlApps, expectedControlIds);
assertIds("daily app", dailyApps, expectedDailyIds);

if (allApps.length !== 20) addFailure(`architecture expected 20 apps, got ${allApps.length}`);
if (summary.totalApps !== 20) addFailure(`summary.totalApps expected 20, got ${summary.totalApps}`);
if (summary.controlApps !== 10) addFailure(`summary.controlApps expected 10, got ${summary.controlApps}`);
if (summary.dailyApps !== 10) addFailure(`summary.dailyApps expected 10, got ${summary.dailyApps}`);
if (summary.appRoutesReady !== 20) addFailure(`summary.appRoutesReady expected 20, got ${summary.appRoutesReady}`);

const idSet = new Set();
allApps.forEach((app) => {
  if (idSet.has(app.id)) addFailure(`duplicate app id ${app.id}`);
  idSet.add(app.id);
});

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
