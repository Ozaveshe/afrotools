'use strict';

const assert = require('assert');
const {
  extractPublishedAt,
  extractTitle,
  publicationInstant,
  localParts,
  parseCutoff,
  evaluateSource,
} = require('../scripts/audit-publishing-slo');

assert.strictEqual(extractPublishedAt('<script>{"datePublished":"2026-08-16"}</script>'), '2026-08-16');
assert.strictEqual(extractPublishedAt('<meta property="article:published_time" content="2026-08-15">'), '2026-08-15');
assert.strictEqual(extractTitle('<title>Useful guide | AfroTools</title>'), 'Useful guide | AfroTools');
assert.strictEqual(publicationInstant('2026-08-16').toISOString(), '2026-08-16T12:00:00.000Z');
assert.strictEqual(parseCutoff('20:00'), 1200);
assert.deepStrictEqual(localParts(new Date('2026-08-16T18:00:00Z'), 'Asia/Tashkent'), {
  date: '2026-08-16',
  minutes: 1380,
});

const policy = {
  timezone: 'Asia/Tashkent',
  publishing: {
    daily_expected_articles: 2,
    deployment_cutoff_local: '20:00',
    max_latest_article_age_hours: 36,
  },
};
const twoToday = [
  { slug: 'pm', published_at: '2026-08-16', instant: '2026-08-16T12:00:00.000Z' },
  { slug: 'am', published_at: '2026-08-16', instant: '2026-08-16T12:00:00.000Z' },
];
assert.deepStrictEqual(
  evaluateSource(twoToday, policy, new Date('2026-08-16T18:00:00Z')).issues,
  []
);
assert.ok(
  evaluateSource(twoToday.slice(0, 1), policy, new Date('2026-08-16T18:00:00Z')).issues
    .some((item) => item.code === 'daily_article_cadence_missed')
);
assert.ok(
  !evaluateSource(twoToday.slice(0, 1), policy, new Date('2026-08-16T12:00:00Z')).issues
    .some((item) => item.code === 'daily_article_cadence_missed'),
  'the two-article requirement starts only after the deployment cutoff'
);

console.log('publishing SLO tests passed');
