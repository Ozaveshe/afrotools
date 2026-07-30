#!/usr/bin/env node
/**
 * Generates fertilizer calculator HTML pages from the Nigeria template.
 * Reuses country data from generate-crop-yield-pages.js country list.
 * Usage: node scripts/generate-fertilizer-pages.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { synchronizeHtml: synchronizeAgricultureHreflang } = require('./lib/fr-agriculture-hreflang');
const { DATA: fertilizerContent, renderSeoBlock } = require('./expand-fertilizer');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE = fs.readFileSync(path.join(ROOT, 'agriculture/fertilizer/nigeria.html'), 'utf8');
const OUTPUT_DIR = path.join(ROOT, 'agriculture/fertilizer');

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
  return `<section class="seo-content agri-country-facts" data-country-id="${escapeHtml(country.code)}" style="max-width:800px;margin:2rem auto;padding:0 1rem;">
<h2 style="font-size:1.15rem;font-weight:700;color:#1e293b;margin:1.5rem 0 0.5rem;">Farming context: ${escapeHtml(country.name)}</h2>
<p>${escapeHtml(country.name)} fertilizer estimates use the selected crop, field, soil and product assumptions from the ${escapeHtml(country.code)} agriculture dataset. Check local conditions before applying national averages.</p>
<table style="width:100%;border-collapse:collapse;font-size:.85rem;"><tbody>${rows.join('')}</tbody></table>
<p style="font-size:.78rem;color:#64748b;">Country context from the AfroTools agriculture dataset - planning reference, not agronomic advice. Confirm with local extension services.</p>
</section>`;
}

function setIdentityMeta(html, country, data) {
  const values = {
    'afrotools-country-id': country.code,
    'afrotools-source-jurisdiction': country.sourceJurisdiction,
    'afrotools-formula-jurisdiction': data.countryCode,
    'afrotools-currency': country.currency
  };
  for (const name of Object.keys(values)) {
    html = html.replace(new RegExp(`<meta name="${name}"[^>]*>\\s*`, 'g'), '');
  }
  const tags = Object.entries(values).map(([name, value]) =>
    `<meta name="${name}" content="${escapeHtml(value)}">`
  ).join('\n');
  return html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n${tags}`);
}

// Read country index to get all countries
const indexSrc = fs.readFileSync(path.join(ROOT, 'data/agriculture/country-index.js'), 'utf8');
const cropDatabaseSrc = fs.readFileSync(path.join(ROOT, 'data/agriculture/crop-database.js'), 'utf8');
const window = { AfroTools: {} };
eval(indexSrc);
const countryProfiles = window.AfroTools.countryIndex;
const canonicalCountries = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/registry/countries.json'), 'utf8'));
const profileById = new Map(countryProfiles.map((country) => [country.code, country]));
const countries = canonicalCountries.map((country) => {
  const profile = profileById.get(country.id);
  if (!profile) throw new Error(`[FERTILIZER_COUNTRY_PROFILE_MISSING] ${country.id}`);
  return { ...profile, name: country.title, currency: country.currency, sourceJurisdiction: country.sourceJurisdiction };
});

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
  const sandbox = { window: {} };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/agriculture', dataFile), 'utf8'), sandbox, { filename: dataFile });
  vm.runInContext(cropDatabaseSrc, sandbox, { filename: 'crop-database.js' });
  const countryData = sandbox.window.AfroTools && sandbox.window.AfroTools.countryData;
  const cropDatabase = sandbox.window.AfroTools && sandbox.window.AfroTools.cropDatabase;
  if (!countryData || countryData.countryCode !== c.code) throw new Error(`[FERTILIZER_DATA_COUNTRY_MISMATCH] ${dataFile} must declare ${c.code}`);
  if (countryData.currency !== c.currency) throw new Error(`[FERTILIZER_DATA_CURRENCY_MISMATCH] ${dataFile} declares ${countryData.currency}; expected ${c.currency}`);
  const supportedCrops = countryData.crops.filter((crop) => {
    const shared = cropDatabase && cropDatabase.crops && cropDatabase.crops[crop.id];
    return Boolean(crop.nutrientUptake || shared && shared.nutrientUptake);
  });
  if (!supportedCrops.length) throw new Error(`[FERTILIZER_SUPPORTED_CROP_MISSING] ${c.slug}`);
  const supportedCropNames = supportedCrops.slice(0, 3).map((crop) => crop.name);

  let html = TEMPLATE;

  // Titles & meta
  html = html.replace(/Fertilizer Calculator for Nigeria/g, `Fertilizer Calculator for ${c.name}`);
  html = html.replace(/Nigeria Fertilizer Calculator/g, `${c.name} Fertilizer Calculator`);
  html = html.replace(
    /Estimate planning NPK needs for supported crops in Nigeria using maintained nutrient-removal methods and indicative local product data\./g,
    `Estimate planning NPK needs for ${supportedCropNames.join(', ')} in ${c.name} using maintained nutrient-removal methods and indicative local product data.`
  );
  html = html.replace(
    /Estimate planning NPK needs for supported crops in Nigeria with clear nutrient-removal assumptions\./g,
    `Estimate planning NPK needs for ${supportedCropNames.join(', ')} in ${c.name} with clear nutrient-removal assumptions.`
  );
  html = html.replace(
    /Estimate planning NPK needs for supported crops in Nigeria with clear assumptions\./g,
    `Estimate planning NPK needs for ${supportedCropNames.join(', ')} in ${c.name} with clear assumptions.`
  );
  html = html.replace(
    /Estimate planning NPK needs for supported crops in Nigeria using maintained nutrient-removal methods\./g,
    `Estimate planning NPK needs for ${supportedCropNames.join(', ')} in ${c.name} using maintained nutrient-removal methods.`
  );
  html = html.replace(
    /Calculate exact NPK fertilizer needs for cassava, maize, rice, yam in Nigeria\. Get product recommendations with local prices and subsidy information\./g,
    `Calculate planning NPK needs for ${supportedCropNames.join(', ')} in ${c.name} using maintained nutrient-removal methods and local product data.`
  );
  html = html.replace(
    /Calculate exact NPK fertilizer needs for cassava, maize, rice, yam in Nigeria\. Local prices and subsidy information\./g,
    `Calculate planning NPK needs for ${supportedCropNames.join(', ')} in ${c.name} using maintained nutrient-removal methods.`
  );
  html = html.replace(
    /Calculate exact NPK fertilizer needs for crops in Nigeria with local product recommendations\./g,
    `Calculate exact NPK fertilizer needs for crops in ${c.name} with local product recommendations.`
  );

  // URLs
  html = html.replace(/\/agriculture\/fertilizer\/nigeria/g, `/agriculture/fertilizer/${c.slug}`);
  const countryArtwork = `fertilizer-${c.slug}.webp`;
  const socialArtwork = fs.existsSync(path.join(ROOT, 'assets/img/tools', countryArtwork))
    ? countryArtwork
    : 'fertilizer-nigeria.webp';
  html = html.replace(/fertilizer-nigeria\.webp/g, socialArtwork);
  html = synchronizeAgricultureHreflang(html, {
    english: {
      id: `fertilizer-${c.slug}`,
      route: `/agriculture/fertilizer/${c.slug}`,
      file: `agriculture/fertilizer/${c.slug}.html`,
    },
    french: { route: `/fr/agriculture/fertilizer/${c.slug}` },
  });

  // Breadcrumb
  html = html.replace(/(<span aria-current="page">)Nigeria(<\/span>)/g, `$1${c.name}$2`);

  // Flag in H1
  html = html.replace(/&#127475;&#127468;/g, c.flag.codePointAt ?
    [...c.flag].map(ch => `&#${ch.codePointAt(0)};`).join('') : c.flag);

  // Data file
  html = html.replace(/ng-agri-data\.js/g, dataFile);

  // Data source footer
  html = html.replace(/Nigeria National Bureau of Statistics/g, `${c.name} National Statistics`);

  // The template also contains generated trust/FAQ/context blocks. Keep every identity-bearing
  // block aligned with the canonical country instead of maintaining a list of fragile selectors.
  html = html.replace(/\bNigeria\b/g, c.name);
  html = setIdentityMeta(html, c, countryData);
  html = html.replace(/current="fertilizer-nigeria"/g, `current="fertilizer-${c.slug}"`);
  const inheritedFacts = /<section class="seo-content agri-country-facts"[\s\S]*?<\/section>/;
  if (!inheritedFacts.test(html)) throw new Error(`[FERTILIZER_COUNTRY_FACTS_OWNER_MISSING] ${c.slug}`);
  html = html.replace(inheritedFacts, renderCountryFacts(c, countryData));

  const content = fertilizerContent[c.slug];
  if (!content) throw new Error(`[FERTILIZER_COUNTRY_CONTENT_MISSING] ${c.slug}`);
  const inheritedSeo = new RegExp(
    '<section class="seo-content"[^>]*>\\s*'
      + '<h2[^>]*>Fertilizer Use in ' + c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      + '<\\/h2>[\\s\\S]*?<\\/section>'
  );
  if (!inheritedSeo.test(html)) {
    throw new Error(`[FERTILIZER_COUNTRY_CONTENT_OWNER_MISSING] ${c.slug}`);
  }
  html = html.replace(inheritedSeo, renderSeoBlock(content).trim());
  if (!html.includes(`/assets/img/tools/${socialArtwork}`)) {
    throw new Error(`[FERTILIZER_COUNTRY_ARTWORK_MISMATCH] ${c.slug} is missing ${socialArtwork}`);
  }

  const outPath = path.join(OUTPUT_DIR, `${c.slug}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  count++;
});

console.log(`Done! Generated ${count} fertilizer pages.`);
