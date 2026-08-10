#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const contract = JSON.parse(fs.readFileSync(path.join(root, "data/localization/sw-creator-team-final.json"), "utf8"));
const html = fs.readFileSync(path.join(root, contract.swahiliFile), "utf8");
const required = [
  'lang="sw"', `<meta name="afrotools-sw-native-owner" content="${contract.englishId}">`,
  `<meta name="afrotools-sw-source-owner" content="${contract.sourceOwner}">`,
  `<link rel="canonical" href="https://afrotools.com${contract.swahiliRoute}">`,
  `<link rel="alternate" hreflang="en" href="https://afrotools.com${contract.englishRoute}">`,
  `<meta property="og:image" content="https://afrotools.com${contract.artwork}">`,
  'data-creator-team-native', 'data-lang="sw"', 'name="project"', 'name="title"', 'name="owner"',
  'name="taskStatus"', 'name="due"', 'name="note"', 'data-summary', 'data-list', 'data-reset',
  'data-json', 'data-csv', '/engines/creator-team-engine.js', '/assets/js/pages/creative/creator-team-native.js',
  'sw-creator-team-native:start', 'sw-creator-team-native:end'
];
const missing = required.filter((token) => !html.includes(token));
if (missing.length) { console.error(`Swahili creator-team owner contract failed: ${missing.join(", ")}`); process.exit(1); }
for (const owned of [contract.engineOwner, contract.controllerOwner, contract.artwork.replace(/^\//, "")]) {
  const file = path.join(root, owned);
  if (!fs.existsSync(file) || (owned.endsWith(".webp") && fs.statSync(file).size < 1000)) {
    console.error(`Creator-team owned dependency is missing: ${owned}`); process.exit(1);
  }
}
console.log(`Swahili creator-team source owner is current: ${contract.swahiliRoute}`);
