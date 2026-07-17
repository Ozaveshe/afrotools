#!/usr/bin/env node
/**
 * Generates seed rate calculator HTML pages from the Nigeria template.
 * Reuses the country index and agri-data files from the agriculture suite.
 * Usage: node scripts/generate-seed-rate-pages.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE = fs.readFileSync(path.join(ROOT, 'agriculture/seed-rate/nigeria.html'), 'utf8');
const OUTPUT_DIR = path.join(ROOT, 'agriculture/seed-rate');

// Read country index (mock browser globals for IIFE)
const indexSrc = fs.readFileSync(path.join(ROOT, 'data/agriculture/country-index.js'), 'utf8');
const window = { AfroTools: {} };
global.window = window;
eval(indexSrc);
const countries = window.AfroTools.countryIndex;

// Map country code to data file prefix
const codeToFile = {};
fs.readdirSync(path.join(ROOT, 'data/agriculture')).forEach(f => {
  const m = f.match(/^([a-z]{2})-agri-data\.js$/);
  if (m) codeToFile[m[1].toUpperCase()] = f;
});

// Helper: convert emoji flag to HTML entities
function flagToHtml(flag) {
  return [...flag].map(ch => `&#${ch.codePointAt(0)};`).join('');
}

let count = 0;
const skipped = [];

countries.forEach(c => {
  if (c.code === 'NG') return; // Nigeria is the template

  const dataFile = codeToFile[c.code];
  if (!dataFile) {
    console.warn(`SKIP: No data file for ${c.code} (${c.name})`);
    skipped.push(c.name);
    return;
  }

  const topCropsStr = c.topCrops.slice(0, 3).map(crop => crop.replace(/_/g, ' ')).join(', ');
  const flagHtml = flagToHtml(c.flag);

  let html = TEMPLATE;

  // Page title
  html = html.replace(
    /Seed Rate Calculator for Nigeria &mdash; Planting Guide \| AfroTools/g,
    `Seed Rate Calculator for ${c.name} — Planting Guide | AfroTools`
  );

  // Meta description
  html = html.replace(
    /Calculate seed rates for cassava, maize, rice, yam in Nigeria\. Get exact seed quantities, planting spacing, and local seed prices for your farm\./g,
    `Calculate seed rates for ${topCropsStr} in ${c.name}. Get exact seed quantities, planting spacing, and local seed prices for your farm.`
  );

  // OG/Twitter title
  html = html.replace(
    /Nigeria Seed Rate Calculator &mdash; AfroTools/g,
    `${c.name} Seed Rate Calculator — AfroTools`
  );

  // OG/Twitter description
  html = html.replace(
    /Calculate seed rates for cassava, maize, rice, yam in Nigeria\. Get exact seed quantities, planting spacing, and local seed prices for your farm\./g,
    `Calculate seed rates for ${topCropsStr} in ${c.name}. Get exact seed quantities, planting spacing, and local seed prices for your farm.`
  );
  html = html.replace(
    /Calculate seed rates for cassava, maize, rice, yam in Nigeria\. Get exact seed quantities, planting spacing, and local seed prices\./g,
    `Calculate seed rates for ${topCropsStr} in ${c.name}. Get exact seed quantities, planting spacing, and local seed prices.`
  );

  // Canonical + OG URL
  html = html.replace(/\/agriculture\/seed-rate\/nigeria/g, `/agriculture/seed-rate/${c.slug}`);

  // Schema.org JSON-LD name + description
  html = html.replace(
    /"name": "Nigeria Seed Rate Calculator"/g,
    `"name": "${c.name} Seed Rate Calculator"`
  );
  html = html.replace(
    /"description": "Calculate exact seed quantities, planting spacing, and local seed prices for farms in Nigeria\."/g,
    `"description": "Calculate exact seed quantities, planting spacing, and local seed prices for farms in ${c.name}."`
  );

  // Breadcrumb "Nigeria"
  html = html.replace(
    /<span aria-current="page">Nigeria<\/span>/g,
    `<span aria-current="page">${c.name}</span>`
  );

  // Seed cost estimate section heading
  html = html.replace(
    /Seed Cost Estimate \(Nigeria\)/g,
    `Seed Cost Estimate (${c.name})`
  );

  // H1 flag + "Nigeria"
  html = html.replace(
    /&#127475;&#127468;<\/span> Nigeria <em>Seed Rate Calculator<\/em>/g,
    `${flagHtml}</span> ${c.name} <em>Seed Rate Calculator</em>`
  );

  // Hero subtitle
  html = html.replace(
    /Calculate exact seed quantities for your Nigerian farm\. Get country-specific planting spacing, germination adjustments, and local seed pricing\./g,
    `Calculate exact seed quantities for your ${c.name} farm. Get country-specific planting spacing, germination adjustments, and local seed pricing.`
  );

  // Hero badge
  html = html.replace(
    /&#127475;&#127468; Nigeria-specific data/g,
    `${flagHtml} ${c.name}-specific data`
  );

  // Data file
  html = html.replace(/ng-agri-data\.js/g, dataFile);

  // Seed Programs section heading
  html = html.replace(
    /&#127473;&#127468; Seed Programs &amp; Sources in Nigeria/g,
    `${flagHtml} Seed Programs &amp; Sources in ${c.name}`
  );

  // Seed programs body — generic replacement
  html = html.replace(
    /<div class="info-box">\s*<strong>Presidential Fertilizer Initiative[\s\S]*?<\/div>/,
    `<div class="info-box"><strong>Local Seed Programs:</strong> Contact your national seed certification authority or agricultural extension service for information on subsidised seed programs and certified seed suppliers in ${c.name}.</div>`
  );

  // Info list items for Nigeria-specific institutions → generic
  html = html.replace(
    /<li><span class="il-label">Certification Body<\/span><span class="il-val">NASC — National Agricultural Seed Council \(nasc\.gov\.ng\)<\/span><\/li>/g,
    `<li><span class="il-label">Certification Body</span><span class="il-val">Contact the national seed certification authority in ${c.name} for certified seed sources.</span></li>`
  );
  html = html.replace(
    /<li><span class="il-label">Key Suppliers<\/span><span class="il-val">Premier Seed Nigeria, SEEDCO Nigeria, Notore Seeds, Syngenta Nigeria, DuPont Pioneer Nigeria<\/span><\/li>/g,
    `<li><span class="il-label">Key Suppliers</span><span class="il-val">Consult your local agro-dealer network or agricultural extension office for certified seed suppliers in ${c.name}.</span></li>`
  );
  html = html.replace(
    /<li><span class="il-label">Research Institutes<\/span><span class="il-val">IITA \(Ibadan\), NRCRI \(Umudike\), IAR \(Zaria\), NCRI \(Badeggi\)<\/span><\/li>/g,
    `<li><span class="il-label">Research Support</span><span class="il-val">CGIAR centers (CIMMYT, IITA, CIP, ICRISAT, IRRI) provide improved varieties and technical support across Africa.</span></li>`
  );
  html = html.replace(
    /<li><span class="il-label">Extension Service<\/span><span class="il-val">State Agricultural Development Programmes \(ADPs\) — contact your local ADP office<\/span><\/li>/g,
    `<li><span class="il-label">Extension Service</span><span class="il-val">Contact your district or county agricultural extension office for local variety recommendations and seed sources.</span></li>`
  );

  // Sources footer
  html = html.replace(
    /Data sources: FAO, NASC \(National Agricultural Seed Council\), IITA, Nigeria National Bureau of Statistics, CGIAR, World Bank\./g,
    `Data sources: FAO, CGIAR, ${c.name} national agricultural authority, World Bank.`
  );

  const outPath = path.join(OUTPUT_DIR, `${c.slug}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  count++;
  console.log(`  ✓ ${c.name} → ${c.slug}.html`);
});

console.log(`\nDone! Generated ${count} seed rate pages.`);
if (skipped.length) console.warn(`Skipped (no data file): ${skipped.join(', ')}`);
