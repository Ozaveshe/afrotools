"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const dataset = require(path.join(ROOT, "data", "energy", "solar-roi-country-dataset.js"));

function read(rel) {
  const file = path.join(ROOT, rel);
  assert.ok(fs.existsSync(file), `Missing file: ${file}`);
  return { file, text: fs.readFileSync(file, "utf8") };
}

function assertIncludes(text, needle, label, file) {
  assert.ok(text.includes(needle), `${label} missing in ${file}`);
}

function assertNotIncludes(text, needle, label, file) {
  assert.ok(!text.includes(needle), `${label} should not appear in ${file}`);
}

function assertSolarPagePerformance(rel) {
  const { file, text } = read(rel);
  const lower = text.toLowerCase();
  for (const banned of ["chart.js", "apexcharts", "recharts", "plotly", "highcharts"]) {
    assertNotIncludes(lower, banned, `heavy chart library ${banned}`, file);
  }
  assertNotIncludes(text, '<script src="/assets/js/energy-tool-assistant.js"></script>', "eager energy assistant script", file);
  assertIncludes(text, "loadAfroEnergyAssistant", "lazy energy assistant loader", file);
  assertIncludes(text, "requestIdleCallback", "idle scheduling for non-critical assistant work", file);
}

const rootPage = read("tools/solar-roi/index.html");
assertSolarPagePerformance("tools/solar-roi/index.html");
assertIncludes(rootPage.text, "solarCountryGrid", "static country grid for root SSG page", rootPage.file);
for (const country of Object.values(dataset.countries)) {
  assertIncludes(rootPage.text, `href="/tools/solar-roi/${country.slug}/"`, `static country link for ${country.slug}`, rootPage.file);
}

for (const country of Object.values(dataset.countries)) {
  const rel = path.join("tools", "solar-roi", country.slug, "index.html");
  const { file, text } = read(rel);
  assertSolarPagePerformance(rel);
  assertIncludes(text, 'id="solarReportPreview"', "print report preview container", file);
  assertIncludes(text, "function renderReport(force)", "lazy report preview renderer", file);
  assertIncludes(text, 'preview.dataset.renderReady!=="true"', "report preview render gate", file);
  assertIncludes(text, "IntersectionObserver", "report and CTA intersection observers", file);
  assertIncludes(text, 'rootMargin:"160px 0px"', "near-viewport report preview trigger", file);
  assertIncludes(text, "requestIdleCallback(renderSponsorSlots", "idle sponsor refresh", file);
  assertIncludes(text, "/assets/js/engines/solar-roi-engine.js", "small shared calculation engine", file);
  assertIncludes(text, '<section class="solar-country-section solar-faq" aria-labelledby="faq-country">', "static FAQ content is server-rendered", file);
  assertIncludes(text, `<summary>How do I calculate solar payback in ${country.countryName}?`, "country FAQ detail is static", file);
}

const engine = read("assets/js/engines/solar-roi-engine.js");
const engineBytes = Buffer.byteLength(engine.text);
assert.ok(engineBytes < 24000, `Solar ROI calculation engine should stay small; found ${engineBytes} bytes`);

console.log(`Solar ROI performance contracts verified for ${Object.keys(dataset.countries).length} country pages plus root`);
