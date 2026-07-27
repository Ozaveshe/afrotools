const assert = require('assert');
const fs = require('fs');
const {
  HUBS,
  getCanonicalEnglishApps,
  loadRegistry,
  normalizeRoute,
  routeToFile,
} = require('./support/day10-category-inventory');

const EXPECTED_COUNTS = {
  african: 35,
  'religious-cultural': 22,
  'data-productivity': 12,
};

function match(html, pattern, label, route) {
  assert(pattern.test(html), `${route}: missing ${label}`);
}

function uniqueToolLinks(html) {
  return [...new Set(
    [...html.matchAll(/href=["'](\/tools\/[^"'#?]+)["']/gi)]
      .map((match) => `${normalizeRoute(match[1])}/`),
  )].sort();
}

function structuredData(html, route) {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => {
      try {
        return JSON.parse(match[1]);
      } catch (error) {
        assert.fail(`${route}: invalid JSON-LD (${error.message})`);
      }
    });
}

const { categories } = loadRegistry();
const apps = getCanonicalEnglishApps();
const aiCatalog = JSON.parse(
  fs.readFileSync(require('path').join(__dirname, '..', 'data', 'ai', 'tool-catalog-pack.json'), 'utf8'),
);
const aiCatalogRoutes = new Set(
  aiCatalog.chunks.flatMap((chunk) => chunk.tools || []).map((tool) => normalizeRoute(tool.route)),
);

assert.strictEqual(apps.length, 69, 'Day 10 must inventory 69 unique English canonical live/new app routes');

for (const [category, expected] of Object.entries(EXPECTED_COUNTS)) {
  const rows = apps.filter((app) => app.category === category);
  assert.strictEqual(rows.length, expected, `${category}: canonical app count drift`);
}

for (const hub of HUBS) {
  assert.strictEqual(
    normalizeRoute(categories[hub.category].href),
    normalizeRoute(hub.route),
    `${hub.category}: hub must follow the registry category destination`,
  );
  const html = fs.readFileSync(routeToFile(hub.route), 'utf8');
  match(html, /<title>[^<]{12,}<\/title>/i, 'bounded title', hub.route);
  match(html, /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{40,}/i, 'meta description', hub.route);
  match(html, /<link[^>]+rel=["']canonical["']/i, 'canonical', hub.route);
  match(html, /application\/ld\+json/i, 'structured data', hub.route);
  const expectedLinks = Array.from(
    apps.filter((app) => app.category === hub.category),
    (app) => `${normalizeRoute(app.href)}/`,
  ).sort();
  assert.deepStrictEqual(
    uniqueToolLinks(html),
    expectedLinks,
    `${hub.route}: static tool destinations must exactly match the English canonical registry slice`,
  );
  const schemas = structuredData(html, hub.route);
  assert(
    schemas.some((schema) => Number(schema.numberOfItems) === expectedLinks.length),
    `${hub.route}: JSON-LD must expose the exact ${expectedLinks.length}-item canonical count`,
  );

  for (const alternateRoute of hub.alternateRoutes) {
    const alternateHtml = fs.readFileSync(routeToFile(alternateRoute), 'utf8');
    match(alternateHtml, /<link[^>]+rel=["']canonical["']/i, 'alternate-route canonical', alternateRoute);
  }
}

for (const app of apps) {
  assert(app.name && app.name.trim().length >= 3, `${app.href}: registry search name is missing`);
  assert(app.desc && app.desc.trim().length >= 20, `${app.href}: registry search description is missing`);
  assert(
    aiCatalogRoutes.has(normalizeRoute(app.href)),
    `${app.href}: canonical route is missing from the committed AI tool catalog`,
  );
  const file = routeToFile(app.href);
  assert(fs.existsSync(file), `${app.href}: route file is missing`);
  const html = fs.readFileSync(file, 'utf8');
  match(html, /<title>[^<]{12,}<\/title>/i, 'bounded title', app.href);
  match(html, /<meta[^>]+name=["']description["']/i, 'meta description', app.href);
  match(html, /<link[^>]+rel=["']canonical["']/i, 'canonical', app.href);
  match(html, /application\/ld\+json/i, 'structured data', app.href);
  match(
    html,
    /(source|reference|checked|updated|as of|freshness|verify|confirm)/i,
    'source, freshness, or verification boundary',
    app.href,
  );
  match(
    html,
    /(planning|estimate|not (?:official|legal|financial|religious)|confirm|verify)/i,
    'confidence or limitation boundary',
    app.href,
  );
  assert(
    !/\b(?:AfroTools guarantees|always accurate|officially approved by AfroTools)\b/i.test(html),
    `${app.href}: unsupported certainty claim`,
  );
}

const registryRows = loadRegistry().tools;
const localizedRecords = registryRows.filter(
  (app) => app.lang && app.lang !== 'en' && ['live', 'new'].includes(app.status) &&
    Object.keys(EXPECTED_COUNTS).includes(app.category),
);
const expandedExperiences = Object.keys(EXPECTED_COUNTS).reduce((grandTotal, category) => {
  const rows = registryRows.filter(
    (app) => (!app.lang || app.lang === 'en') && ['live', 'new'].includes(app.status) && app.category === category,
  );
  const routes = [...new Set(rows.map((app) => normalizeRoute(app.href)))];
  const familyAdjustments = rows.reduce((total, app) => {
    const declared = Number(app.toolCount || 1);
    if (declared <= 1) return total;
    const familyRoute = normalizeRoute(app.href);
    const explicitFamilyRoutes = routes.filter(
      (route) => route === familyRoute || route.startsWith(`${familyRoute}/`),
    ).length;
    return total + Math.max(0, declared - explicitFamilyRoutes);
  }, 0);
  return grandTotal + routes.length + familyAdjustments;
}, 0);
const alternateRoutes = HUBS.flatMap((hub) => hub.alternateRoutes);

console.log(
  `Day 10 contract: ${apps.length} English canonical destinations, ${expandedExperiences} expanded English experiences, ` +
  `${localizedRecords.length} localized records, ${HUBS.length} canonical hubs, and ${alternateRoutes.length} alternate hub routes verified.`,
);
