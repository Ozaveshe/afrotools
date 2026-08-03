#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'data/localization/sw-web-text-codecs-family.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const inventory = JSON.parse(fs.readFileSync(path.join(root, 'reports/swahili-free-app-parity-inventory.json'), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'data/audits/swahili-free-app-acceptance.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function dimensions(buffer) {
  assert(buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP', 'artwork is not WebP');
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (type === 'VP8X') return { width: 1 + buffer.readUIntLE(data + 4, 3), height: 1 + buffer.readUIntLE(data + 7, 3) };
    if (type === 'VP8 ') return { width: buffer.readUInt16LE(data + 6) & 0x3fff, height: buffer.readUInt16LE(data + 8) & 0x3fff };
    if (type === 'VP8L') {
      const bits = buffer.readUInt32LE(data + 1);
      return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
    }
    offset = data + size + (size % 2);
  }
  throw new Error('WebP dimensions were not found');
}

assert(manifest.baseCommit === '8354e321ff34caf60a33a3393cd0dcddfb00c023', 'wrong coordinator base');
assert(manifest.exactRowCount === 2 && manifest.rows.length === 2, 'scope must contain exactly two rows');
assert(new Set(manifest.rows.map((row) => row.englishId)).size === 2, 'duplicate manifest id');
for (const excluded of manifest.excludedEnglishIds) assert(!manifest.rows.some((row) => row.englishId === excluded), `excluded id selected: ${excluded}`);

const acceptedIds = new Set(ledger.entries.map((entry) => entry.englishId));
const inventoryById = new Map(inventory.rows.map((row) => [row.englishId, row]));
const evidence = [];
for (const row of manifest.rows) {
  assert(!acceptedIds.has(row.englishId), `${row.englishId} is already centrally accepted`);
  const inventoryRow = inventoryById.get(row.englishId);
  assert(inventoryRow, `${row.englishId} missing from parity inventory`);
  assert(inventoryRow.categoryKey === 'developer', `${row.englishId} is outside exact Developer scope`);
  for (const owner of [row.englishOwner, row.swahiliOwner, row.sharedEngine, row.artwork]) {
    assert(fs.existsSync(path.join(root, owner)), `missing owner: ${owner}`);
  }
  const english = fs.readFileSync(path.join(root, row.englishOwner), 'utf8');
  const swahili = fs.readFileSync(path.join(root, row.swahiliOwner), 'utf8');
  assert(english.includes('/assets/js/engines/web-text-codecs.js'), `${row.englishId} English owner bypasses shared engine`);
  assert(swahili.includes('/assets/js/engines/web-text-codecs.js'), `${row.englishId} Swahili owner bypasses shared engine`);
  assert(swahili.includes('scripts/build-sw-web-text-codecs-family.js'), `${row.englishId} lacks its maintained owner marker`);
  assert(!/sw-dev-runtime-localizer|data-explicit-language-fallback|sw-fallback-notice|<iframe\b/i.test(swahili), `${row.englishId} has a fallback shell`);
  assert(!/ai-advisor|netlify\/functions\/(?:ask|chat)|fetch\s*\(\s*['"`]/i.test(swahili), `${row.englishId} has an unconsented data path`);
  assert(swahili.includes(`rel="canonical" href="https://afrotools.com${row.swahiliRoute}"`), `${row.englishId} canonical mismatch`);
  assert(english.includes(`hreflang="sw" href="https://afrotools.com${row.swahiliRoute}"`), `${row.englishId} lacks reciprocal English hreflang`);
  const schemaBlocks = [...swahili.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  assert(schemaBlocks.some((schema) => schema['@type'] === 'WebApplication' && schema.inLanguage === 'sw'), `${row.englishId} WebApplication schema mismatch`);
  const artwork = fs.readFileSync(path.join(root, row.artwork));
  const size = dimensions(artwork);
  assert(size.width === 800 && size.height === 450, `${row.englishId} artwork must be 800x450, got ${size.width}x${size.height}`);
  assert(swahili.includes(`content="https://afrotools.com/${row.artwork}"`) || swahili.includes(`content="https://afrotools.com${row.artwork.startsWith('/') ? '' : '/'}${row.artwork}"`), `${row.englishId} OG artwork mismatch`);
  evidence.push({ englishId: row.englishId, artwork: { ...size, bytes: artwork.length, signature: 'RIFF/WEBP' } });
}

const surfaceRun = spawnSync(process.execPath, ['scripts/build-swahili-product-surface.js', '--check'], {
  cwd: root,
  encoding: 'utf8'
});
const surfaceOutput = `${surfaceRun.stdout || ''}${surfaceRun.stderr || ''}`;
const surfaceCount = Number((surfaceOutput.match(/Swahili product surface failed \((\d+)\)/) || [0, 0])[1]);
const targetSurfaceFailures = manifest.rows.filter((row) => surfaceOutput.includes(`${row.swahiliOwner}: generated Swahili product surface is stale`));
assert(targetSurfaceFailures.length === 0, `family owners conflict with the Swahili product-surface owner: ${targetSurfaceFailures.map((row) => row.englishId).join(', ')}`);

const receipt = {
  schemaVersion: 1,
  familyId: manifest.familyId,
  baseCommit: manifest.baseCommit,
  decision: 'candidate-ready-for-adversarial-review',
  centralAcceptancePromoted: false,
  counts: { exactRows: 2, candidateReady: 2, centrallyAccepted: 0, blockedRows: 0 },
  excludedEnglishIds: manifest.excludedEnglishIds,
  rows: evidence,
  proof: {
    maintainedOwner: 'scripts/build-sw-web-text-codecs-family.js',
    engine: 'assets/js/engines/web-text-codecs.js',
    engineTest: 'tests/sw-web-text-codecs-engine.test.js',
    browserSpec: 'tests/e2e/swahili-web-text-codecs-family.spec.js',
    manifest: 'data/localization/sw-web-text-codecs-family.json'
  },
  privacy: 'Both workflows are local-only; browser proof rejects every non-GET request and any AI advisor route.',
  accessibility: {
    renderedTextContrastMinimum: 4.5,
    renderedControlBoundaryContrastMinimum: 3,
    renderedFocusIndicatorContrastMinimum: 3,
    proof: 'Computed browser styles are checked in both light 320px and dark 375px at 200% root scale.'
  },
  repositorySurfaceGate: {
    status: surfaceRun.status === 0 ? 'passed' : 'carried-baseline-blocked',
    staleRowsOutsideFamily: surfaceCount,
    targetOwnersListed: false
  },
  note: 'This receipt is family-scoped evidence, not an edit to the central Swahili acceptance ledger.'
};

if (process.argv.includes('--write')) {
  fs.writeFileSync(path.join(root, 'reports/sw-web-text-codecs-parity-receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
}
console.log(JSON.stringify(receipt.counts));
