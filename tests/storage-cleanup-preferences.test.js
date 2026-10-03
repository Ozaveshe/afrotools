const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('scheduled cache cleanup preserves plain preferences and drafts while removing expired records', () => {
  const now = Date.now();
  const values = new Map([
    ['aft_theme', 'dark'],
    ['aft_country', 'NG'],
    ['aft_legacy_draft', 'unfinished local text'],
    ['aft_saved_recipes', JSON.stringify(['jollof-rice'])],
    ['aft_expired_cache', JSON.stringify({ v: 'old cache', t: now - 100, e: now - 1 })],
    ['aft_current_cache', JSON.stringify({ v: 'current cache', t: now, e: now + 60000 })],
    ['other_product_preference', 'keep']
  ]);
  const initial = new Map(values);
  const timers = [];
  const localStorage = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
  const context = { window: {}, localStorage, setTimeout: (callback, delay) => timers.push({ callback, delay }) };
  vm.runInNewContext(fs.readFileSync('assets/js/lib/storage.js', 'utf8'), context);
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, 5000);
  timers[0].callback();
  assert.equal(values.has('aft_expired_cache'), false);
  for (const [key, value] of initial) if (key !== 'aft_expired_cache') assert.equal(values.get(key), value, key);
  const store = context.window.AfroTools.store;
  assert.equal(store.get('current_cache'), 'current cache');
  assert.equal(store.get('legacy_draft', 'fallback'), 'fallback');
  assert.equal(store.set('new_cache', 'saved', { ttl: '1m' }), true);
  assert.equal(store.get('new_cache'), 'saved');
  store.remove('new_cache');
  assert.equal(store.has('new_cache'), false);
  assert.equal(values.get('aft_theme'), 'dark');
});
