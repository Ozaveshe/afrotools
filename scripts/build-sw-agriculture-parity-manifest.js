#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const FRENCH_MANIFEST = path.join(ROOT, 'data/localization/fr-agriculture-parity-manifest.json');
const STOP_RECEIPT = path.join(ROOT, 'reports/sw-agriculture-parity-stop-receipt-2026-07-31.json');
const ACCEPTANCE = path.join(ROOT, 'data/audits/swahili-free-app-acceptance.json');
const COUNTRIES = path.join(ROOT, 'data/registry/countries.json');
const OUTPUT = path.join(ROOT, 'data/localization/sw-agriculture-parity-manifest.json');

const FAMILY_SLUGS = Object.freeze({
  'crop-yield': 'mavuno',
  fertilizer: 'mbolea',
  irrigation: 'umwagiliaji',
  'farm-profit': 'faida-ya-shamba',
  'seed-rate': 'kiwango-cha-mbegu',
  'fish-farming': 'ufugaji-samaki',
  greenhouse: 'greenhouse',
  'cassava-processing': 'usindikaji-mihogo',
  'livestock-feed': 'chakula-cha-mifugo',
  'farm-payroll': 'mishahara-ya-shamba',
  'input-prices': 'bei-za-pembejeo',
  'farm-loans': 'mikopo-ya-shamba'
});

const SINGLETON_SLUGS = Object.freeze({
  'fertilizer-calc': 'kikokotoo-mbolea-rahisi',
  'farm-budget': 'bajeti-ya-shamba',
  'pesticide-dosage-calculator': 'kipimo-cha-viuatilifu',
  'soil-ph-calculator': 'ph-ya-udongo',
  'farm-size-converter': 'kigeuzi-cha-ukubwa-wa-shamba',
  'coffee-calculator': 'kikokotoo-kahawa',
  'cocoa-tracker': 'kifuatiliaji-kakao',
  'storage-loss': 'hasara-za-uhifadhi',
  'crop-rotation-planner': 'mpangilio-wa-mzunguko-wa-mazao',
  'vaccination-schedule': 'ratiba-ya-chanjo-za-mifugo',
  'commodity-prices': 'bei-za-mazao',
  'cooperative-calculator': 'kikokotoo-cha-ushirika',
  'warehouse-receipt': 'stakabadhi-ghalani',
  'tractor-calculator': 'kikokotoo-trekta',
  'crop-insurance': 'bima-ya-mazao',
  'coffee-calculator': 'kikokotoo-kahawa',
  'cocoa-tracker': 'kifuatiliaji-kakao'
});

function routeToFile(route) {
  return path.posix.join(route.replace(/^\/+|\/+$/g, ''), 'index.html');
}

function normalizeRoute(route) {
  return `/${String(route).replace(/^\/+|\/+$/g, '')}/`;
}

function buildManifest() {
  const french = JSON.parse(fs.readFileSync(FRENCH_MANIFEST, 'utf8'));
  const stop = JSON.parse(fs.readFileSync(STOP_RECEIPT, 'utf8'));
  const acceptanceLedger = JSON.parse(fs.readFileSync(ACCEPTANCE, 'utf8'));
  const countryNames = new Map(JSON.parse(fs.readFileSync(COUNTRIES, 'utf8')).map(country => [
    country.id,
    country.displayNames && country.displayNames.sw
      ? country.displayNames.sw
      : country.title
  ]));
  const acceptedByEnglishId = new Map(acceptanceLedger.entries
    .filter(entry => entry.categoryKey === 'agriculture' && entry.status === 'accepted')
    .map(entry => [entry.englishId, entry]));
  const baselines = new Map(stop.rows.map(row => [
    normalizeRoute(row.englishRoute),
    row.baselineSwahiliRoute ? normalizeRoute(row.baselineSwahiliRoute) : null
  ]));

  const rows = french.rows.map(row => {
    const englishRoute = normalizeRoute(row.english.route);
    const existingRoute = row.english.id === 'vaccination-schedule'
      ? null
      : baselines.get(englishRoute);
    let swahiliRoute = existingRoute;
    if (!swahiliRoute && row.family === 'singleton') {
      const slug = SINGLETON_SLUGS[row.english.id];
      if (!slug) throw new Error(`Missing Swahili singleton slug for ${row.english.id}.`);
      swahiliRoute = `/sw/zana/${slug}/`;
    }
    if (!swahiliRoute) {
      const familySlug = FAMILY_SLUGS[row.family];
      if (!familySlug || !row.country || !row.country.englishSlug) {
        throw new Error(`Cannot map Swahili route for ${row.english.id}.`);
      }
      swahiliRoute = `/sw/kilimo/${familySlug}/${row.country.englishSlug}/`;
    }
    const accepted = acceptedByEnglishId.get(row.english.id);
    if (accepted && normalizeRoute(accepted.swahiliRoute) !== swahiliRoute) {
      throw new Error(`Acceptance route drift for ${row.english.id}.`);
    }

    return {
      english: row.english,
      french: {
        route: row.french.route,
        file: row.french.file
      },
      swahili: {
        route: swahiliRoute,
        routeKey: swahiliRoute,
        file: routeToFile(swahiliRoute),
        ownerState: 'manifest-generated-native',
        contractId: row.family === 'singleton' ? `singleton:${row.english.id}` : row.family,
        currentRuntimeState: accepted ? 'native-accepted' : 'pending-generation'
      },
      family: row.family,
      country: row.country ? {
        ...row.country,
        swahiliName: countryNames.get(row.country.code) || row.country.frenchName
      } : null,
      owners: {
        englishPage: row.owners.englishPage,
        englishEngine: row.owners.englishEngine,
        englishData: row.owners.englishData,
        swahiliRenderer: row.family === 'singleton'
          ? `scripts/lib/sw-agriculture-singleton-contracts/${row.english.id}.js`
          : `scripts/lib/sw-agriculture-family-contracts/${row.family}.js`
      },
      hreflang: {
        owner: 'scripts/lib/sw-agriculture-page-shell.js',
        state: 'pending-reciprocal-proof',
        englishRoute,
        swahiliRoute
      },
      ai: {
        owner: 'data/localization/sw-agriculture-parity-manifest.json',
        state: 'manifest-mapped',
        mappedRoute: swahiliRoute
      },
      artwork: row.artwork,
      acceptance: {
        state: accepted ? 'accepted' : 'pending',
        oracle: accepted ? accepted.evidence.engineTest : null,
        browserReceipt: accepted ? accepted.evidence.browserSpec : null,
        exportReceipt: accepted ? accepted.evidence.export : null,
        sourceReceipt: accepted ? accepted.evidence.sourceOwner : null,
        limitations: []
      }
    };
  });

  const routes = new Set(rows.map(row => row.swahili.route));
  if (rows.length !== 447) throw new Error(`Expected 447 rows, found ${rows.length}.`);
  if (routes.size !== 447) throw new Error(`Expected 447 unique Swahili routes, found ${routes.size}.`);
  if (rows.filter(row => row.artwork && row.artwork.state === 'present').length !== 447) {
    throw new Error('Every Agriculture row must retain its reviewed reusable artwork.');
  }

  return {
    schemaVersion: 1,
    programme: 'swahili-free-app-parity-agriculture',
    locale: 'sw',
    reviewedAt: '2026-07-31',
    source: [
      'data/localization/fr-agriculture-parity-manifest.json#exact-English-447-row-scope',
      'reports/sw-agriculture-parity-stop-receipt-2026-07-31.json#existing-route-reconciliation',
      'data/audits/swahili-free-app-acceptance.json#accepted-route-proof'
    ],
    constraints: {
      exactRows: 447,
      noIframeOwners: true,
      engineLogicMustRemainShared: true,
      acceptanceIsFailClosed: true,
      reusableArtworkRequiresProof: true
    },
    rows
  };
}

function run({ check = false } = {}) {
  const manifest = buildManifest();
  const content = `${JSON.stringify(manifest, null, 2)}\n`;
  const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8') : null;
  if (check && current !== content) throw new Error('Swahili Agriculture parity manifest is stale.');
  if (!check && current !== content) fs.writeFileSync(OUTPUT, content, 'utf8');
  console.log(JSON.stringify({
    mode: check ? 'check' : 'write',
    rows: manifest.rows.length,
    routes: new Set(manifest.rows.map(row => row.swahili.route)).size,
    accepted: manifest.rows.filter(row => row.acceptance.state === 'accepted').length
  }, null, 2));
}

if (require.main === module) {
  try {
    run({ check: process.argv.includes('--check') });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  FAMILY_SLUGS,
  SINGLETON_SLUGS,
  buildManifest,
  normalizeRoute,
  routeToFile,
  run
};
