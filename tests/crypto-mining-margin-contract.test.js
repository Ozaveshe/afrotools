#!/usr/bin/env node
"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const en = read("crypto/mining-calculator/index.html");
const fr = read("fr/crypto/mining-calculator/index.html");
const controller = read("assets/js/pages/crypto-mining-margin.js");
const registry = read("assets/js/components/tool-registry.js");
const ai = read("assets/js/ai/tool-manifest.js");
const context = JSON.parse(read("data/ai/tool-context/crypto-mining.json"));

for (const html of [en, fr]) {
  assert.match(html, /crypto-mining-margin\.js/);
  assert.match(html, /data-mining-export="csv"/);
  assert.match(html, /data-mining-export="json"/);
  assert.match(html, /data-mining-export="pdf"/);
  assert.match(html, /"@type"\s*:\s*"WebApplication"/);
  assert.doesNotMatch(html, /iframe|coinGecko|CryptoData|Chart|cdn\.jsdelivr|difficulty|countrySelect|buying is cheaper/i);
}
assert.match(fr, /<html\b[^>]*\blang="fr"/);
assert.doesNotMatch(fr, /traduction .*venir|available in English/i);
assert.match(controller, /Blob/);
assert.match(controller, /window\.jspdf\.jsPDF/);
assert.match(controller, /window\.print/);
assert.doesNotMatch(controller, /fetch\(|localStorage|sessionStorage/);
assert.match(registry, /id: 'crypto-mining'.*User-entered mining evidence/);
assert.match(ai, /MAJOR_TOOL_OVERRIDES\['crypto-mining'\]/);
assert.match(ai, /crypto-mining-operating-arithmetic/);
assert.strictEqual(context.status, "unverified-static");
assert.ok(!context.sourceBindings);
assert.match(context.staticText, /without requesting, prefilling or transmitting/);
console.log("crypto mining margin contract: ok");
