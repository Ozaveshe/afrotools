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
    ['/pro/', '2026-09-12']
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
  for (const route of ['/pro/apps/', '/pro/settings/', '/business/', '/matchday-os/']) {
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
