#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  ROOT,
  MANIFEST_PATH,
  assertManifestIntegrity,
  assertRoutesInManifest,
  assertNativeFrenchOutput,
} = require('./lib/fr-agriculture-parity-manifest');

const CONTRACTS = Object.freeze({
  'farm-budget': require('./lib/fr-agriculture-singleton-contracts/farm-budget'),
  'farm-size-converter': require('./lib/fr-agriculture-singleton-contracts/farm-size-converter'),
  'harvest-date-estimator': require('./lib/fr-agriculture-singleton-contracts/harvest-date-estimator'),
  'coffee-calculator': require('./lib/fr-agriculture-singleton-contracts/coffee-calculator'),
  'cocoa-tracker': require('./lib/fr-agriculture-singleton-contracts/cocoa-tracker'),
  'pesticide-dosage-calculator': require('./lib/fr-agriculture-singleton-contracts/pesticide-dosage-calculator'),
  'poultry-roi-calculator': require('./lib/fr-agriculture-singleton-contracts/poultry-roi-calculator'),
  'soil-ph-calculator': require('./lib/fr-agriculture-singleton-contracts/soil-ph-calculator'),
  'storage-loss': require('./lib/fr-agriculture-singleton-contracts/storage-loss'),
  'crop-rotation-planner': require('./lib/fr-agriculture-singleton-contracts/crop-rotation-planner'),
  'vaccination-schedule': require('./lib/fr-agriculture-singleton-contracts/vaccination-schedule'),
  'commodity-prices': require('./lib/fr-agriculture-singleton-contracts/commodity-prices'),
  'cooperative-calculator': require('./lib/fr-agriculture-singleton-contracts/cooperative-calculator'),
  'warehouse-receipt': require('./lib/fr-agriculture-singleton-contracts/warehouse-receipt'),
  'export-docs': require('./lib/fr-agriculture-singleton-contracts/export-docs'),
  'tractor-calculator': require('./lib/fr-agriculture-singleton-contracts/tractor-calculator'),
  'crop-insurance': require('./lib/fr-agriculture-singleton-contracts/crop-insurance'),
});

const COUNTRY_PRESET_SINGLETONS = new Set([
  'crop-insurance',
  'export-docs',
  'poultry-roi-calculator',
  'vaccination-schedule',
]);

function addCountryPreset(content, id) {
  if (!COUNTRY_PRESET_SINGLETONS.has(id)) return content;
  let output = content;
  if (!output.includes('/data/agriculture/country-index.js')) {
    output = output.replace(
      /<script\s+src="\/data\/agriculture\//,
      '<script src="/data/agriculture/country-index.js"></script><script src="/data/agriculture/'
    );
  }
  if (!output.includes('/assets/js/pages/fr-agriculture-country-preset.js')) {
    output = output.replace(
      '</body>',
      '<script src="/assets/js/pages/fr-agriculture-country-preset.js"></script>\n</body>'
    );
  }
  return output;
}

function parseArgs(argv) {
  const options = { id: null, check: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--id') options.id = argv[++index];
    else if (argv[index] === '--check') options.check = true;
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!options.id) throw new Error('Provide --id <singleton-id>.');
  return options;
}

function run(options) {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  assertManifestIntegrity(manifest);
  const row = manifest.rows.find(item => item.english.id === options.id && item.family === 'singleton');
  if (!row) throw new Error(`Unknown Agriculture singleton: ${options.id}.`);
  if (row.french.ownerState !== 'manifest-generated-family') throw new Error(`${options.id} is a hand-authored semantic owner.`);
  const contract = CONTRACTS[options.id];
  if (!contract) throw new Error(`No explicit maintained French singleton renderer for ${options.id}.`);
  assertRoutesInManifest(manifest, [row.french.route]);
  const countryRegistry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/registry/countries.json'), 'utf8'));
  const countries = countryRegistry.map(country => ({
    id: country.id,
    fr: country.displayNames && country.displayNames.fr
      ? country.displayNames.fr
      : country.title,
    routeSlug: country.routeSlug,
  }));
  const content = addCountryPreset(contract.render(row, { manifest, countries }), options.id);
  if (/<iframe\b/i.test(content) || /\bfetch\s*\(\s*["'`]\/?(?:agriculture|tools)\//i.test(content)) {
    throw new Error(`Renderer attempted an English iframe/transplant for ${row.french.route}.`);
  }
  const file = path.join(ROOT, row.french.file);
  const current = fs.readFileSync(file, 'utf8');
  if (options.check && current !== content) throw new Error(`${row.french.file} is stale.`);
  if (!options.check && current !== content) fs.writeFileSync(file, content, 'utf8');
  assertNativeFrenchOutput(manifest, [row.french.route]);
  console.log(JSON.stringify({ id: options.id, route: row.french.route, mode: options.check ? 'check' : 'write' }, null, 2));
}

if (require.main === module) {
  try { run(parseArgs(process.argv.slice(2))); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { CONTRACTS, COUNTRY_PRESET_SINGLETONS, addCountryPreset, parseArgs, run };
