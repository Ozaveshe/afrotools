#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'data/localization/sw-agriculture-parity-manifest.json');
const { alternateEntries } = require('./lib/fr-agriculture-hreflang');
const CONTRACTS = Object.freeze({
  'cassava-processing': require('./lib/sw-agriculture-family-contracts/cassava-processing'),
  'crop-yield': require('./lib/sw-agriculture-family-contracts/crop-yield'),
  fertilizer: require('./lib/sw-agriculture-family-contracts/fertilizer'),
  'farm-payroll': require('./lib/sw-agriculture-family-contracts/farm-payroll'),
  'fish-farming': require('./lib/sw-agriculture-family-contracts/fish-farming'),
  greenhouse: require('./lib/sw-agriculture-family-contracts/greenhouse'),
  'input-prices': require('./lib/sw-agriculture-family-contracts/input-prices'),
  irrigation: require('./lib/sw-agriculture-family-contracts/irrigation'),
  'farm-loans': require('./lib/sw-agriculture-family-contracts/farm-loans'),
  'farm-profit': require('./lib/sw-agriculture-family-contracts/farm-profit'),
  'livestock-feed': require('./lib/sw-agriculture-family-contracts/livestock-feed'),
  'seed-rate': require('./lib/sw-agriculture-family-contracts/seed-rate')
});

const FAMILY_SIZES = Object.freeze({
  'cassava-processing': { rows: 16, countries: 15 },
  'crop-yield': { rows: 55, countries: 54 },
  fertilizer: { rows: 55, countries: 54 },
  'farm-payroll': { rows: 55, countries: 54 },
  'fish-farming': { rows: 16, countries: 15 },
  greenhouse: { rows: 16, countries: 15 },
  'input-prices': { rows: 16, countries: 15 },
  irrigation: { rows: 55, countries: 54 },
  'farm-loans': { rows: 16, countries: 15 },
  'farm-profit': { rows: 55, countries: 54 },
  'livestock-feed': { rows: 16, countries: 15 },
  'seed-rate': { rows: 55, countries: 54 }
});

function parseArgs(argv) {
  const options = { family: null, check: false, fullMesh: true };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--family') options.family = argv[++index];
    else if (argv[index] === '--check') options.check = true;
    else if (argv[index] === '--full-mesh') options.fullMesh = true;
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!options.family) throw new Error('Provide --family <family-id>.');
  return options;
}

function alternateBlock(row) {
  return alternateEntries(row)
    .map(({ hreflang, route }) => (
      `<link rel="alternate" hreflang="${hreflang}" href="https://afrotools.com${route}">`
    ))
    .join('\n');
}

function synchronizeAlternates(content, row, relativeFile) {
  const canonicalPattern = /<link rel="canonical" href="[^"]+">/;
  const canonical = content.match(canonicalPattern);
  if (!canonical) throw new Error(`${relativeFile} has no canonical link.`);
  const withoutExisting = content.replace(
    /(?:\r?\n)?<link rel="alternate" hreflang="(?:en|fr|sw|ha|x-default)" href="[^"]+">/g,
    ''
  );
  return withoutExisting.replace(canonicalPattern, `${canonical[0]}\n${alternateBlock(row)}`);
}

function synchronizeEnglish(content, row) {
  return synchronizeAlternates(content, row, row.english.file);
}

function synchronizeSingleAlternate(content, hreflang, route, relativeFile) {
  const canonicalPattern = /<link rel="canonical" href="[^"]+">/;
  const canonical = content.match(canonicalPattern);
  if (!canonical) throw new Error(`${relativeFile} has no canonical link.`);
  const alternate = `<link rel="alternate" hreflang="${hreflang}" href="https://afrotools.com${route}">`;
  const existingPattern = new RegExp(
    `(?:\\r?\\n)?<link rel="alternate" hreflang="${hreflang}" href="[^"]+">`
  );
  if (existingPattern.test(content)) return content.replace(existingPattern, `\n${alternate}`);
  return content.replace(canonicalPattern, `${canonical[0]}\n${alternate}`);
}

function synchronizeFrench(content, row) {
  return synchronizeAlternates(content, row, row.french.file);
}

function routeToFile(route) {
  return `${String(route).replace(/^\/+|\/+$/g, '')}/index.html`;
}

function synchronizeHausa(content, row, relativeFile) {
  return synchronizeAlternates(content, row, relativeFile);
}

function writeOrCheck(file, content, check) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (check && current !== content) throw new Error(`${path.relative(ROOT, file)} is stale.`);
  if (!check && current !== content) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf8');
  }
}

function run(options) {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const contract = CONTRACTS[options.family];
  if (!contract) throw new Error(`No maintained Swahili family renderer for ${options.family}.`);
  const rows = manifest.rows.filter(row => row.family === options.family);
  if (!rows.length) throw new Error(`No rows selected for ${options.family}.`);
  const countryRows = rows.filter(row => row.country);
  const expected = FAMILY_SIZES[options.family];
  if (!expected || rows.length !== expected.rows || countryRows.length !== expected.countries) {
    throw new Error(
      `${options.family} requires ${expected && expected.rows} rows and ${expected && expected.countries} countries; found ${rows.length}/${countryRows.length}.`
    );
  }
  const countries = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'data/registry/countries.json'), 'utf8')
  );
  for (const row of rows) {
    const content = contract.render(row, {
      manifest,
      familyRows: rows,
      countries,
      fullMesh: options.fullMesh
    });
    if (/<iframe\b/i.test(content) || /\bfetch\s*\(/i.test(content)) {
      throw new Error(`${row.swahili.route} attempted an iframe or network-owned calculator.`);
    }
    writeOrCheck(path.join(ROOT, row.swahili.file), content, options.check);
    const englishFile = path.join(ROOT, row.english.file);
    const english = fs.readFileSync(englishFile, 'utf8');
    writeOrCheck(englishFile, synchronizeEnglish(english, row), options.check);
    const frenchFile = path.join(ROOT, row.french.file);
    const french = fs.readFileSync(frenchFile, 'utf8');
    writeOrCheck(frenchFile, synchronizeFrench(french, row), options.check);
    const hausaAlternate = alternateEntries(row).find(entry => entry.hreflang === 'ha');
    if (hausaAlternate) {
      const hausaRelativeFile = routeToFile(hausaAlternate.route);
      const hausaFile = path.join(ROOT, hausaRelativeFile);
      const hausa = fs.readFileSync(hausaFile, 'utf8');
      writeOrCheck(
        hausaFile,
        synchronizeHausa(hausa, row, hausaRelativeFile),
        options.check
      );
    }
  }

  console.log(JSON.stringify({
    family: options.family,
    rows: rows.length,
    countries: countryRows.length,
    fullMesh: options.fullMesh,
    mode: options.check ? 'check' : 'write'
  }, null, 2));
}

if (require.main === module) {
  try {
    run(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  CONTRACTS,
  FAMILY_SIZES,
  alternateBlock,
  parseArgs,
  run,
  synchronizeEnglish,
  synchronizeSingleAlternate,
  synchronizeFrench,
  synchronizeHausa
};
