'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

function engine(relativeFile = '../engines/src/jamb-cbt-engine.js') {
  const storage = new Map();
  const context = { crypto: webcrypto, localStorage: { getItem: k => storage.get(k) || null,
    setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
  setInterval: () => 1, clearInterval: () => {} };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, relativeFile), 'utf8'), context);
  return { cbt: context.AfroJAMB.CBT, storage };
}

const pool = ['first', 'middle', 'last'].map((id, num) => ({ id, num, subject: 'mathematics', question: 'Synthetic test question ' + id,
  options: { A: 'one', B: 'two', C: 'three', D: 'four' }, answer: 'B', format: 4 }));
const snapshot = { sessionId: 'synthetic-test', subjects: ['mathematics'], questionIds: pool.map(q => q.id),
  answers: { 0: 'A', 1: 'B', 2: 'C' }, marked: {}, currentIndex: 1, poolRevision: 'review-v1',
  startedAt: Date.now(), durationMs: 600000 };

test('a quarantined first question cannot shift saved answers onto remaining questions', () => {
  const { cbt, storage } = engine();
  storage.set('afrojamb-cbt-state', JSON.stringify(snapshot));
  assert.throws(() => cbt.restore({ pool: pool.slice(1), poolRevision: 'review-v1' }, snapshot), /saved questions changed/);
  assert.equal(storage.has('afrojamb-cbt-state'), false);
  assert.equal(cbt.getState(), null);
});

test('a quarantined middle question also invalidates the entire saved session', () => {
  const { cbt } = engine();
  assert.throws(() => cbt.restore({ pool: [pool[0], pool[2]] }, snapshot), /saved questions changed/);
});

test('a changed review revision invalidates unchanged IDs and legacy saves', () => {
  const { cbt } = engine();
  assert.throws(() => cbt.restore({ pool, poolRevision: 'review-v2' }, snapshot), /question reviews changed/);
  assert.throws(() => cbt.restore({ pool, poolRevision: 'review-v1' }, { ...snapshot, poolRevision: undefined }), /question reviews changed/);
});

test('an unchanged complete session restores each answer to its original question', () => {
  const { cbt, storage } = engine();
  cbt.restore({ pool: [...pool].reverse(), poolRevision: 'review-v1' }, snapshot);
  const current = cbt.getCurrentQuestion();
  assert.equal(current.question.id, 'middle');
  assert.equal(current.selectedAnswer, 'B');
  const saved = JSON.parse(storage.get('afrojamb-cbt-state'));
  assert.equal(saved.poolRevision, 'review-v1');
  assert.deepEqual(saved.questionIds, snapshot.questionIds);
  assert.deepEqual(saved.answers, snapshot.answers);
});

test('duplicate saved IDs cannot create ambiguous grading positions', () => {
  const { cbt } = engine();
  assert.throws(() => cbt.restore({ pool }, { ...snapshot, questionIds: ['first', 'first'] }), /saved questions changed/);
});

test('the generated browser engine preserves quarantine and revision rejection', () => {
  const { cbt } = engine('../engines/jamb-cbt-engine.js');
  cbt.restore({ pool, poolRevision: 'review-v1' }, snapshot);
  assert.equal(cbt.getCurrentQuestion().selectedAnswer, 'B');
  assert.throws(() => cbt.restore({ pool: pool.slice(1), poolRevision: 'review-v1' }, snapshot), /saved questions changed/);
  assert.throws(() => cbt.restore({ pool, poolRevision: 'review-v2' }, snapshot), /question reviews changed/);
});
