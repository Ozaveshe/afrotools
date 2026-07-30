#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  MANIFEST_PATH,
  EXTRA_ROUTE_REPORT_PATH,
  MISSING_ARTWORK_REPORT_PATH,
  EXPECTED_MISSING_ARTWORK_ROWS,
  buildManifest,
  buildExtraRouteQueue,
  buildMissingArtworkQueue,
  reconcileAcceptanceRoutes,
} = require('./lib/fr-agriculture-parity-manifest');

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeIfChanged(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (current !== content) fs.writeFileSync(file, content, 'utf8');
  return current !== content;
}

function run(options = {}) {
  const manifest = buildManifest();
  const extras = buildExtraRouteQueue(manifest);
  const missingArtwork = buildMissingArtworkQueue(manifest);
  const acceptanceRoutes = reconcileAcceptanceRoutes(manifest);
  if (extras.count !== 193) {
    throw new Error(`Expected 193 extra /fr/agriculture/ files; found ${extras.count}.`);
  }
  if (missingArtwork.count !== EXPECTED_MISSING_ARTWORK_ROWS) {
    throw new Error(
      `Expected ${EXPECTED_MISSING_ARTWORK_ROWS} missing Agriculture artwork items; found ${missingArtwork.count}.`
    );
  }

  const outputs = [
    [MANIFEST_PATH, stableJson(manifest)],
    [EXTRA_ROUTE_REPORT_PATH, stableJson(extras)],
    [MISSING_ARTWORK_REPORT_PATH, stableJson(missingArtwork)],
  ];
  if (options.check) {
    outputs.forEach(([file, expected]) => {
      const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
      if (current !== expected) throw new Error(`${path.relative(process.cwd(), file)} is stale.`);
    });
  } else {
    outputs.forEach(([file, content]) => writeIfChanged(file, content));
  }

  const generated = manifest.rows.filter((row) => row.french.ownerState === 'manifest-generated-family').length;
  const handAuthored = manifest.rows.length - generated;
  const report = {
    rows: manifest.rows.length,
    generated,
    handAuthored,
    extraFrenchAgricultureFiles: extras.count,
    currentNativeFrench: manifest.rows.filter((row) => row.french.currentRuntimeState === 'native-french').length,
    currentLegacyRuntime: manifest.rows.filter((row) => row.french.currentRuntimeState !== 'native-french').length,
    accepted: manifest.rows.filter((row) => row.acceptance.state === 'accepted').length,
    receiptRows: acceptanceRoutes.receiptRows,
    uniqueReceiptRoutes: acceptanceRoutes.uniqueReceiptRoutes,
    receiptRouteMismatches: acceptanceRoutes.mismatchCount,
    nonAcceptedReceiptRows: acceptanceRoutes.nonAcceptedCount,
    missingArtwork: missingArtwork.count,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return { manifest, extras, missingArtwork, acceptanceRoutes, report };
}

if (require.main === module) {
  try {
    run({ check: process.argv.includes('--check') });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { run };
