#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const contract = JSON.parse(fs.readFileSync(path.join(root, "data/localization/sw-personal-brand-audit-final.json"), "utf8"));
const html = fs.readFileSync(path.join(root, contract.swahiliFile), "utf8");
const inputs = ["industry", "yearsExp", "liConnections", "liPosting", "twFollowers", "igFollowers", "website", "googleResult", "articles", "book", "podcast", "speaking", "awards", "education", "certs"];
const required = [
  'lang="sw"', `<meta name="afrotools-sw-native-owner" content="${contract.englishId}">`,
  `<meta name="afrotools-sw-source-owner" content="${contract.sourceOwner}">`,
  `<link rel="canonical" href="https://afrotools.com${contract.swahiliRoute}">`,
  `<link rel="alternate" hreflang="en" href="https://afrotools.com${contract.englishRoute}">`,
  `<meta property="og:image" content="https://afrotools.com${contract.artwork}">`,
  'data-personal-brand-audit-sw', 'data-score', 'data-grade', 'data-summary', 'data-breakdown', 'data-plan', 'data-readiness',
  'data-reset', 'data-copy', 'data-txt', '/engines/personal-brand-audit-engine.js',
  '/assets/js/pages/creative/personal-brand-audit-sw-controller.js', 'sw-personal-brand-audit-native:start', 'sw-personal-brand-audit-native:end'
].concat(inputs.map((id) => `id="${id}"`));
const missing = required.filter((token) => !html.includes(token));
if (missing.length) { console.error(`Swahili personal-brand-audit owner contract failed: ${missing.join(", ")}`); process.exit(1); }
for (const owned of [contract.engineOwner, contract.controllerOwner, contract.artwork.replace(/^\//, "")]) {
  const file = path.join(root, owned);
  if (!fs.existsSync(file) || (owned.endsWith(".webp") && fs.statSync(file).size < 1000)) { console.error(`Personal brand audit dependency missing: ${owned}`); process.exit(1); }
}
console.log(`Swahili personal-brand-audit source owner is current: ${contract.scoredSignals} signals, ${contract.categories} categories, ${contract.exports.join("+")}`);
