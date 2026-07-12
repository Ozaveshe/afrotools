'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const audit = require('../scripts/audit-hausa-visible-copy');
const coverageApi = require('../scripts/report-hausa-coverage');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/localization/ha-bridge-manifest.json'), 'utf8'));
const glossary = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/localization/ha-product-glossary.json'), 'utf8'));
const localeManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/registry/locale-manifest.json'), 'utf8'));
const policy = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/registry/locale-coverage-policy.json'), 'utf8'));

assert.strictEqual(manifest.locale, 'ha');
assert.strictEqual(manifest.fallbackLocale, 'en');
assert.ok(manifest.bridges.length >= 13);
assert.strictEqual(new Set(manifest.bridges.map((bridge) => bridge.id)).size, manifest.bridges.length);
assert.strictEqual(new Set(manifest.bridges.map((bridge) => bridge.route)).size, manifest.bridges.length);

const bridgeRoutes = new Set(manifest.bridges.map((bridge) => bridge.route));
manifest.bridges.forEach((bridge) => {
  const relative = `${bridge.route.replace(/^\/+|\/+$/g, '')}/index.html`;
  const html = fs.readFileSync(path.join(ROOT, relative), 'utf8');
  assert.match(html, /<html\b[^>]*\blang="ha"[^>]*>/);
  assert.match(html, /<meta name="robots" content="noindex,\s*follow">/);
  assert.ok(html.includes(`<link rel="canonical" href="https://afrotools.com${bridge.route}">`));
  assert.ok(!/rel="alternate"|hreflang=/i.test(html), `${bridge.route} must not claim a translated equivalent`);
  assert.match(html, /Shafin da za a buɗe yana Turanci/);
  assert.match(html, /locale=ha/);
  assert.match(html, /return_to/);
  const override = policy.overrides.find((entry) => entry.route === bridge.route);
  assert.ok(override, `${bridge.route} missing locale coverage override`);
  assert.strictEqual(override.state, 'english-fallback');
  assert.ok(override.fallbackRoute);
});

assert.strictEqual(glossary.normalization, 'NFC');
['account', 'dashboard', 'vault', 'country', 'currency', 'privacy', 'terms', 'englishPage', 'languageBridge'].forEach((key) => assert.ok(glossary.terms[key], `glossary missing ${key}`));
assert.strictEqual(JSON.stringify(glossary).normalize('NFC'), JSON.stringify(glossary));

const haLocale = localeManifest.locales.find((locale) => locale.id === 'ha');
assert.ok(haLocale);
assert.strictEqual(haLocale.launchStatus, 'partial');
assert.strictEqual(haLocale.formatting.currency.defaultCurrency, null, 'Hausa language must not silently choose NGN');
['NG', 'NE', 'GH', 'CM', 'TD'].forEach((countryId) => {
  assert.ok(haLocale.countryRefs.includes(countryId));
  assert.ok(haLocale.formatting.marketFormats[countryId], `missing Hausa market format for ${countryId}`);
});

const navbar = fs.readFileSync(path.join(ROOT, 'assets/js/components/navbar.js'), 'utf8');
['/ha/shiga/', '/ha/allon-aiki/', '/ha/maajiyar-takardu/', '/ha/farashi/', '/ha/kasashe/'].forEach((route) => assert.ok(navbar.includes(route), `navbar missing ${route}`));
assert.ok(navbar.includes('Bincika ƙasashe'));
assert.ok(navbar.includes("_lang === 'ha' ? null"), 'Hausa auth must navigate through the bridge instead of opening an English modal silently');

const footer = fs.readFileSync(path.join(ROOT, 'assets/js/components/footer.js'), 'utf8');
['/ha/sirri/', '/ha/sharuddan-amfani/', '/ha/tuntube-mu/', '/ha/farashi/', '/ha/kasashe/'].forEach((route) => assert.ok(footer.includes(route), `footer missing ${route}`));

const selector = fs.readFileSync(path.join(ROOT, 'assets/js/components/country-selector.js'), 'utf8');
assert.match(selector, /["']ha["']\s*===\s*[A-Za-z_$][\w$]*\(\)\s*\?\s*null/, 'Hausa selector must not default to Nigeria without route, query, or saved country context');
assert.ok(selector.includes('displayNames'));
assert.ok(selector.includes('Yammacin Afirka'));

const sensitiveBases = manifest.bridges.flatMap((bridge) => [new URL(bridge.destination, 'https://afrotools.com').pathname, ...(bridge.destinationAliases || [])]);
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return entry.name === 'index.html' ? [absolute] : [];
  });
}
walk(path.join(ROOT, 'ha')).forEach((file) => {
  const relative = path.relative(ROOT, file).replace(/\\/g, '/');
  const route = `/${relative.replace(/index\.html$/, '')}`;
  if (bridgeRoutes.has(route)) return;
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/\bhref=(["'])(\/[^"']*)\1/gi)) {
    const pathname = new URL(match[2].replace(/&amp;/g, '&'), 'https://afrotools.com').pathname;
    assert.ok(!sensitiveBases.some((base) => pathname === base || pathname.startsWith(base.endsWith('/') ? base : `${base}/`)), `${relative} silently links to sensitive English destination ${match[2]}`);
  }
});

const visible = audit.buildReport();
assert.strictEqual(visible.counts.blockers, 0, 'Hausa visible-copy audit has blockers');
const coverage = coverageApi.buildReport();
assert.strictEqual(coverage.summary.total, 105);
assert.strictEqual(coverage.summary['english-fallback'], 32);
manifest.bridges.forEach((bridge) => {
  const record = coverage.records.find((entry) => entry.route === bridge.route);
  assert.ok(record, `coverage report missing ${bridge.route}`);
  assert.strictEqual(record.state, 'english-fallback');
  assert.strictEqual(record.indexable, false);
  assert.strictEqual(record.sitemapIncluded, false);
  assert.deepStrictEqual(record.advertisedHreflangs, []);
});

console.log(`Hausa product surface tests passed: ${manifest.bridges.length} explicit bridges, ${visible.counts.routesScanned} audited routes.`);
