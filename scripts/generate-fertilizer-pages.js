#!/usr/bin/env node
/**
 * Generates fertilizer calculator HTML pages from the Nigeria template.
 * Reuses country data from generate-crop-yield-pages.js country list.
 * Usage: node scripts/generate-fertilizer-pages.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE = fs.readFileSync(path.join(ROOT, 'agriculture/fertilizer/nigeria.html'), 'utf8');
const OUTPUT_DIR = path.join(ROOT, 'agriculture/fertilizer');

// Read country index to get all countries
const indexSrc = fs.readFileSync(path.join(ROOT, 'data/agriculture/country-index.js'), 'utf8');
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
  const countryData = sandbox.window.AfroTools && sandbox.window.AfroTools.countryData;
  if (!countryData || countryData.countryCode !== c.code) throw new Error(`[FERTILIZER_DATA_COUNTRY_MISMATCH] ${dataFile} must declare ${c.code}`);
  if (countryData.currency !== c.currency) throw new Error(`[FERTILIZER_DATA_CURRENCY_MISMATCH] ${dataFile} declares ${countryData.currency}; expected ${c.currency}`);

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
  html = html.replace(/(<meta name="afrotools-country-id" content=")[^"]+(">)/, `$1${c.code}$2`);
  html = html.replace(/(<meta name="afrotools-source-jurisdiction" content=")[^"]+(">)/, `$1${c.sourceJurisdiction}$2`);
  html = html.replace(/(<meta name="afrotools-formula-jurisdiction" content=")[^"]+(">)/, `$1${countryData.countryCode}$2`);
  html = html.replace(/(<meta name="afrotools-currency" content=")[^"]+(">)/, `$1${c.currency}$2`);

  const outPath = path.join(OUTPUT_DIR, `${c.slug}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  count++;
});

console.log(`Done! Generated ${count} fertilizer pages.`);
