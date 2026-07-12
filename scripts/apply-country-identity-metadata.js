#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const audit = require('./audit-country-identity');

const ROOT = path.resolve(__dirname, '..');
const COUNTRIES_PATH = path.join(ROOT, 'data/registry/countries.json');
const RETRY_BUFFER = new SharedArrayBuffer(4);

function writeWithRetry(file, content) {
  let lastError;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      fs.writeFileSync(file, content, 'utf8');
      return;
    } catch (error) {
      lastError = error;
      Atomics.wait(new Int32Array(RETRY_BUFFER), 0, 0, 40 * (attempt + 1));
    }
  }
  throw lastError;
}

function metaTag(name, value) {
  return `<meta name="${name}" content="${String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">`;
}

function upsertMeta(html, name, value) {
  const tagPattern = new RegExp(`<meta\\b(?=[^>]*\\bname\\s*=\\s*(["'])${name}\\1)[^>]*>`, 'i');
  const expected = metaTag(name, value);
  if (tagPattern.test(html)) return html.replace(tagPattern, expected);
  const anchor = html.match(/<meta\s+charset=[^>]+>/i) || html.match(/<head[^>]*>/i);
  if (!anchor) throw new Error(`[COUNTRY_META_HEAD_MISSING] Unable to place ${name}.`);
  return html.replace(anchor[0], `${anchor[0]}\n${expected}`);
}

function agricultureDataFor(html) {
  const match = html.match(/<script[^>]+src=["']([^"']*\/data\/agriculture\/([a-z]{2})-agri-data\.js[^"']*)["']/i);
  if (!match) return null;
  const relative = match[1].split(/[?#]/)[0].replace(/^\/+/, '');
  const absolute = path.join(ROOT, relative);
  if (!fs.existsSync(absolute)) throw new Error(`[COUNTRY_DATA_MISSING] ${relative} does not exist.`);
  const sandbox = { window: {} };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(absolute, 'utf8'), sandbox, { filename: relative });
  const data = sandbox.window.AfroTools && sandbox.window.AfroTools.countryData;
  if (!data) throw new Error(`[COUNTRY_DATA_INVALID] ${relative} does not expose window.AfroTools.countryData.`);
  return { relative, data };
}

function projectCropYieldUi(html, country, file) {
  if (!/^agriculture\/crop-yield\/[^/]+\.html$/i.test(file)) return html;
  const currencyPattern = /(<span\s+id=["']rCurrency["']>)[^<]*(<\/span>)/i;
  if (!currencyPattern.test(html)) throw new Error(`[CROP_VISIBLE_CURRENCY_MISSING] ${file} does not expose #rCurrency.`);
  return html.replace(currencyPattern, `$1${country.currency}$2`);
}

function project(html, country, file) {
  const agriculture = agricultureDataFor(html);
  if (agriculture && agriculture.data.countryCode !== country.id) {
    throw new Error(`[COUNTRY_DATA_JURISDICTION_MISMATCH] ${file} loads ${agriculture.relative} for ${agriculture.data.countryCode}; expected ${country.id}.`);
  }
  if (agriculture && agriculture.data.currency !== country.currency) {
    throw new Error(`[COUNTRY_DATA_CURRENCY_MISMATCH] ${file} loads ${agriculture.relative} with ${agriculture.data.currency}; expected ${country.currency}.`);
  }
  const values = {
    'afrotools-country-id': country.id,
    'afrotools-source-jurisdiction': country.sourceJurisdiction,
    'afrotools-formula-jurisdiction': agriculture ? agriculture.data.countryCode : country.id,
    'afrotools-currency': agriculture ? agriculture.data.currency : country.currency
  };
  const projected = Object.entries(values).reduce((current, [name, value]) => upsertMeta(current, name, value), html);
  return projectCropYieldUi(projected, country, file);
}

function run(options = {}) {
  const countries = JSON.parse(fs.readFileSync(COUNTRIES_PATH, 'utf8'));
  const pages = audit.collectCountryPages(countries);
  const stale = [];
  pages.forEach(({ file, country }) => {
    const before = fs.readFileSync(file, 'utf8');
    const after = project(before, country, path.relative(ROOT, file).replace(/\\/g, '/'));
    if (after === before) return;
    stale.push(path.relative(ROOT, file).replace(/\\/g, '/'));
    if (options.write) writeWithRetry(file, after);
  });
  if (!options.write && stale.length) throw new Error(`Country identity metadata is stale in ${stale.length} file(s). Run node scripts/apply-country-identity-metadata.js --write.\n- ${stale.slice(0, 50).join('\n- ')}`);
  console.log(`${options.write ? 'Updated' : 'Verified'} country identity metadata across ${pages.length} country-specific route(s)${options.write ? `; ${stale.length} changed` : ''}.`);
  return { pages: pages.length, stale };
}

if (require.main === module) {
  try {
    run({ write: process.argv.includes('--write') });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { run, project, upsertMeta, agricultureDataFor, projectCropYieldUi };
