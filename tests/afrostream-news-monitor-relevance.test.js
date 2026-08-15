const assert = require('assert');
const monitor = require('../netlify/functions/afrostream-news-monitor.js').__test;

const now = new Date().toISOString();
const businessSource = { name: 'Business Insider Africa', category: 'business' };
const platformSource = { name: 'IT News Africa', category: 'platform' };

function item(title, description = '') {
  return { title, description, published_at: now };
}

assert.strictEqual(
  monitor.decodeXml('BMA&amp;#8217;s &#8220;Trust&#8221; &amp; creator payouts'),
  'BMA’s “Trust” & creator payouts',
  'numeric and double-encoded XML entities must not leak into public titles'
);

assert.strictEqual(
  monitor.isEditoriallyRelevant(item('Mnangagwa defends Zimbabwe term extension')),
  false,
  'politics must not pass because the source category is business'
);
assert.strictEqual(
  monitor.isEditoriallyRelevant(item(
    'Angelique Kidjo birthday look makes red raffia shine',
    'The music icon wore a couture gown for her birthday.'
  )),
  false,
  'birthday fashion must not pass because the description mentions music'
);
assert.strictEqual(
  monitor.isEditoriallyRelevant(item(
    'Angelique Kidjo wins lifetime music award',
    'The Beninese artist received the honour at a ceremony.'
  )),
  true,
  'real creator milestones must remain eligible'
);
assert.strictEqual(
  monitor.shouldPublishWithoutCreatorMatch(
    item('Africa gold shipment seized as exports tighten'), businessSource, Date.now() - 86400000
  ),
  false,
  'mining stories must not enter the creator news backfill'
);
assert.strictEqual(
  monitor.shouldPublishWithoutCreatorMatch(
    item('Nigeria launches digital payments platform'), platformSource, Date.now() - 86400000
  ),
  false,
  'generic platforms and payments must not enter the creator news backfill'
);
assert.strictEqual(
  monitor.shouldPublishWithoutCreatorMatch(
    item('10 African films selected for international film festival'), businessSource, Date.now() - 86400000
  ),
  true,
  'African film milestones should remain eligible'
);
assert.strictEqual(
  monitor.shouldPublishWithoutCreatorMatch(
    item('Nigerian music creator releases new album'), businessSource, Date.now() - 86400000
  ),
  true,
  'African creator and music news should remain eligible'
);

assert.strictEqual(
  monitor.shouldInsertNewsCandidate(null),
  true,
  'a genuinely new feed item should be inserted'
);
assert.strictEqual(
  monitor.shouldInsertNewsCandidate({ id: 13884, is_published: false, category: 'collabs' }),
  false,
  'an existing row must not be rewritten because editorial moderation may have changed it'
);

const repeatedGuid = 'https://musicinafrica.net/magazine/';
const preparedItems = monitor.prepareFeedItems([
  { title: 'First story', link: 'https://musicinafrica.net/magazine/first-story/', guid: repeatedGuid, published_at: now },
  { title: 'Second story', link: 'https://musicinafrica.net/magazine/second-story/', guid: repeatedGuid, published_at: now }
]);
assert.deepStrictEqual(
  preparedItems.map((entry) => entry.identity),
  preparedItems.map((entry) => entry.link),
  'a feed that reuses one GUID must derive article identity from each source link'
);
assert.strictEqual(
  monitor.prepareFeedItems([
    { title: 'Unique story', link: 'https://example.com/story/', guid: 'unique-guid', published_at: now }
  ])[0].identity,
  'unique-guid',
  'a unique provider GUID should remain stable'
);

const insertBudget = { remaining: 1 };
assert.strictEqual(monitor.reserveInsertSlot(insertBudget), true, 'the first new row should reserve the last slot');
assert.strictEqual(monitor.reserveInsertSlot(insertBudget), false, 'a concurrent candidate must not overshoot an exhausted cap');
assert.strictEqual(insertBudget.remaining, 0, 'slot reservation must never drive the shared budget negative');
assert.strictEqual(
  monitor.insertLimitForEvent({ queryStringParameters: { max_insert_news: '30' } }),
  5,
  'manual live runs must clamp requested backfill volume to five new articles'
);

console.log('afrostream news monitor relevance tests passed');
