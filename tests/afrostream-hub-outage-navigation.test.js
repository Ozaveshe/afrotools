'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('../netlify/functions/afrostream-article');

test('collection outages leave usable navigation and recover when published rows return', async () => {
  const previousFetch = global.fetch;
  const keys = ['SUPABASE_DATA_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
  const saved = keys.map(key => process.env[key]);
  const request = (path, httpMethod = 'GET') => handler({ path, httpMethod });
  const hub = '/tools/afrostream/', news = hub + 'news';
  try {
    keys.forEach(key => delete process.env[key]);
    const offline = [await request(hub), await request(news)];
    assert.equal(offline[0].statusCode, 200);
    assert.equal(offline[1].statusCode, 503);
    assert.equal(offline[1].headers['Retry-After'], '60');
    for (const result of offline) {
      assert.equal(result.headers['Cache-Control'], 'no-store');
      assert.equal(result.headers['Netlify-CDN-Cache-Control'], 'no-store');
      assert.match(result.body, /News stories are temporarily unavailable/);
      assert.doesNotMatch(result.body, /noindex|article\.js|as-news-bootstrap|Story not found/);
      for (const section of ['directory', 'university', 'editorial', 'methodology']) {
        assert.ok(result.body.includes('href="' + hub + section + '/"'));
      }
    }
    process.env.SUPABASE_DATA_SERVICE_ROLE_KEY = 'test';
    for (const failure of [async () => { throw Error('offline'); }, async () => new Response('', { status: 503 }), async () => new Response('{}')]) {
      global.fetch = failure;
      assert.deepEqual(await request(hub), offline[0]);
      assert.deepEqual(await request(news), offline[1]);
      for (const [i, path] of [hub, news].entries()) {
        assert.deepEqual(await request(path, 'HEAD'), { ...offline[i], body: '' });
      }
      const story = await request(news + '/one-story/');
      assert.equal(story.statusCode, 503);
      assert.doesNotMatch(story.body, /src="[^"]*article\.js/);
    }
    global.fetch = async () => new Response('[]');
    for (const path of [hub, news]) {
      const result = await request(path);
      assert.equal(result.statusCode, 200);
      assert.match(result.body, /The scene is taking shape/);
      assert.doesNotMatch(result.body, /News stories are temporarily unavailable/);
    }
    assert.equal((await request(news + '/one-story/')).statusCode, 404);
    const story = { id: 1, slug: 'example-report', title: 'Published creator report', published_at: '2026-01-01', body: 'Reporting.', author: 'AfroStream Team' };
    global.fetch = async () => new Response(JSON.stringify([story]));
    for (const path of [hub, news]) {
      const result = await request(path);
      assert.equal(result.statusCode, 200);
      assert.match(result.body, /Published creator report/);
      assert.doesNotMatch(result.body, /News stories are temporarily unavailable/);
    }
  } finally {
    global.fetch = previousFetch;
    keys.forEach((key, i) => { if (saved[i] === undefined) delete process.env[key]; else process.env[key] = saved[i]; });
  }
});
