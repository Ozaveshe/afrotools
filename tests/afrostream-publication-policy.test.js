'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const policy = require('../tools/afrostream/editorial-policy');
const adminPath = require.resolve('../netlify/functions/afrostream-admin');
const prose = count => Array.from({ length: count }, (_, i) => 'word' + i).join(' ');

test('only visible prose meets the minimum, not URLs, headings or image metadata', () => {
  const body = prose(599) + '\n## A long heading that is not body prose\n![' + prose(80) + '](https://example.com/image)\nhttps://example.com/' + prose(40).replaceAll(' ', '/') + '\n<script>' + prose(30) + '</script>';
  assert.equal(policy.wordCount(body), 599);
  assert.match(policy.publicationError({ author: 'AfroStream Editorial', body }), /599 now/);
  assert.equal(policy.wordCount('[one visible link](https://example.com/a/very/long/url) <b>two</b>'), 4);
  assert.equal(policy.publicationError({ author: 'AfroStream Editorial', body: prose(600) }), null);
  assert.equal(policy.publicationError({ author: 'A publisher', body: 'A short lead', is_published: false }), null);
  assert.match(policy.publicationError({ author: 'A publisher', body: prose(600) }), /original AfroStream/);
});

test('admin publication, draft, partial edits and submission approval use the policy before writing', async () => {
  const oldFetch = global.fetch;
  const oldSecret = process.env.ADMIN_SECRET;
  const oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.ADMIN_SECRET = 'synthetic-admin';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'synthetic-key';
  delete require.cache[adminPath];
  const admin = require(adminPath);
  let writes = [];
  let existing = { id: 7, author: 'AfroStream Editorial', body: 'Legacy short report', is_published: true };
  global.fetch = async (url, options = {}) => {
    const method = options.method || 'GET';
    const path = new URL(url).pathname;
    if (method !== 'GET') writes.push({ method, path, body: JSON.parse(options.body) });
    let data = [];
    if (method === 'GET' && path.endsWith('/as_news')) data = [existing];
    if (method === 'GET' && path.endsWith('/as_submissions')) data = [{ id: 8, status: 'pending', type: 'news_tip', user_id: 'synthetic-user', payload: { title: 'Synthetic tip', excerpt: 'Short summary', body: prose(599) } }];
    if (method !== 'GET' && path.endsWith('/as_news')) data = [{ ...existing, ...JSON.parse(options.body) }];
    return { ok: true, status: 200, text: async () => JSON.stringify(data) };
  };
  const invoke = (method, path, body, auth = true) => admin.handler({ httpMethod: method, path: '/api/admin/afrostream/' + path, headers: auth ? { authorization: 'Bearer synthetic-admin' } : {}, body: JSON.stringify(body) });
  const payload = { title: 'Synthetic report', excerpt: 'Summary', author: 'AfroStream Editorial', body: prose(599), is_published: true };
  try {
    assert.equal((await invoke('POST', 'news', payload, false)).statusCode, 401);
    assert.equal((await invoke('POST', 'news', payload)).statusCode, 400);
    assert.equal(writes.length, 0);
    assert.equal((await invoke('POST', 'news', { ...payload, is_published: false })).statusCode, 201);
    assert.equal(writes[0].body.is_published, false);
    writes = [];
    assert.equal((await invoke('POST', 'news', { ...payload, body: prose(600) })).statusCode, 201);
    assert.equal(writes[0].body.is_published, true);
    writes = [];
    assert.equal((await invoke('PUT', 'news/7', { is_featured: true })).statusCode, 200);
    assert.equal(writes[0].body.is_featured, true);
    writes = [];
    assert.equal((await invoke('PUT', 'news/7', { body: prose(599) })).statusCode, 400);
    assert.equal(writes.length, 0);
    existing.is_published = false;
    assert.equal((await invoke('PUT', 'news/7', { is_published: true })).statusCode, 400);
    assert.equal((await invoke('PUT', 'news/7', { is_published: true, body: prose(600) })).statusCode, 200);
    assert.equal(writes[0].method, 'PATCH');
    writes = [];
    assert.equal((await invoke('PUT', 'submissions/8/approve', {})).statusCode, 400);
    assert.equal(writes.length, 0, 'Rejected tip must not publish, mark approved or award points');
  } finally {
    global.fetch = oldFetch;
    if (oldSecret === undefined) delete process.env.ADMIN_SECRET; else process.env.ADMIN_SECRET = oldSecret;
    if (oldKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = oldKey;
    delete require.cache[adminPath];
  }
});
