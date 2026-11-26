'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('../netlify/functions/afrostream-feed');

test('news outages keep the available static sections crawlable', async () => {
  const keyNames = ['SUPABASE_DATA_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
  const previousKeys = keyNames.map(name => process.env[name]);
  const previousFetch = global.fetch;
  const request = (path, httpMethod = 'GET') => handler({ path, httpMethod });
  const sitemap = '/tools/afrostream/sitemap.xml';
  try {
    keyNames.forEach(name => delete process.env[name]);
    const offline = await request(sitemap);
    assert.equal(offline.statusCode, 200);
    assert.equal(offline.headers['X-AfroStream-Sitemap-Coverage'], 'static-sections');
    assert.match(offline.headers['Content-Type'], /application\/xml/);
    assert.deepEqual([...offline.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]),
      ['directory', 'editorial', 'methodology', 'university'].map(section => 'https://afrotools.com/tools/afrostream/' + section + '/'));
    assert.doesNotMatch(offline.body, /<lastmod>|\/news\//);
    process.env.SUPABASE_DATA_SERVICE_ROLE_KEY = 'test';
    for (const failure of [
      async () => { throw new Error('unreachable'); },
      async () => new Response('', { status: 503 }),
      async () => new Response('{}')
    ]) {
      global.fetch = failure;
      assert.deepEqual(await request(sitemap), offline);
      const head = await request('/.netlify/functions/afrostream-feed/sitemap', 'HEAD');
      assert.deepEqual(head, { ...offline, body: '' });
      assert.equal((await request('/tools/afrostream/feed.xml')).statusCode, 503);
    }
    const story = { slug: 'reviewed-report', title: 'Original report', author: 'AfroStream editorial', external_id: 'editorial:report',
      source_url: 'https://example.org/report', published_at: '2026-01-01', body: 'reporting '.repeat(125) };
    global.fetch = async () => new Response(JSON.stringify([story, { ...story, slug: 'short-brief', body: 'Short.' }]));
    const recovered = await request(sitemap);
    assert.equal(recovered.statusCode, 200);
    assert.match(recovered.body, /news\/reviewed-report/);
    assert.doesNotMatch(recovered.body, /short-brief/);
    assert.equal(recovered.headers['X-AfroStream-Sitemap-Coverage'], undefined);
  } finally {
    global.fetch = previousFetch;
    keyNames.forEach((name, i) => {
      if (previousKeys[i] === undefined) delete process.env[name];
      else process.env[name] = previousKeys[i];
    });
  }
});
