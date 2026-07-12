const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const localeApi = require('../scripts/lib/localization-platform');
const routeApi = require('../scripts/lib/route-contract');

function codes(result) {
  return new Set(result.errors.map((issue) => issue.code));
}

const manifest = localeApi.loadLocaleManifest();
const manifestValidation = localeApi.validateLocaleManifest(manifest);
assert.strictEqual(manifestValidation.ok, true, manifestValidation.errors.map(localeApi.formatIssue).join('\n'));

assert.strictEqual(manifest.defaultLocale, 'en');
assert.strictEqual(manifest.normalization, 'NFC');
assert.deepStrictEqual(localeApi.getPublicLocaleIds(manifest), ['en', 'fr', 'sw', 'yo', 'ha']);
assert.strictEqual(localeApi.getLocale(manifest, 'ig').launchStatus, 'planned');
assert.strictEqual(localeApi.getLocale(manifest, 'ig').routePrefix, null);
assert.ok(!localeApi.getPublicLocaleIds(manifest).includes('ig'));

for (const locale of manifest.locales) {
  for (const field of [
    'id', 'displayName', 'nativeName', 'direction', 'routePrefix', 'launchStatus',
    'contentOwner', 'fallbackLocale', 'marketFocus', 'countryRefs', 'formatting',
    'minimumIndexableCoverage'
  ]) {
    assert.ok(Object.prototype.hasOwnProperty.call(locale, field), `${locale.id} missing ${field}`);
  }
  assert.strictEqual(locale.nativeName, locale.nativeName.normalize('NFC'), `${locale.id} native name must be NFC`);
}

let invalidManifest = localeApi.clone(manifest);
invalidManifest.locales.find((locale) => locale.id === 'fr').countryRefs.push('XX');
let invalid = localeApi.validateLocaleManifest(invalidManifest);
assert.ok(codes(invalid).has('LOCALE_COUNTRY_UNKNOWN'));

invalidManifest = localeApi.clone(manifest);
invalidManifest.locales.find((locale) => locale.id === 'ig').launchStatus = 'launched';
invalid = localeApi.validateLocaleManifest(invalidManifest);
assert.ok(codes(invalid).has('LOCALE_LAUNCH_ROUTE_MISSING'));
assert.ok(codes(invalid).has('LOCALE_LAUNCH_CATALOG_MISSING'));

invalidManifest = localeApi.clone(manifest);
invalidManifest.locales.push({ ...localeApi.clone(invalidManifest.locales[0]), id: 'NG', routePrefix: '/ng' });
invalid = localeApi.validateLocaleManifest(invalidManifest);
assert.ok(codes(invalid).has('LOCALE_CODE_INVALID'));
assert.ok(codes(invalid).has('COUNTRY_CODE_USED_AS_LOCALE'));

const catalogs = localeApi.loadCatalogs(manifest);
const catalogValidation = localeApi.validateCatalogs(manifest, { catalogs });
assert.strictEqual(catalogValidation.ok, true, catalogValidation.errors.map(localeApi.formatIssue).join('\n'));

const requiredDomains = [
  'navigation', 'forms', 'validation', 'states', 'account', 'consent', 'export',
  'sharing', 'pricing', 'ai', 'accessibility', 'footer', 'legal'
];
for (const locale of localeApi.getPublicLocaleIds(manifest)) {
  for (const domain of requiredDomains) {
    assert.ok(catalogs[locale][domain] && typeof catalogs[locale][domain] === 'object', `${locale} missing ${domain}`);
  }
}

const fixtureManifest = localeApi.clone(manifest);
const fixtureCatalogs = localeApi.clone(catalogs);
delete fixtureCatalogs.fr.validation.required;
invalid = localeApi.validateCatalogs(fixtureManifest, { catalogs: fixtureCatalogs });
assert.ok(codes(invalid).has('CATALOG_KEY_MISSING'));

const orphanCatalogs = localeApi.clone(catalogs);
orphanCatalogs.sw.validation.notInEnglish = 'Haipo';
invalid = localeApi.validateCatalogs(fixtureManifest, { catalogs: orphanCatalogs });
assert.ok(codes(invalid).has('CATALOG_KEY_ORPHAN'));

const variableCatalogs = localeApi.clone(catalogs);
variableCatalogs.yo.validation.minLength = 'Lo kere ju {amount}';
invalid = localeApi.validateCatalogs(fixtureManifest, { catalogs: variableCatalogs });
assert.ok(codes(invalid).has('CATALOG_VARIABLE_MISMATCH'));

const unsafeCatalogs = localeApi.clone(catalogs);
unsafeCatalogs.ha.states.error = '<img src=x onerror=alert(1)>';
invalid = localeApi.validateCatalogs(fixtureManifest, { catalogs: unsafeCatalogs });
assert.ok(codes(invalid).has('CATALOG_HTML_UNSAFE'));

const unicodeCatalogs = localeApi.clone(catalogs);
unicodeCatalogs.fr.navigation.language = 'Franc\u0327ais';
invalid = localeApi.validateCatalogs(fixtureManifest, { catalogs: unicodeCatalogs });
assert.ok(codes(invalid).has('UNICODE_NOT_NFC'));

const mojibakeCatalogs = localeApi.clone(catalogs);
mojibakeCatalogs.fr.navigation.language = 'FranÃ§ais';
invalid = localeApi.validateCatalogs(fixtureManifest, { catalogs: mojibakeCatalogs });
assert.ok(codes(invalid).has('UNICODE_MOJIBAKE'));

const duplicateRaw = '{"validation":{"required":"A","required":"B"}}';
invalid = localeApi.validateCatalogs(fixtureManifest, {
  catalogs,
  rawCatalogs: { ...localeApi.loadRawCatalogs(manifest), fr: duplicateRaw }
});
assert.ok(codes(invalid).has('CATALOG_KEY_DUPLICATE'));

const coveragePolicy = localeApi.loadCoveragePolicy();
const native = localeApi.classifyPage({ route: '/fr/blog/exemple/', locale: 'fr', pageType: 'article', indexability: 'indexable' }, coveragePolicy, manifest);
assert.strictEqual(native.state, 'native');
assert.strictEqual(native.indexableEligible, true);

const shell = localeApi.classifyPage({ route: '/sw/zana/kikokotoo-mfano/', locale: 'sw', pageType: 'tool', indexability: 'indexable' }, coveragePolicy, manifest);
assert.strictEqual(shell.state, 'localized-shell');
assert.strictEqual(shell.engineLocaleNeutral, true);

const haFallback = localeApi.classifyPage({ route: '/ha/jamb/cbt/', locale: 'ha', pageType: 'tool', indexability: 'indexable' }, coveragePolicy, manifest);
assert.strictEqual(haFallback.state, 'english-fallback');
assert.strictEqual(haFallback.indexableEligible, false);
assert.ok(haFallback.fallbackRoute);

const unavailable = localeApi.classifyPage({ route: '/ig/tools/example/', locale: 'ig', pageType: 'tool', indexability: 'indexable' }, coveragePolicy, manifest);
assert.strictEqual(unavailable.state, 'unavailable');
assert.strictEqual(unavailable.indexableEligible, false);

const fixtureCoverage = localeApi.validatePageCoverage({
  schemaVersion: '1.0.0',
  records: [
    native,
    { ...shell, fallbackKeys: ['validation.required'], nativeKeyRatio: 0.99, indexableEligible: true }
  ]
}, manifest);
assert.ok(codes(fixtureCoverage).has('INDEXABLE_PAGE_USES_FALLBACK_KEY'));

const routeGraph = routeApi.buildRouteGraph();
const coverage = localeApi.buildPageCoverage(routeGraph, { manifest, policy: coveragePolicy, catalogs });
const coverageValidation = localeApi.validatePageCoverage(coverage, manifest);
assert.strictEqual(coverageValidation.ok, true, coverageValidation.errors.slice(0, 50).map(localeApi.formatIssue).join('\n'));

const pages = routeGraph.routes.filter((record) => record.state === 'page');
assert.strictEqual(coverage.records.length, pages.length, 'every page route must have one explicit coverage record');
assert.strictEqual(new Set(coverage.records.map((record) => record.route)).size, coverage.records.length, 'coverage routes must be unique');

const fallbackRoutes = new Set(coverage.records.filter((record) => record.state === 'english-fallback').map((record) => record.route));
assert.ok(fallbackRoutes.has('/ha/jamb/cbt/'));
const yorubaAudit = require('../scripts/audit-yoruba-visible-copy').buildReport();
for (const row of yorubaAudit.routeSummaries.filter((entry) => entry.blockerCount > 0)) {
  const record = coverage.records.find((entry) => entry.route === row.route);
  assert.ok(record, `visible-copy blocker route ${row.route} must have coverage`);
  assert.strictEqual(record.state, 'unavailable', `${row.route} must be quarantined until visible English is repaired`);
  assert.strictEqual(record.indexableEligible, false);
}

const integratedGraph = routeApi.buildRouteGraph();
for (const record of integratedGraph.routes.filter((item) => item.state === 'page')) {
  assert.ok(record.localeCoverage && record.localeCoverage.state, `${record.route} missing localeCoverage`);
  if (['english-fallback', 'unavailable', 'deprecated'].includes(record.localeCoverage.state)) {
    assert.strictEqual(record.equivalenceGroup, null, `${record.route} must not be a hreflang equivalent`);
    assert.strictEqual(record.sitemap.included, false, `${record.route} must not be in a sitemap`);
  }
}

const report = localeApi.buildLocalizationReport(coverage, manifest, catalogs);
for (const key of ['rawPages', 'native', 'localizedShell', 'englishFallback', 'unavailable', 'deprecated', 'indexableEligible', 'sitemapEligible']) {
  assert.ok(Number.isInteger(report.summary[key]), `report missing ${key}`);
}
assert.ok(report.byPageType.tool && report.byPageType.tool.rawPages > 0, 'report must explain coverage by page type');

const manifestAsset = fs.readFileSync(path.join(ROOT, 'assets/js/data/locale-manifest.js'), 'utf8');
assert.ok(manifestAsset.includes('AfroToolsLocaleManifest'));
assert.ok(!manifestAsset.includes('"launchStatus":"planned"') || !manifestAsset.includes('"routePrefix":"/ig"'));

const reportJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/localization-coverage.json'), 'utf8'));
assert.deepStrictEqual(reportJson.summary, report.summary);

console.log('Localization platform contract tests passed');
