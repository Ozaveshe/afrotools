'use strict';

const assert = require('assert');
const fs = require('fs');
const {
  MANIFEST_PATH,
  EXPECTED_ROWS,
  EXPECTED_GENERATED_ROWS,
  EXPECTED_HAND_AUTHORED_ROWS,
  EXPECTED_MISSING_ARTWORK_ROWS,
  buildManifest,
  buildExtraRouteQueue,
  buildMissingArtworkQueue,
  assertManifestIntegrity,
  assertRoutesInManifest,
  reconcileAcceptanceRoutes,
} = require('../scripts/lib/fr-agriculture-parity-manifest');

const manifest = buildManifest();
assertManifestIntegrity(manifest);
assert.strictEqual(manifest.rows.length, EXPECTED_ROWS);
assert.strictEqual(
  manifest.rows.filter((row) => row.french.ownerState === 'manifest-generated-family').length,
  EXPECTED_GENERATED_ROWS
);
assert.strictEqual(
  manifest.rows.filter((row) => row.french.ownerState === 'hand-authored-semantic-owner').length,
  EXPECTED_HAND_AUTHORED_ROWS
);
assert.strictEqual(new Set(manifest.rows.map((row) => row.english.id)).size, EXPECTED_ROWS);
assert.strictEqual(new Set(manifest.rows.map((row) => row.english.routeKey)).size, EXPECTED_ROWS);
assert.strictEqual(new Set(manifest.rows.map((row) => row.french.routeKey)).size, EXPECTED_ROWS);
assert.strictEqual(buildExtraRouteQueue(manifest).count, 193);
assert.strictEqual(buildMissingArtworkQueue(manifest).count, EXPECTED_MISSING_ARTWORK_ROWS);
manifest.rows.forEach((row) => {
  assert.strictEqual(row.artwork.state, 'present', `Missing artwork for ${row.english.id}`);
  assert.ok(row.artwork.file, `Missing artwork file for ${row.english.id}`);
});
assert.throws(
  () => assertRoutesInManifest(manifest, ['/fr/agriculture/not-in-the-programme/']),
  /outside French Agriculture manifest/
);
assert.ok(fs.existsSync(MANIFEST_PATH), 'Generated manifest must be checked in after build.');
assert.deepStrictEqual(
  reconcileAcceptanceRoutes(manifest),
  {
    manifestRoutes: 447,
    receiptRows: 447,
    uniqueReceiptRoutes: 447,
    mismatchCount: 0,
    nonAcceptedCount: 0,
    duplicateRouteCount: 0,
    missing: [],
    outsideManifest: [],
    idRouteMismatches: [],
    duplicateRoutes: [],
  }
);

const pilotCodes = new Set(['SN', 'CI', 'CM', 'MA', 'CD']);
const pilot = manifest.rows.filter((row) => row.family === 'crop-yield' && row.country && pilotCodes.has(row.country.code));
assert.strictEqual(pilot.length, 5);
pilot.forEach((row) => {
  assert.deepStrictEqual(row.owners.englishEngine, ['engines/src/crop-yield-engine.js']);
  assert.ok(row.owners.englishData.includes(`data/agriculture/${row.country.code.toLowerCase()}-agri-data.js`));
});

console.log('French Agriculture parity manifest contract passed (447 rows, 443 generated, 4 hand-authored).');
