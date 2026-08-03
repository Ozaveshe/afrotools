'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const diasporaApps = require('../assets/js/pages/fr-diaspora-apps');
const frenchRouteMap = require('../assets/js/ai/french-route-map.generated');
const guardrails = require('../assets/js/ai/guardrails');
const router = require('../assets/js/ai/intent-router');
const manifestApi = require('../assets/js/ai/tool-manifest');
const { normalizeBuildManagedHtml } = require('../scripts/lib/shared-asset-references');

const ROOT = path.resolve(__dirname, '..');
const ENGLISH_BASELINE = Object.freeze({
  immigration: '686add5d36233b6c7226f9503948a60d1dc9ed2c3e0fe962c62fc1ca95d5bc95',
  visa: '912b6b336d29a39053c33b0b9f35e852e333249574017933923b36ea1b972034',
});
const FRENCH_VISA_ALTERNATE = '<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/suivi-de-demande-de-visa/">\n';

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizedEnglishOwner(relativePath) {
  return normalizeBuildManagedHtml(read(relativePath))
    .replace(/<link\b[^>]*rel=["']alternate["'][^>]*>\s*/gi, '');
}

function jsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
}

test('English owner behavior stays frozen apart from the reciprocal French visa alternate', () => {
  assert.equal(sha256(normalizedEnglishOwner('tools/immigration-points/index.html')), ENGLISH_BASELINE.immigration);
  assert(read('tools/visa-tracker/index.html').includes(FRENCH_VISA_ALTERNATE.trim()));
  assert.equal(sha256(normalizedEnglishOwner('tools/visa-tracker/index.html')), ENGLISH_BASELINE.visa);
});

test('the French Diaspora hub owns exactly the two canonical counterparts', () => {
  const hub = read('fr/diaspora/index.html');
  const cards = [...hub.matchAll(/<a class="fd-tool-card" href="([^"]+)">/g)].map((match) => match[1]);
  assert.deepEqual(cards, [
    '/fr/tools/calculateur-de-points-d-immigration/',
    '/fr/tools/suivi-de-demande-de-visa/',
  ]);
  const collection = jsonLd(hub).find((entry) => entry['@type'] === 'CollectionPage');
  assert.equal(collection.mainEntity.numberOfItems, 2);
  assert.equal(collection.mainEntity.itemListElement.length, 2);
});

test('both French apps have canonical, reciprocal hreflang, OG, schema, artwork and local privacy contracts', () => {
  const contracts = [
    {
      file: 'fr/tools/calculateur-de-points-d-immigration/index.html',
      canonical: 'https://afrotools.com/fr/tools/calculateur-de-points-d-immigration/',
      english: 'https://afrotools.com/tools/immigration-points/',
      artwork: '/assets/img/tools/immigration-points.webp',
    },
    {
      file: 'fr/tools/suivi-de-demande-de-visa/index.html',
      canonical: 'https://afrotools.com/fr/tools/suivi-de-demande-de-visa/',
      english: 'https://afrotools.com/tools/visa-tracker/',
      artwork: '/assets/img/tools/visa-tracker.webp',
    },
  ];

  for (const contract of contracts) {
    const html = read(contract.file);
    assert(html.includes(`<link rel="canonical" href="${contract.canonical}">`), contract.file);
    assert(html.includes(`<link rel="alternate" hreflang="fr" href="${contract.canonical}">`), contract.file);
    assert(html.includes(`<link rel="alternate" hreflang="en" href="${contract.english}">`), contract.file);
    assert(html.includes(`<meta property="og:url" content="${contract.canonical}">`), contract.file);
    assert(html.includes(`src="${contract.artwork}"`), contract.file);
    assert(html.includes('data-local-only="true"'), contract.file);
    assert(html.includes('/assets/js/pages/fr-diaspora-apps.js'), contract.file);
    assert(jsonLd(html).some((entry) => entry['@type'] === 'WebApplication'), contract.file);
  }
});

test('French immigration formulas reproduce the frozen English selected-factor logic', () => {
  const canada = diasporaApps.calculateCanada({
    age: 110,
    education: 135,
    educationIndex: 6,
    clb: 9,
    canadianExperience: 53,
    canadianExperienceIndex: 2,
    foreignYears: 3,
    nomination: 0,
    sibling: 15,
    canadianStudy: 30,
  });
  const australia = diasporaApps.calculateAustralia({
    age: 30,
    education: 20,
    english: 20,
    outsideExperience: 15,
    australiaExperience: 20,
    nomination: 15,
    australiaStudy: 5,
    partner: 10,
  });
  const uk = diasporaApps.calculateUk({
    sponsorship: 20,
    occupation: 20,
    english: 10,
    salary: 41700,
    salaryFloor: 41700,
    goingRateMet: true,
  });

  assert.equal(canada.score, 567);
  assert.equal(australia.score, 120);
  assert.equal(uk.score, 70);
  assert.equal(diasporaApps.calculateUk({
    sponsorship: 20,
    occupation: 20,
    english: 10,
    salary: 41699,
    salaryFloor: 41700,
    goingRateMet: true,
  }).score, 50);
});

test('visa timeline rejects invented or impossible ranges and uses only entered official values', () => {
  assert.equal(diasporaApps.calculateTimeline({
    destination: '',
    visaType: 'tourist',
    submitted: '2026-07-01',
    minimum: 15,
    maximum: 30,
    unit: 'days',
    checks: [],
  }, '2026-07-29T12:00:00Z').ok, false);
  assert.equal(diasporaApps.calculateTimeline({
    destination: 'CA',
    visaType: 'tourist',
    submitted: '2026-07-01',
    minimum: 30,
    maximum: 15,
    unit: 'days',
    checks: [],
  }, '2026-07-29T12:00:00Z').ok, false);
  const result = diasporaApps.calculateTimeline({
    destination: 'CA',
    visaType: 'tourist',
    submitted: '2026-07-01',
    minimum: 15,
    maximum: 30,
    unit: 'days',
    checks: [true, false],
  }, '2026-07-29T12:00:00Z');
  assert.equal(result.ok, true);
  assert.equal(result.elapsedDays, 28);
  assert.equal(result.minimumCalendarDays, 15);
  assert.equal(result.maximumCalendarDays, 30);
  assert.match(result.source.href, /canada\.ca/);
});

test('registry and locale policy classify exactly two native French Diaspora counterparts', () => {
  const registry = read('assets/js/components/tool-registry.js');
  const frenchRows = [...registry.matchAll(/\{ id: "[^"]+"[^\n]+category: "diaspora"[^\n]+lang: "fr"[^\n]+\}/g)]
    .filter((match) => /sourceId: "(?:immigration-points|visa-tracker)"/.test(match[0]));
  assert.equal(frenchRows.length, 2);
  assert(frenchRows.some((match) => match[0].includes('sourceId: "immigration-points"')));
  assert(frenchRows.some((match) => match[0].includes('sourceId: "visa-tracker"')));

  const policy = JSON.parse(read('data/registry/locale-coverage-policy.json'));
  const coverage = JSON.parse(read('data/registry/locale-page-coverage.json'));
  const wave = JSON.parse(read('data/localization/coverage-wave-2026-07.json'));
  for (const route of [
    '/fr/tools/calculateur-de-points-d-immigration/',
    '/fr/tools/suivi-de-demande-de-visa/',
  ]) {
    const override = policy.overrides.find((entry) => entry.route === route);
    assert.equal(override.state, 'native');
    assert.equal(override.engineLocaleNeutral, true);
    const record = coverage.records.find((entry) => entry.route === route);
    assert(record, `missing canonical coverage record for ${route}`);
    assert.equal(record.state, 'native');
    assert.equal(record.sourceOwner, override.sourceOwner);
  }
  assert.equal(wave.french.find((entry) => entry.enSlug === 'immigration-points').native, true);
  assert.equal(wave.nativeFrench.find((entry) => entry.enSlug === 'visa-tracker').native, true);
});

test('French AI routes both apps from canonical generated coverage without hard-coded overrides', () => {
  const manifest = manifestApi.getToolManifestForRouter();
  const cases = [
    ['immigration-points', 'calculateur de points immigration Canada', '/fr/tools/calculateur-de-points-d-immigration/'],
    ['visa-tracker', 'suivi demande visa', '/fr/tools/suivi-de-demande-de-visa/'],
  ];

  assert.equal(read('assets/js/ai/intent-router.js').includes('FRENCH_LOCAL_ONLY_ROUTE_OVERRIDES'), false);
  assert.equal(read('assets/js/ai/guardrails.js').includes('FRENCH_LOCAL_ONLY_ROUTE_OVERRIDES'), false);

  for (const [toolId, query, frenchRoute] of cases) {
    const tool = manifest.find((entry) => entry.id === toolId);
    assert.equal(frenchRouteMap.routes[tool.route], frenchRoute);
    const decision = router.routeDeterministically(query, { manifest: [tool], locale: 'fr' });
    assert.equal(decision.selectedToolId, toolId);
    assert.equal(decision.selectedRoute, `${frenchRoute}?source=ask`);
    assert.equal(decision._meta.localeRoute.status, 'mapped');
    assert.match(
      decision._meta.localeRoute.source,
      /^data\/registry\/locale-page-coverage\.json(?: \+ .+)?$/,
      'the canonical locale coverage must remain the primary French route source'
    );
    assert.equal(decision.handoffPlan.rawSensitiveDataInUrl, false);
    if (toolId === 'immigration-points') assert.equal(decision.handoffPlan.consentRequiredForModel, true);
    assert.deepEqual(guardrails.validateRouterDecisionSafety(decision, manifest).errors, []);
  }
});
