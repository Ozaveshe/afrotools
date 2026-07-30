#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  ROOT,
  MANIFEST_PATH,
  assertManifestIntegrity,
  assertRoutesInManifest,
  assertNativeFrenchOutput,
} = require('./lib/fr-agriculture-parity-manifest');

const CONTRACTS = Object.freeze({
  'crop-yield': require('./lib/fr-agriculture-family-contracts/crop-yield'),
  fertilizer: require('./lib/fr-agriculture-family-contracts/fertilizer'),
  irrigation: require('./lib/fr-agriculture-family-contracts/irrigation'),
  'farm-profit': require('./lib/fr-agriculture-family-contracts/farm-profit'),
  'seed-rate': require('./lib/fr-agriculture-family-contracts/seed-rate'),
  'fish-farming': require('./lib/fr-agriculture-family-contracts/fish-farming'),
  'cassava-processing': require('./lib/fr-agriculture-family-contracts/cassava-processing'),
  greenhouse: require('./lib/fr-agriculture-family-contracts/greenhouse'),
  'livestock-feed': require('./lib/fr-agriculture-family-contracts/livestock-feed'),
  'input-prices': require('./lib/fr-agriculture-family-contracts/input-prices'),
  'farm-loans': require('./lib/fr-agriculture-family-contracts/farm-loans'),
  'farm-payroll': require('./lib/fr-agriculture-family-contracts/farm-payroll'),
});

function parseArgs(argv) {
  const options = { family: null, pilot: false, countries: [], check: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--family') options.family = argv[++index];
    else if (value === '--pilot') options.pilot = true;
    else if (value === '--country') options.countries.push(String(argv[++index] || '').toUpperCase());
    else if (value === '--check') options.check = true;
    else throw new Error(`Unknown argument: ${value}`);
  }
  if (!options.family) throw new Error('Provide --family <family-id>.');
  return options;
}

function writeIfChanged(file, content) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (current !== content) fs.writeFileSync(file, content, 'utf8');
  return current !== content;
}

function assertCropYieldPilotAccepted(manifest, contract) {
  const pilotRows = manifest.rows.filter((row) => (
    row.family === 'crop-yield'
    && row.country
    && contract.PILOT_CODES.includes(row.country.code)
  ));
  if (
    pilotRows.length !== contract.PILOT_CODES.length
    || pilotRows.some((row) => row.acceptance.state !== 'accepted')
  ) {
    throw new Error('Full-family generation is locked until all five Crop Yield pilot rows have accepted receipts.');
  }
  return true;
}

function run(options) {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error('Missing French Agriculture parity manifest. Run node scripts/build-fr-agriculture-parity-manifest.js.');
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  assertManifestIntegrity(manifest);
  const contract = CONTRACTS[options.family];
  if (!contract) throw new Error(`No maintained French family renderer for ${options.family}.`);

  let rows = manifest.rows.filter((row) => (
    row.family === options.family
    && row.french.ownerState === 'manifest-generated-family'
  ));
  if (options.pilot) rows = rows.filter((row) => row.country && contract.PILOT_CODES.includes(row.country.code));
  if (options.countries.length) rows = rows.filter((row) => row.country && options.countries.includes(row.country.code));
  if (!rows.length) throw new Error(`No manifest rows selected for ${options.family}.`);
  if (options.family === 'crop-yield' && !options.pilot && !options.countries.length) {
    assertCropYieldPilotAccepted(manifest, contract);
  }

  assertRoutesInManifest(manifest, rows.map((row) => row.french.route));
  const familyRows = manifest.rows.filter((row) => (
    row.family === options.family
    && row.french.ownerState === 'manifest-generated-family'
  ));
  const outputs = rows.map((row) => {
    const content = contract.render(row, { manifest, familyRows });
    if (/<iframe\b/i.test(content) || /\bfetch\s*\(\s*["'`]\/?(?:agriculture|tools)\//i.test(content)) {
      throw new Error(`Renderer attempted an English iframe/transplant for ${row.french.route}.`);
    }
    return { row, content, file: path.join(ROOT, row.french.file) };
  });

  outputs.forEach(({ row, file, content }) => {
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    if (options.check && current !== content) throw new Error(`${row.french.file} is stale.`);
    if (!options.check) writeIfChanged(file, content);
  });
  assertNativeFrenchOutput(manifest, rows.map((row) => row.french.route));
  process.stdout.write(`${JSON.stringify({
    family: options.family,
    rows: rows.length,
    routes: rows.map((row) => row.french.route),
    mode: options.check ? 'check' : 'write',
  }, null, 2)}\n`);
  return { rows, outputs };
}

if (require.main === module) {
  try {
    run(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { parseArgs, run, assertCropYieldPilotAccepted };
