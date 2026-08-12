"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const run = (script, args = []) => spawnSync(process.execPath, [path.join(ROOT, script), ...args], { cwd: ROOT, encoding: "utf8" });

for (const [script, args] of [
  ["scripts/build-french-product-surface.js", ["--check"]],
  ["scripts/build-swahili-product-surface.js", []],
  ["scripts/build-localized-non-app-parity.js", ["--check"]],
]) {
  const result = run(script, args);
  assert.strictEqual(result.status, 0, `${script} failed:\n${result.stdout}\n${result.stderr}`);
}

const report = require("../reports/localized-non-app-parity.json");
for (const locale of ["fr", "sw"]) {
  const bucket = report.byClass.institutional[locale];
  assert.strictEqual(bucket.missing, 0, `${locale} institutional routes must not be missing`);
  assert.strictEqual(bucket.underStandard, 0, `${locale} institutional routes must meet the semantic contract`);
}

for (const [file, lang] of [
  ["fr/advertise/index.html", "fr"], ["sw/tangaza/index.html", "sw"],
  ["fr/suggest-tool/index.html", "fr"], ["sw/pendekeza-zana/index.html", "sw"],
  ["fr/pricing/index.html", "fr"], ["sw/bei/index.html", "sw"],
  ["fr/search/index.html", "fr"], ["sw/tafuta/index.html", "sw"],
  ["fr/categories/index.html", "fr"], ["sw/makundi/index.html", "sw"],
  ["fr/changelog/index.html", "fr"], ["sw/mabadiliko/index.html", "sw"],
]) {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  assert.match(html, new RegExp(`<html\\b[^>]*\\blang=["']${lang}["']`, "i"), `${file}: locale`);
  assert.match(html, /<link\b[^>]*rel=["']canonical["']/i, `${file}: canonical`);
  assert.match(html, /hreflang=["']en["']/i, `${file}: English alternate`);
  assert.match(html, /hreflang=["']fr["']/i, `${file}: French alternate`);
  assert.match(html, /hreflang=["']sw["']/i, `${file}: Swahili alternate`);
  assert.match(html, /application\/ld\+json/i, `${file}: schema`);
}

for (const file of ["fr/advertise/index.html", "sw/tangaza/index.html", "fr/suggest-tool/index.html", "sw/pendekeza-zana/index.html"]) {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  assert.match(html, /data-netlify=["']true["']/i, `${file}: real Netlify form`);
  assert.match(html, /netlify-honeypot=/i, `${file}: bot field`);
}

for (const file of ["fr/changelog/index.html", "sw/mabadiliko/index.html"]) {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  assert.ok((html.match(/data-change-entry\b/g) || []).length >= 10, `${file}: release history`);
  assert.match(html, /data-change-search/, `${file}: filter`);
}

console.log("Localized secondary institutional pages passed.");
