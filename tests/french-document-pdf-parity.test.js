'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const router = require('../assets/js/ai/intent-router');
const manifestApi = require('../assets/js/ai/tool-manifest');
const frenchRouteMap = require('../assets/js/ai/french-route-map.generated');

const ROOT = path.resolve(__dirname, '..');
const CONFIG = require('../data/localization/fr-document-pdf-parity.json');
const DIRECTORY = require('../data/tool-directory.json');
const EVIDENCE = require('../reports/french-document-pdf-parity-evidence.json');
const MISSING_ARTWORK = require('../reports/french-document-pdf-missing-artwork.json');

function read(relativeFile) {
  return fs.readFileSync(path.join(ROOT, relativeFile), 'utf8');
}

function canonical(html) {
  return (html.match(/<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)/i) || [])[1] || '';
}

function meta(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (
    html.match(new RegExp(`<meta\\s+(?:name|property)=["']${escaped}["'][^>]*content=["']([^"']*)`, 'i')) ||
    html.match(new RegExp(`<meta\\s+content=["']([^"']*)["'][^>]*(?:name|property)=["']${escaped}["']`, 'i')) ||
    []
  )[1] || '';
}

test('French Document/PDF contract reconciles exactly to the 32 canonical English rows', () => {
  const directoryRows = DIRECTORY.filter((row) => row.category_key === 'document-pdf');
  assert.equal(directoryRows.length, 32);
  assert.equal(CONFIG.apps.length, 32);
  assert.deepEqual(
    [...CONFIG.apps.map((app) => app.id)].sort(),
    [...directoryRows.map((row) => row.id)].sort()
  );
  assert.equal(new Set(CONFIG.apps.map((app) => app.id)).size, 32);
  assert.equal(new Set(CONFIG.apps.map((app) => app.frenchRoute)).size, 32);
});

test('French Document/PDF evidence accepts all 32 rows through fail-closed contracts', () => {
  assert.equal(EVIDENCE.denominator, 32);
  assert.equal(EVIDENCE.rows.length, 32);
  assert.equal(EVIDENCE.failClosed, true);
  assert.equal(EVIDENCE.accepted, 32);
  assert.equal(EVIDENCE.blocked, 0);
  assert.ok(EVIDENCE.rows.every((row) => row.accepted === true && row.blockers.length === 0));
  assert.equal(MISSING_ARTWORK.denominator, 32);
  assert.equal(MISSING_ARTWORK.rows.length, 32);
  assert.equal(MISSING_ARTWORK.blocked, 0);
  assert.equal(MISSING_ARTWORK.reusedTextFree + MISSING_ARTWORK.localizedFrench, 32);
  assert.ok(MISSING_ARTWORK.rows.every((row) => (
    ['reusedTextFree', 'localizedFrench'].includes(row.status)
    && row.visuallyReviewed === true
    && row.dimensions.width > 0
    && row.dimensions.height > 0
  )));
});

test('French registry ownership is unique and stays in Document & PDF', () => {
  const sandbox = { document: undefined, window: {} };
  vm.createContext(sandbox);
  vm.runInContext(read('assets/js/components/tool-registry.js'), sandbox);

  for (const app of CONFIG.apps) {
    const rows = sandbox.AFRO_TOOLS.filter((entry) => (
      String(entry.href || '').replace(/\/$/, '') === app.frenchRoute.replace(/\/$/, '')
    ));
    assert.equal(rows.length, 1, `${app.id} French registry owner count`);
    assert.equal(rows[0].lang, 'fr', `${app.id} registry locale`);
    assert.equal(rows[0].category, 'document-pdf', `${app.id} registry category`);
    assert.equal(rows[0].sourceId, app.id, `${app.id} registry source owner`);
  }
});

test('French AI discovery routes every app-specific intent to its verified owner', () => {
  const manifest = manifestApi.getToolManifestForRouter();
  for (const app of CONFIG.apps) {
    const query = `Ouvrir ${app.name}`;
    const decision = router.routeDeterministically(query, { manifest, locale: 'fr' });
    assert.deepEqual(router.validateRouterOutput(decision).errors, [], query);
    if (app.id === 'document-pdf') {
      assert.equal(decision.selectedToolId, 'pdf-workspace', query);
      assert.equal(decision.selectedRoute, '/fr/tools/espace-pdf/?source=ask', query);
      continue;
    }
    assert.equal(decision.selectedToolId, app.id, query);
    assert.equal(decision.selectedRoute, `${app.frenchRoute}?source=ask`, query);
    assert.equal(decision._meta.localeRoute.status, 'mapped', query);
    assert.equal(
      frenchRouteMap.routes[app.englishRoute],
      app.frenchRoute,
      `${app.id} generated French AI route`
    );
  }
});

for (const app of CONFIG.apps) {
  test(`${app.id}: French owner is native, locale-correct and fail-closed`, () => {
    const html = read(app.frenchFile);
    assert.match(html, /<html\b[^>]*\blang=["']fr["']/i);
    assert.doesNotMatch(html, /<iframe\b[^>]*(?:src|data-src)=["'][^"']*(?:\/tools\/|\/document-pdf\/)/i);
    assert.doesNotMatch(html, /fetch\s*\(\s*[`"'](?:https:\/\/afrotools\.com)?\/tools\//i);
    assert.doesNotMatch(html, /\b(?:source-launch|prep-panel)\b/i);
    assert.equal(canonical(html), `https://afrotools.com${app.frenchRoute}`);
    assert.equal(meta(html, 'og:url'), `https://afrotools.com${app.frenchRoute}`);
    if (!app.preserveExisting) assert.equal(meta(html, 'content-language'), 'fr');
    assert.match(html, /"inLanguage"\s*:\s*"fr"/);
    assert.doesNotMatch(html, /"inLanguage"\s*:\s*"https?:\/\//);
    assert.match(html, /<h1\b[^>]*>[\s\S]*?<\/h1>/i);
    assert.match(html, /href=["']\/fr\//i);
    assert.doesNotMatch(html, /africa-tools\.com/i);
    if (!app.preserveExisting) {
      assert.match(html, /fr-document-pdf-localizer\.js/);
      assert.match(html, /fr-document-pdf-parity\.css/);
      assert.match(html, /"localFirstDownloads":true/);
      assert.match(html, /class=["'][^"']*fr-document-pdf-native/i);
      assert.match(html, /class=["']fr-parity-proof["']/i);
    }
    if (app.requiresConsent) {
      assert.match(html, /consent/i);
      assert.match(html, /local/i);
    }
    if (app.sensitive) {
      assert.match(html, /sensible|sensitive|confidential/i);
    }
  });

  if (app.englishWorkspaceFile) {
    test(`${app.id}: French app workspace exists and stays noindex`, () => {
      assert.ok(app.frenchWorkspaceFile);
      const html = read(app.frenchWorkspaceFile);
      assert.match(html, /<html\b[^>]*\blang=["']fr["']/i);
      assert.equal(canonical(html), `https://afrotools.com${app.frenchWorkspaceRoute}`);
      assert.match(meta(html, 'robots'), /noindex/i);
      assert.doesNotMatch(html, /<iframe\b/i);
      assert.doesNotMatch(html, /fetch\s*\(\s*[`"'](?:https:\/\/afrotools\.com)?\/tools\//i);
      assert.match(html, /fr-document-pdf-localizer\.js/);
    });
  }
}

test('French Document/PDF route map keeps all app and parent handoffs inside the French surface', () => {
  for (const app of CONFIG.apps) {
    const html = read(app.frenchFile);
    for (const target of CONFIG.apps) {
      const english = target.englishRoute.replace(/\/$/, '');
      const ownSourcePattern = new RegExp(
        `<a\\s+[^>]*href=["']${target.englishRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*hreflang=["']en["']`,
        'i'
      );
      const ownSourceLink = target.id === app.id && ownSourcePattern.test(html);
      const englishLinks = [...html.matchAll(/href=["']([^"']+)/gi)]
        .map((match) => match[1])
        .filter((href) => href === english || href === `${english}/` || href.startsWith(`${english}?`));
      if (ownSourceLink && englishLinks.length === 1) continue;
      assert.equal(englishLinks.length, 0, `${app.id} still links to English ${target.id}`);
    }
  }
});
