const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const pages = [
  "tools/shipping-calc/index.html",
  "fr/tools/calculateur-expedition/index.html",
  "sw/zana/gharama-usafirishaji/index.html"
];

test("all native locales use one engine/controller and reciprocal locale links", () => {
  for (const file of pages) {
    const source = read(file);
    assert.match(source, /\/assets\/js\/engines\/shipping-cost-planner\.js/);
    assert.match(source, /\/assets\/js\/pages\/shipping-cost-planner\.js/);
    assert.match(source, /hreflang="en"[^>]+\/tools\/shipping-calc\//);
    assert.match(source, /hreflang="fr"[^>]+\/fr\/tools\/calculateur-expedition\//);
    assert.match(source, /hreflang="sw"[^>]+\/sw\/zana\/gharama-usafirishaji\//);
    assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest|sessionStorage|localStorage|gtag\s*\(/);
  }
});

test("native and widget surfaces contain no provider tables, route promises, customs arithmetic or affiliate links", () => {
  const surface = pages.map(read).join("\n") + read("widgets/ecommerce/shipping-calc.js");
  assert.doesNotMatch(surface, /CARRIERS|COUNTRIES|cheapest|fastest|transit days|delivery time|affiliate|commission|route availability/i);
  assert.doesNotMatch(surface, /customsDuty|customsVat|dutyPct|vatPct|broker fee|fx rate/i);
  assert.doesNotMatch(surface, /DHL Express|FedEx International|EMS Africa|GIG Logistics|Aramex|NIPOST|PostNet|Sendy|Courier Guy/i);
});

test("widget is a shared-engine subset bound to the canonical planner", () => {
  const widget = read("widgets/ecommerce/shipping-calc.js");
  const iframe = read("widgets/iframe/ecommerce-shipping-calc.html");
  const additions = JSON.parse(read("widgets/registry-additions.json"));
  const entry = additions.find((item) => item.id === "shipping-calc");
  assert.equal(entry.link, "/tools/shipping-calc/");
  assert.match(widget, /ShippingCostPlanner/);
  assert.match(widget, /\/tools\/shipping-calc\//);
  assert.doesNotMatch(widget + iframe, /shipping-estimator|crypto-tax/);
  assert.match(iframe, /shipping-cost-planner\.js/);
});

test("schema and source copy describe the same user-input-only contract", () => {
  const english = read(pages[0]);
  assert.match(english, /"name":"Shipping Cost & Chargeable Weight Planner"/);
  assert.match(english, /Duty, import VAT, HS classification, brokerage and border charges are deliberately excluded/);
  const context = JSON.parse(read("data/ai/tool-context/shipping-calc.json"));
  assert.equal(context.toolKey, "shipping-calc");
  assert.match(context.staticText, /supplies no carrier rate/);
});
