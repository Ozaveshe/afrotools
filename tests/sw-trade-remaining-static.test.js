"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "data/localization/sw-trade-import-parity.json"), "utf8"));
const generated = require("../scripts/build-sw-trade-regional-parity.js").pages;
const registry = fs.readFileSync(path.join(ROOT, "assets/js/components/tool-registry.js"), "utf8");
const hub = fs.readFileSync(path.join(ROOT, "sw/biashara-ya-nje/index.html"), "utf8");
const runtime = fs.readFileSync(path.join(ROOT, "assets/js/pages/sw-trade-regional-parity.js"), "utf8");
const styles = fs.readFileSync(path.join(ROOT, "assets/css/sw-trade-regional-parity.css"), "utf8");

assert.strictEqual(manifest.routes.length, 22, "exact central Trade denominator");
assert.strictEqual(new Set(manifest.routes.map((row) => row.id)).size, 22, "unique Trade ids");
assert.strictEqual(manifest.routes.filter((row) => row.state === "accepted-prior").length, 6, "six prior accepted routes retained");
assert.strictEqual(generated.length, 4, "four regional shared-engine candidates");

const priorHashes = {
  "sw/zana/ankara-proforma/index.html": "d8c585b7788a23eb7e7b3806358843a0432aff4d1ff1c94fee067c51fb7651fc",
  "sw/zana/orodha-ya-kupakia/index.html": "648ec26baf9ccd97f8eb673da08e62ca44c106fe447079b5d9827543a94b0dbb",
  "sw/zana/bill-of-lading/index.html": "42ec42dc099dd357ced5bf848b78caf9781c3c517196dcffec04ad6e3046e721",
  "sw/zana/uhamishaji-data-mpaka/index.html": "7aa19678e3041d626bdeef8ab777e6595b2f8d6a248f84b04818fb4229f282b1",
  "sw/zana/muda-wa-kupitisha-forodha/index.html": "e065aabf3a1fef8f5eac00cefdbe30023d542d767535e85f77c870b56215ff7d",
  "sw/zana/uzito-wa-usafirishaji/index.html": "7611b876b53b79e8a510fc1dc22b7d9fb63e602167f7044b71d48d3ee08029d7"
};
for (const [relative, expected] of Object.entries(priorHashes)) {
  const actual = crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, relative))).digest("hex");
  assert.strictEqual(actual, expected, `${relative} remains byte-identical`);
}

for (const page of generated) {
  const relative = `sw/zana/${page.slug}/index.html`;
  const html = fs.readFileSync(path.join(ROOT, relative), "utf8");
  assert.match(html, /<html lang="sw">/, `${page.id}: native locale`);
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
  assert.match(registry, new RegExp(`href: "${page.en === "/tools/sadc-roo/" ? "/sw/zana/kanuni-za-asili-sadc/" : `/sw/zana/${page.slug}/`}"`), `${page.id}: registry discovery`);
  assert.match(hub, new RegExp(`href="/sw/zana/${page.slug}/"`), `${page.id}: category hub discovery`);
  const english = fs.readFileSync(path.join(ROOT, page.en.replace(/^\//, ""), "index.html"), "utf8");
  assert.match(english, new RegExp(`hreflang="sw" href="https://afrotools\\.com/sw/zana/${page.slug}/"`), `${page.id}: English reciprocity`);
}

assert.doesNotMatch(runtime, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/, "runtime makes no network request");
assert.match(runtime, /lastReport = null; resultBox\.hidden = true; summary\.textContent = ""/, "invalid submit clears stale output");
assert.match(runtime, /data\.locale !== "sw"/, "reopen is locale and owner scoped");
assert.match(styles, /prefers-color-scheme:dark/, "system dark mode fallback");
assert.match(styles, /max-width:420px/, "small-mobile layout contract");
assert.match(styles, /focus-visible/, "visible keyboard focus contract");

const context = { console };
context.window = context;
vm.createContext(context);
for (const relative of [
  "data/trade/commodity-trade-data.js", "engines/src/commodity-engine.js",
  "engines/src/ecowas-levy-engine.js", "engines/src/sadc-roo-engine.js", "engines/src/eac-cet-engine.js"
]) vm.runInContext(fs.readFileSync(path.join(ROOT, relative), "utf8"), context, { filename: relative });

assert.ok(context.CommodityEngine.getRankedList("KE", "exports", null).length > 0, "commodity shared engine oracle");
const ecowas = context.EcowasLevyEngine.calculate({ cifValue: 10000, fobValue: 9500, cetBand: 3, countryCode: "NG", hsCode: "", isEtls: false });
assert.ok(ecowas.totalLandedCost > 10000 && ecowas.breakdown.length >= 3, "ECOWAS shared engine oracle");
const sadc = context.SadcRooEngine.checkOrigin({ hsChapter: 9, exportCountry: "TZ", importCountry: "ZA", exWorksPrice: 10000, nonSadcCost: 4000, whollyObtained: true, hasCTH: false, hasFabricFwd: false });
assert.ok(Array.isArray(sadc.checks) && sadc.checks.length > 0, "SADC shared engine oracle");
const eac = context.EacCetEngine.calculate({ cifValue: 10000, cetRate: 25, countryCode: "KE" });
assert.ok(eac.totalLanded > 10000 && eac.breakdown.length >= 3, "EAC shared engine oracle");

console.log("sw-trade-remaining-static.test.js passed: 22 reconciled, 6 prior preserved, 4 static candidates, 12 explicit blockers");
