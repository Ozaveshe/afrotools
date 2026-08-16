"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const retirement = require("../scripts/retire-french-english-iframe-routes");
const routeApi = require("../scripts/lib/route-contract");

const ROOT = path.resolve(__dirname, "..");
const result = retirement.buildChanges();
assert.strictEqual(result.changes.size, 0, "French English-iframe retirement outputs must be current");
assert.ok(result.report.wrapperPages >= 379, "the frozen French iframe denominator must remain governed by the retirement policy");

const agricultureCount = Object.entries(result.report.byFamily)
  .filter(([family]) => family.startsWith("agriculture/"))
  .reduce((sum, [, count]) => sum + count, 0);
assert.strictEqual(agricultureCount, 192, "all 192 French agriculture country wrappers must consolidate into native owners");

for (const row of result.report.routes) {
  const html = fs.readFileSync(path.join(ROOT, row.sourceFile), "utf8");
  assert.match(html, /<meta\s+name="robots"\s+content="noindex, follow">/i, `${row.route} must be noindex`);
  assert.match(html, /<meta\s+name="afrotools-localization-state"\s+content="english-fallback-noindex">/i, `${row.route} must declare its fallback state`);
  assert.doesNotMatch(html, /<link\b[^>]*\brel=["']alternate["'][^>]*\bhreflang=/i, `${row.route} must not advertise false locale equivalence`);
  assert.ok(html.includes(`<link rel="canonical" href="https://afrotools.com${row.canonical}">`), `${row.route} must retain its consolidated canonical owner`);
  assert.ok(html.includes(`<meta property="og:url" content="https://afrotools.com${row.canonical}">`), `${row.route} OG URL must match the consolidated canonical owner`);
}

assert.strictEqual(
  retirement.canonicalFor(path.join(ROOT, "fr", "api", "pricing.html"), "/api/pricing.html"),
  "/api/pricing",
  "generic iframe wrappers must inherit the English owner's preferred canonical instead of the iframe file path"
);
assert.match(
  fs.readFileSync(path.join(ROOT, "agriculture", "crop-insurance", "index.html"), "utf8"),
  /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/agriculture\/crop-insurance\/"/,
  "retiring country wrappers must not remove the native French hub from its valid reciprocal group"
);

const graph = routeApi.buildRouteGraph();
const remaining = graph.routes.filter((record) => {
  if (record.locale !== "fr" || record.state !== "page" || record.indexability !== "indexable") return false;
  const html = fs.readFileSync(path.join(ROOT, record.source.file), "utf8");
  return Boolean(retirement.iframeSource(html));
});
assert.deepStrictEqual(remaining.map((row) => row.route), [], "no indexable French route may visibly wrap an English workflow");

for (const [slug, selector] of [
  ["crop-insurance", "country"],
  ["export-docs", "country"],
  ["poultry-roi", "countryCode"],
  ["vaccination-schedule", "country"]
]) {
  const file = path.join(ROOT, "fr", "agriculture", slug, "index.html");
  const html = fs.readFileSync(file, "utf8");
  assert.doesNotMatch(html, /<iframe\b/i, `${slug} must remain a native French workflow`);
  assert.match(html, new RegExp(`id=["']${selector}["']`), `${slug} must retain a country selector`);
  assert.match(html, /\/assets\/js\/pages\/fr-agriculture-country-preset\.js/, `${slug} must preserve redirected country context`);
}

const redirects = fs.readFileSync(path.join(ROOT, "_redirects"), "utf8");
assert.match(redirects, /# BEGIN FRENCH ENGLISH-IFRAME RETIREMENT/);
assert.match(redirects, /\/fr\/agriculture\/export-docs\/:country\.html\s+\/fr\/agriculture\/export-docs\/\?country=:country\s+301!/);
assert.match(redirects, /\/fr\/agriculture\/harvest-date\/:country\s+\/fr\/agriculture\/harvest-date\/\s+301!/);

console.log(`French English-iframe retirement tests passed (${result.report.wrapperPages} governed wrappers).`);
