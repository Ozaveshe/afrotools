const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const parity = require('../data/transport/french-parity.json');
const officialSources = require('../data/transport/official-sources.json');
const sourceStatus = require('../data/transport/source-status.json');
const aiRouteMap = require('../assets/js/ai/french-transport-route-map.js');
const routeApi = require('../scripts/lib/route-contract');
const { normalizeBuildManagedHtml } = require('../scripts/lib/shared-asset-references');

const ENGLISH_BEHAVIOR_SHA256 = Object.freeze({
  'car-import-cost': 'da931a7b7cd4ed124e368494bd95b81d2f4c214559337cccc18184edf0292608',
  'car-price-intelligence': '977562c9185e29eeaae0e24066ae8ab76ed76b276b50e98d2e9b107a060e582c',
  'ride-fare': 'c308e31f56353dcab4208303ae9e580b6bef8e8f0ad1c3e8a38eda25b9761b33',
  'boda-income': 'bdbe8a554e3db71123a63e7685768f2f763768418b037af38421432940c4131f',
  'matatu-fare': 'ed41748d00eaf657c00e25795b10069ea17f0d1671507e6f9a8f4e9e0726199a',
  'delivery-cost': 'a8014d67b83d868062e2d52ce9a2c4456de4ba7412757d6ced9e5351703ab8eb',
  'car-loan-vs-cash': 'ba84ef7cf69ee74dab2be479ef80a5b4526b7dd7d7816799ebd56f5a55fb6673',
  'vehicle-registration': '9275644c32ab043dea121bc5f514754385424cfff79d2757870a0affe55d021c',
  roadworthiness: '3092a42aca8cd6c5e07c1af18ff966410d2f0cb8349815e4bb90c751e4e78344',
  'vehicle-depreciation': '9bc1d166a38d5250f4a635a384415b7624e20238744f9c0b6a672d882272845b',
  'fleet-fuel': '9d329549301f68cec4060490b989fd76dbdfab1663df65eb121094a852e04151',
  'last-mile-delivery': 'f60aeeea05436ee5eae8f40d3e84187be614b19231101f12b468792533817a2e',
  'parking-fee': 'dc3c255088802ff371f338d384e8e00db671d076c2081f5adb46e91e03bc4812',
  'route-cost': '2fd010bf8947a0db1c19cf7bbdc36c2f883befa9c2bc7cfef8b7e1386f777174',
  'toll-calc': '0ed9f0e2ffe448f1d4aa5af576f681ab472d3e32b570a4ca5f92b2a14caa7fe4',
  'truck-load': '843b426de61004cd00b7518c53d250d4e844e7202f962db4547bb3e9cc0f8a6c',
  'vehicle-operating-cost': '7d902d5857c9d20bdd914955fcf2d5b1c9f9d636955437adde8335ac4f01c63a',
  'vehicle-tracker-roi': '48a7b21307768960ca053c68d7f97347dd5062e5064ec1c187505e271350c497',
});

function routeFile(route) {
  const clean = route.replace(/^\/+|\/+$/g, '');
  return path.join(root, clean, route.endsWith('/') ? 'index.html' : '');
}

function loadRegistry() {
  const source = fs.readFileSync(path.join(root, 'assets/js/components/tool-registry.js'), 'utf8');
  const sandbox = { document: undefined, window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.AFRO_TOOLS;
}

function englishTransportRows(registry) {
  return registry
    .filter((tool) => tool.category === 'transport')
    .filter((tool) => tool.status === 'live' || tool.status === 'new')
    .filter((tool) => !/^\/(?:fr|sw|ha|yo)\//.test(tool.href));
}

function englishBehaviorFingerprint(html) {
  const normalized = normalizeBuildManagedHtml(html)
    .replace(/((?:src|href)=["'][^"'?]+)\?v=[a-f0-9]+(["'])/gi, '$1$2')
    .replace(/\r\n?/g, '\n');
  const bodyTag = normalized.match(/<body\b[^>]*>/i)?.[0] || '';
  const bodyData = Array.from(bodyTag.matchAll(/\b(data-[\w-]+)=["']([^"']*)["']/gi))
    .map((match) => [match[1].toLowerCase(), match[2]])
    .sort((left, right) => left[0].localeCompare(right[0]));
  const forms = Array.from(normalized.matchAll(/<form\b[\s\S]*?<\/form>/gi))
    .map((match) => match[0].replace(/>\s+</g, '><').trim());
  const scripts = [];

  for (const match of normalized.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributes = match[1];
    const source = attributes.match(/\bsrc=["']([^"']+)["']/i);
    if (source) {
      const executionAttributes = attributes
        .replace(/\bsrc=["'][^"']+["']/i, '')
        .replace(/\s+/g, ' ')
        .trim();
      scripts.push({
        kind: 'external',
        source: source[1].replace(/\?v=[a-f0-9]+$/i, ''),
        attributes: executionAttributes
      });
      continue;
    }
    if (/\btype=["']application\/ld\+json["']/i.test(attributes)) continue;
    if (/\btype=["']application\/json["']/i.test(attributes)) {
      const parsed = JSON.parse(match[2]);
      scripts.push({ kind: 'config', value: parsed });
      continue;
    }
    const executable = match[2].replace(/[ \t]+$/gm, '').trim();
    if (executable) scripts.push({ kind: 'inline', source: executable });
  }

  return JSON.stringify({ bodyData, forms, scripts });
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function alternateHref(html, locale) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    const language = tag.match(/\bhreflang=["']([^"']+)["']/i);
    const href = tag.match(/\bhref=["']([^"']+)["']/i);
    if (
      /\brel=["']alternate["']/i.test(tag) &&
      language &&
      href &&
      language[1].toLowerCase() === locale.toLowerCase()
    ) return href[1];
  }
  return '';
}

assert.strictEqual(parity.schemaVersion, 1);
assert.strictEqual(parity.locale, 'fr');
assert.strictEqual(parity.category, 'transport');
assert.strictEqual(
  parity.sourceReviewDate,
  sourceStatus.summary.generatedAt.slice(0, 10),
  'French Transport review date matches the refreshed source ledger'
);
assert.strictEqual(
  parity.sourceChangedCount,
  sourceStatus.summary.changedSources,
  'French Transport changed-source count matches the refreshed source ledger'
);
assert.strictEqual(
  parity.sourceBlockedManualCount,
  sourceStatus.summary.blockedSources + sourceStatus.summary.manualSources,
  'French Transport blocked/manual count matches the refreshed source ledger'
);
assert.strictEqual(sourceStatus.summary.brokenSources, 0, 'refreshed Transport source ledger has no broken source');
assert.strictEqual(parity.apps.length, 18, 'French Transport denominator is exactly 18');
assert.strictEqual(new Set(parity.apps.map((app) => app.englishId)).size, 18);
assert.strictEqual(new Set(parity.apps.map((app) => app.englishRoute)).size, 18);
assert.strictEqual(new Set(parity.apps.map((app) => app.frenchRoute)).size, 18);
assert.deepStrictEqual(
  new Set(Object.keys(ENGLISH_BEHAVIOR_SHA256)),
  new Set(parity.apps.map((app) => app.englishId)),
  'committed English behavior evidence covers the exact Transport denominator'
);

const registry = loadRegistry();
const englishRows = englishTransportRows(registry);
assert.strictEqual(englishRows.length, 18, 'registry English Transport denominator is exactly 18');
assert.deepStrictEqual(
  new Set(parity.apps.map((app) => app.englishId)),
  new Set(englishRows.map((row) => row.id)),
  'French manifest reconciles the exact English owner ids'
);
assert.deepStrictEqual(
  new Set(parity.apps.map((app) => app.englishRoute)),
  new Set(englishRows.map((row) => row.href)),
  'French manifest reconciles the exact English owner routes'
);

const sourceOwners = new Set(officialSources.tools.map((tool) => tool.id));
for (const app of parity.apps) {
  const frenchFile = routeFile(app.frenchRoute);
  const englishFile = routeFile(app.englishRoute);
  const artwork = path.join(root, 'assets/img/tools', `${app.imageId}.webp`);
  assert.ok(fs.existsSync(frenchFile), `${app.englishId} French route exists`);
  assert.ok(fs.existsSync(englishFile), `${app.englishId} English route exists`);
  assert.ok(fs.existsSync(artwork), `${app.englishId} canonical artwork exists`);
  assert.ok(sourceOwners.has(app.englishId), `${app.englishId} has an official-source owner`);

  const html = fs.readFileSync(frenchFile, 'utf8');
  const absoluteFrench = `https://afrotools.com${app.frenchRoute}`;
  const absoluteEnglish = `https://afrotools.com${app.englishRoute}`;
  assert.match(html, /<html\b[^>]*\blang=["']fr["']/i, `${app.englishId} is a French document`);
  assert.match(html, new RegExp(`<body\\b[^>]*data-fr-transport-parity=["']${app.englishId}["']`, 'i'));
  assert.ok(!/<iframe\b/i.test(html), `${app.englishId} is native and not an iframe bridge`);
  assert.ok(html.includes(`<link rel="canonical" href="${absoluteFrench}">`), `${app.englishId} canonical`);
  assert.ok(html.includes(`<meta property="og:url" content="${absoluteFrench}">`), `${app.englishId} OG URL`);
  assert.ok(
    html.includes(`<meta property="og:image" content="https://afrotools.com/assets/img/tools/${app.imageId}.webp">`),
    `${app.englishId} canonical social artwork`
  );
  assert.ok(
    html.includes(`<meta name="twitter:image" content="https://afrotools.com/assets/img/tools/${app.imageId}.webp">`),
    `${app.englishId} canonical Twitter artwork`
  );
  assert.ok(html.includes('<meta property="og:locale" content="fr_FR">'), `${app.englishId} OG locale`);
  assert.ok(html.includes(`<meta name="twitter:title" content="${app.name.replace(/&/g, '&amp;')} | AfroTools">`) ||
    app.existingNative, `${app.englishId} French Twitter title`);
  assert.ok(html.includes(`<link rel="alternate" hreflang="en" href="${absoluteEnglish}">`), `${app.englishId} English hreflang`);
  assert.ok(html.includes(`<link rel="alternate" hreflang="fr" href="${absoluteFrench}">`), `${app.englishId} French hreflang`);
  assert.match(html, /data-fr-transport-schema[^>]*>[^<]*"inLanguage":"fr"/, `${app.englishId} French schema`);
  assert.match(html, /data-fr-transport-download-text/, `${app.englishId} local TXT export`);
  assert.match(html, /data-fr-transport-download-pdf/, `${app.englishId} local PDF export`);
  assert.match(
    html,
    new RegExp(`data-fr-transport-artwork[^>]*src=["']/assets/img/tools/${app.imageId}\\.webp["']`),
    `${app.englishId} renders its assigned artwork`
  );
  assert.match(html, /Aucun tarif, horaire, trajet, disponibilit/, `${app.englishId} non-live boundary`);
  assert.match(html, /restent dans ce navigateur/, `${app.englishId} local privacy boundary`);
  assert.match(html, /Cadence pr/, `${app.englishId} freshness cadence`);
  assert.match(html, /Confiance prudente/, `${app.englishId} confidence`);
  assert.ok(!/class=["'][^"']*\bfaq-section\b/.test(html), `${app.englishId} excludes unsupported inherited FAQ claims`);
  if (!app.existingNative) {
    assert.ok(!/"@type"\s*:\s*"FAQPage"/.test(html), `${app.englishId} excludes inherited English FAQ schema`);
  }
  assert.ok(!/class=["'][^"']*\btool-verification-sec\b/.test(html), `${app.englishId} uses one French verification boundary`);
  assert.match(html, /\/assets\/js\/lib\/pdf-template\.js/, `${app.englishId} PDF engine`);
  assert.match(html, /\/assets\/js\/pages\/french-transport-parity\.js/, `${app.englishId} French runtime`);
  if (app.englishId === 'car-import-cost') {
    assert.strictEqual(
      (html.match(/src=["']\/assets\/js\/lib\/analytics\.js(?:\?[^"']*)?["']/g) || []).length,
      1,
      'Car Import declares exactly one shared analytics loader'
    );
    assert.match(
      html,
      /<script\b[^>]*\bid=["']afro-analytics-js["'][^>]*\bsrc=["']\/assets\/js\/lib\/analytics\.js/,
      'Car Import analytics loader owns the shared de-duplication id'
    );
  }
  let inlineIndex = 0;
  for (const script of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
    inlineIndex += 1;
    if (/\bsrc=|application\/ld\+json/i.test(script[1])) continue;
    if (/type=["']application\/json["']/i.test(script[1])) {
      assert.doesNotThrow(
        () => JSON.parse(script[2]),
        `${app.englishId} generated UI translation JSON parses`
      );
      continue;
    }
    assert.doesNotThrow(
      () => new vm.Script(script[2], { filename: `${app.englishId}-inline-${inlineIndex}` }),
      `${app.englishId} inline browser script ${inlineIndex} parses`
    );
  }

  const englishHtml = fs.readFileSync(englishFile, 'utf8');
  assert.ok(
    englishHtml.includes(`<link rel="alternate" hreflang="fr" href="${absoluteFrench}">`),
    `${app.englishId} reciprocal English hreflang`
  );
  const swahiliHref = alternateHref(englishHtml, 'sw');
  if (swahiliHref) {
    assert.strictEqual(
      alternateHref(html, 'sw'),
      swahiliHref,
      `${app.englishId} preserves its established Swahili equivalent`
    );
    const swahiliFile = routeFile(new URL(swahiliHref).pathname);
    const swahiliHtml = fs.readFileSync(swahiliFile, 'utf8');
    assert.strictEqual(
      alternateHref(swahiliHtml, 'fr'),
      absoluteFrench,
      `${app.englishId} has reciprocal French-Swahili hreflang`
    );
  }
  assert.strictEqual(
    sha256(englishBehaviorFingerprint(englishHtml)),
    ENGLISH_BEHAVIOR_SHA256[app.englishId],
    `${app.englishId} English forms, configuration, scripts, formulas and behavior match the committed parity evidence`
  );

  const owners = registry.filter((tool) =>
    /^\/fr\//.test(tool.href) &&
    tool.sourceId === app.englishId
  );
  assert.strictEqual(owners.length, 1, `${app.englishId} has exactly one canonical French registry owner`);
  assert.strictEqual(owners[0].href, app.frenchRoute, `${app.englishId} registry route matches manifest`);
  assert.strictEqual(aiRouteMap.routes[app.englishRoute], app.frenchRoute, `${app.englishId} AI route is exact`);
}

const transportRuntime = fs.readFileSync(
  path.join(root, 'assets/js/pages/french-transport-parity.js'),
  'utf8'
);
assert.match(transportRuntime, /carImportCostLastInput/, 'French Car Import blocks implicit full-input storage');
assert.match(transportRuntime, /Storage\.prototype\.setItem/, 'French Car Import installs its storage boundary before async calculation');
assert.match(transportRuntime, /replaceCarImportState/, 'French Car Import prevents sensitive query re-population');
assert.match(transportRuntime, /carImportCloudSave/, 'French Car Import removes unsupported cloud-save advertising');
assert.match(transportRuntime, /keepCarImportPdfLocalAndUngated/, 'French Car Import keeps its advertised PDF local and ungated');
assert.match(transportRuntime, /#carImportAiQuestion/, 'French Car Import advice input does not stale the financial result');
assert.match(transportRuntime, /afrotools:fr-transport-theme-ready/, 'French Car Import exposes real dark-mode API readiness');
assert.match(transportRuntime, /car-import:reset/, 'French Car Import clears stale French export state after reset');

const carImportEnhancements = fs.readFileSync(
  path.join(root, 'assets/js/car-import-cost-enhancements.js'),
  'utf8'
);
assert.match(carImportEnhancements, /id = "carImportReset"/, 'Car Import exposes a visible reset control');
assert.match(carImportEnhancements, /resetCarImportForm/, 'Car Import reset uses the shared runtime enhancement owner');
assert.match(carImportEnhancements, /car-import:reset/, 'Car Import reset emits the shared state-clearing contract');

const carImportAlias = routeApi.resolveFinalRoute(
  routeApi.buildRouteGraph(),
  '/fr/transport/car-import-cost/'
);
assert.strictEqual(carImportAlias.finalRoute, '/fr/tools/cout-importation-voiture/', 'French Car Import alias resolves to its semantic owner');
assert.strictEqual(carImportAlias.hops, 1, 'French Car Import alias resolves in one hop');
assert.strictEqual(carImportAlias.statusCode, 301, 'French Car Import alias is permanent');
assert.strictEqual(
  fs.existsSync(path.join(root, 'fr/transport/car-import-cost/index.html')),
  false,
  'French Car Import alias does not create a duplicate indexable page'
);

const hub = fs.readFileSync(path.join(root, 'fr/transport/index.html'), 'utf8');
assert.strictEqual((hub.match(/data-fr-transport-card=/g) || []).length, 18, 'French hub has exactly 18 cards');
assert.match(hub, /"numberOfItems":18/, 'French hub schema declares exactly 18');
assert.match(hub, /Les cinq outils transversaux/, 'French hub explains the cross-category exclusion');

for (const page of ['ai/index.html', 'ask/index.html']) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  const baseIndex = html.indexOf('/assets/js/ai/french-route-map.generated.js');
  const overlayIndex = html.indexOf('/assets/js/ai/french-transport-route-map.js');
  const routerIndex = html.indexOf('/assets/js/ai/intent-router.js');
  assert.ok(baseIndex >= 0 && overlayIndex > baseIndex && routerIndex > overlayIndex, `${page} loads the scoped route overlay before routing`);
}

console.log('French Transport exact parity contracts passed: 18/18.');
