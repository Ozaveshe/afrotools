'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const checker = require('../ops/jamb/verification/check-english-2021-1001.cjs');
const { prepareBatch } = require('../ops/nigeria-exams/import-jamb-english-2021-batch-01.cjs');
const root = path.resolve(__dirname, '..');
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const bytes = Object.fromEntries([['manifest', checker.manifestPath], ['snapshot', checker.snapshotPath], ['review', checker.reviewPath]]
  .map(([key, relative]) => [key, fs.readFileSync(path.join(root, relative))]));
const manifest = JSON.parse(bytes.manifest), snapshot = JSON.parse(bytes.snapshot), review = JSON.parse(bytes.review);
const pool = read('ops/jamb/source-pool.json'), ledger = read('data/jamb/review-ledger.json'), receipt = read(checker.receiptPath);
const options = { referenceRoot: root, bytes, implementationBase: receipt.implementation_base_sha };
const asQuestion = row => ({ question: row.question, options: row.observed_options });

test('the frozen 24 English 2021 records have genuinely completed review and exact portable source hashes', () => {
  assert.equal(review.root_independent_review_complete, true);
  assert(review.records.every(row => row.verdict === 'accepted'));
  const result = checker.verify(manifest, snapshot, review, pool, ledger, receipt, bytes, options);
  assert.equal(result.accepted, 24); assert.equal(result.held_or_excluded, 14);
  for (const input of Object.values(bytes)) assert.equal(input.includes(Buffer.from('\r\n')), false, 'Review source inputs use committed LF bytes');
  for (const row of manifest.records) {
    const question = pool.questions.find(q => q.id === 'english-2021-myschool-' + row.source_question_id);
    assert.deepEqual(Object.values(question.options), row.choices);
    assert.equal(question.format, row.choices.length);
    assert.equal(question.options[question.answer], checker.ANSWER_TEXT[row.source_question_id]);
    assert.equal(question.num, null);
  }
});

test('distinct spelling option sets remain separate tasks while real duplicates remain blocked', () => {
  const tasks = [60694, 60695, 60697].map(id => asQuestion(manifest.records.find(row => row.source_question_id === id)));
  assert.equal(tasks[0].question, tasks[1].question);
  assert.equal(checker.isDuplicateQuestion(tasks[0], tasks[1]), false);
  assert.equal(checker.isDuplicateQuestion(tasks[0], tasks[2]), false);
  assert.equal(checker.isDuplicateQuestion(tasks[1], tasks[2]), false);
  assert.equal(checker.isDuplicateQuestion(tasks[0], structuredClone(tasks[0])), true);
  const substantive = asQuestion(manifest.records.find(row => row.source_question_id === 60648));
  assert.equal(checker.isDuplicateQuestion(substantive, { ...substantive, options: { A: 'changed', B: 'options', C: 'do not', D: 'hide repetition' } }), true);
  const clone = structuredClone(pool);
  const existing = clone.questions.find(q => q.id === 'english-2021-myschool-60694');
  clone.questions.push({ ...structuredClone(existing), id: 'duplicate-spelling-regression', source_provenance: undefined });
  assert.throws(() => prepareBatch(manifest, snapshot, review, clone, ledger, options), /Duplicate prompt or source identity/);
});

test('real reviewed intake replay is idempotent and cannot mutate mathematics or caller owner objects', () => {
  const beforePool = JSON.stringify(pool), beforeLedger = JSON.stringify(ledger);
  const prepared = prepareBatch(manifest, snapshot, review, pool, ledger, options);
  assert.deepEqual(prepared.pool, pool); assert.deepEqual(prepared.ledger, ledger); assert.deepEqual(prepared.receipt, receipt);
  assert.equal(JSON.stringify(pool), beforePool); assert.equal(JSON.stringify(ledger), beforeLedger);
});

test('incomplete review and corrupted option/source evidence are rejected', () => {
  const pending = structuredClone(review); pending.root_independent_review_complete = false;
  assert.throws(() => checker.validateManifest(manifest, snapshot, pending, options), /Root independent/);
  const changedManifest = structuredClone(manifest); changedManifest.records[0].choices[0] = 'Changed source option';
  assert.throws(() => checker.validateManifest(changedManifest, snapshot, review, options));
  const changedSnapshot = structuredClone(snapshot); changedSnapshot.records[0].choices[0].text = 'Changed source option';
  assert.throws(() => checker.validateManifest(manifest, changedSnapshot, review, options), /Immutable decoded/);
});
