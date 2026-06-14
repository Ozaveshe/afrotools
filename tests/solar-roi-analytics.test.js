"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const dataset = require(path.join(ROOT, "data", "energy", "solar-roi-country-dataset.js"));

const REQUIRED_EVENTS = [
  "calculator_view",
  "country_selected",
  "beginner_mode_started",
  "advanced_mode_opened",
  "calculate_clicked",
  "result_generated",
  "preset_loaded",
  "appliance_added",
  "battery_option_changed",
  "finance_enabled",
  "whatsapp_copied",
  "txt_downloaded",
  "print_clicked",
  "country_page_opened",
  "generator_tool_clicked",
  "quote_cta_clicked",
  "source_update_clicked"
];

function read(rel) {
  const file = path.join(ROOT, rel);
  assert.ok(fs.existsSync(file), `Missing file: ${file}`);
  return { file, html: fs.readFileSync(file, "utf8") };
}

function assertIncludes(text, needle, label, file) {
  assert.ok(text.includes(needle), `${label} missing in ${file}`);
}

function assertNotIncludes(text, needle, label, file) {
  assert.ok(!text.includes(needle), `${label} should not appear in ${file}`);
}

const root = read("tools/solar-roi/index.html");
const nigeria = read("tools/solar-roi/nigeria/index.html");
const aggregate = `${root.html}\n${nigeria.html}`;

for (const eventName of REQUIRED_EVENTS) {
  assertIncludes(aggregate, `"${eventName}"`, `analytics event ${eventName}`, "Solar ROI generated pages");
}

assert.ok(root.html.includes("/assets/js/lib/analytics.js") || root.html.includes("/assets/js/bundles/core."), `root analytics helper missing in ${root.file}`);
assertIncludes(root.html, "trackRootSolarEvent", "root Solar ROI event wrapper", root.file);
assertIncludes(root.html, "rootSolarPayload", "root low-PII payload helper", root.file);
assertIncludes(root.html, 'data-country-slug="nigeria"', "root country-selected country slug", root.file);

assertIncludes(nigeria.html, "function solarAnalyticsPayload", "country low-PII payload helper", nigeria.file);
assertIncludes(nigeria.html, "analytics.track(eventName,solarAnalyticsPayload", "country events use shared payload", nigeria.file);
assertIncludes(nigeria.html, "trackSolarEventOnReady(\"country_page_opened\",\"country_page\")", "country page opened event", nigeria.file);
assertIncludes(nigeria.html, "trackSolarEvent(\"result_generated\")", "result generated after explicit run", nigeria.file);

const payloadMatch = nigeria.html.match(/function solarAnalyticsPayload[\s\S]*?return\{([^}]+)\};/);
assert.ok(payloadMatch, `Could not find country analytics payload in ${nigeria.file}`);
const payloadFields = [...payloadMatch[1].matchAll(/([a-z_]+):/g)].map(match => match[1]);
assert.deepStrictEqual(payloadFields, ["country", "system_size_band", "payback_band", "mode"], "Country analytics payload should expose only approved fields");

const rootPayloadMatch = root.html.match(/function rootSolarPayload[\s\S]*?return\{([^}]+)\};/);
assert.ok(rootPayloadMatch, `Could not find root analytics payload in ${root.file}`);
const rootPayloadFields = [...rootPayloadMatch[1].matchAll(/([a-z_]+):/g)].map(match => match[1]);
assert.deepStrictEqual(rootPayloadFields, ["country", "system_size_band", "payback_band", "mode"], "Root analytics payload should expose only approved fields");

for (const forbidden of [
  "monthly_bill",
  "monthly_generator_spend",
  "generator_spend",
  "fuel_price",
  "tariff_per_kwh",
  "source_note",
  "user_note",
  "cta_name",
  "slot_id"
]) {
  assertNotIncludes(nigeria.html, forbidden, `forbidden Solar ROI analytics parameter ${forbidden}`, nigeria.file);
  assertNotIncludes(root.html, forbidden, `forbidden Solar ROI analytics parameter ${forbidden}`, root.file);
}

for (const country of Object.values(dataset.countries)) {
  const page = read(path.join("tools", "solar-roi", country.slug, "index.html"));
  assertIncludes(page.html, "trackSolarEventOnReady(\"calculator_view\")", `calculator view tracking for ${country.slug}`, page.file);
  assertIncludes(page.html, "trackSolarEventOnReady(\"country_page_opened\",\"country_page\")", `country page tracking for ${country.slug}`, page.file);
}

console.log(`Solar ROI analytics contracts verified for root plus ${Object.keys(dataset.countries).length} country pages`);
