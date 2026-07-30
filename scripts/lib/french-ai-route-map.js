'use strict';

const fs = require('fs');
const path = require('path');
const manifestApi = require('../../assets/js/ai/tool-manifest');
const frenchToolRoutes = require('./french-tool-route-map');

const ROOT = path.resolve(__dirname, '../..');
const COVERAGE_PATH = path.join(ROOT, 'data', 'registry', 'locale-page-coverage.json');
const POLICY_PATH = path.join(ROOT, 'data', 'registry', 'locale-coverage-policy.json');
const AGRICULTURE_PARITY_PATH = path.join(ROOT, 'data', 'localization', 'fr-agriculture-parity-manifest.json');
const DEVELOPER_PARITY_PATH = path.join(ROOT, 'data', 'localization', 'fr-developer-parity-manifest.json');
const FINANCE_OVERRIDE_PATH = path.join(ROOT, 'data', 'ai', 'french-finance-route-overrides.json');
const FINTECH_PARITY_PATH = path.join(ROOT, 'data', 'localization', 'fr-fintech-banking-parity-manifest.json');
const CONTEXT_DIR = path.join(ROOT, 'data', 'ai', 'tool-context');
const REVIEWED_EQUIVALENTS_PATH = path.join(ROOT, 'data', 'ai', 'french-route-equivalents.json');
const SME_PARITY_PATH = path.join(ROOT, 'data', 'localization', 'fr-small-business-parity.json');
const ELIGIBLE_STATES = new Set(['native', 'localized-shell']);
const SYSTEM_ROUTES = ['/search/'];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeRoute(value) {
  const pathname = String(value || '/').split(/[?#]/)[0].replace(/\/+/g, '/');
  if (pathname === '/') return '/';
  return `/${pathname.replace(/^\/+|\/+$/g, '')}/`;
}

function buildFrenchAiRouteMap(options = {}) {
  const coverage = options.coverage || readJson(COVERAGE_PATH);
  const policy = options.policy || readJson(POLICY_PATH);
  const reviewedEquivalents = options.reviewedEquivalents || (
    fs.existsSync(REVIEWED_EQUIVALENTS_PATH) ? readJson(REVIEWED_EQUIVALENTS_PATH) : { routes: {} }
  );
  const financeOverrides = options.financeOverrides
    || (fs.existsSync(FINANCE_OVERRIDE_PATH) ? readJson(FINANCE_OVERRIDE_PATH) : { routes: {} });
  const agricultureParity = options.agricultureParity
    || (fs.existsSync(AGRICULTURE_PARITY_PATH) ? readJson(AGRICULTURE_PARITY_PATH) : null);
  const manifest = options.manifest || manifestApi.getToolManifestForRouter();
  const byEnglishRoute = new Map();

  const records = [
    ...(coverage.records || []),
    ...(policy.overrides || []).map((record) => ({
      ...record,
      locale: String(record.route || '').startsWith('/fr/') ? 'fr' : '',
      indexableEligible: record.indexableEligible !== false,
    })),
  ];

  for (const record of records) {
    if (
      record.locale !== 'fr' ||
      !record.indexableEligible ||
      !ELIGIBLE_STATES.has(record.state) ||
      !record.equivalentRoute ||
      !String(record.route || '').startsWith('/fr/')
    ) continue;

    const key = normalizeRoute(record.equivalentRoute);
    if (!byEnglishRoute.has(key)) byEnglishRoute.set(key, new Set());
    byEnglishRoute.get(key).add(normalizeRoute(record.route));
  }
  if (fs.existsSync(DEVELOPER_PARITY_PATH)) {
    const developerParity = readJson(DEVELOPER_PARITY_PATH);
    for (const record of developerParity.rows || []) {
      if (!record.accepted || !record.englishRoute || !record.frenchRoute) continue;
      const key = normalizeRoute(record.englishRoute);
      if (!byEnglishRoute.has(key)) byEnglishRoute.set(key, new Set());
      byEnglishRoute.get(key).add(normalizeRoute(record.frenchRoute));
    }
  }

  for (const [englishRoute, frenchRoute] of Object.entries(reviewedEquivalents.routes || {})) {
    const key = normalizeRoute(englishRoute);
    const destination = normalizeRoute(frenchRoute);
    if (!destination.startsWith('/fr/')) throw new Error(`Reviewed French equivalent must stay under /fr/: ${destination}`);
    if (!fs.existsSync(path.join(ROOT, destination.replace(/^\/|\/$/g, ''), 'index.html'))) {
      throw new Error(`Reviewed French equivalent is missing its route owner: ${destination}`);
    }
    if (!byEnglishRoute.has(key)) byEnglishRoute.set(key, new Set());
    byEnglishRoute.get(key).add(destination);
  }

  let financeOverrideRoutes = 0;
  for (const [englishRoute, frenchRoute] of Object.entries(financeOverrides.routes || {})) {
    const key = normalizeRoute(englishRoute);
    byEnglishRoute.set(key, new Set([normalizeRoute(frenchRoute)]));
    financeOverrideRoutes += 1;
  }

  // Native category owners may be completed ahead of the broad generated
  // locale-coverage inventory. Keep this exact, source-owned overlay so AI
  // routing can ship with the reviewed applications without accepting stale
  // bridge pages or forcing a sitewide localization rebuild.
  if (fs.existsSync(SME_PARITY_PATH)) {
    const scoped = readJson(SME_PARITY_PATH);
    for (const record of scoped.routes || []) {
      if (!record.english || !record.french) continue;
      const key = normalizeRoute(record.english);
      if (!byEnglishRoute.has(key)) byEnglishRoute.set(key, new Set());
      byEnglishRoute.get(key).add(normalizeRoute(record.french));
    }
  }

  const fintechParity = options.fintechParity ||
    (fs.existsSync(FINTECH_PARITY_PATH) ? readJson(FINTECH_PARITY_PATH) : null);
  for (const record of fintechParity && fintechParity.routes || []) {
    if (!record.englishRoute || !record.frenchRoute) continue;
    const key = normalizeRoute(record.englishRoute);
    if (!byEnglishRoute.has(key)) byEnglishRoute.set(key, new Set());
    byEnglishRoute.get(key).add(normalizeRoute(record.frenchRoute));
  }

  const routeOwners = new Map();
  for (const tool of manifest) {
    const route = normalizeRoute(tool.route);
    if (!routeOwners.has(route)) routeOwners.set(route, []);
    routeOwners.get(route).push(tool);
  }
  for (const route of SYSTEM_ROUTES) {
    if (!routeOwners.has(normalizeRoute(route))) routeOwners.set(normalizeRoute(route), []);
  }

  const routes = {};
  const mappedTools = [];
  const unmappedRoutes = [];
  const ambiguousRoutes = [];
  let contextBackedRoutes = 0;

  for (const [englishRoute, tools] of [...routeOwners.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const destinations = [...(byEnglishRoute.get(englishRoute) || [])].sort();
    const explicitFrenchRoute = frenchToolRoutes.frenchRouteForEnglishToolSource(englishRoute);
    if (explicitFrenchRoute && destinations.length === 0) {
      const explicitFile = path.join(ROOT, explicitFrenchRoute.replace(/^\/+/, ''), 'index.html');
      const normalizedExplicitRoute = normalizeRoute(explicitFrenchRoute);
      if (fs.existsSync(explicitFile) && destinations.indexOf(normalizedExplicitRoute) === -1) {
        destinations.push(normalizedExplicitRoute);
        destinations.sort();
      }
    }
    if (destinations.length === 0) {
      unmappedRoutes.push(englishRoute);
      continue;
    }
    if (destinations.length > 1) {
      ambiguousRoutes.push({ englishRoute, destinations });
      continue;
    }

    const frenchRoute = destinations[0];
    routes[englishRoute] = frenchRoute;
    const contextAvailable = tools.some((tool) => fs.existsSync(path.join(CONTEXT_DIR, `${tool.id}.json`)));
    if (contextAvailable) contextBackedRoutes += 1;
    tools.forEach((tool) => {
      mappedTools.push({
        id: tool.id,
        englishRoute,
        frenchRoute,
        contextAvailable: fs.existsSync(path.join(CONTEXT_DIR, `${tool.id}.json`)),
      });
    });
  }

  let agricultureManifestRows = 0;
  let agricultureNativeRows = 0;
  let agricultureManifestMappedRows = 0;
  if (agricultureParity) {
    if (!Array.isArray(agricultureParity.rows) || agricultureParity.rows.length !== 447) {
      throw new Error(`French Agriculture parity manifest must have exactly 447 rows; found ${agricultureParity.rows && agricultureParity.rows.length}.`);
    }
    agricultureManifestRows = agricultureParity.rows.length;
    agricultureParity.rows.forEach((row) => {
      if (row.french.currentRuntimeState !== 'native-french') return;
      agricultureNativeRows += 1;
      const englishRoute = normalizeRoute(row.english.routeKey);
      const frenchRoute = normalizeRoute(row.french.routeKey);
      if (!englishRoute.startsWith('/agriculture/') && !englishRoute.startsWith('/tools/')) {
        throw new Error(`Agriculture AI mapping is outside the exact manifest scope: ${englishRoute}`);
      }
      if (routes[englishRoute] && routes[englishRoute] !== frenchRoute) {
        throw new Error(`Conflicting French AI mapping for ${englishRoute}: ${routes[englishRoute]} vs ${frenchRoute}`);
      }
      routes[englishRoute] = frenchRoute;
      agricultureManifestMappedRows += 1;
      const unmappedIndex = unmappedRoutes.indexOf(englishRoute);
      if (unmappedIndex !== -1) unmappedRoutes.splice(unmappedIndex, 1);
    });
  }

  const report = {
    schemaVersion: 1,
    locale: 'fr',
    source: 'data/registry/locale-page-coverage.json + data/registry/locale-coverage-policy.json + data/localization/fr-agriculture-parity-manifest.json + data/localization/fr-developer-parity-manifest.json + data/ai/french-route-equivalents.json + data/ai/french-finance-route-overrides.json + data/localization/fr-small-business-parity.json + data/localization/fr-fintech-banking-parity-manifest.json',
    financeOverrideSource: 'data/ai/french-finance-route-overrides.json',
    financeOverrideRoutes,
    supplementalSource: 'scripts/lib/french-tool-route-map.js with physical-route verification',
    eligibleStates: [...ELIGIBLE_STATES],
    manifestRecords: manifest.length,
    uniqueManifestRoutes: new Set(manifest.map((tool) => normalizeRoute(tool.route))).size,
    mappedRoutes: Object.keys(routes).length,
    mappedManifestRecords: mappedTools.length,
    contextBackedRoutes,
    unmappedRoutes: unmappedRoutes.length,
    ambiguousRoutes: ambiguousRoutes.length,
    reviewedEquivalentRoutes: Object.keys(reviewedEquivalents.routes || {}).length,
    agricultureManifestRows,
    agricultureNativeRows,
    agricultureManifestMappedRows,
  };

  return { routes, mappedTools, unmappedRoutes, ambiguousRoutes, report };
}

module.exports = {
  buildFrenchAiRouteMap,
  normalizeRoute,
};
