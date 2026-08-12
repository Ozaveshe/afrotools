"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { ROUTES } = require("../scripts/build-french-editorial-standard");

const ROOT = path.resolve(__dirname, "..");
const check = spawnSync(process.execPath, [path.join(ROOT, "scripts/build-french-editorial-standard.js")], { cwd: ROOT, encoding: "utf8" });
assert.strictEqual(check.status, 0, `${check.stdout}\n${check.stderr}`);
assert.strictEqual(ROUTES.length, 4, "four reviewed French articles needed the final semantic standard");
for (const [slug] of ROUTES) {
  const html = fs.readFileSync(path.join(ROOT, "fr", "blog", slug, "index.html"), "utf8");
  assert.strictEqual((html.match(/data-fr-editorial-standard/g) || []).length, 1, `${slug}: one editorial standard`);
  assert.match(html, /"@type"\s*:\s*"FAQPage"/, `${slug}: FAQ schema`);
  assert.match(html, /Contrôle final avant utilisation/, `${slug}: verification boundary`);
}
const report = require("../reports/localized-non-app-parity.json");
for (const locale of ["fr", "sw"]) assert.strictEqual(report.byClass.editorial[locale].underStandard, 0, `${locale}: no under-standard native articles`);
assert.deepStrictEqual(report.byClass["editorial-hub"].fr, { pass: 1, underStandard: 0, missing: 0 });
assert.deepStrictEqual(report.byClass["editorial-hub"].sw, { pass: 1, underStandard: 0, missing: 0 });
console.log("Localized editorial standard passed with fallback backlog kept explicit.");
