const assert = require('assert');
const fs = require('fs');
const path = require('path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const livecheck = fs.readFileSync(path.join(root, 'netlify/functions/afrostream-livecheck.js'), 'utf8');
const sync = fs.readFileSync(path.join(root, 'netlify/functions/afrostream-sync.js'), 'utf8');
const {
  cacheBypassUrl,
  loadCreators,
  scoreLink,
} = require('../scripts/audit-afrostream-creator-links.js');

test('live stream upserts retain creator relationships', () => {
  const linkedLivecheckUpserts = livecheck.match(
    /await upsertStream\(creator\.name, \{\s*creator_id: creator\.id,\s*creator_name: creator\.name,/g
  ) || [];

  assert.strictEqual(linkedLivecheckUpserts.length, 3);
  assert.match(
    sync,
    /var streamData = \{\s*creator_id: creator\.id,\s*creator_name: creator\.name,[\s\S]*?platform: 'Kick'/
  );
  assert.match(
    sync,
    /var streamData = \{\s*creator_id: liveCreator\.id,\s*creator_name: liveCreator\.name,[\s\S]*?platform: 'Twitch'/
  );
});

test('creator link audit flags profile URLs stored under the wrong platform', () => {
  const creator = {
    id: 346,
    name: 'Oumou Sangare',
    slug: 'oumou-sangare',
    tiktok_url: 'https://instagram.com/oumousangareofficial',
  };

  const issue = scoreLink(creator, 'tiktok_url', 'TikTok');
  assert.ok(issue);
  assert.strictEqual(issue.score, -6);
  assert.match(issue.reasons[0], /does not match TikTok/);
  assert.strictEqual(scoreLink({ ...creator, tiktok_url: 'https://www.tiktok.com/@oumou.sang' }, 'tiktok_url', 'TikTok'), null);
});

test('creator link audit bypasses stale public endpoint caches', async () => {
  assert.strictEqual(
    cacheBypassUrl('https://afrotools.com/api/afrostream/creators?sort=name&_audit=old', 1234),
    'https://afrotools.com/api/afrostream/creators?sort=name&_audit=1234'
  );

  const previousUrl = process.env.AFROSTREAM_CREATORS_URL;
  process.env.AFROSTREAM_CREATORS_URL = 'https://example.com/creators?limit=500';
  let request;
  try {
    const payload = await loadCreators(async (url, options) => {
      request = { url, options };
      return {
        ok: true,
        json: async () => ({ data: [] }),
      };
    }, 5678);

    assert.deepStrictEqual(payload, { data: [] });
    assert.strictEqual(request.url, 'https://example.com/creators?limit=500&_audit=5678');
    assert.strictEqual(request.options.cache, 'no-store');
  } finally {
    if (previousUrl === undefined) delete process.env.AFROSTREAM_CREATORS_URL;
    else process.env.AFROSTREAM_CREATORS_URL = previousUrl;
  }
});
