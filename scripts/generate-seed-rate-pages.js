#!/usr/bin/env node
/**
 * Generates seed rate calculator HTML pages from the Nigeria template.
 * Reuses the country index and agri-data files from the agriculture suite.
 * Usage: node scripts/generate-seed-rate-pages.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function renderCountryFacts(country, data) {
  const stats = data.agriStats || {};
  const food = Array.isArray(stats.mainFoodCrops) ? stats.mainFoodCrops.slice(0, 6).map((item) => String(item).replace(/_/g, ' ')).join(', ') : '';
  const exports = Array.isArray(stats.mainExportCrops) ? stats.mainExportCrops.slice(0, 5).map((item) => String(item).replace(/_/g, ' ')).join(', ') : '';
  const rows = [];
  if (stats.gdpSharePercent != null) rows.push(`<tr><th scope="row">Agriculture share of GDP</th><td>~${escapeHtml(stats.gdpSharePercent)}%</td></tr>`);
  if (stats.arableLandHectares != null) rows.push(`<tr><th scope="row">Arable land</th><td>${escapeHtml(Number(stats.arableLandHectares).toLocaleString('en-US'))} ha</td></tr>`);
  if (stats.irrigatedPercent != null) rows.push(`<tr><th scope="row">Irrigated share</th><td>~${escapeHtml(stats.irrigatedPercent)}%</td></tr>`);
  if (food) rows.push(`<tr><th scope="row">Main food crops</th><td>${escapeHtml(food)}</td></tr>`);
  if (exports) rows.push(`<tr><th scope="row">Main export crops</th><td>${escapeHtml(exports)}</td></tr>`);
  const regions = (data.regions || []).slice(0, 8).map((region) =>
    `<tr><td>${escapeHtml(region.name)}</td><td>${escapeHtml(region.annualRainfall_mm)} mm</td><td>${escapeHtml((region.majorCrops || []).slice(0, 5).join(', '))}</td></tr>`
  ).join('');
  return `<section class="seo-content agri-country-facts" data-country-id="${escapeHtml(country.code)}" style="max-width:800px;margin:2rem auto;padding:0 1rem;">
<h2 style="font-size:1.15rem;font-weight:700;color:#1e293b;margin:1.5rem 0 0.5rem;">Farming context: ${escapeHtml(country.name)}</h2>
<p>${escapeHtml(country.name)} seed estimates use the selected crop, spacing, seed quality and field assumptions from the ${escapeHtml(country.code)} agriculture dataset. Check the variety label and local conditions before buying seed.</p>
<table style="width:100%;border-collapse:collapse;font-size:.85rem;"><tbody>${rows.join('')}</tbody></table>
${regions ? `<h3 style="font-size:.95rem;font-weight:700;margin:1.2rem 0 .4rem;">Growing regions at a glance</h3><table style="width:100%;border-collapse:collapse;font-size:.82rem;"><thead><tr><th>Region</th><th>Annual rainfall</th><th>Major crops</th></tr></thead><tbody>${regions}</tbody></table>` : ''}
<p style="font-size:.78rem;color:#64748b;">Country context from the AfroTools agriculture dataset - planning reference, not agronomic advice. Confirm with local extension services.</p>
</section>`;
}

function setIdentityMeta(html, country, data) {
  const values = {
    'afrotools-currency': data.currency,
    'afrotools-formula-jurisdiction': country.code,
    'afrotools-source-jurisdiction': country.code,
    'afrotools-country-id': country.code
  };
  for (const name of Object.keys(values)) {
    html = html.replace(new RegExp(`<meta name="${name}"[^>]*>\\s*`, 'g'), '');
  }
  const tags = Object.entries(values).map(([name, value]) =>
    `<meta name="${name}" content="${escapeHtml(value)}">`
  ).join('\n');
  return html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n${tags}`);
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
  const dataSandbox = { window: { AfroTools: {} } };
  vm.createContext(dataSandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/agriculture', dataFile), 'utf8'), dataSandbox, { filename: dataFile });
  const countryData = dataSandbox.window.AfroTools.countryData;
  if (!countryData || countryData.countryCode !== c.code) {
    throw new Error(`[SEED_RATE_DATA_COUNTRY_MISMATCH] ${dataFile} must declare ${c.code}`);
  }

  let html = TEMPLATE;
  html = setIdentityMeta(html, c, countryData);

  // Page title
  html = html.replace(
    /Seed Rate Calculator for Nigeria &mdash; Planting Guide \| AfroTools/g,
    `Seed Rate Calculator for ${c.name} — Planting Guide | AfroTools`
  );

  // Meta description
  html = html.replace(
    /Estimate seed quantities and spacing for cassava, maize, rice and yam in Nigeria\. Check the result against the variety label and local advice\./g,
    `Estimate seed quantities and spacing for ${topCropsStr} in ${c.name}. Check the result against the variety label and local advice.`
  );

  // OG/Twitter title
  html = html.replace(
    /Nigeria Seed Rate Calculator &mdash; AfroTools/g,
    `${c.name} Seed Rate Calculator — AfroTools`
  );

  // OG/Twitter description
  html = html.replace(
    /Estimate seed quantities and planting spacing for cassava, maize, rice and yam in Nigeria\. Check the result locally before buying seed\./g,
    `Estimate seed quantities and planting spacing for ${topCropsStr} in ${c.name}. Check the result locally before buying seed.`
  );
  html = html.replace(
    /Estimate seed quantities and planting spacing for cassava, maize, rice and yam in Nigeria\./g,
    `Estimate seed quantities and planting spacing for ${topCropsStr} in ${c.name}.`
  );

  // Canonical + OG URL
  html = html.replace(/\/agriculture\/seed-rate\/nigeria/g, `/agriculture/seed-rate/${c.slug}`);

  // Schema.org JSON-LD name + description
  html = html.replace(
    /"name": "Nigeria Seed Rate Calculator"/g,
    `"name": "${c.name} Seed Rate Calculator"`
  );
  html = html.replace(
    /"description": "Estimate seed quantities and planting spacing for farms in Nigeria\. Confirm the planning result against the variety label and local extension advice\."/g,
    `"description": "Estimate seed quantities and planting spacing for farms in ${c.name}. Confirm the planning result against the variety label and local extension advice."`
  );

  // Breadcrumb "Nigeria"
  html = html.replace(
    /<span aria-current="page">Nigeria<\/span>/g,
    `<span aria-current="page">${c.name}</span>`
  );
  html = html.replace(
    /"position":4,"name":"Nigeria","item":"https:\/\/afrotools\.com\/agriculture\/seed-rate\/([^"]+)"/g,
    `"position":4,"name":"${c.name}","item":"https://afrotools.com/agriculture/seed-rate/$1"`
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
    /Estimate seed quantities for your Nigerian farm using maintained crop methods, spacing and germination adjustments\. Confirm the planning result against your variety label and local extension advice\./g,
    `Estimate seed quantities for your ${c.name} farm using maintained crop methods, spacing and germination adjustments. Confirm the planning result against your variety label and local extension advice.`
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
    /Data sources: FAO crop guidance, NASC \(National Agricultural Seed Council\), IITA, Nigeria National Bureau of Statistics, CGIAR and World Bank\. Tomato planning parameters also reference <a href="https:\/\/www\.fao\.org\/land-water\/databases-and-software\/crop-information\/tomato\/en\/" rel="noopener noreferrer">FAO crop information<\/a>\./g,
    `Data sources: FAO crop guidance, CGIAR, ${c.name} national agricultural authority and World Bank. Tomato planning parameters also reference <a href="https://www.fao.org/land-water/databases-and-software/crop-information/tomato/en/" rel="noopener noreferrer">FAO crop information</a>.`
  );
  html = html.replace(/current="seed-rate-ng"/g, `current="seed-rate-${c.code.toLowerCase()}"`);
  const inheritedFacts = /<section class="seo-content agri-country-facts"[\s\S]*?<\/section>/;
  if (!inheritedFacts.test(html)) throw new Error(`[SEED_RATE_COUNTRY_FACTS_OWNER_MISSING] ${c.slug}`);
  html = html.replace(inheritedFacts, renderCountryFacts(c, countryData));

  const outPath = path.join(OUTPUT_DIR, `${c.slug}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  count++;
  console.log(`  ✓ ${c.name} → ${c.slug}.html`);
});

console.log(`\nDone! Generated ${count} seed rate pages.`);
if (skipped.length) console.warn(`Skipped (no data file): ${skipped.join(', ')}`);
