#!/usr/bin/env node
/**
 * Generates fertilizer calculator HTML pages from the Nigeria template.
 * Reuses country data from generate-crop-yield-pages.js country list.
 * Usage: node scripts/generate-fertilizer-pages.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE = fs.readFileSync(path.join(ROOT, 'agriculture/fertilizer/nigeria.html'), 'utf8');
const OUTPUT_DIR = path.join(ROOT, 'agriculture/fertilizer');

// Read country index to get all countries
const indexSrc = fs.readFileSync(path.join(ROOT, 'data/agriculture/country-index.js'), 'utf8');
const window = { AfroTools: {} };
eval(indexSrc);
const countries = window.AfroTools.countryIndex;

// Map country code to data file prefix
const codeToFile = {};
fs.readdirSync(path.join(ROOT, 'data/agriculture')).forEach(f => {
  const m = f.match(/^([a-z]{2})-agri-data\.js$/);
  if (m) codeToFile[m[1].toUpperCase()] = f;
});

let count = 0;

countries.forEach(c => {
  if (c.code === 'NG') return; // Nigeria is the template

  const dataFile = codeToFile[c.code];
  if (!dataFile) { console.warn(`SKIP: No data file for ${c.code} (${c.name})`); return; }

  let html = TEMPLATE;

  // Titles & meta
  html = html.replace(/Fertilizer Calculator for Nigeria/g, `Fertilizer Calculator for ${c.name}`);
  html = html.replace(/Nigeria Fertilizer Calculator/g, `${c.name} Fertilizer Calculator`);
  html = html.replace(
    /Calculate exact NPK fertilizer needs for cassava, maize, rice, yam in Nigeria\. Get product recommendations with local prices and subsidy information\./g,
    `Calculate exact NPK fertilizer needs for ${c.topCrops.slice(0, 3).join(', ')} in ${c.name}. Get product recommendations with local prices and subsidy information.`
  );
  html = html.replace(
    /Calculate exact NPK fertilizer needs for cassava, maize, rice, yam in Nigeria\. Local prices and subsidy information\./g,
    `Calculate NPK fertilizer needs for ${c.topCrops.slice(0, 3).join(', ')} in ${c.name}. Local prices and subsidy info.`
  );
  html = html.replace(
    /Calculate exact NPK fertilizer needs for crops in Nigeria with local product recommendations\./g,
    `Calculate exact NPK fertilizer needs for crops in ${c.name} with local product recommendations.`
  );

  // URLs
  html = html.replace(/\/agriculture\/fertilizer\/nigeria/g, `/agriculture/fertilizer/${c.slug}`);

  // Breadcrumb
  html = html.replace(/>[\s]*Nigeria[\s]*<\/nav>/g, `>${c.name}</nav>`);

  // Flag in H1
  html = html.replace(/&#127475;&#127468;/g, c.flag.codePointAt ?
    [...c.flag].map(ch => `&#${ch.codePointAt(0)};`).join('') : c.flag);

  // Data file
  html = html.replace(/ng-agri-data\.js/g, dataFile);

  // Data source footer
  html = html.replace(/Nigeria National Bureau of Statistics/g, `${c.name} National Statistics`);

  const outPath = path.join(OUTPUT_DIR, `${c.slug}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  count++;
});

console.log(`Done! Generated ${count} fertilizer pages.`);
