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
  'car-import-cost': 'a4f0c24612547918092f6bcea3cfb2fb4b4b3a2c2a7c39a31898c51bf351a06e',
  'car-price-intelligence': '977562c9185e29eeaae0e24066ae8ab76ed76b276b50e98d2e9b107a060e582c',
  'ride-fare': '2f6ebd585d5b31ad22c624d78fc9977bb99b3eb8adabe8067e83138b38a56b05',
  'boda-income': 'e796d5d35000ede36e9a98bb78bc4352be38d222378bcc703b472e8fddd73ce5',
  'matatu-fare': 'fd40245a7cd80e7fa4b95e1ad5aee4f8cbe0c04ae853046d3f0ddda1d9571e0a',
  'delivery-cost': '59ea30734c312860c9abe06e61ceade1889ca9837f27870e47e2305846f16387',
  'car-loan-vs-cash': 'ba84ef7cf69ee74dab2be479ef80a5b4526b7dd7d7816799ebd56f5a55fb6673',
  'vehicle-registration': '68211a0f8882697a81d2155d8a159a2a737c83541cafb4b3c084a3a88ad94ceb',
  roadworthiness: '39d219bf7ee288894f2993046123ed989012d91395d2487e84747b248fb5337b',
  'vehicle-depreciation': '030a454237132801ef47ad5212d7d1b6dae92c8bce8a87b73ac92bdd16e92cd9',
  'fleet-fuel': 'c41e69cfcce85769c05ef04fa3fccc550713f9f62094f56880353b3cbdd3bae2',
  'last-mile-delivery': 'bcf665b1d398a86ce299653c8681f700620f18069c4316f11791378ae8084a74',
  'parking-fee': '93544d439ec311eaca07bdcdde640b13eee28d67f9d3d086c68fefa71e5505d5',
  'route-cost': 'b30905a9abf6526e92425a7e7be8a6cfe4b09baf770c69eb97a7d00ea1c16397',
  'toll-calc': '15fcf5433e4eaf6d11d9b6a5401fefcd80bc47cb2852946b2d5f82815dbfd823',
  'truck-load': 'c5c9f9f121ff1bb7af55d526bc709f90a16b8b4ccaae94eb53da15963e35ac7a',
  'vehicle-operating-cost': 'bf7ce95ca34ec7a7b9dd2982ace0c008e6ba012a9d16e8c225142033e5f16a65',
  'vehicle-tracker-roi': 'ee8ef7965bea884a1708d032c19b3f590e051e3e818076fdeb13e0ebe89383d1',
});

function routeFile(route) {
  const clean = route.replace(/^\/+|\/+$/g, '');
  return path.join(root, clean, route.endsWith('/') ? 'index.html' : '');
}

function normalizeRoute(route) {
  return '/' + String(route).replace(/^\/+|\/+$/g, '');
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
  if (app.existingNative) {
    const schemas = Array.from(html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))
      .flatMap((match) => {
        const parsed = JSON.parse(match[1]);
        return Array.isArray(parsed) ? parsed : [parsed];
      });
    assert.ok(schemas.some((schema) => schema.inLanguage === 'fr'), `${app.englishId} native French schema`);
  } else {
    assert.match(html, /data-fr-transport-schema[^>]*>[^<]*"inLanguage":"fr"/, `${app.englishId} French schema`);
  }
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
  assert.strictEqual(
    normalizeRoute(owners[0].href),
    normalizeRoute(app.frenchRoute),
    `${app.englishId} registry route matches manifest`
  );
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
