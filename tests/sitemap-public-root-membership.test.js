const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://afrotools.com';

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function sitemapLastmods(relativePath) {
  return new Map(
    [...read(relativePath).matchAll(/<url>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>[\s\S]*?<\/url>/g)]
      .map((match) => [match[1], match[2]])
  );
}

function latestJambReviewDate() {
  const poolDir = path.join(ROOT, 'data', 'jamb', 'pools');
  const dates = [];
  for (const name of fs.readdirSync(poolDir)) {
    if (name === 'index.json' || !name.endsWith('.json')) continue;
    const pool = readJson(path.join('data', 'jamb', 'pools', name));
    for (const question of pool.questions || []) {
      const date = (question.verification && question.verification.reviewed_at)
        || (question.review && question.review.reviewed_at);
      if (date) dates.push(date);
    }
  }
  return dates.sort().slice(-1)[0];
}

test('indexable public commercial roots remain in the primary sitemap', () => {
  const expected = new Map([
    ['/afrowork/', '2026-09-10'],
    ['/afrowork/api/', '2026-09-10'],
    ['/afrowork/whatsapp/', '2026-09-10'],
    ['/developers/', '2026-09-12'],
    ['/pro/', '2026-09-12'],
    ['/business/', '2026-10-04']
  ]);
  const graph = readJson('data/registry/route-graph.json');
  const records = new Map(graph.routes.filter((record) => record.state === 'page').map((record) => [record.route, record]));
  const lastmods = sitemapLastmods('sitemap-misc.xml');

  for (const [route, expectedLastmod] of expected) {
    const record = records.get(route);
    assert.ok(record, `${route} must remain in the route graph`);
    assert.equal(record.indexability, 'indexable', `${route} must remain indexable`);
    assert.equal(record.sitemap.included, true, `${route} must remain sitemap eligible`);
    assert.equal(record.sitemap.sitemapId, 'sitemap-misc.xml');
    assert.equal(lastmods.get(`${BASE_URL}${route}`), expectedLastmod, `${route} must keep its reviewed source date`);
  }
});

test('utility and retired neighbors stay outside the primary sitemap', () => {
  const urls = new Set(sitemapLastmods('sitemap-misc.xml').keys());
  for (const route of ['/pro/apps/', '/pro/settings/', '/matchday-os/']) {
    assert.ok(!urls.has(`${BASE_URL}${route}`), `${route} must not enter sitemap-misc.xml`);
  }
});

test('the JAMB child sitemap exposes reviewed-data freshness in the root index', () => {
  const indexLastmods = new Map(
    [...read('sitemap-index.xml').matchAll(/<sitemap>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>[\s\S]*?<\/sitemap>/g)]
      .map((match) => [match[1], match[2]])
  );
  assert.equal(indexLastmods.get(`${BASE_URL}/jamb/sitemap.xml`), latestJambReviewDate());
});

test('Yoruba sitemap membership matches the catalog and current page indexability', () => {
  const { routes } = readJson('data/registry/yoruba-route-manifest.json');
  const urls = sitemapLastmods('sitemap-yo.xml');
  for (const record of routes) {
    const html = read(record.sourceOwner);
    const robots = html.match(/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i)?.[0] || '';
    const canonical = html.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i)?.[0] || '';
    const href = canonical.match(/\bhref=["']([^"']+)["']/i)?.[1];
    const url = BASE_URL + record.route;
    const native = ['native', 'localized-shell'].includes(record.state);
    const indexable = native && href === url && !/\bnoindex\b/i.test(robots);
    assert.equal(urls.has(url), indexable, record.route);
  }
});

test('Yoruba invoice and receipt publish reciprocal five-language document clusters', () => {
  const graph = readJson('data/registry/route-graph.json');
  const sitemap = new Map([...read('sitemap-i18n.xml').matchAll(/<url>([\s\S]*?)<\/url>/g)]
    .map(([, block]) => [block.match(/<loc>([^<]+)<\/loc>/)[1], block]));
  const yoruba = sitemapLastmods('sitemap-yo.xml');
  for (const slug of ['kiriiro-invoice', 'kiriiro-risiti']) {
    const route = '/yo/awon-ise/' + slug + '/';
    const html = read(route.slice(1) + 'index.html');
    const declared = Object.fromEntries([...html.matchAll(/hreflang="([^"]+)" href="https:\/\/afrotools\.com([^"]+)"/g)]
      .map(([, language, target]) => [language, target]));
    assert.deepEqual(Object.keys(declared).sort(), ['en', 'fr', 'ha', 'sw', 'x-default', 'yo']);
    assert.equal(declared['x-default'], declared.en);
    assert.ok(yoruba.has(BASE_URL + route), route);
    for (const target of new Set(Object.values(declared))) {
      const record = graph.routes.find(record => record.state === 'page' && record.route === target);
      assert.equal(record.indexability, 'indexable', target);
      assert.equal(record.sitemap.included, true, target);
      assert.deepEqual(record.hreflangs, declared, target);
      const block = sitemap.get(BASE_URL + target);
      assert.ok(block, target);
      for (const [language, destination] of Object.entries(declared)) {
        assert.ok(block.includes('hreflang="' + language + '" href="' + BASE_URL + destination + '"'), target);
      }
    }
  }
});
