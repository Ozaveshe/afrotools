'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'reports/fr-engineering-construction-parity-manifest.json'),
  'utf8'
));
const frozenFixtures = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'tests/fixtures/engineering-construction-owner-parity.json'),
  'utf8'
));
const localeCoverage = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'data/registry/locale-page-coverage.json'),
  'utf8'
));
const frenchAiRouteMap = require('../assets/js/ai/french-route-map.generated');
const missing = {
  afrodraft: '/fr/ingenierie/afrodraft/',
  'afroplan-floor-planner': '/fr/ingenierie/planificateur-etage/',
  'scaffolding-calc': '/fr/tools/calculateur-echafaudage/',
  'window-door-sizing': '/fr/tools/dimensionnement-fenetres-portes/',
  'plumbing-material': '/fr/tools/materiaux-plomberie/'
};
const engineOwners = new Set([
  'scaffolding-calc',
  'window-door-sizing',
  'plumbing-material',
  'septic-tank',
  'site-clearance',
  'road-construction-cost'
]);
const modularOwners = new Set(['afroplan-floor-planner', 'home-renovation-cost']);
const sharedControllers = new Map([
  ['architectural-fee', '/assets/js/pages/architectural-fee-workspace.js']
]);

function fileFor(route) {
  return path.join(ROOT, route.replace(/^\/|\/$/g, ''), 'index.html');
}

function inlineControllers(html) {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((match) => match[2].trim());
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertReciprocal(sourceHtml, targetHtml, sourceRoute, targetRoute, locale) {
  assert.match(
    sourceHtml,
    new RegExp(`hreflang="${locale}" href="https://afrotools\\.com${escapeRegExp(targetRoute)}"`),
    `${sourceRoute} must reference ${locale} ${targetRoute}`
  );
  const sourceLocale = sourceRoute.startsWith('/fr/') ? 'fr' : 'en';
  assert.match(
    targetHtml,
    new RegExp(`hreflang="${sourceLocale}" href="https://afrotools\\.com${escapeRegExp(sourceRoute)}"`),
    `${targetRoute} must reciprocate ${sourceLocale} ${sourceRoute}`
  );
}

assert.equal(manifest.routes.length, 26, 'Engineering manifest must stay exact at 26 owners');
assert.equal(new Set(manifest.routes.map((row) => row.id)).size, 26, 'Engineering owner ids must be unique');
assert.equal(frozenFixtures.length, 26, 'English/French pre/post fixtures must stay exact at 26');
assert.deepEqual(
  frozenFixtures.map((fixture) => fixture.id),
  manifest.routes.map((row) => row.id),
  'frozen fixture order must match the owner manifest'
);

for (const row of manifest.routes) {
  const french = row.french || missing[row.id];
  assert.ok(french, `missing French route mapping for ${row.id}`);
  const englishFile = fileFor(row.english);
  const frenchFile = fileFor(french);
  assert.ok(fs.existsSync(englishFile), `missing English owner ${row.english}`);
  assert.ok(fs.existsSync(frenchFile), `missing French owner ${french}`);

  const englishHtml = fs.readFileSync(englishFile, 'utf8');
  const frenchHtml = fs.readFileSync(frenchFile, 'utf8');
  assert.match(frenchHtml, /<html[^>]*\blang="fr"/i, `${french} is not French`);
  assert.match(frenchHtml, new RegExp(`<link rel="canonical" href="https://afrotools\\.com${french.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(frenchHtml, new RegExp(`hreflang="en" href="https://afrotools\\.com${row.english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(frenchHtml, new RegExp(`hreflang="fr" href="https://afrotools\\.com${french.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(frenchHtml, /hreflang="x-default"/);
  assertReciprocal(englishHtml, frenchHtml, row.english, french, 'fr');

  const coverageRecord = localeCoverage.records.find((record) => record.route === french);
  assert.ok(coverageRecord, `${french} is missing from locale page coverage`);
  assert.equal(coverageRecord.locale, 'fr', `${french} coverage locale must be French`);
  assert.equal(coverageRecord.state, 'native', `${french} coverage must be truthfully native`);
  assert.equal(coverageRecord.indexableEligible, true, `${french} coverage must be indexable`);
  assert.equal(coverageRecord.equivalentRoute, row.english, `${french} coverage equivalent drifted`);
  assert.equal(
    frenchAiRouteMap.routes[row.english],
    french,
    `${row.english} is missing its exact French AI route`
  );
  assert.match(frenchHtml, new RegExp(`name="afrotools-ai-tool-id" content="${row.id}"`));
  assert.match(frenchHtml, new RegExp(`data-fr-engineering-owner="${row.id}"`));
  assert.match(frenchHtml, /"privacy":"local-first","aiConsent":"explicit"/);
  assert.match(frenchHtml, /\/assets\/js\/pages\/fr-engineering-export\.js/);
  assert.match(frenchHtml, new RegExp(`data-fr-engineering-export="${row.id}"`));
  assert.match(
    frenchHtml,
    /<meta\b(?=[^>]*\bproperty="og:image")(?=[^>]*\bcontent="https:\/\/afrotools\.com\/assets\/img\/tools\/)[^>]*>/i
  );
  assert.doesNotMatch(frenchHtml, /fr-engineering-localizer|MutationObserver|mountSource|SOURCE_URL|<iframe/i);
  assert.doesNotMatch(frenchHtml, /\/assets\/js\/pages\/english-df-app-upgrades\.js/i);
  assert.doesNotMatch(frenchHtml, />Informations et hypothèses du calcul<\/button>/);

  const schemaBlocks = [...frenchHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
  assert.ok(schemaBlocks.length, `${french} has no parseable structured data`);
  assert.ok(
    schemaBlocks.flatMap((block) => Array.isArray(block) ? block : [block]).some((block) => block.inLanguage === 'fr'),
    `${french} has no French structured-data owner`
  );

  for (const artwork of row.artwork) {
    assert.ok(
      fs.existsSync(path.join(ROOT, 'assets/img/tools', artwork)),
      `missing dedicated artwork assets/img/tools/${artwork}`
    );
  }

  if (engineOwners.has(row.id)) {
    const engineName = {
      'scaffolding-calc': 'scaffolding-engine',
      'window-door-sizing': 'window-door-sizing-engine',
      'plumbing-material': 'plumbing-material-engine',
      'septic-tank': 'septic-tank-engine',
      'site-clearance': 'site-clearing-engine',
      'road-construction-cost': 'road-construction-cost-engine'
    }[row.id];
    assert.ok(fs.existsSync(path.join(ROOT, `engines/src/${engineName}.js`)));
    assert.ok(fs.existsSync(path.join(ROOT, `engines/${engineName}.js`)));
    assert.match(englishHtml, new RegExp(`/engines/${engineName}\\.js`));
  } else if (sharedControllers.has(row.id)) {
    const controller = sharedControllers.get(row.id);
    assert.match(englishHtml, new RegExp(controller.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.ok(fs.existsSync(path.join(ROOT, controller.replace(/^\//, ''))));
  } else if (!modularOwners.has(row.id) && row.id !== 'afrodraft') {
    assert.equal(inlineControllers(englishHtml).length, 0, `${row.english} still owns an inline controller`);
    const controllerRefs = [...englishHtml.matchAll(/\/assets\/js\/pages\/engineering-parity\/([^"'?]+\.js)/g)];
    assert.ok(controllerRefs.length, `${row.english} has no extracted controller owner`);
    for (const ref of controllerRefs) {
      assert.ok(fs.existsSync(path.join(ROOT, 'assets/js/pages/engineering-parity', ref[1])));
      assert.ok(fs.existsSync(path.join(ROOT, 'assets/js/pages/engineering-parity/fr', ref[1])));
    }
  }
}

const frenchSolar = fs.readFileSync(fileFor('/fr/tools/calculateur-solaire/'), 'utf8');
for (const expected of [
  'Dimensionnement du système solaire',
  'Configuration du système',
  'Puissance de pointe',
  'Dimensionner mon système solaire',
  'Notes sur la méthode',
  'Poser une question'
]) {
  assert.match(frenchSolar, new RegExp(expected), `French solar surface is missing reviewed copy: ${expected}`);
}
for (const residualEnglish of [
  'Solar System Sizer',
  'System Setup',
  'Peak Power Demand',
  'Calculate My Solar System',
  'Method notes',
  'Ask a question'
]) {
  assert.doesNotMatch(
    frenchSolar,
    new RegExp(`(?:>|=["'])[^<"'\\n]*${residualEnglish}`, 'i'),
    `French solar surface leaked English copy: ${residualEnglish}`
  );
}

const frenchHub = fs.readFileSync(path.join(ROOT, 'fr/ingenierie/index.html'), 'utf8');
const englishHub = fs.readFileSync(path.join(ROOT, 'engineering/index.html'), 'utf8');
assert.match(frenchHub, /<html\b[^>]*\blang="fr"/);
assert.match(frenchHub, /<link rel="canonical" href="https:\/\/afrotools\.com\/fr\/ingenierie\/">/);
assert.match(frenchHub, /name="afrotools-ai-category-id" content="engineering"/);
assert.match(frenchHub, /"numberOfItems":26/);
assert.equal((frenchHub.match(/class="fr-engineering-hub-card"/g) || []).length, 26);
assert.match(englishHub, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/ingenierie\/"/);
const hubCoverage = localeCoverage.records.find((record) => record.route === '/fr/ingenierie/');
assert.ok(hubCoverage, 'French Engineering hub is missing from locale page coverage');
assert.equal(hubCoverage.state, 'native', 'French Engineering hub coverage must be native');
assert.equal(hubCoverage.equivalentRoute, '/engineering/');
assertReciprocal(
  englishHub,
  frenchHub,
  '/engineering/',
  '/fr/ingenierie/',
  'fr'
);

const multilingualReciprocals = [
  {
    french: '/fr/ingenierie/afrodraft/',
    swahili: '/sw/zana/afrodraft-cad/'
  },
  {
    french: '/fr/ingenierie/planificateur-etage/',
    swahili: '/sw/zana/mpangaji-ramani-ya-sakafu/'
  },
  {
    french: '/fr/ingenierie/',
    swahili: '/sw/ujenzi-na-uhandisi/'
  }
];
for (const pair of multilingualReciprocals) {
  const frenchHtml = fs.readFileSync(fileFor(pair.french), 'utf8');
  const swahiliHtml = fs.readFileSync(fileFor(pair.swahili), 'utf8');
  assert.match(
    frenchHtml,
    new RegExp(`hreflang="sw" href="https://afrotools\\.com${escapeRegExp(pair.swahili)}"`)
  );
  assert.match(
    swahiliHtml,
    new RegExp(`hreflang="fr" href="https://afrotools\\.com${escapeRegExp(pair.french)}"`)
  );
}

const reflowRuntime = fs.readFileSync(
  path.join(ROOT, 'assets/js/pages/fr-engineering-reflow.js'),
  'utf8'
);
assert.match(reflowRuntime, /window\.AfroTools\.darkMode\.set/);
assert.match(reflowRuntime, /frEngineeringThemeReady/);
assert.match(reflowRuntime, /fr-engineering:theme-ready/);
for (const fixture of frozenFixtures) {
  assert.match(frenchHub, new RegExp(`href="${fixture.french.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
}

assert.match(
  fs.readFileSync(path.join(ROOT, 'engineering/afrodraft/app.js'), 'utf8'),
  /SvgExporter\.export\(this\.engine\)/,
  'AfroDraft SVG export must call the accepted static exporter contract'
);

console.log('French Engineering 26-owner architecture, SEO, artwork, privacy and native-route contracts passed.');
