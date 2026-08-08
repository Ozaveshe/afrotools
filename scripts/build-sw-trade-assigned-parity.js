#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CHECK = process.argv.includes("--check");
const MANIFEST = path.join(ROOT, "data/localization/sw-trade-import-parity.json");
const OWNER = "scripts/build-sw-trade-assigned-parity.js";

function routeFile(route) {
  return path.join(ROOT, route.replace(/^\//, ""), "index.html");
}

function own(html) {
  const marker = `<meta name="afrotools-source-owner" content="${OWNER}">`;
  let output = html;
  if (/class="swt-result" id="swt-results"/.test(output) && !/class="swt-result" id="swt-results"[^>]+aria-live=/.test(output)) {
    output = output.replace('class="swt-result" id="swt-results"', 'class="swt-result" id="swt-results" role="region" aria-live="polite" tabindex="-1"');
  }
  if (/class="swm-result on" id="importResult"/.test(output) && !/id="importResult"[^>]+aria-live=/.test(output)) {
    output = output.replace('class="swm-result on" id="importResult"', 'class="swm-result on" id="importResult" role="region" aria-live="polite" tabindex="-1"');
  }
  if (/name="afrotools-source-owner"/.test(output)) {
    return output;
  }
  return output.replace(/<head>/i, `<head>\n${marker}`);
}

function validate(row, html) {
  if (!/<html[^>]+lang="sw"/i.test(html)) throw new Error(`${row.id}: not a native Swahili document`);
  if (/<iframe\b/i.test(html)) throw new Error(`${row.id}: iframe/transplant owner is prohibited`);
  if (!html.includes(`rel="canonical" href="https://afrotools.com${row.swahili}"`)) {
    throw new Error(`${row.id}: canonical does not match ${row.swahili}`);
  }
  if (!/(\/engines\/|shared-controller|data-trade-form|data-sw-payment-allocation-form|function swtCalc\()/.test(html)) {
    throw new Error(`${row.id}: no shared engine or maintained controller contract found`);
  }
  if (!/aria-live=|role="status"|role="alert"/.test(html)) throw new Error(`${row.id}: no accessible result/status contract`);
}

function run() {
  require("./build-sw-trade-regional-parity.js");
  require("./build-sw-trade-core-parity.js");
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  if (manifest.denominator !== 16 || manifest.routes.length !== 16) {
    throw new Error("Assigned Trade manifest must contain exactly 16 rows.");
  }
  const stale = [];
  for (const row of manifest.routes) {
    const file = routeFile(row.swahili);
    if (!fs.existsSync(file)) throw new Error(`${row.id}: missing ${path.relative(ROOT, file)}`);
    const current = fs.readFileSync(file, "utf8");
    const next = own(current);
    validate(row, next);
    if (next !== current) {
      stale.push(path.relative(ROOT, file));
      if (!CHECK) fs.writeFileSync(file, next, "utf8");
    }
  }
  if (CHECK && stale.length) throw new Error(`Trade assigned owners are stale:\n${stale.join("\n")}`);
  console.log(`${CHECK ? "Checked" : "Owned"} 16 assigned Swahili Trade routes; ${stale.length} ${CHECK ? "stale" : "updated"}.`);
}

if (require.main === module) {
  try { run(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { OWNER, own, run };
