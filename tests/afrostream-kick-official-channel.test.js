'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { createRequire } = require('node:module');

const OWNER = process.env.AFROSTREAM_LIVECHECK_SOURCE_PATH || path.join(__dirname, '../netlify/functions/afrostream-livecheck.js');
const slug = 'sample-creator';
const creator = { id: 'synthetic-creator-id', name: 'Synthetic Creator', country: 'GH', kick_url: 'https://kick.com/' + slug };
function official(overrides = {}) {
  return {
    slug, broadcaster_user_id: 101,
    stream_title: 'Synthetic live broadcast',
    category: { id: 202, name: 'Just Chatting' },
    banner_picture: 'https://media.example/banner.webp',
    stream: { is_live: true, viewer_count: 27, thumbnail: 'https://media.example/live.webp' },
    ...overrides,
  };
}
function harness(data, options = {}) {
  const requests = [], writes = [], logs = [];
  const context = {
    exports: {}, process: { env: { SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-key', KICK_CLIENT_ID: 'synthetic-client-id', KICK_CLIENT_SECRET: 'synthetic-client-secret' } },
    require: createRequire(OWNER), URL, console: { log: (...args) => logs.push(args.join(' ')), error: (...args) => logs.push(args.join(' ')) },
    fetch: async (url, init = {}) => {
      const u = new URL(url), method = init.method || 'GET';
      requests.push({ url: String(url), method });
      if (u.origin === 'https://id.kick.com' && u.pathname === '/oauth/token') return Response.json({ access_token: 'synthetic-token' });
      if (u.origin === 'https://api.kick.com' && u.pathname === '/public/v1/channels') {
        assert.equal(u.searchParams.get('slug'), slug);
        assert.equal(init.headers.Authorization, 'Bearer synthetic-token');
        if (options.channelThrows) throw new Error('synthetic provider unavailable');
        return Response.json({ data }, { status: options.channelStatus || 200 });
      }
      if (u.origin === 'https://api.kick.com' && u.pathname === '/public/v1/video/livestreams') return Response.json({ message: 'synthetic unavailable' }, { status: 503 });
      if (u.origin === 'https://kick.com' && u.pathname === '/api/v2/channels/' + slug) {
        if (options.legacyThrows) throw new Error('synthetic legacy transport failure');
        if (options.legacyInvalidJSON) return new Response('invalid-json', { status: 200 });
        if (Object.hasOwn(options, 'legacyBody')) return Response.json(options.legacyBody, { status: options.legacyStatus || 200 });
        if (options.legacyStatus) return Response.json({}, { status: options.legacyStatus });
        return options.legacyLive
          ? Response.json({ livestream: { is_live: true, session_title: 'Legacy synthetic live', viewer_count: 8 } })
          : Response.json({ message: 'synthetic unavailable' }, { status: 503 });
      }
      if (u.origin === 'https://kick.com' && u.pathname === '/' + slug) {
        if (Object.hasOwn(options, 'htmlBody')) return new Response(options.htmlBody, { status: 200 });
        return new Response('synthetic unavailable', { status: 503 });
      }
      if (u.origin === 'https://zpclagtgczsygrgztlts.supabase.co' && u.pathname === '/rest/v1/as_streams') {
        if (method === 'GET') return Response.json([]);
        if (method === 'POST' || method === 'PATCH') {
          writes.push({ method, query: u.search, body: JSON.parse(init.body) });
          return Response.json([{ id: 'synthetic-stream-id' }]);
        }
      }
      throw new Error('Unexpected closed-test request: ' + method + ' ' + u.origin + u.pathname);
    },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(OWNER, 'utf8'), context, { filename: OWNER });
  return { context, requests, writes, logs };
}
async function collect(data, options) {
  const h = harness(data, options);
  h.result = await h.context.checkKick([creator]);
  return h;
}
function assertUnavailable(h) {
  assert.equal(h.result.live, 0);
  assert.equal(h.writes.length, 0, 'unknown state must never clear or create a stored stream');
  assert.ok(h.result.errors.some(x => x.includes('no data from any API')));
}

test('official stream.is_live true creates a live observation with official metadata', async () => {
  const h = await collect([official()]);
  assert.equal(h.result.live, 1);
  assert.equal(h.result.errors.length, 0);
  assert.equal(h.writes.length, 1);
  const write = h.writes[0];
  assert.equal(write.method, 'POST');
  assert.equal(write.body.is_live, true);
  assert.equal(write.body.title, 'Synthetic live broadcast');
  assert.equal(write.body.viewer_count, 27);
  assert.equal(write.body.category, 'Just Chatting');
  assert.equal(write.body.thumbnail, 'https://media.example/live.webp');
  assert.equal(write.body.creator_id, creator.id);
  assert.equal(write.body.url, creator.kick_url);
  assert.ok(!h.requests.some(x => x.url.includes('/public/v1/video/livestreams') || x.url.includes('/api/v2/')));
});
test('official stream.is_live false is an explicit checked offline state', async () => {
  const h = await collect([official({ stream: { is_live: false, viewer_count: 0 } })]);
  assert.equal(h.result.live, 0);
  assert.equal(h.result.errors.length, 0);
  assert.equal(h.writes.length, 1);
  assert.equal(h.writes[0].method, 'PATCH');
  assert.equal(h.writes[0].body.is_live, false);
  assert.ok(h.writes[0].query.includes('platform=eq.Kick'));
  assert.ok(h.writes[0].query.includes('creator_name=eq.Synthetic%20Creator'));
});
for (const [name, row] of [
  ['missing stream', official({ stream: undefined })],
  ['null stream', official({ stream: null })],
  ['missing is_live', official({ stream: { viewer_count: 9 } })],
  ['string false', official({ stream: { is_live: 'false' } })],
  ['numeric zero', official({ stream: { is_live: 0 } })],
  ['wrong requested identity', official({ slug: 'another-creator' })],
  ['missing channel identity', official({ slug: undefined })],
]) test(name + ' remains unavailable and cannot clear current state', async () => assertUnavailable(await collect([row])));
test('empty official data is unavailable, not evidence of offline', async () => assertUnavailable(await collect([])));
test('non-array official data remains unavailable', async () => assertUnavailable(await collect({ channel: official() })));
test('a matching channel is selected instead of an unrelated first row', async () => {
  const h = await collect([official({ slug: 'unrelated', stream: { is_live: false } }), official()]);
  assert.equal(h.result.live, 1);assert.equal(h.writes[0].body.is_live, true);
});
test('a missing channel falls back to the existing verified legacy provider shape', async () => {
  const h = await collect([official({ stream: undefined })], { legacyLive: true });
  assert.equal(h.result.live, 1);assert.equal(h.writes.length, 1);
  assert.equal(h.writes[0].body.title, 'Legacy synthetic live');
  assert.equal(h.writes[0].body.viewer_count, 8);
});
test('official transport failure stays an honest partial failure', async () => assertUnavailable(await collect([], { channelThrows: true })));
test('official non-success HTTP remains unavailable', async () => assertUnavailable(await collect([], { channelStatus: 503 })));
test('optional malformed metrics do not become invented values or block checked live state', async () => {
  const h = await collect([official({ stream_title: ' ', category: null, stream: { is_live: true, viewer_count: -4, thumbnail: { bad: true } }, banner_picture: null })]);
  assert.equal(h.result.live, 1);assert.equal(h.writes[0].body.viewer_count, 0);
  assert.equal(h.writes[0].body.title, 'Live on Kick');assert.equal(h.writes[0].body.category, '');
  assert.equal('thumbnail' in h.writes[0].body, false);
});
test('case-equivalent requested slug matches the documented identity', async () => {
  const h = await collect([official({ slug: slug.toUpperCase() })]);assert.equal(h.result.live, 1);
});

// Legacy provider unknown-state safety. No real provider/DB call is permitted.
function assertLegacyUnknown(h) {
  assertUnavailable(h);
  assert.equal(h.requests.filter(request => new URL(request.url).origin === 'https://zpclagtgczsygrgztlts.supabase.co').length, 0, 'unknown provider state must not even query the database');
}
for (const [name, body] of [
  ['empty object', {}], ['null payload', null], ['array payload', []], ['string payload', 'unavailable'], ['numeric payload', 0], ['boolean payload', true],
  ['null livestream', { livestream: null }], ['array livestream', { livestream: [] }], ['string livestream', { livestream: 'unavailable' }], ['boolean livestream', { livestream: false }],
  ['missing nested live state', { livestream: {} }], ['string false state', { livestream: { is_live: 'false' } }], ['string true state', { livestream: { is_live: 'true' } }],
  ['numeric zero state', { livestream: { is_live: 0 } }], ['numeric one state', { livestream: { is_live: 1 } }], ['null state', { livestream: { is_live: null } }],
  ['array state', { livestream: { is_live: [] } }], ['object state', { livestream: { is_live: {} } }], ['unsupported top-level live state', { is_live: true }]
]) test('legacy ' + name + ' is unknown and cannot touch stored stream state', async () => assertLegacyUnknown(await collect([], { legacyBody: body })));
test('legacy explicit boolean false remains a checked offline observation', async () => {
  const h = await collect([], { legacyBody: { livestream: { is_live: false } } });
  assert.equal(h.result.live, 0); assert.equal(h.result.errors.length, 0);
  assert.equal(h.writes.length, 1); assert.equal(h.writes[0].method, 'PATCH'); assert.equal(h.writes[0].body.is_live, false);
  assert.ok(h.writes[0].query.includes('platform=eq.Kick')); assert.ok(h.writes[0].query.includes('creator_name=eq.Synthetic%20Creator'));
  assert.ok(!h.requests.some(request => new URL(request.url).pathname === '/' + slug));
});
test('legacy explicit boolean true preserves current title/category/thumbnail/metrics mapping', async () => {
  const h = await collect([], { legacyBody: { following_count: 4, user: { profile_pic: 'https://media.example/profile.webp' }, livestream: { is_live: true, session_title: 'Verified legacy shape', viewer_count: 7, categories: [{ name: 'Music' }], thumbnail: 'https://media.example/legacy.webp' } } });
  assert.equal(h.result.live, 1); assert.equal(h.result.errors.length, 0); assert.equal(h.writes.length, 1);
  assert.equal(h.writes[0].body.is_live, true); assert.equal(h.writes[0].body.title, 'Verified legacy shape'); assert.equal(h.writes[0].body.viewer_count, 7);
  assert.equal(h.writes[0].body.category, 'Music'); assert.equal(h.writes[0].body.thumbnail, 'https://media.example/legacy.webp');
  assert.ok(!h.requests.some(request => new URL(request.url).pathname === '/' + slug));
});
for (const [name, options] of [['transport error', { legacyThrows: true }], ['non-success HTTP', { legacyStatus: 503 }], ['malformed JSON', { legacyInvalidJSON: true }]]) {
  test('legacy ' + name + ' preserves unavailable state through fallback failure', async () => assertLegacyUnknown(await collect([], options)));
}

test('legacy unknown continues to the existing positive HTML fallback pattern', async () => {
  const h = await collect([], { legacyBody: {}, htmlBody: '"is_live":true,"session_title":"Existing fallback fixture","viewer_count":0' });
  assert.equal(h.result.live, 1); assert.equal(h.writes.length, 1); assert.equal(h.writes[0].body.is_live, true);
  assert.equal(h.writes[0].body.title, 'Existing fallback fixture');
});
test('legacy unknown plus HTML not-live pattern remains unknown without database requests', async () => {
  assertLegacyUnknown(await collect([], { legacyBody: {}, htmlBody: '"is_live":false' }));
});
