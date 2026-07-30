'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../..');
const EXPECTED_ROWS = 447;
const EXPECTED_GENERATED_ROWS = 443;
const EXPECTED_HAND_AUTHORED_ROWS = 4;
const EXPECTED_MISSING_ARTWORK_ROWS = 0;
const MANIFEST_PATH = path.join(ROOT, 'data', 'localization', 'fr-agriculture-parity-manifest.json');
const EXTRA_ROUTE_REPORT_PATH = path.join(ROOT, 'reports', 'fr-agriculture-extra-route-queue.json');
const MISSING_ARTWORK_REPORT_PATH = path.join(ROOT, 'reports', 'fr-agriculture-missing-artwork-queue.json');
const ACCEPTANCE_DIR = path.join(ROOT, 'reports', 'fr-agriculture-acceptance');

const SEMANTIC_FRENCH_ROUTES = Object.freeze({
  '/tools/planting-calendar/': '/fr/tools/calendrier-semis/',
  '/tools/fertilizer-calc/': '/fr/tools/calculateur-engrais/',
  '/tools/agric-profit/': '/fr/tools/profit-agricole/',
  '/tools/crop-yield/': '/fr/tools/rendement-culture/',
});

const FAMILY_CONTRACTS = Object.freeze([
  {
    id: 'crop-yield',
    prefix: '/agriculture/crop-yield/',
    renderer: 'scripts/lib/fr-agriculture-family-contracts/crop-yield.js',
    pageOwners: ['scripts/generate-crop-yield-pages.js'],
    engineOwners: ['engines/src/crop-yield-engine.js'],
    dataOwners: ['data/agriculture/crop-database.js', 'data/agriculture/{countryCodeLower}-agri-data.js'],
    hubDataOwners: ['data/agriculture/country-index.js', 'data/agriculture/crop-database.js'],
  },
  {
    id: 'fertilizer',
    prefix: '/agriculture/fertilizer/',
    renderer: 'scripts/lib/fr-agriculture-family-contracts/fertilizer.js',
    pageOwners: ['scripts/generate-fertilizer-pages.js', 'scripts/expand-fertilizer.js'],
    engineOwners: ['engines/src/fertilizer-engine.js'],
    dataOwners: ['data/agriculture/{countryCodeLower}-agri-data.js'],
    hubDataOwners: ['data/agriculture/country-index.js'],
  },
  {
    id: 'irrigation',
    prefix: '/agriculture/irrigation/',
    renderer: 'scripts/lib/fr-agriculture-family-contracts/irrigation.js',
    pageOwners: ['scripts/generate-irrigation-pages.js'],
    engineOwners: ['engines/src/irrigation-engine.js'],
    dataOwners: ['data/agriculture/{countryCodeLower}-agri-data.js'],
    hubDataOwners: ['data/agriculture/country-index.js'],
  },
  {
    id: 'farm-profit',
    prefix: '/agriculture/farm-profit/',
    renderer: 'scripts/lib/fr-agriculture-family-contracts/farm-profit.js',
    pageOwners: ['scripts/generate-farm-profit-pages.js'],
    engineOwners: ['engines/src/farm-profit-engine.js'],
    dataOwners: ['data/agriculture/farm-costs.js'],
    hubDataOwners: ['data/agriculture/country-index.js'],
  },
  {
    id: 'seed-rate',
    prefix: '/agriculture/seed-rate/',
    renderer: 'scripts/lib/fr-agriculture-family-contracts/seed-rate.js',
    pageOwners: ['scripts/generate-seed-rate-pages.js'],
    engineOwners: ['engines/src/seed-rate-engine.js'],
    dataOwners: ['data/agriculture/seed-data.js', 'data/agriculture/seed-data-extension.js'],
    hubDataOwners: ['data/agriculture/country-index.js'],
  },
  {
    id: 'fish-farming',
    prefix: '/agriculture/fish-farming/',
    renderer: 'scripts/lib/fr-agriculture-family-contracts/fish-farming.js',
    pageOwners: ['scripts/generate-fish-farming-pages.js'],
    engineOwners: ['engines/src/aquaculture-roi-engine.js'],
    dataOwners: ['data/agriculture/aquaculture-data.js'],
    hubDataOwners: ['data/agriculture/aquaculture-data.js'],
  },
  {
    id: 'cassava-processing',
    prefix: '/agriculture/cassava-processing/',
    renderer: 'scripts/lib/fr-agriculture-family-contracts/cassava-processing.js',
    pageOwners: ['scripts/generate-cassava-processing-pages.js'],
    engineOwners: ['engines/src/cassava-processing-engine.js'],
    dataOwners: ['data/agriculture/cassava-processing-data.js'],
    hubDataOwners: ['data/agriculture/cassava-processing-data.js'],
  },
  {
    id: 'greenhouse',
    prefix: '/agriculture/greenhouse/',
    renderer: 'scripts/lib/fr-agriculture-family-contracts/greenhouse.js',
    pageOwners: ['agriculture/greenhouse/*.html'],
    engineOwners: ['engines/src/greenhouse-engine.js'],
    dataOwners: ['data/agriculture/greenhouse-data.js'],
    hubDataOwners: ['data/agriculture/greenhouse-data.js'],
  },
  {
    id: 'livestock-feed',
    prefix: '/agriculture/livestock-feed/',
    renderer: 'scripts/lib/fr-agriculture-family-contracts/livestock-feed.js',
    pageOwners: ['agriculture/livestock-feed/*.html', 'scripts/expand-livestock-feed.js'],
    engineOwners: ['engines/src/livestock-feed-engine.js'],
    dataOwners: ['data/agriculture/livestock-feed-data.js'],
    hubDataOwners: ['data/agriculture/livestock-feed-data.js'],
  },
  {
    id: 'input-prices',
    prefix: '/agriculture/input-prices/',
    renderer: 'scripts/lib/fr-agriculture-family-contracts/input-prices.js',
    pageOwners: ['agriculture/input-prices/*.html', 'assets/js/pages/input-prices-controller.js'],
    engineOwners: ['engines/src/input-prices-engine.js'],
    dataOwners: ['data/agriculture/input-prices-data.js'],
    hubDataOwners: ['data/agriculture/input-prices-data.js'],
  },
  {
    id: 'farm-loans',
    prefix: '/agriculture/farm-loans/',
    renderer: 'scripts/lib/fr-agriculture-family-contracts/farm-loans.js',
    pageOwners: ['agriculture/farm-loans/*.html'],
    engineOwners: ['engines/src/farm-loan-engine.js'],
    dataOwners: ['data/agriculture/agri-loans-data.js'],
    hubDataOwners: ['data/agriculture/agri-loans-data.js'],
  },
  {
    id: 'farm-payroll',
    prefix: '/agriculture/farm-payroll/',
    renderer: 'scripts/lib/fr-agriculture-family-contracts/farm-payroll.js',
    pageOwners: [
      'agriculture/farm-payroll/_gen.py#legacy-english-only',
      'agriculture/farm-payroll/_gen_pages.sh#legacy-english-only',
    ],
    engineOwners: ['engines/src/farm-payroll-engine.js'],
    dataOwners: ['data/agriculture/farm-payroll-data.js'],
    hubDataOwners: ['data/agriculture/country-index.js'],
  },
]);

function normalizeRoute(value) {
  const route = `/${String(value || '').split(/[?#]/)[0].replace(/^\/+|\/+$/g, '')}`;
  return route === '/' ? '/' : `${route}/`;
}

function loadRegistry() {
  const registryPath = path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js');
  const source = fs.readFileSync(registryPath, 'utf8');
  const sandbox = { console };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: registryPath });
  if (!Array.isArray(sandbox.AFRO_TOOLS)) throw new Error('Unable to read AFRO_TOOLS registry.');
  return sandbox.AFRO_TOOLS;
}

function englishAgricultureRows(registry = loadRegistry()) {
  return registry.filter((row) => (
    row.category === 'agriculture'
    && (row.status === 'live' || row.status === 'new')
    && (!row.lang || row.lang === 'en')
    && !/^\/(?:fr|sw|ha|yo)\//.test(row.href || '')
  ));
}

function routeToFile(route) {
  const clean = String(route).replace(/^\/+/, '');
  const candidates = route.endsWith('/')
    ? [path.join(ROOT, clean, 'index.html')]
    : [path.join(ROOT, `${clean}.html`), path.join(ROOT, clean, 'index.html')];
  const match = candidates.find((candidate) => fs.existsSync(candidate));
  return match ? path.relative(ROOT, match).replace(/\\/g, '/') : null;
}

function findFamily(route) {
  return FAMILY_CONTRACTS.find((family) => normalizeRoute(route).startsWith(family.prefix)) || null;
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function loadAiRouteMap() {
  const modulePath = path.join(ROOT, 'assets', 'js', 'ai', 'french-route-map.generated.js');
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function extractRuntimeOwners(englishFile) {
  const html = fs.readFileSync(path.join(ROOT, englishFile), 'utf8');
  const sources = [...html.matchAll(/<script[^>]+src=["']([^"'?#]+)[^"']*["'][^>]*>/gi)]
    .map((match) => match[1].replace(/^\/+/, ''));
  const engineOwners = sources.filter((source) => (
    source.startsWith('engines/') || source.startsWith('assets/js/engines/')
  )).map((source) => {
    if (!source.startsWith('engines/') || source.startsWith('engines/src/')) return source;
    const readableOwner = `engines/src/${path.basename(source)}`;
    return fs.existsSync(path.join(ROOT, readableOwner)) ? readableOwner : source;
  });
  const dataOwners = sources.filter((source) => source.startsWith('data/'));
  return {
    engineOwners: engineOwners.length ? engineOwners : [`${englishFile}#inline-controller`],
    dataOwners: dataOwners.length ? dataOwners : [`${englishFile}#embedded-data`],
  };
}

function expandOwner(owner, countryCode) {
  return owner.replace('{countryCodeLower}', String(countryCode || '').toLowerCase());
}

function currentRuntimeState(frenchFile) {
  const html = fs.readFileSync(path.join(ROOT, frenchFile), 'utf8');
  if (/<iframe\b/i.test(html)) return 'legacy-english-iframe';
  if (/\bfetch\s*\(\s*["'`]\/?(?:agriculture|tools)\//i.test(html)) return 'legacy-english-html-fetch';
  if (/<html[^>]+lang=["']en/i.test(html)) return 'english-transplant';
  return 'native-french';
}

function loadArtworkExtensions() {
  const registryPath = path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js');
  const source = fs.readFileSync(registryPath, 'utf8');
  const sandbox = { console, setTimeout, clearTimeout };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: registryPath });
  return sandbox.TOOL_CARD_IMAGE_EXTENSIONS || {};
}

function artworkState(row, artworkExtensions = loadArtworkExtensions()) {
  const imageId = row.imageId || row.id;
  const extension = artworkExtensions[imageId];
  const file = extension ? `assets/img/tools/${imageId}.${extension}` : null;
  const present = Boolean(file && fs.existsSync(path.join(ROOT, file)));
  return { imageId, file: present ? file : null, state: present ? 'present' : 'missing' };
}

function loadAcceptanceEvidence() {
  const accepted = new Map();
  if (!fs.existsSync(ACCEPTANCE_DIR)) return accepted;
  fs.readdirSync(ACCEPTANCE_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .forEach((name) => {
      const relativeFile = `reports/fr-agriculture-acceptance/${name}`;
      const receipt = readJson(relativeFile);
      if (!Array.isArray(receipt.rows)) throw new Error(`Acceptance receipt has no rows: ${relativeFile}`);
      receipt.rows.forEach((evidence, index) => {
        if (!evidence.englishId || evidence.status !== 'accepted') return;
        if (accepted.has(evidence.englishId)) {
          throw new Error(`Duplicate acceptance evidence for ${evidence.englishId}.`);
        }
        accepted.set(evidence.englishId, {
          state: 'accepted',
          oracle: `${relativeFile}#rows[${index}].oracle`,
          browserReceipt: `${relativeFile}#rows[${index}].browser`,
          exportReceipt: `${relativeFile}#rows[${index}].exports`,
          sourceReceipt: `${relativeFile}#rows[${index}].source`,
          limitations: Array.isArray(evidence.limitations) ? evidence.limitations : [],
        });
      });
    });
  return accepted;
}

function reconcileAcceptanceRoutes(manifest) {
  assertManifestIntegrity(manifest);
  const expectedById = new Map(manifest.rows.map((row) => [row.english.id, row.french.routeKey]));
  const expectedRoutes = new Set(expectedById.values());
  const receiptRows = [];
  fs.readdirSync(ACCEPTANCE_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .forEach((name) => {
      const relativeFile = `reports/fr-agriculture-acceptance/${name}`;
      const receipt = readJson(relativeFile);
      if (!Array.isArray(receipt.rows)) throw new Error(`Acceptance receipt has no rows: ${relativeFile}`);
      receipt.rows.forEach((row, index) => receiptRows.push({
        englishId: row.englishId,
        frenchRoute: normalizeRoute(row.frenchRoute),
        status: row.status,
        source: `${relativeFile}#rows[${index}]`,
      }));
    });

  const receiptRoutes = new Set(receiptRows.map((row) => row.frenchRoute));
  const missing = [...expectedRoutes].filter((route) => !receiptRoutes.has(route)).sort();
  const outsideManifest = [...receiptRoutes].filter((route) => !expectedRoutes.has(route)).sort();
  const duplicateRoutes = [...receiptRoutes]
    .map((route) => ({ route, count: receiptRows.filter((row) => row.frenchRoute === route).length }))
    .filter((entry) => entry.count > 1);
  const nonAccepted = receiptRows.filter((row) => row.status !== 'accepted');
  const idRouteMismatches = receiptRows.filter((row) => (
    !expectedById.has(row.englishId)
    || expectedById.get(row.englishId) !== row.frenchRoute
  ));
  const result = {
    manifestRoutes: expectedRoutes.size,
    receiptRows: receiptRows.length,
    uniqueReceiptRoutes: receiptRoutes.size,
    mismatchCount: missing.length + outsideManifest.length + idRouteMismatches.length,
    nonAcceptedCount: nonAccepted.length,
    duplicateRouteCount: duplicateRoutes.length,
    missing,
    outsideManifest,
    idRouteMismatches,
    duplicateRoutes,
  };
  if (
    result.manifestRoutes !== EXPECTED_ROWS
    || result.receiptRows !== EXPECTED_ROWS
    || result.uniqueReceiptRoutes !== EXPECTED_ROWS
    || result.mismatchCount !== 0
    || result.nonAcceptedCount !== 0
    || result.duplicateRouteCount !== 0
  ) {
    throw new Error(`French Agriculture acceptance route reconciliation failed:\n${JSON.stringify(result, null, 2)}`);
  }
  return result;
}

function buildManifest() {
  const registry = loadRegistry();
  const artworkExtensions = loadArtworkExtensions();
  const countries = readJson('data/registry/countries.json');
  const countryByCode = new Map(countries.map((country) => [country.id, country]));
  const aiRoutes = loadAiRouteMap().routes || {};
  const acceptanceEvidence = loadAcceptanceEvidence();
  const rows = englishAgricultureRows(registry);

  if (rows.length !== EXPECTED_ROWS) {
    throw new Error(`French Agriculture parity requires exactly ${EXPECTED_ROWS} English rows; found ${rows.length}.`);
  }

  const manifestRows = rows.map((row) => {
    const englishRoute = row.href;
    const englishFile = routeToFile(englishRoute);
    if (!englishFile) throw new Error(`Missing English route file for ${row.id}: ${englishRoute}`);

    const generated = englishRoute.startsWith('/agriculture/');
    const frenchRoute = generated ? `/fr${englishRoute}` : SEMANTIC_FRENCH_ROUTES[normalizeRoute(englishRoute)];
    if (!frenchRoute) throw new Error(`No verified French semantic counterpart for ${row.id}: ${englishRoute}`);
    const frenchFile = routeToFile(frenchRoute);
    if (!frenchFile) throw new Error(`Missing French route file for ${row.id}: ${frenchRoute}`);

    const countryCode = row.countries && row.countries.length === 1 && row.countries[0] !== 'ALL'
      ? row.countries[0]
      : null;
    const countryRecord = countryCode ? countryByCode.get(countryCode) : null;
    if (countryCode && !countryRecord) throw new Error(`Unknown country ${countryCode} on ${row.id}.`);

    const family = findFamily(englishRoute);
    const extractedOwners = extractRuntimeOwners(englishFile);
    const engineOwners = family
      ? family.engineOwners.map((owner) => expandOwner(owner, countryCode))
      : extractedOwners.engineOwners;
    const dataOwners = family
      ? (countryCode ? family.dataOwners : (family.hubDataOwners || family.dataOwners))
        .map((owner) => expandOwner(owner, countryCode))
      : extractedOwners.dataOwners;
    const frenchRouteKey = normalizeRoute(frenchRoute);
    const englishRouteKey = normalizeRoute(englishRoute);
    const runtimeState = currentRuntimeState(frenchFile);
    const art = artworkState(row, artworkExtensions);

    return {
      english: {
        id: row.id,
        route: englishRoute,
        routeKey: englishRouteKey,
        file: englishFile,
        status: row.status,
      },
      french: {
        route: frenchRoute,
        routeKey: frenchRouteKey,
        file: frenchFile,
        ownerState: generated ? 'manifest-generated-family' : 'hand-authored-semantic-owner',
        contractId: family ? family.id : `singleton:${row.id}`,
        rendererId: family ? family.id : null,
        currentRuntimeState: runtimeState,
      },
      family: family ? family.id : 'singleton',
      country: countryRecord ? {
        code: countryRecord.id,
        englishSlug: countryRecord.routeSlug,
        frenchName: countryRecord.displayNames && countryRecord.displayNames.fr,
      } : null,
      owners: {
        englishPage: family ? family.pageOwners : [englishFile],
        englishEngine: engineOwners,
        englishData: dataOwners,
        frenchRenderer: family ? family.renderer : frenchFile,
      },
      hreflang: {
        owner: generated ? 'scripts/lib/fr-agriculture-page-shell.js' : frenchFile,
        state: runtimeState === 'native-french' ? 'verify-pair' : 'blocked-by-legacy-runtime',
        englishRoute: englishRouteKey,
        frenchRoute: frenchRouteKey,
      },
      ai: {
        owner: 'data/localization/fr-agriculture-parity-manifest.json',
        state: aiRoutes[englishRouteKey] === frenchRouteKey ? 'mapped-existing' : 'manifest-mapping-required',
        mappedRoute: aiRoutes[englishRouteKey] || null,
      },
      artwork: art,
      acceptance: acceptanceEvidence.get(row.id) || {
        state: 'pending',
        oracle: null,
        browserReceipt: null,
        exportReceipt: null,
        sourceReceipt: null,
        limitations: [],
      },
    };
  });

  const manifest = {
    schemaVersion: 1,
    programme: 'fr-agriculture-parity',
    locale: 'fr',
    source: 'assets/js/components/tool-registry.js',
    constraints: {
      expectedRows: EXPECTED_ROWS,
      expectedGeneratedRows: EXPECTED_GENERATED_ROWS,
      expectedHandAuthoredRows: EXPECTED_HAND_AUTHORED_ROWS,
      generatedRoutePrefix: '/fr/agriculture/',
      forbiddenRuntimePatterns: ['iframe', 'english-html-fetch', 'english-transplant'],
    },
    rows: manifestRows,
  };
  assertManifestIntegrity(manifest);
  return manifest;
}

function assertManifestIntegrity(manifest) {
  if (!manifest || !Array.isArray(manifest.rows)) throw new Error('Manifest rows are required.');
  if (manifest.rows.length !== EXPECTED_ROWS) {
    throw new Error(`French Agriculture manifest must contain exactly ${EXPECTED_ROWS} rows; found ${manifest.rows.length}.`);
  }
  const englishIds = new Set();
  const englishRoutes = new Set();
  const frenchRoutes = new Set();
  let generatedRows = 0;
  let handAuthoredRows = 0;

  manifest.rows.forEach((row) => {
    if (englishIds.has(row.english.id)) throw new Error(`Duplicate English id: ${row.english.id}`);
    if (englishRoutes.has(row.english.routeKey)) throw new Error(`Duplicate English route: ${row.english.routeKey}`);
    if (frenchRoutes.has(row.french.routeKey)) throw new Error(`Duplicate French route: ${row.french.routeKey}`);
    englishIds.add(row.english.id);
    englishRoutes.add(row.english.routeKey);
    frenchRoutes.add(row.french.routeKey);

    if (row.country && !/^[A-Z]{2}$/.test(row.country.code)) {
      throw new Error(`Unknown country shape on ${row.english.id}: ${row.country.code}`);
    }
    if (row.french.ownerState === 'manifest-generated-family') {
      generatedRows += 1;
      if (!row.french.routeKey.startsWith('/fr/agriculture/')) {
        throw new Error(`Generated route is outside /fr/agriculture/: ${row.french.routeKey}`);
      }
    } else if (row.french.ownerState === 'hand-authored-semantic-owner') {
      handAuthoredRows += 1;
      if (!Object.values(SEMANTIC_FRENCH_ROUTES).map(normalizeRoute).includes(row.french.routeKey)) {
        throw new Error(`Unknown hand-authored French owner: ${row.french.routeKey}`);
      }
    } else {
      throw new Error(`Unknown French owner state on ${row.english.id}: ${row.french.ownerState}`);
    }
  });

  if (generatedRows !== EXPECTED_GENERATED_ROWS || handAuthoredRows !== EXPECTED_HAND_AUTHORED_ROWS) {
    throw new Error(
      `French Agriculture owner split must be ${EXPECTED_GENERATED_ROWS}/${EXPECTED_HAND_AUTHORED_ROWS}; `
      + `found ${generatedRows}/${handAuthoredRows}.`
    );
  }
  return true;
}

function assertRoutesInManifest(manifest, routes) {
  const allowed = new Set(manifest.rows.map((row) => row.french.routeKey));
  routes.forEach((route) => {
    const key = normalizeRoute(route);
    if (!allowed.has(key)) throw new Error(`Refusing route outside French Agriculture manifest: ${route}`);
  });
  return true;
}

function assertNativeFrenchOutput(manifest, routes) {
  assertRoutesInManifest(manifest, routes);
  const byRoute = new Map(manifest.rows.map((row) => [row.french.routeKey, row]));
  routes.forEach((route) => {
    const row = byRoute.get(normalizeRoute(route));
    const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
    if (/<iframe\b/i.test(html)) throw new Error(`English iframe/transplant forbidden: ${row.french.route}`);
    if (/\bfetch\s*\(\s*["'`]\/?(?:agriculture|tools)\//i.test(html)) {
      throw new Error(`English HTML fetch/transplant forbidden: ${row.french.route}`);
    }
    if (/<html[^>]+lang=["']en/i.test(html)) throw new Error(`English runtime forbidden: ${row.french.route}`);
  });
  return true;
}

function buildExtraRouteQueue(manifest) {
  const directory = path.join(ROOT, 'fr', 'agriculture');
  const programmeFiles = new Set(
    manifest.rows
      .filter((row) => row.french.routeKey.startsWith('/fr/agriculture/'))
      .map((row) => row.french.file)
  );
  const files = [];
  const stack = [directory];
  while (stack.length) {
    const current = stack.pop();
    fs.readdirSync(current, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path.relative(ROOT, full).replace(/\\/g, '/'));
    });
  }
  const extras = files.filter((file) => !programmeFiles.has(file)).sort();
  return {
    schemaVersion: 1,
    programme: 'fr-agriculture-parity',
    decision: 'leave-untouched-pending-duplicate-noindex-review',
    count: extras.length,
    files: extras,
  };
}

function buildMissingArtworkQueue(manifest) {
  const rows = manifest.rows
    .filter((row) => row.artwork.state === 'missing')
    .map((row) => ({
      englishId: row.english.id,
      englishRoute: row.english.routeKey,
      frenchRoute: row.french.routeKey,
      family: row.family,
      countryCode: row.country ? row.country.code : null,
      imageId: row.artwork.imageId,
    }));
  return {
    schemaVersion: 1,
    programme: 'fr-agriculture-parity',
    blocking: false,
    decision: rows.length ? 'separate-artwork-evidence-queue' : 'artwork-closeout-complete',
    count: rows.length,
    rows,
  };
}

module.exports = {
  ROOT,
  MANIFEST_PATH,
  EXTRA_ROUTE_REPORT_PATH,
  MISSING_ARTWORK_REPORT_PATH,
  ACCEPTANCE_DIR,
  EXPECTED_ROWS,
  EXPECTED_GENERATED_ROWS,
  EXPECTED_HAND_AUTHORED_ROWS,
  EXPECTED_MISSING_ARTWORK_ROWS,
  SEMANTIC_FRENCH_ROUTES,
  FAMILY_CONTRACTS,
  normalizeRoute,
  loadRegistry,
  englishAgricultureRows,
  routeToFile,
  buildManifest,
  assertManifestIntegrity,
  assertRoutesInManifest,
  assertNativeFrenchOutput,
  buildExtraRouteQueue,
  buildMissingArtworkQueue,
  loadAcceptanceEvidence,
  reconcileAcceptanceRoutes,
};
