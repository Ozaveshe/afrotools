#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/localization/fr-trade-import-parity.json"), "utf8"));
const inventory = JSON.parse(fs.readFileSync(path.join(root, "reports/french-free-app-parity-inventory.json"), "utf8"));
const expected = inventory.rows.filter((row) => row.category === "Trade & Import");
const failures = [];
const aiSandbox = {};
vm.runInNewContext(
  fs.readFileSync(path.join(root, "assets/js/ai/french-route-map.generated.js"), "utf8"),
  aiSandbox
);
const aiRoutes = aiSandbox.AfroToolsAIFrenchRouteMap.routes;

if (expected.length !== 22) failures.push(`inventory denominator is ${expected.length}, expected 22`);
if (manifest.routes.length !== 22) failures.push(`manifest denominator is ${manifest.routes.length}, expected 22`);
if (new Set(manifest.routes.map((row) => row.id)).size !== 22) failures.push("manifest contains duplicate ids");

for (const row of manifest.routes) {
  const pagePath = path.join(root, row.french.replace(/^\/|\/$/g, ""), "index.html");
  if (!fs.existsSync(pagePath)) {
    failures.push(`${row.id}: French route missing`);
    continue;
  }
  const html = fs.readFileSync(pagePath, "utf8");
  if (!/<html[^>]+lang=["']fr(?:-|["'])/i.test(html)) failures.push(`${row.id}: lang is not French`);
  if (/iframe[^>]+(?:\/tools\/|afrotools\.com\/tools\/)/i.test(html)) failures.push(`${row.id}: English iframe detected`);
  if (!html.includes(`https://afrotools.com${row.french}`)) failures.push(`${row.id}: self canonical missing`);
  if (!html.includes(`hreflang="en"`) || !html.includes(`https://afrotools.com${row.english}`)) {
    failures.push(`${row.id}: English hreflang missing`);
  }
  if (aiRoutes[row.english] !== row.french) {
    failures.push(`${row.id}: French AI route map mismatch`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("French Trade parity static contract: 22/22 routes reconciled.");
