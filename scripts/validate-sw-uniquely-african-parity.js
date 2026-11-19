#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(ROOT, "data", "localization", "sw-uniquely-african-parity-manifest.json");
const FRENCH = path.join(ROOT, "data", "localization", "fr-uniquely-african-parity-manifest.json");
const errors = [];

function read(file) { return fs.readFileSync(path.join(ROOT, file), "utf8"); }
function fail(condition, message) { if (!condition) errors.push(message); }
function count(text, pattern) { return (text.match(pattern) || []).length; }

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const french = JSON.parse(fs.readFileSync(FRENCH, "utf8"));
fail(manifest.denominator === 33 && manifest.rows.length === 33, "manifest must contain exactly 33 rows");
fail(new Set(manifest.rows.map((row) => row.english.id)).size === manifest.denominator, "English ids must be unique");
fail(new Set(manifest.rows.map((row) => row.swahili.route)).size === manifest.denominator, "Swahili routes must be unique");
fail(JSON.stringify(manifest.rows.map((row) => row.english.id)) === JSON.stringify(french.rows.filter(row => row.english.id !== "remittance-v2").map((row) => row.english.id)), "manifest must preserve the accepted English African denominator and order");
fail(manifest.rows.filter((row) => row.swahili.mode === "shared-engine").length === 28, "exactly 28 shared-engine routes required");
const available = manifest.rows.filter(row => ["shared-engine", "native-existing"].includes(row.swahili.mode));

const frenchMarkers = /\b(?:Calculer|Comparez|Coût|Devise|Montant|Résultat|Fraîcheur|Confiance|Limites|Réinitialiser|Ouganda|Tanzanie|Afrique du Sud|Éthiopie|Égypte)\b/i;
const englishShellMarkers = /Fungua zana kamili ya Kiingereza|Zana kamili inayofuata iko kwa Kiingereza|English fallback|open the full English tool/i;

for (const row of manifest.rows) {
  fail(fs.existsSync(path.join(ROOT, row.english.file)), `${row.english.id}: missing English owner`);
  fail(fs.existsSync(path.join(ROOT, row.artwork.path)), `${row.english.id}: missing artwork ${row.artwork.path}`);
  const file = path.join(ROOT, row.swahili.file);
  if (row.swahili.mode === "native-blocked-missing") {
    fail(!fs.existsSync(file), `${row.english.id}: missing-owner blocker unexpectedly exists; classify and prove it before acceptance`);
    continue;
  }
  if (row.swahili.mode === "native-blocked-shell") {
    fail(fs.existsSync(file), `${row.english.id}: expected explicit fallback shell is missing`);
    if (fs.existsSync(file)) fail(englishShellMarkers.test(fs.readFileSync(file, "utf8")), `${row.english.id}: blocked shell must remain explicitly labelled`);
    continue;
  }
  if (row.swahili.mode.startsWith("native-blocked")) {
    fail(fs.existsSync(file), `${row.english.id}: documented blocker route is missing`);
    if (row.swahili.mode === "native-blocked-handoff" && fs.existsSync(file)) {
      fail(/\/tools\/japa-calculator\//.test(fs.readFileSync(file, "utf8")), `${row.english.id}: handoff evidence changed; reclassify before acceptance`);
    }
    if (row.swahili.mode === "native-blocked-runtime-wrapper" && fs.existsSync(file)) {
      fail(/data-language-fallback-notice|rs-upgrade-shell/.test(fs.readFileSync(file, "utf8")), `${row.english.id}: wrapper evidence changed; reclassify before acceptance`);
    }
    continue;
  }
  fail(fs.existsSync(file), `${row.english.id}: missing physical Swahili route`);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  fail(/<html\b[^>]*\blang=["']sw["']/i.test(html), `${row.english.id}: html lang must be sw`);
  fail(new RegExp(`<link\\b[^>]*rel=["']canonical["'][^>]*href=["']https://afrotools\\.com${row.swahili.route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "i").test(html), `${row.english.id}: self canonical missing`);
  fail(/<meta\b[^>]*property=["']og:image["'][^>]*content=["']https:\/\/afrotools\.com\/assets\/img\/tools\//i.test(html), `${row.english.id}: dedicated OG artwork missing`);
  fail(!/<iframe\b/i.test(html), `${row.english.id}: iframe is forbidden`);
  fail(!englishShellMarkers.test(html), `${row.english.id}: English fallback shell remains`);
  if (row.swahili.mode === "shared-engine") {
    fail(html.includes(`data-sw-ua-app="${row.english.id}"`), `${row.english.id}: generated owner marker missing`);
    fail(html.includes("/engines/uniquely-african-engine.js"), `${row.english.id}: shared engine missing`);
    fail(html.includes("/assets/js/pages/sw-uniquely-african.js"), `${row.english.id}: Swahili runtime missing`);
    fail(/"inLanguage"\s*:\s*"sw"/.test(html), `${row.english.id}: schema language missing`);
    const visibleText = html.replace(/<head>[\s\S]*?<\/head>/i, "").replace(/<script\b[\s\S]*?<\/script>/gi, "");
    fail(!frenchMarkers.test(visibleText), `${row.english.id}: residual French presentation copy`);
    fail(count(html, /data-ua-form/g) === 1, `${row.english.id}: exactly one owned app form required`);
    fail(count(html, /data-ua-result/g) === 1, `${row.english.id}: exactly one result surface required`);
  } else {
    fail(html.includes(`data-sw-ua-native="${row.english.id}"`), `${row.english.id}: native owner marker missing`);
  }
}

const hub = read("sw/zana-za-kipekee-afrika/index.html");
fail(count(hub, /class="ua-hub-card"/g) === available.length, "hub card count must match the available destinations");
for (const row of available) fail(hub.includes(`href="${row.swahili.route}"`), `${row.english.id}: hub link missing`);

const result = { denominator:manifest.denominator, linked:available.length, blocked:manifest.rows.length - available.length, artworkPresent:manifest.denominator - errors.filter((error) => error.includes("missing artwork")).length, errors };
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exitCode = 1;
