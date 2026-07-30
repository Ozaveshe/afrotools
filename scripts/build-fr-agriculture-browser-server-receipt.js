#!/usr/bin/env node
'use strict';

const fs = require('fs');
const net = require('net');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FORBIDDEN_STORAGE_KEYS = new Set([
  '_afro_search_sid',
  '_afro_ref_tracked',
  'afro_pro_cache',
  'afro_pro_status_cache',
  'aft_theme',
]);

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function load(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sum(rows, selector) {
  return rows.reduce((total, row) => total + selector(row), 0);
}

function privacyTotals(rows) {
  return {
    offOriginRequests: sum(rows, (row) => row.offOriginRequests.length),
    forbiddenStorageMutations: sum(rows, (row) => (
      row.privacy.storageMutations.filter((mutation) => (
        FORBIDDEN_STORAGE_KEYS.has(mutation.key)
      )).length
    )),
    analyticsCommandsBeforeConsent: sum(
      rows,
      (row) => row.privacy.analyticsCommands.length,
    ),
    analyticsConfiguredBeforeConsent: rows.filter(
      (row) => row.privacy.analyticsConfigured,
    ).length,
    googleTagsBeforeConsent: rows.filter(
      (row) => row.privacy.googleTagPresent,
    ).length,
    pageErrors: sum(rows, (row) => row.pageErrors.length),
    consoleErrors: sum(rows, (row) => row.consoleErrors.length),
  };
}

function assertFreshReceipt(receipt, label, origin, pid, startedAt) {
  assert(Date.parse(receipt.checkedAt) >= startedAt, `${label} is not from this run`);
  assert(receipt.baseUrl === origin, `${label} origin differs from the fresh server`);
  assert(receipt.ownedServerPid === pid, `${label} PID differs from the fresh server`);
}

function portIsClosed(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    const finish = (closed) => {
      socket.destroy();
      resolve(closed);
    };
    socket.setTimeout(1200);
    socket.once('connect', () => finish(false));
    socket.once('timeout', () => finish(true));
    socket.once('error', () => finish(true));
  });
}

async function main() {
  const artworkOrigin = new URL(requiredEnvironment('FR_AGRI_PROOF_ORIGIN')).origin;
  const artworkPort = Number(requiredEnvironment('FR_AGRI_ARTWORK_SERVER_PORT'));
  const artworkPid = Number(requiredEnvironment('FR_AGRI_ARTWORK_SERVER_PID'));
  const artworkStartedAtIso = requiredEnvironment('FR_AGRI_PROOF_STARTED_AT');
  const artworkStartedAt = Date.parse(artworkStartedAtIso);
  const resultOrigin = new URL(
    process.env.FR_AGRI_RESULT_PROOF_ORIGIN || artworkOrigin,
  ).origin;
  const resultPort = Number(
    process.env.FR_AGRI_RESULT_SERVER_PORT || artworkPort,
  );
  const resultPid = Number(
    process.env.FR_AGRI_RESULT_SERVER_PID || artworkPid,
  );
  const resultStartedAtIso = (
    process.env.FR_AGRI_RESULT_PROOF_STARTED_AT || artworkStartedAtIso
  );
  const resultStartedAt = Date.parse(resultStartedAtIso);
  [
    ['artwork', artworkOrigin, artworkPort, artworkPid, artworkStartedAt],
    ['result', resultOrigin, resultPort, resultPid, resultStartedAt],
  ].forEach(([label, origin, port, pid, startedAt]) => {
    assert(Number.isInteger(port) && port > 0, `${label} server port must be a positive integer`);
    assert(Number.isInteger(pid) && pid > 0, `${label} server PID must be a positive integer`);
    assert(Number.isFinite(startedAt), `${label} proof start time must be an ISO timestamp`);
    assert(new URL(origin).port === String(port), `${label} proof origin and port differ`);
  });

  const artwork = load('reports/fr-agriculture-artwork-browser-proof.json');
  const responsive = load('reports/fr-agriculture-artwork-responsive-proof.json');
  const exactReceipts = [1, 2, 3, 4].map((ordinal) => (
    load(`reports/fr-agriculture-artwork-320-reflow-proof-shard-${ordinal}-of-4.json`)
  ));
  const resultReceipts = [1, 2, 3, 4, 5, 6].map((ordinal) => (
    load(`reports/fr-agriculture-result-state-320-reflow-proof-shard-${ordinal}-of-6.json`)
  ));
  const contrast = load('reports/fr-agriculture-contrast-proof.json');

  [
    ['artwork proof', artwork],
    ['responsive proof', responsive],
    ...exactReceipts.map((receipt, index) => [`exact reflow shard ${index + 1}`, receipt]),
  ].forEach(([label, receipt]) => {
    assertFreshReceipt(
      receipt,
      label,
      artworkOrigin,
      artworkPid,
      artworkStartedAt,
    );
  });
  resultReceipts.forEach((receipt, index) => {
    assertFreshReceipt(
      receipt,
      `result-state shard ${index + 1}`,
      resultOrigin,
      resultPid,
      resultStartedAt,
    );
  });
  assert(
    Date.parse(contrast.checkedAt) >= artworkStartedAt,
    'contrast proof is not from this run',
  );
  assert(
    contrast.origin === artworkOrigin,
    'contrast proof origin differs from the fresh artwork server',
  );

  const exactRows = exactReceipts.flatMap((receipt) => receipt.rows);
  const resultRows = resultReceipts.flatMap((receipt) => receipt.rows);
  const artworkRows = [
    ...artwork.rows,
    ...responsive.rows,
    ...exactRows,
  ];
  const artworkPrivacy = privacyTotals(artworkRows);
  const resultPrivacy = privacyTotals(resultRows);
  const privacy = Object.fromEntries(Object.keys(artworkPrivacy).map((name) => [
    name,
    artworkPrivacy[name] + resultPrivacy[name],
  ]));
  const exactIndexes = exactRows.map((row) => row.manifestIndex);
  const resultIndexes = resultRows.map((row) => row.resultIndex);

  assert(artwork.rows.length === 447, 'fresh artwork proof must contain 447 routes');
  assert(new Set(artwork.rows.map((row) => row.route)).size === 447, 'artwork routes are not unique');
  assert(responsive.rows.length === 447, 'fresh responsive proof must contain 447 routes');
  assert(new Set(responsive.rows.map((row) => row.route)).size === 447, 'responsive routes are not unique');
  assert(exactRows.length === 447, 'exact-320 shard union must contain 447 routes');
  assert(new Set(exactIndexes).size === 447, 'exact-320 routes were skipped or repeated');
  assert(Math.min(...exactIndexes) === 0 && Math.max(...exactIndexes) === 446, 'exact-320 indexes are incomplete');
  assert(resultRows.length === 435, 'result-state shard union must contain 435 routes');
  assert(new Set(resultIndexes).size === 435, 'result-state routes were skipped or repeated');
  assert(Math.min(...resultIndexes) === 0 && Math.max(...resultIndexes) === 434, 'result-state indexes are incomplete');
  assert(resultRows.filter((row) => row.family === 'singleton').length === 21, 'singleton result count differs');
  assert(resultRows.filter((row) => row.family !== 'singleton').length === 414, 'family-country result count differs');
  assert(sum(exactRows, (row) => row.clippedTextFragmentCount) === 0, 'exact-320 text clipping found');
  assert(sum(resultRows, (row) => row.clippedTextFragmentCount) === 0, 'result-state text clipping found');
  assert(sum(resultRows, (row) => row.localActionWrites) === 0, 'result-state local network writes found');
  Object.entries(privacy).forEach(([name, value]) => {
    assert(value === 0, `${name} must be zero across every fresh browser row`);
  });
  assert(contrast.summary.scenarios === 12, 'contrast proof must contain 12 scenarios');
  assert(contrast.summary.contrastFailures === 0, 'contrast failures found');
  assert(contrast.summary.offOriginRequests === 0, 'contrast proof attempted off-origin requests');
  assert(contrast.summary.pageErrors === 0, 'contrast proof page errors found');
  assert(contrast.summary.consoleErrors === 0, 'contrast proof console errors found');
  assert(
    await portIsClosed(artworkPort),
    `owned artwork server port ${artworkPort} is still listening`,
  );
  assert(
    await portIsClosed(resultPort),
    `owned result server port ${resultPort} is still listening`,
  );

  const checkedAt = new Date().toISOString();
  const sameRun = (
    artworkOrigin === resultOrigin
    && artworkPid === resultPid
    && artworkStartedAtIso === resultStartedAtIso
  );
  const artworkRun = {
    proof: 'Portable fresh 447 artwork/320/375/exact-2x release matrix with strict privacy, console, storage, analytics, network, text clipping, and contrast gates.',
    origin: artworkOrigin,
    port: artworkPort,
    ownedServerPid: artworkPid,
    serverReleased: true,
    testExitCode: 0,
    artworkRoutes: artwork.rows.length,
    responsiveRoutes: responsive.rows.length,
    exact320Routes: exactRows.length,
    exact320DirectTextNodes: sum(exactRows, (row) => row.directTextNodeCount),
    exact320DirectTextFragments: sum(exactRows, (row) => row.directTextFragmentCount),
    clippedTextFragments: sum(exactRows, (row) => row.clippedTextFragmentCount),
    localActionNetworkWrites: 0,
    ...artworkPrivacy,
    contrastScenarios: contrast.summary.scenarios,
    contrastFailures: contrast.summary.contrastFailures,
    exact320ShardRanges: exactReceipts.map((receipt) => [
      receipt.shard.startManifestIndex,
      receipt.shard.endManifestIndexExclusive,
    ]),
  };
  const resultRun = {
    proof: 'Portable fresh 435 populated-result release matrix with real deterministic app actions and strict privacy, console, storage, analytics, network, and text clipping gates.',
    origin: resultOrigin,
    port: resultPort,
    ownedServerPid: resultPid,
    serverReleased: true,
    testExitCode: 0,
    resultCapableRoutes: resultRows.length,
    familyCountryRoutes: 414,
    singletonRoutes: 21,
    familyHubsNotApplicable: 12,
    resultDirectTextNodes: sum(resultRows, (row) => row.directTextNodeCount),
    resultDirectTextFragments: sum(resultRows, (row) => row.directTextFragmentCount),
    clippedTextFragments: sum(resultRows, (row) => row.clippedTextFragmentCount),
    localActionNetworkWrites: sum(resultRows, (row) => row.localActionWrites),
    ...resultPrivacy,
    resultShardRanges: resultReceipts.map((receipt) => [
      receipt.shard.startResultIndex,
      receipt.shard.endResultIndexExclusive,
    ]),
  };
  if (sameRun) {
    Object.assign(artworkRun, resultRun, {
      proof: `${artworkRun.proof} ${resultRun.proof}`,
    });
  }
  const payload = {
    schemaVersion: 3,
    programme: 'fr-agriculture-artwork-closeout',
    freshRun: true,
    checkedAt,
    proofStartedAt: artworkStartedAtIso,
    worktree: ROOT,
    allOwnedServersReleased: true,
    summary: {
      artworkRoutes: artwork.rows.length,
      resultCapableRoutes: resultRows.length,
      familyCountryRoutes: 414,
      singletonRoutes: 21,
      familyHubsNotApplicable: 12,
      clippedTextFragments: 0,
      localActionNetworkWrites: 0,
      ...privacy,
      contrastFailures: contrast.summary.contrastFailures,
    },
    runs: sameRun ? [artworkRun] : [artworkRun, resultRun],
  };
  fs.writeFileSync(
    path.join(ROOT, 'reports/fr-agriculture-artwork-browser-server.json'),
    `${JSON.stringify(payload, null, 2)}\n`,
  );
  console.log(
    `Fresh Agriculture browser receipt: 447 artwork, 435 results, ${payload.runs.length} owned server run(s) released.`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
