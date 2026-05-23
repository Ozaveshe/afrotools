const assert = require('assert');
const path = require('path');

const api = require(path.join(__dirname, '..', 'netlify/functions/api-scholarships.js'));

const now = new Date('2026-05-23T12:00:00Z');
const metadata = api._private.buildScholarshipMetadata([
  {
    title: 'Open verified scholarship',
    status: 'open',
    deadline_date: '2026-06-01',
    deadline_confidence: 'verified',
    official_url: 'https://example.edu/open',
    last_verified_at: '2026-05-23T08:00:00Z',
    created_at: '2026-05-22T08:00:00Z'
  },
  {
    title: 'Upcoming scholarship',
    status: 'upcoming',
    deadline_date: '2026-07-15',
    source_url: 'https://example.edu/upcoming',
    last_checked_at: '2026-04-01T08:00:00Z',
    created_at: '2026-05-23T02:00:00Z'
  },
  {
    title: 'Closed scholarship',
    status: 'closed',
    deadline_date: '2026-04-01',
    official_url: 'https://example.edu/closed',
    last_verified_at: '2026-03-01T08:00:00Z'
  }
], {
  mode: 'live',
  label: 'Live feed',
  lastCheckedAt: '2026-05-23T09:30:00Z',
  publicMinCount: 50
}, now);

assert.strictEqual(metadata.total_loaded, 3, 'API metadata should include total loaded records');
assert.strictEqual(metadata.scholarships_added_count, 3, 'hero can show scholarship catalog count as scholarships added');
assert.strictEqual(metadata.open_count, 2, 'open count should include open and upcoming public opportunities');
assert.strictEqual(metadata.closing_soon_count, 1, 'deadlines within 30 days should count as closing soon');
assert.strictEqual(metadata.verified_today_count, 1, 'verified today should use checked/verified timestamps');
assert.strictEqual(metadata.added_today_count, 1, 'added today should use created/published timestamps');
assert.strictEqual(metadata.last_refresh_at, '2026-05-23T09:30:00Z', 'metadata should expose refresh timestamp');
assert.strictEqual(metadata.stale_count, 2, 'stale count should flag old or missing verification timestamps');
assert.strictEqual(metadata.source_health.verified_deadline_count, 1, 'source health should count verified exact deadlines');
assert.strictEqual(metadata.source_health.no_single_public_deadline_count, 0, 'source health should count no-single-public-deadline rows');
assert.deepStrictEqual(
  Object.keys(metadata.source_health).sort(),
  ['degraded', 'label', 'limited', 'mode', 'no_single_public_deadline_count', 'official_link_count', 'public_min_count', 'source_backed_count', 'stale', 'verified_deadline_count', 'with_deadline_count'].sort(),
  'source health metadata should be present for the frontend status panel'
);

console.log('Scholarship API metadata contract verified.');
