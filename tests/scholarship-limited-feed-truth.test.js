const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFeedMeta } = require('../netlify/functions/_shared/scholarship-platform');
for (const mode of ['live', 'cached', 'curated', 'fallback']) {
  for (const error of ['', 'upstream unavailable']) {
    test('limited ' + mode + ' retains provenance, error=' + Boolean(error), () => {
      const meta = buildFeedMeta([], { mode, count: 2, error, lastCheckedAt: '2026-10-01T12:00:00Z' });
      const label = mode === 'curated' && error ? 'curated fallback' : mode;
      assert.equal(meta.label, 'Limited ' + label + ' feed');
      assert.equal(meta.mode, mode);
      assert.equal(meta.count, 2);
      assert.equal(meta.isLimited, true);
      assert.equal(meta.isDegraded, true);
      assert.equal(meta.tone, 'warn');
      assert.equal(meta.lastCheckedAt, '2026-10-01T12:00:00Z');
      assert.ok(meta.message.includes(mode === 'curated' ? 'curated scholarship catalog' : mode + ' scholarship'));
      if (mode !== 'live') assert.doesNotMatch(meta.label, /live/i);
      assert.doesNotMatch(meta.message, /verified scholarship/i);
    });
  }
}
test('empty fallback remains fallback without manufactured coverage', () => {
  const meta = buildFeedMeta([], { mode: 'fallback' });
  assert.equal(meta.label, 'Fallback feed');
  assert.equal(meta.count, 0);
  assert.equal(meta.isLimited, false);
});
