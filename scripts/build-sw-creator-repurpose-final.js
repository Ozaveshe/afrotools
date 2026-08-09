#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const contractPath = path.join(root, "data/localization/sw-creator-repurpose-final.json");
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const target = path.join(root, contract.swahiliFile);
const html = fs.readFileSync(target, "utf8");

const required = [
  'lang="sw"',
  `<meta name="afrotools-sw-native-owner" content="${contract.englishId}">`,
  `<meta name="afrotools-sw-source-owner" content="${contract.sourceOwner}">`,
  `<link rel="canonical" href="https://afrotools.com${contract.swahiliRoute}">`,
  `<link rel="alternate" hreflang="en" href="https://afrotools.com${contract.englishRoute}">`,
  `<meta property="og:image" content="https://afrotools.com${contract.artwork}">`,
  'id="idea"', 'id="source"', 'id="platforms"', 'id="copyPlan"', 'id="reset"',
  'data-creator-repurpose-native', 'data-lang="sw"', 'name="source"', 'name="sourceType"',
  'name="platform"', 'data-json', 'data-txt', 'data-reset',
  '/engines/creator-repurpose-engine.js', '/assets/js/pages/creative/creator-repurpose-native.js',
  'sw-creator-repurpose-native:start', 'sw-creator-repurpose-native:end'
];

const missing = required.filter((token) => !html.includes(token));
if (missing.length) {
  console.error(`Swahili creator-repurpose owner contract failed: ${missing.join(", ")}`);
  process.exit(1);
}

const artwork = path.join(root, contract.artwork.replace(/^\//, ""));
if (!fs.existsSync(artwork) || fs.statSync(artwork).size < 1000) {
  console.error(`Creator-repurpose artwork is missing or too small: ${contract.artwork}`);
  process.exit(1);
}

for (const owned of [contract.engineOwner, contract.controllerOwner]) {
  if (!fs.existsSync(path.join(root, owned))) {
    console.error(`Creator-repurpose owner is missing: ${owned}`);
    process.exit(1);
  }
}

console.log(`Swahili creator-repurpose source owner is current: ${contract.swahiliRoute}`);
