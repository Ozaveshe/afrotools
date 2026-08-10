#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const contract = JSON.parse(fs.readFileSync(path.join(root, "data/localization/sw-certificate-maker-final.json"), "utf8"));
const html = fs.readFileSync(path.join(root, contract.swahiliFile), "utf8");
const required = [
  'lang="sw"', `<meta name="afrotools-sw-native-owner" content="${contract.englishId}">`,
  `<meta name="afrotools-sw-source-owner" content="${contract.sourceOwner}">`,
  `<link rel="canonical" href="https://afrotools.com${contract.swahiliRoute}">`,
  `<link rel="alternate" hreflang="en" href="https://afrotools.com${contract.englishRoute}">`,
  `<meta property="og:image" content="https://afrotools.com${contract.artwork}">`,
  'data-certificate-maker-native', 'name="recipient"', 'name="course"', 'name="date"', 'name="organization"',
  'data-certificate-canvas', `width="${contract.dimensions.width}"`, `height="${contract.dimensions.height}"`,
  'data-reset', 'data-png', 'data-pdf', '/assets/vendor/pdf-lib/pdf-lib.min.js',
  '/assets/js/pages/creative/certificate-maker-native.js', 'sw-certificate-maker-native:start', 'sw-certificate-maker-native:end'
].concat(contract.templates.map((template) => `data-template="${template}"`));
const missing = required.filter((token) => !html.includes(token));
if (missing.length) { console.error(`Swahili certificate-maker owner contract failed: ${missing.join(", ")}`); process.exit(1); }
if (/<input[^>]+type="file"/i.test(html) || /data-(?:save|import)/.test(html)) { console.error("Swahili certificate-maker advertises assets or persistence absent from English."); process.exit(1); }
for (const owned of [contract.controllerOwner, contract.artwork.replace(/^\//, "")]) {
  const file = path.join(root, owned); if (!fs.existsSync(file) || (owned.endsWith(".webp") && fs.statSync(file).size < 1000)) { console.error(`Certificate-maker dependency missing: ${owned}`); process.exit(1); }
}
console.log(`Swahili certificate-maker source owner is current: ${contract.templates.length} templates, ${contract.dimensions.width}x${contract.dimensions.height}, ${contract.exports.join("+")}`);
