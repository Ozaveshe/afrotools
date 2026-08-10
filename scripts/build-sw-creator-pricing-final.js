#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const contractPath = path.join(root, "data/localization/sw-creator-pricing-final.json");
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
  'data-creator-pricing', 'name="craft"', 'name="specialty"', 'name="country"', 'name="city"',
  'name="experience"', 'name="currency"', 'data-json', 'data-txt', 'data-reset',
  'data-manual-quote', 'id="quote-hours"', 'id="quote-hourly"', 'id="quote-costs"',
  'id="quote-revisions"', 'id="quote-usage"', 'id="quote-margin"', 'data-sw-creator-workspace',
  '/engines/creator-pricing-engine.js', '/assets/js/pages/creative/sw-creator-pricing-calculator.js',
  '/assets/js/pages/creative/sw-creator-pricing-workspace.js'
];

const missing = required.filter((token) => !html.includes(token));
if (missing.length) {
  console.error(`Swahili creator-pricing owner contract failed: ${missing.join(", ")}`);
  process.exit(1);
}

const artwork = path.join(root, contract.artwork.replace(/^\//, ""));
if (!fs.existsSync(artwork) || fs.statSync(artwork).size < 1000) {
  console.error(`Creator-pricing artwork is missing or too small: ${contract.artwork}`);
  process.exit(1);
}

console.log(`Swahili creator-pricing source owner is current: ${contract.swahiliRoute}`);
