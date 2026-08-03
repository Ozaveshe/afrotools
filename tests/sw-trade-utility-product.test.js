"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const { PAGES, html } = require("../scripts/build-sw-trade-utility-pages.js");
const { localizedGeneratorEquivalent } = require("../scripts/lib/localized-generator-equivalence");
const runtime = require("../assets/js/pages/sw-trade-utility.js");
const engine = require("../engines/src/trade-utility-engine.js");

const required = {
  "proforma-invoice": ["sellerExportLicense", "buyerImportLicense", "sellerCountry", "buyerCountry", "deliveryTime", "packaging", "inspection", "shippingMarks", "items.unit"],
  "packing-list": ["notifyName", "vesselVoyage", "originCountry", "packages.marks", "packages.type"],
  "bol-generator": ["blType", "onBoardDate", "freightMode", "originals", "governingLaw", "cargo.containerNumber", "cargo.sealNumber"],
  "customs-time": ["country", "goodsType", "documentStatus", "cargoValue"],
  "shipping-weight": ["lengthCm", "widthCm", "heightCm", "actualKg", "shippingType"],
  "cross-border-data": ["matter", "legalBasis", "riskAssessment", "privateNotes", "sensitive", "children", "largeScale"]
};
const englishFields = {
  "proforma-invoice": ["sellerExportLicense", "buyerImportLicense", "piDelivery", "piPackaging", "piInspection", "piMarks"],
  "packing-list": ["notifyName", "plVessel", "plOrigin", "pct20", "pct40", "pct40hc"],
  "bol-generator": ["blType", "blOnBoardDate", "blFreightPayable", "blOriginals", "blJurisdiction", "blCargoBody"],
  "customs-time": ["CUSTOMS_DATA", "DOCS_BY_TYPE", "custTips", "custDocList"],
  "shipping-weight": ["pkgShipType", "divisors", "swCourierTable", "swTip"],
  "cross-border-data": ["data-workflow-field=\"matter\"", "data-workflow-evidence-list", "data-workflow-risk-list", "data-workflow-field=\"note\"", "data-workflow-save", "href=\"/dashboard/\""]
};

assert.equal(PAGES.length, 6);
assert.equal(runtime.PROFILES.length, 16);
assert.deepEqual(Object.keys(runtime.CUSTOMS).sort(), [
  "egypt", "ethiopia", "ghana", "kenya", "kenya_icd", "nigeria",
  "rwanda", "senegal", "southafrica", "tanzania"
]);
assert.deepEqual(Object.keys(runtime.DOCUMENTS).sort(), ["commercial", "electronics", "food", "personal", "pharma", "vehicles"]);

const registry = fs.readFileSync(path.join(ROOT, "assets/js/components/tool-registry.js"), "utf8");
const hashes = new Set();
for (const page of PAGES) {
  const outputFile = path.join(ROOT, ...page.route.split("/").filter(Boolean), "index.html");
  const sw = fs.readFileSync(outputFile, "utf8");
  const en = fs.readFileSync(path.join(ROOT, ...page.englishRoute.split("/").filter(Boolean), "index.html"), "utf8");

  assert.equal(localizedGeneratorEquivalent(sw, html(page)), true, `${page.id}: generated owner must be current`);
  assert.match(sw, /<html lang="sw">/);
  assert.match(sw, new RegExp(`rel="canonical" href="https://afrotools\\.com${page.route}"`));
  assert.match(sw, new RegExp(`hreflang="en" href="https://afrotools\\.com${page.englishRoute}"`));
  assert.match(sw, new RegExp(`hreflang="fr" href="https://afrotools\\.com${page.frenchRoute}"`));
  assert.match(en, new RegExp(`hreflang="sw" href="https://afrotools\\.com${page.route}"`));
  assert.match(sw, new RegExp(`data-sw-trade-app="${page.id}"`));
  assert.match(sw, /data-shared-ai-handoff/);
  assert.match(sw, /href="\/sw\/ai\/"/);
  assert.doesNotMatch(sw, /\?tool=|candidate route|acceptance ledger|route map|iframe/i);
  assert.match(sw, new RegExp(`/assets/img/tools/${page.id}\\.webp`));
  assert.match(registry, new RegExp(`id:\\s*['"]${page.id}['"][\\s\\S]{0,500}category:\\s*['"]trade['"]`));
  for (const field of required[page.id]) assert.ok(runtime.FIELD_MATRICES[page.id].includes(field), `${page.id}: missing ${field}`);
  for (const marker of englishFields[page.id]) assert.ok(en.includes(marker), `${page.id}: English owner missing ${marker}`);

  const artwork = fs.readFileSync(path.join(ROOT, "assets/img/tools", `${page.id}.webp`));
  const hash = crypto.createHash("sha256").update(artwork).digest("hex");
  assert.ok(!hashes.has(hash), `${page.id}: artwork duplicates another family member`);
  hashes.add(hash);
}

const runtimeSource = fs.readFileSync(path.join(ROOT, "assets/js/pages/sw-trade-utility.js"), "utf8");
assert.doesNotMatch(runtimeSource, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
assert.match(runtimeSource, /function setDirty[\s\S]*current=null[\s\S]*button\.disabled=true/);
assert.match(runtimeSource, /cleanSnapshot!==snapshot\(\)/);
assert.match(runtimeSource, /window\.jspdf|root\.jspdf/);
assert.match(runtimeSource, /afrotools-sw-cross-border-data/);

assert.deepEqual(engine.proformaTotals({
  items: [{ description: "Kahawa", quantity: 12, unitPrice: 80 }],
  freight: 120,
  insurance: 30
}), {
  items: [{ description: "Kahawa", quantity: 12, unitPrice: 80, total: 960 }],
  itemCount: 1,
  subtotal: 960,
  fob: 960,
  freight: 120,
  cfr: 1080,
  insurance: 30,
  cif: 1110,
  total: 1110
});
assert.equal(engine.shippingWeight({
  packages: 1,
  actualWeight: 8,
  length: 50,
  width: 40,
  height: 30,
  divisor: 5000
}).chargeableWeight, 12);
assert.equal(engine.customsClearanceModel({
  minimumDays: 5,
  typicalDays: 10,
  maximumDays: 20,
  documentStatus: "partial",
  goodsType: "food",
  cargoValue: 10000,
  agentRate: 0.012,
  storagePerDay: 35
}).typicalDays, 20);

console.log("Swahili Trade Utility product contracts: 6/6 product routes, 16 privacy regimes, exact matrices and shared-engine oracles passed.");
