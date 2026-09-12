'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { bank, revision, reviewed, publication, questions } = require('./support/jamb-reviewed-fixtures');
const { questionFingerprint } = require('../scripts/lib/jamb-content-trust');
function browser(fixture = bank()) {
  const calls = [];
  const context = { crypto: webcrypto, TextEncoder, fetch: async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => JSON.parse(JSON.stringify(url.endsWith('/index.json') ? fixture.index : fixture.pool)) };
  } };
  context.window = context;
  vm.runInNewContext(fs.readFileSync('assets/js/lib/jamb-question-trust.js', 'utf8'), context);
  return { trust: context.AfroJAMB.QuestionTrust, calls, context };
}
test('browser digest matches server canonical hashing including nested Unicode and reordered keys', async () => {
  const { trust } = browser();
  const value = { z: 'Ékọ́', a: [{ c: 2, b: 'line\nquote"' }], absent: undefined };
  assert.equal(await trust.digest(value), questionFingerprint(value));
});
test('a complete synthetic bank registers immutable object identities and refreshes index without cache', async () => {
  const { trust, calls } = browser();
  const pool = await trust.loadPool();
  assert.equal(trust.assertEligible(pool.questions, revision), true);
  assert.equal(Object.isFrozen(pool.questions[0].options), true);
  assert.throws(() => trust.assertEligible([{ ...pool.questions[0] }], revision), /Unreviewed/);
  assert.throws(() => trust.assertEligible([pool.questions[0], pool.questions[0]], revision), /duplicate/);
  assert.equal(calls[0].url, '/data/jamb/pools/index.json');
  assert.ok(calls.every(call => call.options.cache === 'no-store'));
});
test('an empty reviewed bank is valid but contains no gradable objects', async () => {
  const { trust } = browser(bank([]));
  assert.equal((await trust.loadPool()).questions.length, 0);
});

test('browser accepts reviewed A-F questions and rejects gaps or a seventh option', async () => {
  const { review: ignored, ...base } = questions()[0];
  const six = { ...base, options: { A: '36', B: '40', C: '48', D: '49', E: '41', F: '42' }, answer: 'F', format: 6 };
  const { trust } = browser(bank([reviewed(six)]));
  const pool = await trust.loadPool();
  assert.equal(pool.questions[0].options.F, '42');
  assert.equal(trust.assertEligible(pool.questions, revision), true);
  const gap = structuredClone(six); delete gap.options.E; gap.format = 5;
  await assert.rejects(browser(bank([reviewed(gap)])).trust.loadPool(), /invalid/);
  const seven = structuredClone(six); seven.options.G = '43'; seven.format = 7;
  await assert.rejects(browser(bank([reviewed(seven)])).trust.loadPool(), /invalid/);
});
for (const [label, change] of [
  ['missing review', q => { delete q.review; }],
  ['changed wording', q => { q.question += ' changed'; }],
  ['wrong answer', q => { q.answer = 'Z'; q.review = reviewed(Object.fromEntries(Object.entries(q).filter(([k]) => k !== 'review'))).review; }],
  ['duplicate choices', q => { q.options.B = q.options.A; q.review = reviewed(Object.fromEntries(Object.entries(q).filter(([k]) => k !== 'review'))).review; }],
  ['missing option', q => { delete q.options.B; q.review = reviewed(Object.fromEntries(Object.entries(q).filter(([k]) => k !== 'review'))).review; }],
]) test('rejects ' + label + ' even in a newly hashed publication', async () => {
  const rows = questions(); change(rows[0]);
  await assert.rejects(browser(bank(rows)).trust.loadPool(), /review|invalid/);
});
test('duplicate IDs reject the entire bank', async () => {
  const rows = questions(); rows.push(rows[0]);
  await assert.rejects(browser(bank(rows)).trust.loadPool(), /duplicate/);
});
test('stale pool and tampered index/publication are rejected', async () => {
  const stale = bank(); stale.index = bank([], 'b'.repeat(64)).index;
  await assert.rejects(browser(stale).trust.loadPool(), /changed/);
  const broken = bank(); broken.index.stats = {};
  await assert.rejects(browser(broken).trust.loadPool(), /verified/);
  const badPool = bank(); badPool.pool.count = 99;
  await assert.rejects(browser(badPool).trust.loadPool(), /verified/);
});
test('count mismatch cannot pass merely by rehashing the publication', async () => {
  const fixture = bank(); const { publication: ignored, ...payload } = fixture.pool;
  fixture.pool = publication({ ...payload, count: 99 });
  await assert.rejects(browser(fixture).trust.loadPool(), /counts/);
});
test('failed or changed fresh index revokes previously registered question eligibility', async () => {
  const fixture = bank(); const { trust, context } = browser(fixture);
  const pool = await trust.loadPool();
  fixture.index = bank([], 'b'.repeat(64)).index;
  await trust.fetchIndex();
  assert.throws(() => trust.assertEligible(pool.questions, revision), /changed/);
  context.fetch = async () => { throw new Error('offline'); };
  await assert.rejects(trust.fetchIndex(), /offline/);
  assert.throws(() => trust.assertEligible(pool.questions, revision), /changed/);
});
test('reviewed cards and aggregate publications use their own exact digest scope', async () => {
  const { trust } = browser();
  const index = await trust.fetchIndex();
  const card = reviewed({ id: 'synthetic-card', front: '6 × 7', back: '42' });
  assert.equal(await trust.validateReviewedObject(card), card);
  const patterns = publication({ schema_version: 1, review_revision: revision, subjects: {} });
  assert.equal(await trust.validatePublication(patterns, index), patterns);
  await assert.rejects(trust.validateReviewedObject({ ...card, back: '43' }), /review/);
});
