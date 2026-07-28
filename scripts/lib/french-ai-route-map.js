'use strict';

const fs = require('fs');
const path = require('path');
const manifestApi = require('../../assets/js/ai/tool-manifest');

const ROOT = path.resolve(__dirname, '../..');
const COVERAGE_PATH = path.join(ROOT, 'data', 'registry', 'locale-page-coverage.json');
const CONTEXT_DIR = path.join(ROOT, 'data', 'ai', 'tool-context');
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
  const manifest = options.manifest || manifestApi.getToolManifestForRouter();
  const byEnglishRoute = new Map();

  for (const record of coverage.records || []) {
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

  const report = {
    schemaVersion: 1,
    locale: 'fr',
    source: 'data/registry/locale-page-coverage.json',
    eligibleStates: [...ELIGIBLE_STATES],
    manifestRecords: manifest.length,
    uniqueManifestRoutes: new Set(manifest.map((tool) => normalizeRoute(tool.route))).size,
    mappedRoutes: Object.keys(routes).length,
    mappedManifestRecords: mappedTools.length,
    contextBackedRoutes,
    unmappedRoutes: unmappedRoutes.length,
    ambiguousRoutes: ambiguousRoutes.length,
  };

  return { routes, mappedTools, unmappedRoutes, ambiguousRoutes, report };
}

module.exports = {
  buildFrenchAiRouteMap,
  normalizeRoute,
};
