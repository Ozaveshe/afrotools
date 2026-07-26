'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const harness = require('../scripts/audit-day5-language-release.js');
const registry = fs.readFileSync(path.join(root, 'assets/js/components/tool-registry.js'), 'utf8');

test('harness derives exactly 11 English Language routes from the registry', () => {
  const routes = harness.deriveEnglishLanguageRoutes(registry);
  assert.equal(routes.length, 11);
  assert.equal(new Set(routes.map((route) => route.id)).size, 11);
  assert.ok(routes.every((route) => route.status === 'live'));
  assert.ok(routes.every((route) => route.route.startsWith('/tools/') && route.route.endsWith('/')));
});

test('every derived route has one of the three explicit privacy classifications', () => {
  const routes = harness.deriveEnglishLanguageRoutes(registry);
  const counts = routes.reduce((result, route) => {
    result[route.classification] = (result[route.classification] || 0) + 1;
    return result;
  }, {});
  assert.deepEqual(counts, {
    'local-phrasebook-first-with-explicit-cloud-consent': 8,
    'deterministic-local-only': 2,
    'provenance-lookup': 1
  });
});

test('static audits run against every current route without mutating sources', () => {
  const routes = harness.deriveEnglishLanguageRoutes(registry);
  const audits = routes.map((route) => harness.staticRouteAudit(route));
  assert.equal(audits.length, 11);
  assert.ok(audits.every((audit) => audit.exists));
  assert.ok(audits.every((audit) => audit.file.startsWith('tools/')));
  assert.ok(audits.every((audit) => Array.isArray(audit.classificationChecks)));
});

test('accepted hub and shared consent foundation have a separate regression gate', () => {
  const routes = harness.deriveEnglishLanguageRoutes(registry);
  const accepted = harness.acceptedSurfaceAudit(routes);
  assert.equal(accepted.pass, true);
  assert.ok(accepted.checks.length >= 8);
  assert.ok(accepted.checks.every((check) => check.pass));
});

test('report wording treats accepted-app failures as release regressions', () => {
  const markdown = harness.markdownReport({
    reviewedOn: '2026-07-26',
    summary: {
      routes: 1,
      acceptedSurfacesGreen: true,
      appsWithBaselineFailures: 1
    },
    acceptedSurfaces: { checks: [{ id: 'hub', pass: true }] },
    routes: [{
      route: '/tools/example/',
      classification: 'deterministic-local-only',
      static: {
        title: { pass: true },
        description: { pass: true },
        canonical: { pass: true },
        localTypography: { pass: false }
      },
      browser: {
        httpRender: { pass: true },
        mainLandmark: { pass: true },
        noGoogleFontRequest: { pass: false },
        namedPrimaryControls: { pass: true },
        mobile320Reflow: { pass: true },
        darkModeSurface: { pass: true },
        runtimeErrors: { pass: true },
        privacy: { pass: true }
      },
      baselineFailures: ['static-local-typography']
    }],
    regressions: []
  });
  assert.match(markdown, /REGRESSION/);
  assert.match(markdown, /Accepted-surface regressions/);
  assert.match(markdown, /after separate app-level acceptance/i);
});
