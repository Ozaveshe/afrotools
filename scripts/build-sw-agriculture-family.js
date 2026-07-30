#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'data/localization/sw-agriculture-parity-manifest.json');
const { alternateEntries } = require('./lib/fr-agriculture-hreflang');
const HAUSA_NIGERIA_CROP_YIELD = Object.freeze({
  route: '/ha/noma/amfanin-gona-najeriya/',
  file: 'ha/noma/amfanin-gona-najeriya/index.html'
});
const CONTRACTS = Object.freeze({
  'crop-yield': require('./lib/sw-agriculture-family-contracts/crop-yield'),
  fertilizer: require('./lib/sw-agriculture-family-contracts/fertilizer')
});

function parseArgs(argv) {
  const options = { family: null, check: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--family') options.family = argv[++index];
    else if (argv[index] === '--check') options.check = true;
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

function synchronizeFrench(content, row) {
  return synchronizeAlternates(content, row, row.french.file);
}

function synchronizeHausa(content, row) {
  return synchronizeAlternates(content, row, HAUSA_NIGERIA_CROP_YIELD.file);
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
  if (options.family === 'crop-yield' && (rows.length !== 55 || countryRows.length !== 54)) {
    throw new Error(`Crop Yield requires 55 rows and 54 countries; found ${rows.length}/${countryRows.length}.`);
  }
  if (options.family === 'fertilizer' && (rows.length !== 55 || countryRows.length !== 54)) {
    throw new Error(`Fertilizer requires 55 rows and 54 countries; found ${rows.length}/${countryRows.length}.`);
  }
  const countries = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'data/registry/countries.json'), 'utf8')
  );

  for (const row of rows) {
    const content = contract.render(row, { manifest, familyRows: rows, countries });
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
    if (row.english.id === 'crop-yield-nigeria') {
      const hausaFile = path.join(ROOT, HAUSA_NIGERIA_CROP_YIELD.file);
      const hausa = fs.readFileSync(hausaFile, 'utf8');
      writeOrCheck(hausaFile, synchronizeHausa(hausa, row), options.check);
    }
  }

  console.log(JSON.stringify({
    family: options.family,
    rows: rows.length,
    countries: countryRows.length,
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
  alternateBlock,
  parseArgs,
  run,
  synchronizeEnglish,
  synchronizeFrench,
  synchronizeHausa
};
