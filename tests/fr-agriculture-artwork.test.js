'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const FORBIDDEN_PASSIVE_STORAGE_KEYS = new Set([
  '_afro_search_sid',
  '_afro_ref_tracked',
  'afro_pro_cache',
  'afro_pro_status_cache',
  'aft_theme',
]);
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const missingQueue = require('../reports/fr-agriculture-missing-artwork-queue.json');
const generationReceipt = require('../reports/fr-agriculture-artwork-generation.json');
const diffReceipt = require('../reports/fr-agriculture-artwork-diff-proof.json');
const browserReceipt = require('../reports/fr-agriculture-artwork-browser-proof.json');
const responsiveReceipt = require('../reports/fr-agriculture-artwork-responsive-proof.json');
const exact320ReflowReceipts = [1, 2, 3, 4].map(ordinal => (
  require(`../reports/fr-agriculture-artwork-320-reflow-proof-shard-${ordinal}-of-4.json`)
));
const resultState320ReflowReceipts = [1, 2, 3, 4, 5, 6].map(ordinal => (
  require(`../reports/fr-agriculture-result-state-320-reflow-proof-shard-${ordinal}-of-6.json`)
));
const {
  expectedArtworkAlt,
} = require('./support/fr-agriculture-artwork-alt-contract');
const {
  isResultCapable,
  resultActionContract,
} = require('./support/fr-agriculture-result-state-contract');

function loadRegistry() {
  const source = fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8');
  const context = { console, setTimeout, clearTimeout };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'tool-registry.js' });
  return {
    rows: context.AFRO_TOOLS,
    extensions: context.TOOL_CARD_IMAGE_EXTENSIONS,
  };
}

function metaContent(html, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'));
  return match ? match[1] : '';
}

function publicAsset(value) {
  if (!value) return '';
  return new URL(value, 'https://afrotools.com/').pathname.replace(/^\/+/, '');
}

function hasMeaningfulArtworkAlt(value) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  if (normalized.length < 12 || /\b(?:pour|de|du|des|la|le|les|l['’])[\s:;,.!?–—-]*$/i.test(normalized)) {
    return false;
  }
  return normalized
    .replace(/^illustration\b/i, '')
    .replace(/[\s:;,.!?–—-]+/g, ' ')
    .trim()
    .split(' ')
    .filter((word) => word.length > 1).length >= 2;
}

function decodeHtmlAttribute(value) {
  return String(value || '')
    .replace(/&#39;|&#x27;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&');
}

function loadFreshReceipt(environmentName) {
  const configuredPath = process.env[environmentName];
  if (!configuredPath) return null;
  const absolutePath = path.resolve(ROOT, configuredPath);
  const receipt = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  receipt.__absolutePath = absolutePath;
  return receipt;
}

function assertStrictPrivacy(row) {
  assert.deepEqual(row.offOriginRequests, [], `${row.route} attempted off-origin requests`);
  assert.ok(
    row.privacy.storageMutations.every((mutation) => (
      !FORBIDDEN_PASSIVE_STORAGE_KEYS.has(mutation.key)
    )),
    `${row.route} mutated forbidden passive storage`,
  );
  assert.deepEqual(row.privacy.analyticsCommands, [], `${row.route} ran analytics before consent`);
  assert.equal(row.privacy.analyticsConfigured, false, `${row.route} configured analytics before consent`);
  assert.equal(row.privacy.googleTagPresent, false, `${row.route} inserted Google Tag Manager before consent`);
  assert.deepEqual(row.pageErrors, [], `${row.route} page errors`);
  assert.deepEqual(row.consoleErrors, [], `${row.route} console errors`);
}

const registry = loadRegistry();
const registryById = new Map(registry.rows.map((row) => [row.id, row]));
const generatedFamilyUse = new Map([
  ['fr-agriculture-crop-yield', 5],
  ['fr-agriculture-fertilizer', 38],
  ['fr-agriculture-irrigation', 30],
  ['fr-agriculture-farm-profit', 28],
  ['fr-agriculture-seed-rate', 6],
  ['fr-agriculture-farm-payroll', 37],
]);

assert.equal(manifest.rows.length, 447);
assert.equal(missingQueue.count, 0);
assert.deepEqual(missingQueue.rows, []);
assert.equal(missingQueue.decision, 'artwork-closeout-complete');
assert.equal(generationReceipt.originalQueue.rows, 146);
assert.equal(generationReceipt.originalQueue.resolvedWithGeneratedFamilyArtwork, 144);
assert.equal(generationReceipt.originalQueue.resolvedWithExistingExactFamilyArtwork, 2);
assert.equal(generationReceipt.originalQueue.remainingRows, 0);
assert.equal(generationReceipt.generatedAssets.length, 6);
assert.equal(generationReceipt.reusedAssets.length, 1);
assert.equal(diffReceipt.summary.originalQueueRows, 146);
assert.equal(diffReceipt.summary.changedQueueRouteFiles, 146);
assert.equal(diffReceipt.summary.missingExpectedRouteFiles, 0);
assert.equal(diffReceipt.summary.unexpectedFrenchRouteFiles, 0);
assert.equal(diffReceipt.summary.deletedFiles, 0);
assert.equal(diffReceipt.resolverPreservation.ownedImageIds, 453);
assert.equal(diffReceipt.resolverPreservation.nonOwnedMappingBytesEqual, true);
assert.equal(
  diffReceipt.resolverPreservation.baseNonOwnedSha256,
  diffReceipt.resolverPreservation.currentNonOwnedSha256
);
assert.equal(browserReceipt.schemaVersion, 2);
assert.equal(browserReceipt.evidenceStatus, 'route-real-no-clones-no-forced-image-styles');
assert.equal(browserReceipt.summary.routes, 447);
assert.equal(browserReceipt.summary.routeStatus200, 447);
assert.equal(browserReceipt.summary.ogResolved, 447);
assert.equal(browserReceipt.summary.twitterResolved, 447);
assert.equal(browserReceipt.summary.visiblePageArtworkResolved, 447);
assert.equal(browserReceipt.summary.visiblePageArtworkAccessible, 447);
assert.equal(browserReceipt.summary.visiblePageArtworkResourcesLoaded, 447);
assert.equal(browserReceipt.summary.visiblePageArtworkRendered, 447);
assert.equal(browserReceipt.summary.horizontalReflowPassed, 447);
assert.equal(browserReceipt.summary.failures, 0);
const freshServerReceipt = loadFreshReceipt('FR_AGRI_FRESH_BROWSER_SERVER_RECEIPT');
if (process.env.FR_AGRI_REQUIRE_FRESH_BROWSER_PROOF === '1') {
  assert.ok(
    freshServerReceipt,
    'FR_AGRI_FRESH_BROWSER_SERVER_RECEIPT is required for a fresh release proof',
  );
}
if (freshServerReceipt) {
  assert.equal(freshServerReceipt.schemaVersion, 3);
  assert.equal(freshServerReceipt.freshRun, true);
  assert.equal(freshServerReceipt.allOwnedServersReleased, true);
  assert.ok(freshServerReceipt.runs.length >= 1 && freshServerReceipt.runs.length <= 2);
  freshServerReceipt.runs.forEach((freshRun) => {
    const origin = new URL(freshRun.origin);
    assert.match(origin.hostname, /^(?:127\.0\.0\.1|localhost)$/);
    assert.equal(origin.port, String(freshRun.port));
    assert.ok(Number.isInteger(freshRun.ownedServerPid) && freshRun.ownedServerPid > 0);
    assert.equal(freshRun.serverReleased, true);
    assert.equal(freshRun.testExitCode, 0);
    assert.equal(freshRun.offOriginRequests, 0);
    assert.equal(freshRun.forbiddenStorageMutations, 0);
    assert.equal(freshRun.analyticsCommandsBeforeConsent, 0);
    assert.equal(freshRun.analyticsConfiguredBeforeConsent, 0);
    assert.equal(freshRun.googleTagsBeforeConsent, 0);
    assert.equal(freshRun.pageErrors, 0);
    assert.equal(freshRun.consoleErrors, 0);
    assert.equal(freshRun.clippedTextFragments, 0);
    assert.equal(freshRun.localActionNetworkWrites, 0);
  });
  const artworkRun = freshServerReceipt.runs.find(run => run.artworkRoutes === 447);
  const resultRun = freshServerReceipt.runs.find(run => run.resultCapableRoutes === 435);
  assert.ok(artworkRun);
  assert.equal(artworkRun.responsiveRoutes, 447);
  assert.equal(artworkRun.exact320Routes, 447);
  assert.equal(artworkRun.contrastFailures, 0);
  assert.ok(resultRun);
  assert.equal(resultRun.familyCountryRoutes, 414);
  assert.equal(resultRun.singletonRoutes, 21);
  assert.equal(resultRun.familyHubsNotApplicable, 12);
  assert.equal(freshServerReceipt.summary.artworkRoutes, 447);
  assert.equal(freshServerReceipt.summary.resultCapableRoutes, 435);
  assert.equal(freshServerReceipt.summary.offOriginRequests, 0);
  assert.equal(freshServerReceipt.summary.forbiddenStorageMutations, 0);
  assert.equal(freshServerReceipt.summary.analyticsCommandsBeforeConsent, 0);
  assert.equal(freshServerReceipt.summary.clippedTextFragments, 0);
  assert.equal(freshServerReceipt.summary.localActionNetworkWrites, 0);
  assert.ok(Date.parse(freshServerReceipt.checkedAt) > 0);
}
assert.equal(new Set(browserReceipt.rows.map((row) => row.route)).size, 447);
assert.ok(browserReceipt.rows.every((row) => (
  row.scenario === '320px-route-real'
  && row.viewportWidth === 320
  && row.effectiveViewportWidth === 320
  && row.hero === row.asset
  && row.heroAlt === row.expectedHeroAlt
  && row.og === row.asset
  && row.twitter === row.asset
  && row.heroResourceStatus === 200
  && row.heroResourceLoaded
  && row.computedDisplay !== 'none'
  && row.computedVisibility === 'visible'
  && row.computedOpacity > 0
  && row.renderedWidth > 0
  && row.renderedHeight > 0
  && row.pageScrollWidth <= row.pageClientWidth + 1
  && row.offOriginRequests.length === 0
  && row.privacy.storageMutations.every((mutation) => ![
    '_afro_search_sid',
    '_afro_ref_tracked',
    'afro_pro_cache',
    'afro_pro_status_cache',
    'aft_theme',
  ].includes(mutation.key))
  && row.privacy.analyticsCommands.length === 0
  && row.privacy.analyticsConfigured === false
  && row.privacy.googleTagPresent === false
  && row.pageErrors.length === 0
  && row.consoleErrors.length === 0
)));
browserReceipt.rows.forEach(assertStrictPrivacy);
assert.equal(responsiveReceipt.schemaVersion, 2);
assert.equal(responsiveReceipt.summary.routes, 447);
assert.equal(responsiveReceipt.summary.requestedTextScalePercent, 200);
assert.equal(responsiveReceipt.summary.effectiveViewportWidth, 375);
assert.equal(responsiveReceipt.summary.horizontalReflowPassed, 447);
assert.equal(responsiveReceipt.summary.visibleArtworkPassed, 447);
assert.equal(responsiveReceipt.summary.failures, 0);
assert.equal(new Set(responsiveReceipt.rows.map((row) => row.route)).size, 447);
assert.ok(responsiveReceipt.rows.every((row) => (
  row.scenario === '375px-200-percent-text'
  && row.viewportWidth === 375
  && row.effectiveViewportWidth === 375
  && row.requestedTextScalePercent === 200
  && row.appliedTextScale >= 1.95
  && row.appliedTextScale <= 2.05
  && row.hero === row.asset
  && row.heroAlt === row.expectedHeroAlt
  && row.heroResourceLoaded
  && row.computedDisplay !== 'none'
  && row.computedVisibility === 'visible'
  && row.computedOpacity > 0
  && row.renderedWidth > 0
  && row.renderedHeight > 0
  && row.pageScrollWidth <= row.pageClientWidth + 1
  && row.offOriginRequests.length === 0
  && row.privacy.analyticsCommands.length === 0
  && row.privacy.analyticsConfigured === false
  && row.privacy.googleTagPresent === false
  && row.pageErrors.length === 0
  && row.consoleErrors.length === 0
)));
responsiveReceipt.rows.forEach(assertStrictPrivacy);
const exact320Rows = exact320ReflowReceipts.flatMap(receipt => receipt.rows);
assert.deepEqual(
  exact320ReflowReceipts.map(receipt => receipt.shard),
  [
    { index: 0, ordinal: 1, count: 4, startManifestIndex: 0, endManifestIndexExclusive: 111 },
    { index: 1, ordinal: 2, count: 4, startManifestIndex: 111, endManifestIndexExclusive: 223 },
    { index: 2, ordinal: 3, count: 4, startManifestIndex: 223, endManifestIndexExclusive: 335 },
    { index: 3, ordinal: 4, count: 4, startManifestIndex: 335, endManifestIndexExclusive: 447 },
  ],
);
assert.equal(exact320Rows.length, 447);
assert.equal(new Set(exact320Rows.map(row => row.manifestIndex)).size, 447);
assert.ok(exact320ReflowReceipts.every(receipt => (
  receipt.summary.manifestRoutes === 447
  && receipt.summary.requestedTextScalePercent === 200
  && receipt.summary.effectiveViewportWidth === 320
  && receipt.summary.exactBaselineRootFontSize === 16
  && receipt.summary.exactScaledRootFontSize === 32
  && receipt.summary.exactRootScalePassed === receipt.summary.routes
  && receipt.summary.horizontalReflowPassed === receipt.summary.routes
  && receipt.summary.visibleDescendantClippingPassed === receipt.summary.routes
  && receipt.summary.directTextFragmentClippingPassed === receipt.summary.routes
  && receipt.summary.visibleArtworkPassed === receipt.summary.routes
  && receipt.summary.failures === 0
)));
exact320Rows.sort((left, right) => left.manifestIndex - right.manifestIndex)
  .forEach((row, manifestIndex) => {
    assert.equal(row.manifestIndex, manifestIndex);
    assert.equal(row.route, manifest.rows[manifestIndex].french.route);
    assert.equal(row.scenario, '320px-exact-200-percent-root-text');
    assert.equal(row.viewportWidth, 320);
    assert.equal(row.effectiveViewportWidth, 320);
    assert.equal(row.baselineRootFontSize, 16);
    assert.equal(row.computedRootFontSize, 32);
    assert.equal(row.appliedTextScale, 2);
    assert.equal(row.pageScrollWidth <= row.pageClientWidth + 1, true);
    assert.equal(row.visibleDescendantCount > 0, true);
    assert.equal(row.clippedRectangleCount, 0);
    assert.deepEqual(row.clippedRectangles, []);
    assert.equal(row.directTextNodeCount > 0, true);
    assert.equal(row.directTextFragmentCount > 0, true);
    assert.equal(row.clippedTextFragmentCount, 0);
    assert.deepEqual(row.clippedTextFragments, []);
    assert.equal(row.heroAlt, row.expectedHeroAlt);
    assert.equal(row.heroResourceLoaded, true);
    assertStrictPrivacy(row);
  });

const expectedResultRows = manifest.rows.filter(isResultCapable);
const resultStateRows = resultState320ReflowReceipts.flatMap(receipt => receipt.rows);
const expectedResultShardRanges = [
  [0, 72],
  [72, 145],
  [145, 217],
  [217, 290],
  [290, 362],
  [362, 435],
];
assert.deepEqual(
  resultState320ReflowReceipts.map(receipt => receipt.shard),
  expectedResultShardRanges.map(([startResultIndex, endResultIndexExclusive], index) => ({
    index,
    ordinal: index + 1,
    count: 6,
    startResultIndex,
    endResultIndexExclusive,
  })),
);
assert.equal(expectedResultRows.length, 435);
assert.equal(expectedResultRows.filter(row => row.family === 'singleton').length, 21);
assert.equal(expectedResultRows.filter(row => row.country).length, 414);
assert.equal(manifest.rows.filter(row => !isResultCapable(row)).length, 12);
assert.equal(resultStateRows.length, 435);
assert.equal(new Set(resultStateRows.map(row => row.route)).size, 435);
assert.equal(new Set(resultStateRows.map(row => row.resultIndex)).size, 435);
assert.equal(new Set(resultStateRows.map(row => row.manifestIndex)).size, 435);
assert.ok(resultState320ReflowReceipts.every((receipt) => (
  receipt.status === 'passed'
  && receipt.failure === null
  && receipt.scope.manifestRoutes === 447
  && receipt.scope.resultCapableRoutes === 435
  && receipt.scope.familyCountryRoutes === 414
  && receipt.scope.singletonRoutes === 21
  && receipt.scope.familyHubsNotApplicable === 12
  && receipt.notApplicableFamilyHubs.length === 12
  && receipt.summary.routes === receipt.summary.expectedShardRoutes
  && receipt.summary.exactRootScalePassed === receipt.summary.routes
  && receipt.summary.deterministicActionsPassed === receipt.summary.routes
  && receipt.summary.runtimeResultsPopulated === receipt.summary.routes
  && receipt.summary.horizontalReflowPassed === receipt.summary.routes
  && receipt.summary.visibleDescendantClippingPassed === receipt.summary.routes
  && receipt.summary.directTextFragmentClippingPassed === receipt.summary.routes
  && receipt.summary.artworkPreserved === receipt.summary.routes
  && receipt.summary.localActionNetworkWrites === 0
  && receipt.summary.directTextNodes > 0
  && receipt.summary.directTextFragments > 0
  && receipt.summary.clippedTextFragments === 0
  && receipt.summary.failures === 0
)));
resultStateRows.sort((left, right) => left.resultIndex - right.resultIndex)
  .forEach((row, resultIndex) => {
    const expectedRow = expectedResultRows[resultIndex];
    const actionContract = resultActionContract(expectedRow);
    assert.equal(row.resultIndex, resultIndex);
    assert.equal(row.manifestIndex, manifest.rows.indexOf(expectedRow));
    assert.equal(row.route, expectedRow.french.route);
    assert.equal(row.id, expectedRow.english.id);
    assert.equal(row.family, expectedRow.family);
    assert.equal(row.ownership, expectedRow.family === 'singleton' ? 'singleton' : 'family-country');
    assert.equal(row.action.action, actionContract.action || 'submit');
    assert.equal(row.action.form || null, actionContract.form || null);
    assert.equal(row.action.eventObserved > 0, true);
    assert.equal(row.resultSelector, actionContract.result);
    assert.equal(row.resultTextLength > 0, true);
    assert.equal(row.resultWidth > 0, true);
    assert.equal(row.resultHeight > 0, true);
    assert.equal(row.runtimeResultPopulated, true);
    assert.equal(row.viewportWidth, 320);
    assert.equal(row.effectiveViewportWidth, 320);
    assert.equal(row.visualViewportWidth, 320);
    assert.equal(row.requestedTextScalePercent, 200);
    assert.equal(row.baselineRootFontSize, 16);
    assert.equal(row.computedRootFontSize, 32);
    assert.equal(row.appliedTextScale, 2);
    assert.equal(row.pageScrollWidth <= row.viewportWidth + 1, true);
    assert.equal(row.loadedLocalScripts.length > 0, true);
    assert.equal(row.localActionWrites, 0);
    assertStrictPrivacy(row);
    assert.equal(row.visibleDescendantCount > 0, true);
    assert.equal(row.clippedRectangleCount, 0);
    assert.deepEqual(row.clippedRectangles, []);
    assert.equal(row.directTextNodeCount > 0, true);
    assert.equal(row.directTextFragmentCount > 0, true);
    assert.equal(row.clippedTextFragmentCount, 0);
    assert.deepEqual(row.clippedTextFragments, []);
    assert.equal(row.artworkPreserved, true);
    assert.equal(row.artworkAlt, expectedArtworkAlt(expectedRow));
  });

generationReceipt.generatedAssets.forEach((asset) => {
  const bytes = fs.readFileSync(path.join(ROOT, asset.file));
  assert.equal(bytes.length, asset.bytes, `Byte-size drift for ${asset.imageId}`);
  assert.equal(
    crypto.createHash('sha256').update(bytes).digest('hex'),
    asset.sha256,
    `SHA-256 drift for ${asset.imageId}`
  );
  assert.equal(generatedFamilyUse.get(asset.imageId), asset.queueRowsResolved);
});

for (const [imageId, expected] of generatedFamilyUse) {
  assert.equal(
    manifest.rows.filter((row) => row.artwork.imageId === imageId).length,
    expected,
    `Unexpected route usage for ${imageId}`
  );
}
assert.equal(
  manifest.rows.filter((row) => (
    row.family === 'livestock-feed'
    && row.country
    && ['AO', 'TN'].includes(row.country.code)
    && row.artwork.imageId === 'livestock-feed-calculator'
  )).length,
  2,
  'The two original livestock-feed gaps must reuse the exact family artwork.'
);

manifest.rows.forEach((row) => {
  const registryRow = registryById.get(row.english.id);
  assert.ok(registryRow, `Missing registry row for ${row.english.id}`);
  assert.equal(registryRow.imageId || registryRow.id, row.artwork.imageId, `Resolver drift for ${row.english.id}`);
  assert.equal(registry.extensions[row.artwork.imageId], path.extname(row.artwork.file).slice(1));

  const artworkFile = path.join(ROOT, row.artwork.file);
  assert.ok(fs.existsSync(artworkFile), `Missing artwork file for ${row.english.id}`);
  assert.ok(fs.statSync(artworkFile).size > 1024, `Artwork is too small to be real: ${row.artwork.file}`);
  assert.doesNotMatch(row.artwork.file, /(?:^|\/)og-default(?:\.|$)|placeholder|monogram/i);

  const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
  const expectedAsset = row.artwork.file.replace(/\\/g, '/');
  assert.equal(publicAsset(metaContent(html, 'og:image')), expectedAsset, `OG image mismatch: ${row.french.routeKey}`);
  assert.equal(publicAsset(metaContent(html, 'twitter:image')), expectedAsset, `Twitter image mismatch: ${row.french.routeKey}`);
  const hero = html.match(/<img[^>]+class=["'][^"']*\bhero-art\b[^"']*["'][^>]+src=["']([^"']+)["'][^>]*>/i);
  assert.ok(hero, `Missing hero artwork: ${row.french.routeKey}`);
  assert.equal(publicAsset(hero[1]), expectedAsset, `Hero image mismatch: ${row.french.routeKey}`);
  const alt = hero[0].match(/\balt="([^"]*)"|\balt='([^']*)'/i);
  assert.ok(alt, `Missing hero alt text: ${row.french.routeKey}`);
  const actualAlt = decodeHtmlAttribute(alt[1] ?? alt[2]);
  const expectedAlt = expectedArtworkAlt(row);
  assert.ok(hasMeaningfulArtworkAlt(actualAlt), `Malformed hero alt text: ${row.french.routeKey}`);
  assert.equal(actualAlt, expectedAlt, `Family-semantic hero alt mismatch: ${row.french.routeKey}`);
  assert.doesNotMatch(hero[0], /\bhidden\b|aria-hidden=["']true["']/i, `Hidden hero artwork: ${row.french.routeKey}`);
});

[
  'fr/tools/calculateur-engrais/index.html',
  'fr/tools/profit-agricole/index.html',
  'fr/tools/rendement-culture/index.html',
].forEach((relativeFile) => {
  const html = fs.readFileSync(path.join(ROOT, relativeFile), 'utf8');
  assert.match(
    html,
    /Niveau de confiance\s*:/i,
    `Missing explicit confidence statement in ${relativeFile}`,
  );
});

console.log(JSON.stringify({
  rows: manifest.rows.length,
  missingQueue: missingQueue.count,
  resolvedWithGeneratedFamilyArtwork: [...generatedFamilyUse.values()].reduce((sum, value) => sum + value, 0),
  resolvedWithExistingFamilyArtwork: 2,
  result: 'pass',
}, null, 2));
