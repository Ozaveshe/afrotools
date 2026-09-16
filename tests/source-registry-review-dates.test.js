'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { preserveRecordedReview, buildRegistry } = require('../scripts/build-source-registry');

test('generation can age a review without advancing its recorded dates', () => {
  const entry = { id: 'method', reviewCadenceDays: 30 };
  const previous = { lastCheckedAt: '2026-08-16', lastReviewedAt: '2026-08-16' };
  const current = preserveRecordedReview(entry, previous, '2026-08-17');
  const later = preserveRecordedReview(entry, previous, '2027-08-17');
  assert.equal(current.lastReviewedAt, previous.lastReviewedAt);
  assert.equal(later.lastCheckedAt, previous.lastCheckedAt);
  assert.equal(later.lastReviewedAt, previous.lastReviewedAt);
  assert.notEqual(current.freshnessStatus, later.freshnessStatus);
  const missing = preserveRecordedReview(entry, undefined, '2026-09-16');
  assert.equal(missing.lastCheckedAt, null);
  assert.equal(missing.lastReviewedAt, null);
  assert.equal(missing.freshnessStatus, 'unknown');
});

test('actual registry keeps method dates separate from generation and reviewed tax sources', () => {
  const first = buildRegistry('2026-09-16').registry;
  const later = buildRegistry('2027-09-16').registry;
  for (const id of ['route-fares-user-input-method', 'workflow-energy-source-contract', 'savings-goal-user-input-method']) {
    const before = first.sources.find(source => source.id === id);
    const after = later.sources.find(source => source.id === id);
    assert.equal(after.lastReviewedAt, before.lastReviewedAt, id);
    assert.equal(after.lastCheckedAt, before.lastCheckedAt, id);
  }
  assert.equal(first.sources.find(source => source.id === 'paye-zm-source').lastReviewedAt, '2026-09-15');
  assert.notEqual(first.updatedAt, later.updatedAt);
});
