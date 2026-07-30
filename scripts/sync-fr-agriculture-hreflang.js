#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  ROOT,
  MANIFEST_PATH,
  assertManifestIntegrity,
} = require('./lib/fr-agriculture-parity-manifest');
const {
  VERIFIED_EXISTING_ALTERNATES,
  desiredBlock,
  synchronizeHtml,
} = require('./lib/fr-agriculture-hreflang');

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

function run(options) {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  assertManifestIntegrity(manifest);
  const rows = manifest.rows.filter((row) => (
    row.family === options.family
    && row.french.currentRuntimeState === 'native-french'
  ));
  if (!rows.length) throw new Error(`No native manifest rows for ${options.family}.`);

  const changed = [];
  const checkedFiles = new Set();
  function synchronizeFile(relativeFile, row) {
    if (checkedFiles.has(relativeFile)) return;
    checkedFiles.add(relativeFile);
    const file = path.join(ROOT, relativeFile);
    const current = fs.readFileSync(file, 'utf8');
    const next = synchronizeHtml(current, row);
    if (current === next) return;
    changed.push(relativeFile);
    if (options.check) throw new Error(`${relativeFile} has stale or non-semantic hreflang.`);
    fs.writeFileSync(file, next, 'utf8');
  }
  rows.forEach((row) => {
    synchronizeFile(row.english.file, row);
    synchronizeFile(row.french.file, row);
    (VERIFIED_EXISTING_ALTERNATES[row.english.id] || []).forEach((alternate) => {
      const localizedFile = `${alternate.route.replace(/^\/+|\/+$/g, '')}/index.html`;
      synchronizeFile(localizedFile, row);
    });
  });
  process.stdout.write(`${JSON.stringify({
    family: options.family,
    checkedRows: rows.length,
    checkedFiles: checkedFiles.size,
    changedRows: changed.length,
    changed,
    mode: options.check ? 'check' : 'write',
  }, null, 2)}\n`);
  return { rows, changed };
}

if (require.main === module) {
  try {
    run(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { parseArgs, desiredBlock, synchronizeHtml, run };
