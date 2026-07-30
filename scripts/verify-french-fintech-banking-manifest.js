'use strict';

const fs = require('fs');
const path = require('path');
const { buildReport, normalizeRoute } = require('./build-french-free-app-parity-inventory.js');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'data', 'localization', 'fr-fintech-banking-parity-manifest.json');

function fail(message) {
  throw new Error(`French Fintech & Banking manifest: ${message}`);
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const freshReport = buildReport();
  const freshRows = freshReport.rows.filter((row) => row.category === manifest.category);
  const expectedBaseline = {
    'native-candidate': manifest.baseline.nativeCandidate,
    'english-iframe': manifest.baseline.englishIframe,
    'bridge-handoff': manifest.baseline.bridgeHandoff,
    missing: manifest.baseline.missing
  };

  if (manifest.routes.length !== manifest.expectedEnglishFreeApps) {
    fail(`expected ${manifest.expectedEnglishFreeApps} rows, found ${manifest.routes.length}`);
  }
  if (freshRows.length !== manifest.expectedEnglishFreeApps) {
    fail(`fresh inventory denominator drifted to ${freshRows.length}`);
  }

  const ids = new Set();
  const frenchRoutes = new Set();
  for (const row of manifest.routes) {
    if (ids.has(row.englishId)) fail(`duplicate English id ${row.englishId}`);
    if (frenchRoutes.has(normalizeRoute(row.frenchRoute))) fail(`duplicate French route ${row.frenchRoute}`);
    ids.add(row.englishId);
    frenchRoutes.add(normalizeRoute(row.frenchRoute));
    const inventoryRow = freshRows.find((candidate) => candidate.englishId === row.englishId);
    if (!inventoryRow) fail(`English owner ${row.englishId} is outside the fresh denominator`);
    if (normalizeRoute(inventoryRow.englishRoute) !== normalizeRoute(row.englishRoute)) {
      fail(`${row.englishId} English route drifted from ${row.englishRoute} to ${inventoryRow.englishRoute}`);
    }
    const template = path.join(
      ROOT,
      'data',
      'localization',
      'fr-fintech-banking-pages',
      `${row.englishId}.html`
    );
    if (fs.existsSync(template)) {
      if (inventoryRow.state !== 'native-candidate') {
        fail(`${row.englishId} has a native template but fresh inventory reports ${inventoryRow.state}`);
      }
      if (normalizeRoute(inventoryRow.primaryFrenchRoute) !== normalizeRoute(row.frenchRoute)) {
        fail(
          `${row.englishId} native owner drifted from ${row.frenchRoute} `
          + `to ${inventoryRow.primaryFrenchRoute || 'none'}`
        );
      }
    } else if (inventoryRow.state !== row.baselineState) {
      fail(`${row.englishId} pending route drifted from baseline ${row.baselineState} to ${inventoryRow.state}`);
    }
    for (const relativeFile of [
      `tools/${row.englishId}/index.html`,
      row.controller,
      row.artwork
    ]) {
      if (!fs.existsSync(path.join(ROOT, relativeFile))) fail(`${row.englishId} is missing ${relativeFile}`);
    }
  }

  for (const [state, count] of Object.entries(expectedBaseline)) {
    const actual = manifest.routes.filter((row) => row.baselineState === state).length;
    if (actual !== count) fail(`${state} expected ${count}, found ${actual}`);
  }

  console.log(`French Fintech & Banking manifest verified: ${manifest.routes.length}/31 exact English owners; baseline 0 native, 9 iframe, 19 bridge, 3 missing.`);
}

if (require.main === module) main();

module.exports = { main };
