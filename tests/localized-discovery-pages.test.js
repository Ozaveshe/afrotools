"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { ROUTES } = require("../scripts/build-localized-discovery-pages");

const ROOT = path.resolve(__dirname, "..");
const check = spawnSync(process.execPath, [path.join(ROOT, "scripts/build-localized-discovery-pages.js")], { cwd: ROOT, encoding: "utf8" });
assert.strictEqual(check.status, 0, `${check.stdout}\n${check.stderr}`);
assert.strictEqual(ROUTES.length, 18, "exact informational discovery denominator");

for (const row of ROUTES) {
  for (const [locale, route] of [["fr", row[1]], ["sw", row[2]]]) {
    const file = path.join(ROOT, route.replace(/^\//, ""), "index.html");
    assert.ok(fs.existsSync(file), `${route}: physical owner`);
    const html = fs.readFileSync(file, "utf8");
    assert.match(html, new RegExp(`<html\\b[^>]*\\blang=["']${locale}["']`, "i"), `${route}: language`);
    const isFallback = html.includes('name="afrotools-localization-state" content="english-fallback-noindex"');
    const canonicalRoute = isFallback ? row[0] : route;
    assert.match(html, new RegExp(`<link\\b[^>]*rel=["']canonical["'][^>]*href=["']https://afrotools\\.com${canonicalRoute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "i"), `${route}: canonical`);
    if (isFallback) {
      assert.match(html, /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i, `${route}: fallback noindex`);
      assert.doesNotMatch(html, /hreflang=["']/i, `${route}: fallback must not join hreflang`);
    } else {
      const siblingLocale = locale === "fr" ? "sw" : "fr";
      const siblingRoute = locale === "fr" ? row[2] : row[1];
      const siblingHtml = fs.readFileSync(path.join(ROOT, siblingRoute.replace(/^\//, ""), "index.html"), "utf8");
      const siblingIsFallback = siblingHtml.includes('name="afrotools-localization-state" content="english-fallback-noindex"');
      for (const lang of ["en", locale]) assert.match(html, new RegExp(`hreflang=["']${lang}["']`, "i"), `${route}: ${lang} hreflang`);
      if (siblingIsFallback) {
        assert.doesNotMatch(html, new RegExp(`hreflang=["']${siblingLocale}["']`, "i"), `${route}: fallback sibling must not join hreflang`);
      } else {
        assert.match(html, new RegExp(`hreflang=["']${siblingLocale}["']`, "i"), `${route}: ${siblingLocale} hreflang`);
      }
    }
    assert.match(html, /data-localized-discovery-standard=/, `${route}: shared standard`);
    assert.match(html, /"@type"\s*:\s*"FAQPage"/, `${route}: FAQ schema`);
    assert.match(html, /localized-discovery__links/, `${route}: internal discovery`);
    assert.match(html, /<form\b/i, `${route}: search or contact handoff`);
  }
}

for (const row of ROUTES.filter(row => new Set(["/business-enquiry/", "/custom-calculators/", "/media-kit/"]).has(row[0]))) {
  for (const route of [row[1], row[2]]) {
    const html = fs.readFileSync(path.join(ROOT, route.replace(/^\//, ""), "index.html"), "utf8");
    assert.match(html, /data-netlify=["']true["']/i, `${route}: service form`);
    assert.match(html, /name=["']email["'][^>]*type=["']email["']/i, `${route}: labeled email field`);
  }
}

const report = require("../reports/localized-non-app-parity.json");
assert.deepStrictEqual(report.byClass["discovery-support"].fr, { pass: 17, underStandard: 0, missing: 1 }, "fr: discovery contract");
assert.deepStrictEqual(report.byClass["discovery-support"].sw, { pass: 18, underStandard: 0, missing: 0 }, "sw: discovery contract");

for (const row of require('../scripts/build-localized-discovery-pages.js').ROUTES) {
  const slug = row[0].replace(/^\//, '').replace(/\/$/, '') || 'home';
  for (const [locale, route] of [['fr', row[1]], ['sw', row[2]]]) {
    const file = path.join(ROOT, route.replace(/^\//, ''), 'index.html');
    const html = fs.readFileSync(file, 'utf8');
    assert(html.includes(`name="afrotools-content-id" content="localized-discovery:${locale}:${slug}"`), `${route}: stable localized discovery content id`);
  }
}
console.log("Localized discovery standard passed for 36 pages.");
