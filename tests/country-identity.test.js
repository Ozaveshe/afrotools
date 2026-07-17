'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const registryApi = require('../scripts/lib/canonical-registry');
const identityAudit = require('../scripts/audit-country-identity');
const metadataProjection = require('../scripts/apply-country-identity-metadata');

const ROOT = path.resolve(__dirname, '..');
const canonical = registryApi.buildCanonicalRegistry();
const validation = registryApi.validateCanonicalRegistry(canonical);
assert.strictEqual(validation.ok, true, validation.errors.map(registryApi.formatIssue).join('\n'));
assert.strictEqual(canonical.countries.length, 54);

canonical.countries.forEach((country) => {
  ['id', 'isoCode', 'displayNames', 'title', 'flag', 'currency', 'region', 'sourceJurisdiction', 'routeSlug', 'route', 'supportedToolTypes', 'localeCoverage'].forEach((field) => {
    assert.ok(Object.prototype.hasOwnProperty.call(country, field), `${country.id} missing ${field}`);
  });
  assert.strictEqual(country.id, country.isoCode);
  assert.strictEqual(country.id, country.sourceJurisdiction);
  assert.strictEqual(country.routeSlug, country.route.replace(/^\/+|\/+$/g, ''));
  ['en', 'fr', 'sw', 'yo', 'ha'].forEach((locale) => {
    assert.ok(country.displayNames[locale], `${country.id} missing ${locale} display name`);
    assert.ok(country.localeCoverage[locale], `${country.id} missing ${locale} coverage`);
  });
});

function validationCodes(registry) {
  return registryApi.validateCanonicalRegistry(registry).errors.map((issue) => issue.code);
}

let invalid = registryApi.cloneCanonicalRegistry(canonical);
invalid.countries[0].sourceJurisdiction = 'NG';
assert.ok(validationCodes(invalid).includes('COUNTRY_SOURCE_JURISDICTION_MISMATCH'));

invalid = registryApi.cloneCanonicalRegistry(canonical);
invalid.countries[0].routeSlug = 'wrong-country';
assert.ok(validationCodes(invalid).includes('COUNTRY_ROUTE_SLUG_MISMATCH'));

invalid = registryApi.cloneCanonicalRegistry(canonical);
invalid.countries[0].currency = 'XX';
assert.ok(validationCodes(invalid).includes('COUNTRY_CURRENCY_INVALID'));

const cf = canonical.countries.find((country) => country.id === 'CF');
const fixtureFile = path.join(ROOT, 'fixture-country.html');
const correctFixture = `<!doctype html><html><head><title>Central African Republic Crop Tool</title><meta name="description" content="Plan crops in Central African Republic"><meta name="afrotools-country-id" content="CF"><meta name="afrotools-source-jurisdiction" content="CF"><meta name="afrotools-formula-jurisdiction" content="CF"><meta name="afrotools-currency" content="XAF"><script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"Central African Republic Crop Tool","description":"Planning for Central African Republic"}</script></head><body><h1>Central African Republic Crop Tool</h1></body></html>`;
assert.deepStrictEqual(identityAudit.scanHtml(correctFixture, { country: cf, route: '/fixture-country', file: fixtureFile }).errors, []);

const wrongFixture = correctFixture
  .replace(/Central African Republic/g, 'Nigeria')
  .replace('content="CF"', 'content="NG"')
  .replace('content="XAF"', 'content="NGN"');
const wrongCodes = identityAudit.scanHtml(wrongFixture, { country: cf, route: '/fixture-country', file: fixtureFile }).errors.map((error) => error.code);
['COUNTRY_TITLE_MISMATCH', 'COUNTRY_HEADING_MISMATCH', 'COUNTRY_DESCRIPTION_MISMATCH', 'COUNTRY_ID_MISMATCH', 'COUNTRY_CURRENCY_MISMATCH', 'COUNTRY_STRUCTURED_DATA_MISMATCH'].forEach((code) => assert.ok(wrongCodes.includes(code), `fixture should trigger ${code}`));

const projected = metadataProjection.project('<!doctype html><html><head><meta charset="utf-8"><title>Central African Republic Crop Tool</title></head><body><h1>Central African Republic Crop Tool</h1></body></html>', cf, 'fixture-country.html');
assert.ok(projected.includes('name="afrotools-country-id" content="CF"'));
assert.ok(projected.includes('name="afrotools-currency" content="XAF"'));

const carFile = path.join(ROOT, 'agriculture/crop-yield/central-african-republic.html');
const carHtml = fs.readFileSync(carFile, 'utf8');
assert.match(carHtml, /<h1><span class="flag"[^>]*>[^<]*<\/span> Central African Republic <em>Crop Yield Estimator<\/em><\/h1>/);
assert.match(carHtml, /<span aria-current="page">Central African Republic<\/span>/);
assert.match(carHtml, /name="afrotools-country-id" content="CF"/);
assert.match(carHtml, /name="afrotools-formula-jurisdiction" content="CF"/);
assert.match(carHtml, /name="afrotools-currency" content="XAF"/);
assert.match(carHtml, /cf-agri-data\.js/);
assert.doesNotMatch(carHtml.match(/<h1[^>]*>[\s\S]*?<\/h1>/i)[0], /Nigeria/);

const report = identityAudit.run({ write: false });
assert.ok(report.summary.scanned >= 1900, `expected complete generated-country scan, got ${report.summary.scanned}`);
assert.strictEqual(report.summary.mismatched, 0, report.mismatches.slice(0, 10).map((record) => `${record.file}: ${record.errors.map((error) => error.code).join(', ')}`).join('\n'));

console.log(`Country identity contract tests passed across ${report.summary.scanned} routes.`);
