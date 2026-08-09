"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "data/localization/sw-trade-import-parity.json"), "utf8"));
const generated = require("../scripts/build-sw-trade-regional-parity.js").pages;
const core = require("../scripts/build-sw-trade-core-parity.js").apps;
const regionalOwner = fs.readFileSync(path.join(ROOT, "scripts/build-sw-trade-regional-parity.js"), "utf8");
const coreOwner = fs.readFileSync(path.join(ROOT, "scripts/build-sw-trade-core-parity.js"), "utf8");
const registry = fs.readFileSync(path.join(ROOT, "assets/js/components/tool-registry.js"), "utf8");
const hub = fs.readFileSync(path.join(ROOT, "sw/biashara-ya-nje/index.html"), "utf8");
const runtime = fs.readFileSync(path.join(ROOT, "assets/js/pages/sw-trade-regional-parity.js"), "utf8");
const styles = fs.readFileSync(path.join(ROOT, "assets/css/sw-trade-regional-parity.css"), "utf8");

assert.strictEqual(manifest.routes.length, 16, "exact assigned unaccepted Trade denominator");
assert.strictEqual(new Set(manifest.routes.map((row) => row.id)).size, 16, "unique assigned Trade ids");
assert.strictEqual(generated.length, 5, "five regional shared-engine candidates");
assert.strictEqual(core.length, 11, "eleven core shared-engine candidates");
assert.match(regionalOwner, /if \(require\.main === module\) main\(\);/, "regional owner import must be read-only");
assert.match(coreOwner, /if \(require\.main === module\) main\(\);/, "core owner import must be read-only");

for (const row of manifest.routes) {
  const relative = `${row.swahili.replace(/^\//, "")}index.html`;
  const html = fs.readFileSync(path.join(ROOT, relative), "utf8");
  assert.match(html, /<html[^>]+lang="sw"/, `${row.id}: native Swahili document`);
  assert.match(html, new RegExp(`rel="canonical" href="https://afrotools\\.com${row.swahili.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `${row.id}: self canonical`);
  assert.doesNotMatch(html, /<iframe\b/i, `${row.id}: no iframe transplant`);
}

for (const page of core) {
  const relative = `sw/zana/${page.slug}/index.html`;
  const html = fs.readFileSync(path.join(ROOT, relative), "utf8");
  assert.match(html, /afrotools-source-owner" content="scripts\/build-sw-trade-core-parity\.js"/, `${page.id}: durable core owner`);
  assert.match(html, /data-sw-trade-core/, `${page.id}: native runtime root`);
  assert.match(html, /data-export="pdf"/, `${page.id}: PDF export`);
  assert.match(html, /data-export="csv"/, `${page.id}: CSV export`);
  assert.match(html, /data-export="json"/, `${page.id}: JSON export`);
  assert.match(html, /data-export="txt"/, `${page.id}: TXT export`);
  assert.match(html, /data-import/, `${page.id}: JSON reopen`);
  assert.match(html, new RegExp(`/assets/img/tools/${page.id}\\.webp`), `${page.id}: dedicated artwork`);
  assert.ok(fs.existsSync(path.join(ROOT, "assets/img/tools", `${page.id}.webp`)), `${page.id}: artwork exists`);
  const english = fs.readFileSync(path.join(ROOT, page.en.replace(/^\//, ""), "index.html"), "utf8");
  assert.match(english, new RegExp(`hreflang="sw" href="https://afrotools\\.com/sw/zana/${page.slug}/"`), `${page.id}: English reciprocity`);
}

for (const page of generated) {
  const relative = `sw/zana/${page.slug}/index.html`;
  const html = fs.readFileSync(path.join(ROOT, relative), "utf8");
  assert.match(html, /<html\b[^>]*\blang="sw"[^>]*>/, `${page.id}: native locale`);
  assert.match(html, /afrotools-source-owner" content="scripts\/build-sw-trade-regional-parity\.js"/, `${page.id}: durable owner`);
  assert.match(html, new RegExp(`rel="canonical" href="https://afrotools\\.com/sw/zana/${page.slug}/"`), `${page.id}: canonical`);
  assert.match(html, new RegExp(`hreflang="en" href="https://afrotools\\.com${page.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `${page.id}: English alternate`);
  assert.match(html, /hreflang="sw"/, `${page.id}: Swahili alternate`);
  assert.match(html, /application\/ld\+json/, `${page.id}: schema`);
  assert.match(html, new RegExp(`/assets/img/tools/${page.image}`), `${page.id}: dedicated artwork`);
  assert.ok(fs.existsSync(path.join(ROOT, "assets/img/tools", page.image)), `${page.id}: artwork exists`);
  assert.match(html, /data-trade-form/, `${page.id}: functional form`);
  assert.match(html, /data-export="pdf"/, `${page.id}: PDF export`);
  assert.match(html, /data-export="csv"/, `${page.id}: CSV export`);
  assert.match(html, /data-export="json"/, `${page.id}: JSON export`);
  assert.match(html, /data-import-json/, `${page.id}: JSON reopen`);
  assert.match(html, /Hakuna akaunti, upload au AI inayohitajika/, `${page.id}: local privacy boundary`);
  assert.match(registry, new RegExp(`href: ["']${page.en === "/tools/sadc-roo/" ? "/sw/zana/kanuni-za-asili-sadc/" : `/sw/zana/${page.slug}/`}["']`), `${page.id}: registry discovery`);
  assert.match(hub, new RegExp(`href="/sw/zana/${page.slug}/"`), `${page.id}: category hub discovery`);
  const english = fs.readFileSync(path.join(ROOT, page.en.replace(/^\//, ""), "index.html"), "utf8");
  assert.match(english, new RegExp(`hreflang="sw" href="https://afrotools\\.com/sw/zana/${page.slug}/"`), `${page.id}: English reciprocity`);
}

assert.doesNotMatch(runtime, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/, "runtime makes no network request");
const coreRuntime = fs.readFileSync(path.join(ROOT, "assets/js/pages/sw-trade-core-parity.js"), "utf8");
assert.doesNotMatch(coreRuntime, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/, "core runtime makes no network request");
assert.match(coreRuntime, /latest=null;box\.hidden=true;output\.textContent=""/, "core invalid/reset clears stale output");
assert.match(coreRuntime, /p\.tool!==cfg\.id\|\|p\.locale!=="sw"/, "core reopen is locale and owner scoped");
assert.match(runtime, /lastReport = null; resultBox\.hidden = true; summary\.textContent = ""/, "invalid submit clears stale output");
assert.match(runtime, /data\.locale !== "sw"/, "reopen is locale and owner scoped");
assert.match(styles, /prefers-color-scheme:dark/, "system dark mode fallback");
assert.match(styles, /max-width:420px/, "small-mobile layout contract");
assert.match(styles, /focus-visible/, "visible keyboard focus contract");

const context = { console };
context.window = context;
vm.createContext(context);
for (const relative of [
  "data/trade/landed-cost-data.js", "engines/src/landed-cost-engine.js",
  "data/trade/commodity-trade-data.js", "engines/src/commodity-engine.js",
  "engines/src/ecowas-levy-engine.js", "engines/src/sadc-roo-engine.js", "engines/src/eac-cet-engine.js"
]) vm.runInContext(fs.readFileSync(path.join(ROOT, relative), "utf8"), context, { filename: relative });

const landed = context.LandedCostEngine.calculate({ destCountry: "KE", port: "KEMBA", fobUSD: 10000, freightUSD: 1200, insuranceUSD: 200, dutyRate: 25, quantity: 10, fxRate: 130 });
assert.ok(landed.totalLandedUSD > landed.cifUSD && landed.perUnitLocal > 0, "landed-cost shared engine oracle");
assert.ok(context.CommodityEngine.getRankedList("KE", "exports", null).length > 0, "commodity shared engine oracle");
const ecowas = context.EcowasLevyEngine.calculate({ cifValue: 10000, fobValue: 9500, cetBand: 3, countryCode: "NG", hsCode: "", isEtls: false });
assert.ok(ecowas.totalLandedCost > 10000 && ecowas.breakdown.length >= 3, "ECOWAS shared engine oracle");
const sadc = context.SadcRooEngine.checkOrigin({ hsChapter: 9, exportCountry: "TZ", importCountry: "ZA", exWorksPrice: 10000, nonSadcCost: 4000, whollyObtained: true, hasCTH: false, hasFabricFwd: false });
assert.ok(Array.isArray(sadc.checks) && sadc.checks.length > 0, "SADC shared engine oracle");
const eac = context.EacCetEngine.calculate({ cifValue: 10000, cetRate: 25, countryCode: "KE" });
assert.ok(eac.totalLanded > 10000 && eac.breakdown.length >= 3, "EAC shared engine oracle");

console.log("sw-trade-remaining-static.test.js passed: exact 16 assigned rows reconciled through 5 regional and 11 core generated owners");
