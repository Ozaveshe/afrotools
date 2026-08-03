#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'data/localization/sw-agriculture-parity-manifest.json');
const ORACLES = path.join(ROOT, 'reports/sw-agriculture-irrigation-oracles.json');
const BROWSER = path.join(ROOT, 'reports/sw-agriculture-irrigation-browser-proof.json');
const RECEIPT = path.join(ROOT, 'reports/sw-agriculture-acceptance/irrigation.json');
const MISSING_ARTWORK = path.join(ROOT, 'reports/sw-agriculture-irrigation-missing-artwork.json');

function indexUnique(rows, key, label) {
  const result = new Map();
  for (const row of rows) {
    if (!row[key] || result.has(row[key])) throw new Error(`Duplicate or missing ${label}: ${row[key]}.`);
    result.set(row[key], row);
  }
  return result;
}

function assertExactIds(actualIds, expectedIds, label) {
  if (
    !Array.isArray(actualIds)
    || actualIds.length !== expectedIds.length
    || new Set(actualIds).size !== expectedIds.length
    || actualIds.some((id, index) => id !== expectedIds[index])
  ) {
    throw new Error(`${label} IDs do not exactly match the Irrigation manifest.`);
  }
}

function build() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const oracleReport = JSON.parse(fs.readFileSync(ORACLES, 'utf8'));
  const browserReport = JSON.parse(fs.readFileSync(BROWSER, 'utf8'));
  const rows = manifest.rows.filter((row) => row.family === 'irrigation');
  const expectedIds = rows.map((row) => row.english.id);
  if (rows.length !== 55) throw new Error(`Expected 55 Irrigation rows; found ${rows.length}.`);
  if (
    oracleReport.routes !== 55
    || oracleReport.countryOracles !== 54
    || oracleReport.rows.length !== 55
  ) {
    throw new Error('Route-specific Irrigation engine oracle report is incomplete.');
  }
  if (
    browserReport.status !== 'passed-local-proof'
    || browserReport.routes !== 55
    || browserReport.passedLocalProof !== 55
    || browserReport.accepted !== 0
    || browserReport.blocked !== 55
    || browserReport.rows.length !== 55
  ) {
    throw new Error('Route-specific Irrigation browser proof is incomplete.');
  }

  const oracleById = indexUnique(oracleReport.rows, 'englishId', 'oracle English ID');
  const browserById = indexUnique(browserReport.rows, 'englishId', 'browser English ID');
  assertExactIds([...oracleById.keys()], expectedIds, 'Engine oracle');
  assertExactIds([...browserById.keys()], expectedIds, 'Browser proof');
  assertExactIds(browserReport.blockedIds, expectedIds, 'Browser blocked');
  if (!Array.isArray(browserReport.acceptedIds) || browserReport.acceptedIds.length) {
    throw new Error('Browser report must keep acceptedIds empty.');
  }
  const receiptRows = rows.map((row) => {
    const oracle = oracleById.get(row.english.id);
    const browser = browserById.get(row.english.id);
    if (!oracle || !browser) throw new Error(`Missing proof for ${row.english.id}.`);
    if (
      oracle.englishRoute !== row.english.routeKey
      || oracle.swahiliRoute !== row.swahili.routeKey
      || browser.englishRoute !== row.english.routeKey
      || browser.swahiliRoute !== row.swahili.routeKey
    ) {
      throw new Error(`Route proof drift for ${row.english.id}.`);
    }
    if (row.country) {
      if (
        !oracle.validOracle
        || !oracle.invalidOracle
        || oracle.validOracle.mode !== 'season'
        || !browser.exports.applicable
        || !browser.exports.pdfParsed
        || browser.browser.consoleErrors !== 0
        || browser.browser.resourceFailures !== 0
        || browser.browser.networkWrites !== 0
        || browser.browser.externalRequests !== 0
      ) {
        throw new Error(`Incomplete country acceptance contract for ${row.english.id}.`);
      }
    } else if (browser.exports.applicable) {
      throw new Error('Irrigation hub must not claim a result export.');
    }
    if (!row.artwork || row.artwork.state !== 'present' || !row.artwork.file) {
      throw new Error(`Missing reviewed artwork for ${row.english.id}.`);
    }

    return {
      englishId: row.english.id,
      englishRoute: row.english.routeKey,
      swahiliRoute: row.swahili.routeKey,
      countryCode: row.country ? row.country.code : null,
      status: 'accepted',
      localProofStatus: 'passed',
      nativeOwner: 'scripts/lib/sw-agriculture-family-contracts/irrigation.js',
      generator: 'scripts/build-sw-agriculture-family.js --family irrigation',
      engine: row.country ? oracle.engineOwner : null,
      dataOwner: row.country ? oracle.dataOwner : 'data/agriculture/country-index.js',
      artwork: row.artwork.file,
      oracle: row.country ? {
        valid: oracle.validOracle,
        invalid: oracle.invalidOracle,
      } : oracle,
      browser: browser.browser,
      exports: browser.exports,
      source: row.country ? {
        label: oracle.source,
        freshness: oracle.freshness,
        currency: oracle.currency,
        currencySymbol: oracle.currencySymbol,
        liveData: false,
        confidence: 'Planning estimate; confirm flow, availability, losses, restrictions and costs locally.',
      } : {
        label: 'Country index and the 54 maintained country irrigation datasets',
        freshness: 'Per-country static references',
        liveData: false,
        confidence: 'Country chooser; no calculation is performed on the hub.',
      },
      privacy: browser.privacy,
      limitations: row.country ? [
        'Static planning estimate, not a live irrigation prescription or official tariff.',
        'The engine pump fallback is explicitly labelled as USD 0.05/m³ and not a country tariff.',
      ] : [
        'The hub selects a country route and does not calculate or export a result.',
      ],
    };
  });

  return {
    receipt: {
      schemaVersion: 1,
      reviewedAt: '2026-07-31',
      family: 'irrigation',
      englishRows: 55,
      accepted: 55,
      blocked: 0,
      acceptedIds: expectedIds,
      blockedIds: [],
      sharedEngine: 'engines/src/irrigation-engine.js#calculate',
      nativeOwner: 'scripts/lib/sw-agriculture-family-contracts/irrigation.js',
      generator: 'scripts/build-sw-agriculture-family.js --family irrigation',
      reciprocalHreflangOwner: 'scripts/build-sw-agriculture-family.js --family irrigation',
      rows: receiptRows,
    },
    missingArtwork: {
      schemaVersion: 1,
      reviewedAt: '2026-07-31',
      family: 'irrigation',
      reviewedRoutes: 55,
      missing: 0,
      rows: [],
    },
  };
}

function writeOrCheck(file, value, check) {
  const content = `${JSON.stringify(value, null, 2)}\n`;
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (check && current !== content) throw new Error(`${path.relative(ROOT, file)} is stale.`);
  if (!check && current !== content) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf8');
  }
}

function run({ check = false } = {}) {
  const output = build();
  writeOrCheck(RECEIPT, output.receipt, check);
  writeOrCheck(MISSING_ARTWORK, output.missingArtwork, check);
  console.log(JSON.stringify({
    family: output.receipt.family,
    accepted: output.receipt.accepted,
    blocked: output.receipt.blocked,
    mode: check ? 'check' : 'write',
  }, null, 2));
  return output;
}

if (require.main === module) {
  try {
    run({ check: process.argv.includes('--check') });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { assertExactIds, build, indexUnique, run };
