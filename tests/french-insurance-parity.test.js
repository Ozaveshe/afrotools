'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const { normalizeLocalizedGeneratorHtml } = require('../scripts/lib/localized-generator-equivalence');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const CONTRACT = require('../data/insurance/assumption-contract.json');
const engine = require('../assets/js/pages/insurance-assumption-workflow.js');
const router = require('../assets/js/ai/intent-router.js');
const manifest = require('../assets/js/ai/tool-manifest.js').getToolManifestForRouter();
const routeMap = require('../assets/js/ai/french-route-map.generated.js');
const frenchCategories = require('../scripts/lib/french-category-directory.js').FRENCH_CATEGORIES;

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

function routeFile(route) {
  return path.join(ROOT, route.replace(/^\/+/, ''), 'index.html');
}

function loadRegistry() {
  const sandbox = {};
  return vm.runInNewContext(`${read('assets/js/components/tool-registry.js')}\n;AFRO_TOOLS;`, sandbox);
}

function jsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
}

function normalizePublishedHtml(html) {
  return normalizeLocalizedGeneratorHtml(html
    .replace(/\s*<meta\b[^>]*name=["']twitter:image["'][^>]*>\s*/gi, '\n')
    .replace(/<\/main>\s*<afro-footer>/g, '</main>\n<afro-footer>'));
}

test('Insurance contract freezes the exact 16-app denominator and six formula modes', () => {
  assert.equal(CONTRACT.apps.length, 16);
  assert.equal(new Set(CONTRACT.apps.map((app) => app.id)).size, 16);
  assert.equal(new Set(CONTRACT.apps.map((app) => app.englishRoute)).size, 16);
  assert.equal(new Set(CONTRACT.apps.map((app) => app.frenchRoute)).size, 16);
  assert.deepEqual(
    [...new Set(CONTRACT.apps.map((app) => app.mode))].sort(),
    ['claim', 'compare', 'contribution', 'need', 'quote', 'warning']
  );
  assert.equal(CONTRACT.policyBoundary.prohibitedClaims.length, 8);
});

test('DOM-free engine matches every frozen English/French oracle and rejects blank premium bases', () => {
  for (const [mode, fixture] of Object.entries(CONTRACT.oracleFixtures)) {
    const result = engine.calculate(mode, fixture.input);
    assert.equal(result.ok, true, mode);
    for (const [key, expected] of Object.entries(fixture.expected)) {
      assert.equal(result[key], expected, `${mode}.${key}`);
    }
  }
  assert.equal(engine.calculate('quote', { exposure: 0, rate: 2, fixed: 0, contingency: 0 }).ok, false);
  assert.equal(engine.calculate('need', { annual: 0, years: 0, debts: 0, education: 0, other: 0, available: 0 }).ok, false);
  assert.equal(engine.calculate('contribution', { base: 1000, employee: 2, employer: 3, months: 0 }).ok, false);
});

test('registry reconciles 16 English owners, 16 French canonical parents and separate expanded records', () => {
  const registry = loadRegistry();
  const english = registry.filter((item) => (
    item.category === 'insurance'
    && (!item.lang || item.lang === 'en')
    && ['live', 'new'].includes(item.status)
  ));
  const frenchAll = registry.filter((item) => (
    item.category === 'insurance'
    && item.lang === 'fr'
    && item.countries.includes('ALL')
    && ['live', 'new'].includes(item.status)
  ));
  const frenchExpanded = registry.filter((item) => (
    item.category === 'insurance'
    && item.lang === 'fr'
    && ['live', 'new'].includes(item.status)
  ));
  assert.deepEqual(Array.from(english, (item) => item.id), CONTRACT.apps.map((app) => app.id));
  assert.equal(english.reduce((sum, item) => sum + (item.toolCount || 1), 0), 322);
  assert.equal(frenchAll.length, 16);
  assert.equal(frenchExpanded.length, 115);
  assert.deepEqual(
    Array.from(frenchAll, (item) => item.sourceId).sort(),
    CONTRACT.apps.map((app) => app.id).sort()
  );
  const healthHub = registry.find((item) => item.id === 'assurance-sante-fr');
  assert.equal(healthHub.category, 'health');
  assert.equal(healthHub.href, '/fr/health/');
});

test('French hub is native, links each canonical app once and keeps ItemList at 16', () => {
  const html = read('fr/insurance/index.html');
  const englishHub = read('insurance/index.html');
  const links = [...html.matchAll(/data-insurance-app="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(links, CONTRACT.apps.map((app) => app.id));
  assert.equal((html.match(/class="insurance-link"/g) || []).length, 16);
  assert.match(html, /<html\b[^>]*\blang="fr"/);
  assert.match(html, /https:\/\/afrotools\.com\/fr\/insurance\//);
  assert.match(html, /hreflang="en" href="https:\/\/afrotools\.com\/insurance\/"/);
  assert.match(englishHub, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/insurance\/"/);
  assert.match(html, /"numberOfItems":16/);
  const category = frenchCategories.find((item) => item.key === 'insurance');
  assert.deepEqual({ href: category.href, nativeHub: category.nativeHub }, {
    href: '/fr/insurance/',
    nativeHub: true
  });
});

test('all 16 French app owners meet native product, privacy, export, SEO, source and artwork contracts', () => {
  for (const app of CONTRACT.apps) {
    const file = routeFile(app.frenchRoute);
    assert.equal(fs.existsSync(file), true, app.frenchRoute);
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /<html\b[^>]*\blang="fr"/, app.id);
    assert.match(html, new RegExp(`<h1>${app.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`), app.id);
    assert.match(html, new RegExp(`rel="canonical" href="${`https://afrotools.com${app.frenchRoute}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), app.id);
    assert.match(html, new RegExp(`hreflang="en" href="${`https://afrotools.com${app.englishRoute}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), app.id);
    assert.match(html, /data-locale="fr"/, app.id);
    assert.match(html, /data-source-date="2026-03-29"/, app.id);
    assert.match(html, /Plancher du jeu de données/, app.id);
    assert.match(html, /Confiance :<\/strong> élevée pour l’arithmétique/, app.id);
    assert.match(html, /Vie privée locale/, app.id);
    assert.match(html, /data-export="copy"/, app.id);
    assert.match(html, /data-export="json"/, app.id);
    assert.match(html, /data-export="pdf"/, app.id);
    assert.match(html, /router=off/, app.id);
    assert.match(html, /consentement explicite/, app.id);
    assert.doesNotMatch(html, /<iframe\b|fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/i, app.id);
    assert.doesNotMatch(html, /meilleur assureur|garantie d’acceptation|prime en direct disponible|devis ferme/i, app.id);
    const artwork = path.join(ROOT, 'assets', 'img', 'tools', `${app.id}.webp`);
    assert.equal(fs.existsSync(artwork), true, artwork);
    assert.match(html, new RegExp(`/assets/img/tools/${app.id}\\.webp`), app.id);

    const schemas = jsonLd(html);
    const graph = schemas.flatMap((schema) => schema['@graph'] || [schema]);
    const webApp = graph.find((item) => item['@type'] === 'WebApplication');
    const faq = graph.find((item) => item['@type'] === 'FAQPage');
    assert.equal(webApp.inLanguage, 'fr', app.id);
    assert.equal(webApp.url, `https://afrotools.com${app.frenchRoute}`, app.id);
    assert.equal(webApp.isBasedOn, `https://afrotools.com${app.englishRoute}`, app.id);
    assert.equal(faq.inLanguage, 'fr', app.id);

    const english = fs.readFileSync(routeFile(app.englishRoute), 'utf8');
    assert.match(
      english,
      new RegExp(`hreflang="fr" href="https://afrotools\\.com${app.frenchRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`),
      `${app.id} English reciprocal`
    );
  }
});

test('all 16 French Insurance intents resolve locally to their verified routes', () => {
  const queries = [
    'estimer assurance auto',
    'comparer deux assurances sante',
    'calculer besoin assurance vie',
    'preparer assurance obseques',
    'responsabilite civile automobile',
    'planifier assurance entreprise',
    'planifier assurance voyage',
    'cotisation accident du travail',
    'contribution assurance sante',
    'suivre un sinistre assurance',
    'planifier assurance recolte',
    'planifier assurance incendie',
    'verifier signaux fraude assurance',
    'assurance transport maritime cargo',
    'planifier microassurance',
    'responsabilite civile professionnelle'
  ];
  assert.equal(queries.length, CONTRACT.apps.length);
  for (let index = 0; index < queries.length; index += 1) {
    const app = CONTRACT.apps[index];
    const decision = router.routeDeterministically(queries[index], { manifest, locale: 'fr' });
    assert.equal(decision.selectedToolId, app.id, queries[index]);
    assert.equal(decision.selectedRoute, `${app.frenchRoute}?source=ask`, queries[index]);
    assert.equal(decision._meta.providerUsed, false, queries[index]);
    assert.equal(decision._meta.localeRoute.status, 'mapped', queries[index]);
    assert.equal(routeMap.routes[app.englishRoute], app.frenchRoute, app.id);
  }
});

test('AI consent copy keeps optional model help explicit and local fallback visible', () => {
  const i18n = read('assets/js/ai/i18n.js');
  const aiPage = read('ai/index.html');
  assert.match(i18n, /AfroTools peut reessayer avec un fournisseur de modele seulement apres votre consentement/);
  assert.match(i18n, /La recherche locale peut fonctionner sans consentement modele/);
  assert.match(aiPage, /id="aiModelConsent"/);
  assert.match(aiPage, /id="aiContinueWithoutModel"/);
});

test('generator is deterministic for all scoped French Insurance outputs', () => {
  const generator = require('../scripts/build-fr-insurance-parity.js');
  for (const app of CONTRACT.apps) {
    assert.equal(
      normalizePublishedHtml(generator.appHtml(app)),
      normalizePublishedHtml(fs.readFileSync(routeFile(app.frenchRoute), 'utf8')),
      app.id
    );
  }
  assert.equal(
    normalizePublishedHtml(generator.hubHtml()),
    normalizePublishedHtml(read('fr/insurance/index.html'))
  );
});
