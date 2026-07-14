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

console.log('afrostream news monitor relevance tests passed');
