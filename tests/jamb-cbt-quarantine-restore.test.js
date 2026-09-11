'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { bank, revision, questions } = require('./support/jamb-reviewed-fixtures');

async function engine(relativeFile = '../engines/src/jamb-cbt-engine.js') {
  const storage = new Map();
  const fixture = bank();
  const context = { crypto: webcrypto, TextEncoder, fetch: async url => ({ ok: true, json: async () => JSON.parse(JSON.stringify(url.endsWith("/index.json") ? fixture.index : fixture.pool)) }), localStorage: { getItem: k => storage.get(k) || null,
    setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
  setInterval: () => 1, clearInterval: () => {} };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/js/lib/jamb-question-trust.js'), 'utf8'), context);
  const loaded = await context.AfroJAMB.QuestionTrust.loadPool();
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, relativeFile), 'utf8'), context);
  return { cbt: context.AfroJAMB.CBT, storage, pool: loaded.questions, trust: context.AfroJAMB.QuestionTrust, fixture };
}

const pool = questions();
const snapshot = { sessionId: 'synthetic-test', subjects: ['mathematics'], questionIds: pool.map(q => q.id),
  answers: { 0: 'A', 1: 'B', 2: 'C' }, marked: {}, currentIndex: 1, poolRevision: revision,
  startedAt: Date.now(), durationMs: 600000 };

test('a quarantined first question cannot shift saved answers onto remaining questions', async () => {
  const { cbt, storage, pool } = await engine();
  storage.set('afrojamb-cbt-state', JSON.stringify(snapshot));
  assert.throws(() => cbt.restore({ pool: pool.slice(1), poolRevision: revision }, snapshot), /saved questions changed/);
  assert.equal(storage.has('afrojamb-cbt-state'), false);
  assert.equal(cbt.getState(), null);
});

test('a quarantined middle question also invalidates the entire saved session', async () => {
  const { cbt, pool } = await engine();
  assert.throws(() => cbt.restore({ pool: [pool[0], pool[2]], poolRevision: revision }, snapshot), /saved questions changed/);
});

test('a changed review revision invalidates unchanged IDs and legacy saves', async () => {
  const { cbt, pool } = await engine();
  assert.throws(() => cbt.restore({ pool, poolRevision: 'b'.repeat(64) }, snapshot), /[Qq]uestion reviews changed/);
  assert.throws(() => cbt.restore({ pool, poolRevision: revision }, { ...snapshot, poolRevision: undefined }), /[Qq]uestion reviews changed/);
});

test('an unchanged complete session restores each answer to its original question', async () => {
  const { cbt, storage, pool } = await engine();
  cbt.restore({ pool: [...pool].reverse(), poolRevision: revision }, snapshot);
  const current = cbt.getCurrentQuestion();
  assert.equal(current.question.id, 'middle');
  assert.equal(current.selectedAnswer, 'B');
  const saved = JSON.parse(storage.get('afrojamb-cbt-state'));
  assert.equal(saved.poolRevision, revision);
  assert.deepEqual(saved.questionIds, snapshot.questionIds);
  assert.deepEqual(saved.answers, snapshot.answers);
});

test('duplicate saved IDs cannot create ambiguous grading positions', async () => {
  const { cbt, pool } = await engine();
  assert.throws(() => cbt.restore({ pool, poolRevision: revision }, { ...snapshot, questionIds: ['first', 'first'] }), /saved questions changed/);
});

test('the generated browser engine preserves quarantine and revision rejection', async () => {
  const { cbt, pool } = await engine('../engines/jamb-cbt-engine.js');
  cbt.restore({ pool, poolRevision: revision }, snapshot);
  assert.equal(cbt.getCurrentQuestion().selectedAnswer, 'B');
  assert.throws(() => cbt.restore({ pool: pool.slice(1), poolRevision: revision }, snapshot), /saved questions changed/);
  assert.throws(() => cbt.restore({ pool, poolRevision: 'b'.repeat(64) }, snapshot), /[Qq]uestion reviews changed/);
});


test('engine refuses raw objects, omitted revision and an empty bank without generating a score', async () => {
  const { cbt, pool } = await engine();
  assert.throws(() => cbt.init({ pool: questions(), poolRevision: revision }), /Unreviewed/);
  assert.throws(() => cbt.init({ pool }), /reviews changed/);
  assert.throws(() => cbt.init({ pool: [], poolRevision: revision }), /no questions/);
  assert.equal(cbt.submit(), null);
});

test('approved initialization scores synthetic answers and includes question identity in review', async () => {
  const { cbt, pool } = await engine();
  cbt.init({ pool, poolRevision: revision, subjects: ['mathematics'] });
  for (let i = 0; i < 3; i++) { cbt.selectAnswer('B'); cbt.next(); }
  const score = cbt.submit();
  assert.equal(score.total, 3);
  assert.equal(score.outOf, 3);
  assert.ok(score.reviewItems.every(item => pool.some(question => question.id === item.id)));
});

test('saved answers remain bound to original positions and invalid saved options are discarded', async () => {
  const { cbt, pool, storage } = await engine();
  cbt.restore({ pool, poolRevision: revision }, { ...snapshot, answers: { 0: 'Z', 1: 'B', 99: 'A' } });
  assert.deepEqual(JSON.parse(storage.get('afrojamb-cbt-state')).answers, { 1: 'B' });
});
