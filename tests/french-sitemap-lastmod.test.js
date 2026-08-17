const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://afrotools.com';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function sitemapLastmods() {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap-fr.xml'), 'utf8');
  return new Map(
    [...xml.matchAll(/<url>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>[\s\S]*?<\/url>/g)]
      .map((match) => [match[1], match[2]])
  );
}

test('reviewed French search repairs receive selective sitemap freshness', () => {
  const registry = readJson('data/registry/sitemap-lastmod-overrides.json');
  const lastmods = sitemapLastmods();
  assert.equal(registry.schemaVersion, 1);
  assert.ok(registry.overrides.length >= 12);

  for (const override of registry.overrides) {
    assert.match(override.lastmod, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(override.reason && override.reason.length > 20);

    if (override.route) {
      const url = `${BASE_URL}${override.route}`;
      assert.ok(lastmods.has(url), `${url} must remain in the French sitemap`);
      assert.equal(lastmods.get(url), override.lastmod, `${url} must expose the authoritative reviewed lastmod`);
      continue;
    }

    const matched = [...lastmods].filter(([url]) => url.startsWith(`${BASE_URL}${override.routePrefix}`));
    assert.equal(matched.length, 55, `${override.routePrefix} must cover its hub and 54 country pages`);
    for (const [url, lastmod] of matched) {
      assert.equal(lastmod, override.lastmod, `${url} must expose the authoritative family rebuild date`);
    }
  }
});

test('the registry does not authorize a broad French or site-wide restamp', () => {
  const registry = readJson('data/registry/sitemap-lastmod-overrides.json');
  const broadSelectors = new Set(['/', '/fr/', '/fr/tools/', '/fr/blog/']);
  for (const override of registry.overrides) {
    const selector = override.route || override.routePrefix;
    assert.ok(!broadSelectors.has(selector), `${selector} is too broad for selective freshness`);
  }
});
