const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const pages = [
  "tools/discount-calc/index.html",
  "fr/tools/calculateur-remise/index.html",
  "sw/zana/kikokotoo-discount/index.html"
];

test("native locale pages share one engine/controller and reciprocal locale links", () => {
  for (const page of pages) {
    const html = read(page);
    assert.match(html, /assets\/js\/engines\/discount-planner\.js/);
    assert.match(html, /assets\/js\/pages\/discount-planner\.js/);
    assert.match(html, /hreflang="en"/);
    assert.match(html, /hreflang="fr"/);
    assert.match(html, /hreflang="sw"/);
    assert.match(html, /assets\/vendor\/jspdf\/jspdf\.umd\.min\.js/);
  }
});

test("native and widget sources contain no supplied rate, prefill, persistence or value-network path", () => {
  const sources = pages.map(read).concat([
    read("assets/js/engines/discount-planner.js"),
    read("assets/js/pages/discount-planner.js"),
    read("widgets/financial/discount-calc.js"),
    read("widgets/iframe/financial-discount-calc.html")
  ]).join("\n");
  assert.doesNotMatch(sources, /fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|gtag\s*\(|dataLayer\.push|prefill/i);
  assert.doesNotMatch(sources, /Paystack|Jumia|Konga|retailer rate|official VAT rate/i);
});

test("widget is a compact shared-engine subset with canonical handoff", () => {
  const iframe = read("widgets/iframe/financial-discount-calc.html");
  const widget = read("widgets/financial/discount-calc.js");
  assert.match(iframe, /assets\/js\/engines\/discount-planner\.js/);
  assert.match(iframe, /https:\/\/afrotools\.com\/tools\/discount-calc\//);
  assert.match(widget, /AfroTools\.DiscountPlanner/);
  assert.match(widget, /quantity/);
  assert.match(widget, /taxPct/);
});

test("SEO/schema and AI context state the user-input-only contract", () => {
  const context = JSON.parse(read("data/ai/tool-context/discount-calc.json"));
  assert.match(context.staticText, /optional user-entered tax scenario/i);
  assert.match(context.staticText, /supplies no VAT or tax rate/i);
  for (const page of pages) {
    const html = read(page);
    assert.match(html, /WebApplication/);
    assert.match(html, /FAQPage/);
    assert.match(html, /user-entered|saisi par|unayoingiza/i);
  }
});
