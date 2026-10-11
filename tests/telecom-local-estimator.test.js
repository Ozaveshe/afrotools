'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../assets/js/engines/telecom-planning-engine');
const input = { country: 'NG', browsing: 1, social: 2, youtube: 1, music: 0.5, videocall: 0.5, email: 20, downloads: 1, youtubeQuality: 'medium' };
const catalogue = { lastUpdated: '2026-03-01', countries: { NG: { currency: 'NGN', operators: [{ name: 'Synthetic', dataBundles: [{ name: 'Fixture', validity: '30 days', volumeMB: 100000, volume: '100 GB', price: 2000 }] }] } } };

test('local usage has fixed activity totals and no invented catalogue provenance', () => {
  const result = engine.estimateDataUsage(input);
  assert.equal(result.ok, true);
  assert.deepEqual(result.breakdown, [
    { id: 'browsing', mb: 1800 }, { id: 'social', mb: 9000 },
    { id: 'youtube', mb: 15000 }, { id: 'music', mb: 1080 },
    { id: 'videocall', mb: 12000 }, { id: 'email', mb: 300 },
    { id: 'downloads', mb: 1024 }
  ]);
  assert.equal(result.totalMB, 40204);
  assert.equal(result.totalGB, 39.26171875);
  assert.equal(result.bufferedNeedMB, 44224.4);
  assert.equal(result.source, undefined);
  assert.equal(result.recommendedPlans, undefined);
  assert.deepEqual(engine.dataUsage(null, input), { ok: false, error: 'country_unavailable' });
  const recommended = engine.dataUsage(catalogue, input);
  assert.equal(recommended.totalMB, 40204);
  assert.equal(recommended.source.reviewedAt, '2026-03-01');
  assert.equal(recommended.recommendedPlans.length, 1);
  assert.equal(recommended.recommendedPlans[0].price, 2000);
});

test('quality changes only video use and zero remains zero', () => {
  for (const [quality, expected] of [['low', 31204], ['medium', 40204], ['high', 62704], ['hd', 100204]]) {
    assert.equal(engine.estimateDataUsage({ ...input, youtubeQuality: quality }).totalMB, expected);
  }
  const zero = { ...input };
  for (const key of ['browsing', 'social', 'youtube', 'music', 'videocall', 'email', 'downloads']) zero[key] = 0;
  assert.equal(engine.estimateDataUsage(zero).totalMB, 0);
  assert.equal(engine.estimateDataUsage(zero).bufferedNeedMB, 0);
});

test('bad activity numbers and inherited quality keys cannot produce a result', () => {
  for (const value of [-1, Infinity, NaN, Number.MAX_VALUE]) {
    assert.deepEqual(engine.estimateDataUsage({ ...input, youtube: value }), { ok: false, error: 'invalid_usage' });
  }
  for (const youtubeQuality of ['constructor', '__proto__', 'toString', 'unknown']) {
    assert.deepEqual(engine.estimateDataUsage({ ...input, youtubeQuality }), { ok: false, error: 'invalid_usage' });
  }
  assert.deepEqual(engine.estimateDataUsage(), { ok: false, error: 'invalid_usage' });
});
