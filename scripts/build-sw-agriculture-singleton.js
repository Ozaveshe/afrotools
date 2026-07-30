#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'data/localization/sw-agriculture-parity-manifest.json');
const CONTRACTS = Object.freeze({
  'vaccination-schedule': require('./lib/sw-agriculture-singleton-contracts/vaccination-schedule')
});

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
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const row = manifest.rows.find(item => item.english.id === options.id && item.family === 'singleton');
  if (!row) throw new Error(`Unknown Swahili Agriculture singleton: ${options.id}.`);
  const contract = CONTRACTS[options.id];
  if (!contract) throw new Error(`No maintained Swahili renderer for ${options.id}.`);
  const countryRegistry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/registry/countries.json'), 'utf8'));
  const countries = countryRegistry.map(country => ({
    code: country.isoCode || country.id,
    sw: country.displayNames && country.displayNames.sw
      ? country.displayNames.sw
      : country.title
  }));
  const content = contract.render(row, { manifest, countries });
  if (/<iframe\b/i.test(content)) throw new Error(`${row.swahili.route} attempted an iframe owner.`);
  const file = path.join(ROOT, row.swahili.file);
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (options.check && current !== content) throw new Error(`${row.swahili.file} is stale.`);
  if (!options.check && current !== content) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf8');
  }
  console.log(JSON.stringify({
    id: options.id,
    route: row.swahili.route,
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

module.exports = { CONTRACTS, parseArgs, run };
