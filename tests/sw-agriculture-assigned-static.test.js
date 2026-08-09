"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const routeEntry = require("../assets/js/pages/sw-ai-route-entry");
const routeMap = require("../assets/js/ai/swahili-route-map.generated");
const { assertLifecycle } = require("./support/swahili-acceptance-lifecycle");
const apps = [
  ["planting-calendar", "kalenda-ya-kupanda-mazao", "/tools/planting-calendar/"],
  ["fertilizer-calc", "kikokotoo-mbolea-rahisi", "/tools/fertilizer-calc/"],
  ["farm-budget", "bajeti-ya-shamba", "/agriculture/farm-budget/"],
  ["poultry-roi-calculator", "faida-ya-ufugaji-kuku", "/agriculture/poultry-roi/"],
  ["pesticide-dosage-calculator", "kipimo-cha-viuatilifu", "/agriculture/pesticide-dosage/"],
  ["soil-ph-calculator", "ph-ya-udongo", "/agriculture/soil-ph/"],
  ["farm-size-converter", "kigeuzi-cha-ukubwa-wa-shamba", "/agriculture/farm-size-converter/"],
  ["harvest-date-estimator", "makisio-tarehe-ya-mavuno", "/agriculture/harvest-date/"],
  ["coffee-calculator", "kikokotoo-kahawa", "/agriculture/coffee-calculator/"],
  ["cocoa-tracker", "kifuatiliaji-kakao", "/agriculture/cocoa-tracker/"],
  ["storage-loss", "hasara-za-uhifadhi", "/agriculture/storage-loss/"],
  ["crop-rotation-planner", "mpangilio-wa-mzunguko-wa-mazao", "/agriculture/crop-rotation/"],
  ["commodity-prices", "bei-za-mazao", "/agriculture/commodity-prices/"],
  ["cooperative-calculator", "kikokotoo-cha-ushirika", "/agriculture/cooperative-calculator/"],
  ["warehouse-receipt", "stakabadhi-ghalani", "/agriculture/warehouse-receipt/"],
  ["agric-profit", "faida-ya-kilimo", "/tools/agric-profit/"],
  ["crop-yield", "mavuno-ya-mazao", "/tools/crop-yield/"],
  ["export-docs", "nyaraka-za-usafirishaji-mazao", "/agriculture/export-docs/"],
  ["tractor-calculator", "kikokotoo-trekta", "/agriculture/tractor-calculator/"],
  ["crop-insurance", "bima-ya-mazao", "/agriculture/crop-insurance/"],
].map(([id, slug, en]) => ({ id, slug, en }));
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, "reports/swahili-free-app-parity-inventory.json"), "utf8"));
const acceptance = JSON.parse(fs.readFileSync(path.join(ROOT, "data/audits/swahili-free-app-acceptance.json"), "utf8"));
const assigned = apps.map((app) => inventory.rows.find((row) => row.englishId === app.id));
assert.strictEqual(assigned.length, 20, "exact Agriculture denominator");
assert.ok(assigned.every(Boolean), "all 20 immutable Agriculture IDs remain in inventory");
assert.strictEqual(apps.length, 20, "20 maintained configurations");
assert.deepStrictEqual(new Set(apps.map(app => app.id)), new Set(assigned.map(row => row.englishId)), "exact assigned English IDs");
assertLifecycle({
  inventory,
  acceptance,
  routeEntry,
  routeMap,
  apps: apps.map((app) => ({ id: app.id, swahiliRoute: `/sw/zana/${app.slug}/` })),
});
for (const app of apps) {
  const file = path.join(ROOT, "sw/zana", app.slug, "index.html");
  const html = fs.readFileSync(file, "utf8");
  assert.match(html, /<html\b[^>]*\blang="sw"/i, `${app.id}: native Swahili`);
  assert.match(html, /build-sw-agriculture-assigned-apps\.js/, `${app.id}: maintained owner`);
  assert.match(html, new RegExp(`canonical" href="https://afrotools\\.com/sw/zana/${app.slug}/`), `${app.id}: self canonical`);
  assert.match(html, new RegExp(`hreflang="en" href="https://afrotools\\.com${app.en.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}`), `${app.id}: English alternate`);
  assert.doesNotMatch(html, /<iframe\b/i, `${app.id}: no bridge`);
  for (const format of ["pdf","csv","json","txt"]) assert.match(html, new RegExp(`data-export="${format}"`), `${app.id}: ${format}`);
}
const runtime = fs.readFileSync(path.join(ROOT, "assets/js/pages/sw-agriculture-assigned-parity.js"), "utf8");
assert.doesNotMatch(runtime, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/, "local-only runtime");
assert.match(runtime, /latest=null;box\.hidden=true;output\.textContent=""/, "fail-closed stale result clearing");
assert.match(runtime, /p\.tool!==cfg\.id\|\|p\.locale!=="sw"/, "scoped JSON reopen");
console.log("sw-agriculture-assigned-static.test.js passed: exact 20 native generated candidates");
