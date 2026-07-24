"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const en = read("crypto/profit-calculator/index.html");
const fr = read("fr/crypto/profit-calculator/index.html");
const controller = read("assets/js/pages/crypto-profit-vip.js");
const widget = read("widgets/crypto/profit-loss.js");
const iframe = read("widgets/iframe/crypto-crypto-profit-loss.html");
const context = JSON.parse(read("data/ai/tool-context/crypto-profit.json"));

for (const html of [en, fr]) {
  assert.match(html, /assets\/js\/engines\/crypto-profit\.js/);
  assert.match(html, /assets\/js\/pages\/crypto-profit-vip\.js/);
  assert.match(html, /data-profit-export="csv"/);
  assert.match(html, /data-profit-export="json"/);
  assert.match(html, /data-profit-export="pdf"/);
  assert.match(html, /data-profit-export="print"/);
  assert.match(html, /scenarioPrice1/);
  assert.doesNotMatch(html, /CoinGecko|chart\.js|crypto-data\.js|current market price|live price as sell/i);
  assert.doesNotMatch(html, /<iframe/i);
}
assert.match(en, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/crypto\/profit-calculator\/"/);
assert.match(fr, /hreflang="en" href="https:\/\/afrotools\.com\/crypto\/profit-calculator\/"/);
assert.match(fr, /<html\b[^>]*\blang="fr"/);
assert.doesNotMatch(controller, /fetch\(|localStorage|sessionStorage|email|account/i);
assert.match(controller, /window\.jspdf\.jsPDF/);

assert.doesNotMatch(widget, /type="number"|parseFloat|addEventListener\s*\(\s*["']click|netProfit\s*=|totalCost\s*=/);
assert.match(widget, /No live price, conversion, forecast/);
assert.match(iframe, /crypto\/profit-calculator/);
assert.doesNotMatch(iframe, /tools\/crypto-tax/);

assert.equal(context.status, "unverified-static");
assert.match(context.staticText, /without requesting, prefilling or transmitting/);
assert.match(context.staticText, /no live price, currency conversion, forecast/);
assert.ok(!context.sourceBindings);

const manifestApi = require("../assets/js/ai/tool-manifest.js");
const tool = manifestApi.loadDefaultToolManifest().find((entry) => entry.id === "crypto-profit");
assert.ok(tool);
assert.equal(tool.route, "/crypto/profit-calculator/");
assert.deepEqual(tool.requiredInputs, []);
assert.deepEqual(tool.optionalInputs, []);
assert.deepEqual(tool.aiCapabilities, ["route_only"]);
assert.equal(tool.privacyMode, "browser_local");
assert.equal(tool.sourcePolicy, "user_input");
assert.equal(tool.highStakesDomain, "finance");
assert.deepEqual(tool.languagesSupported, ["en", "fr"]);
assert.ok(!tool.monetizationSurfaces.includes("api"));
assert.ok(!tool.monetizationSurfaces.includes("pro_export"));
assert.equal(manifestApi.buildToolInvocation(tool).canPrefill, false);

console.log("crypto profit VIP contract: ok");
