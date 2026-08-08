"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const manifest = require("../data/localization/sw-developer-parity.json");
const meta = require("../assets/js/engines/meta-tag-engine.js");
assert.strictEqual(manifest.denominator, 26);
assert.strictEqual(manifest.routes.length, 26);
assert.strictEqual(new Set(manifest.routes.map((route) => route.id)).size, 26);
for (const route of manifest.routes) {
  const sw = fs.readFileSync(path.join(root, route.file), "utf8");
  const enFile = `${route.english.replace(/^\//, "")}index.html`;
  const en = fs.readFileSync(path.join(root, enFile), "utf8");
  assert(!/afrotools-language-fallback|<iframe\b/i.test(sw), `${route.id} must be native and fail closed`);
  assert(sw.includes(`hreflang="en"`), `${route.id} must link to its English owner`);
  assert(en.includes(`hreflang="sw"`) && en.includes(`https://afrotools.com${route.swahili}`), `${route.id} English owner must reciprocate hreflang`);
  assert(fs.existsSync(path.join(root, route.artwork)), `${route.id} must have declared artwork`);
  assert(route.sourceOwner, `${route.id} must record a source owner`);
}
const generated = meta.generate({ title: "Duka & Soko", description: "Bidhaa za mfano", url: "https://example.test/duka?x=1", image: "https://example.test/og.jpg", siteName: "Mfano" });
assert.strictEqual(generated.ok, true);
assert(generated.code.includes("<title>Duka &amp; Soko</title>"));
assert(generated.code.includes('rel="canonical" href="https://example.test/duka?x=1"'));
assert.strictEqual(meta.generate({ title: "x", description: "y", url: "javascript:alert(1)" }).ok, false);
console.log("Swahili Developer owner oracles: 26/26 ownership, reciprocal metadata and meta engine passed.");
