'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareBatch } = require('../ops/nigeria-exams/import-jamb-math-2021-batch-01.cjs');
const { verify, solveAnswers, ACCEPTED, DUPLICATES } = require('../ops/jamb/verification/check-mathematics-2021-001.cjs');
const { questionFingerprint, assessQuestion } = require('../scripts/lib/jamb-content-trust');
const { buildPublications } = require('../scripts/lib/jamb-publication');
const { renderYear } = require('../scripts/build-jamb-reviewed-pages');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('ops/nigeria-exams/jamb-math-2021-curated-batch-01.json');
const pool = read('ops/jamb/source-pool.json');
const ledger = read('data/jamb/review-ledger.json');
const receipt = read('ops/jamb/verification/mathematics-2021-publishable-001.json');
const snapshotBytes = fs.readFileSync(path.join(root, 'ops/nigeria-exams/jamb-math-2021-source-snapshot-01.json'));
const ids = ACCEPTED.map(sourceItem => 'mathematics-2021-myschool-' + sourceItem);

function beforeBatch() {
  const beforePool = structuredClone(pool), beforeLedger = structuredClone(ledger);
  beforePool.questions = beforePool.questions.filter(question => !ids.includes(question.id));
  beforePool.count = beforePool.questions.length;
  beforePool.answered_count = beforePool.questions.filter(question => question.answer).length;
  for (const id of ids) {
    const review = beforeLedger.questions[id];
    if (review) delete beforeLedger.sources[review.source_id];
    delete beforeLedger.questions[id];
  }
  return { pool: beforePool, ledger: beforeLedger };
}

test('five complete source items have matching independent answers and portable review evidence', () => {
  assert.deepEqual(solveAnswers(manifest), { 60716: 'D', 60732: 'D', 60735: 'A', 60736: 'A', 60739: 'A' });
  const result = verify(manifest, pool, ledger, receipt, snapshotBytes);
  assert.equal(result.passed, true);
  assert.deepEqual(result.question_ids, ids);
  assert.equal(manifest.sitting_authenticated, false);
  for (const id of ids) {
    const question = pool.questions.find(row => row.id === id);
    assert.equal(question.num, null);
    assert.deepEqual(Object.keys(question.source_provenance).sort(), ['publisher', 'url', 'year_basis']);
    assert.equal(assessQuestion(question, ledger).state, 'eligible');
    assert.doesNotMatch(question.explanation, /publisher|source|repair|transcription|corrected|restored/i);
  }
});

test('intake adds only five reviewed questions and preserves every old record, review, source and hold', () => {
  const before = beforeBatch(), untouched = structuredClone(before);
  const prepared = prepareBatch(manifest, before.pool, before.ledger);
  assert.deepEqual(before, untouched, 'Inputs must not be mutated');
  assert.equal(prepared.pool.questions.length, before.pool.questions.length + 5);
  assert.equal(prepared.pool.answered_count, before.pool.answered_count + 5);
  assert.deepEqual(prepared.pool.questions.filter(question => !ids.includes(question.id)), before.pool.questions);
  for (const [id, review] of Object.entries(before.ledger.questions)) assert.deepEqual(prepared.ledger.questions[id], review, id);
  for (const [id, source] of Object.entries(before.ledger.sources)) assert.deepEqual(prepared.ledger.sources[id], source, id);
  assert.deepEqual(prepared.ledger.publication_holds, before.ledger.publication_holds);
  for (const oldId of ['mathematics-1985-4-09798bb21718', 'mathematics-1991-17-2b9e25198c2a']) {
    assert.deepEqual(prepared.pool.questions.find(q => q.id === oldId), before.pool.questions.find(q => q.id === oldId));
    assert.notEqual(assessQuestion(prepared.pool.questions.find(q => q.id === oldId), prepared.ledger).state, 'eligible');
  }
  const flashcards = read('ops/jamb/source-flashcards.json');
  const oldPublic = buildPublications(before.pool, flashcards, before.ledger).files['pools/practice-pool.json'];
  const newPublic = buildPublications(prepared.pool, flashcards, prepared.ledger).files['pools/practice-pool.json'];
  assert.equal(newPublic.questions.length, oldPublic.questions.length + 5);
  assert.deepEqual(newPublic.questions.filter(q => !ids.includes(q.id)), oldPublic.questions);
});

test('reimport is idempotent and refuses changed existing intake content', () => {
  const prepared = prepareBatch(manifest, pool, ledger);
  assert.deepEqual(prepared.pool, pool);
  assert.deepEqual(prepared.ledger, ledger);
  assert.deepEqual(prepared.receipt, receipt);
  const changed = structuredClone(pool);
  changed.questions.find(q => q.id === ids[0]).explanation += ' Changed.';
  assert.throws(() => prepareBatch(manifest, changed, ledger), /content changed/);
});

test('source gaps, duplicated accepted items and invented sitting or question numbers are rejected', () => {
  const falseSitting = structuredClone(manifest); falseSitting.sitting_authenticated = true;
  assert.throws(() => prepareBatch(falseSitting, pool, ledger), /Unexpected Mathematics 2021 provenance/);
  const falseNumber = structuredClone(manifest); falseNumber.items[0].num = 31;
  assert.throws(() => prepareBatch(falseNumber, pool, ledger), /invented exam number/);
  const falseYear = structuredClone(manifest); falseYear.items[0].source_url = falseYear.items[0].source_url.replace('exam_year=2021', 'exam_year=2020');
  assert.throws(() => prepareBatch(falseYear, pool, ledger), /Incomplete source/);
  const missingOptions = structuredClone(manifest); delete missingOptions.items[0].observed_options;
  assert.throws(() => prepareBatch(missingOptions, pool, ledger), /Incomplete source/);
  const emptySourceOption = structuredClone(manifest); emptySourceOption.items[0].observed_options.D = '';
  assert.throws(() => prepareBatch(emptySourceOption, pool, ledger), /Incomplete source/);
  const duplicates = structuredClone(manifest); duplicates.items[0].sourceItem = DUPLICATES[0];
  assert.throws(() => prepareBatch(duplicates, pool, ledger), /accepted items or duplicate decisions/);
  for (const sourceItem of DUPLICATES) assert(!pool.questions.some(q => q.id === 'mathematics-2021-myschool-' + sourceItem));
});

test('independent answer checks reject a wrong key even after review and receipt hashes are recomputed', () => {
  const wrongPool = structuredClone(pool), wrongLedger = structuredClone(ledger), wrongReceipt = structuredClone(receipt);
  const wrongQuestion = wrongPool.questions.find(q => q.id === ids[0]);
  wrongQuestion.answer = 'A';
  const hash = questionFingerprint(wrongQuestion);
  wrongLedger.questions[wrongQuestion.id].content_sha256 = hash;
  const wrongRecord = wrongReceipt.records.find(q => q.id === wrongQuestion.id);
  wrongRecord.content_sha256 = hash; wrongRecord.answer = 'A'; wrongRecord.independently_selected_answer = 'A';
  assert.throws(() => verify(manifest, wrongPool, wrongLedger, wrongReceipt, snapshotBytes), /independently selected answer/);
  const wrongManifest = structuredClone(manifest); wrongManifest.items[0].answer = 'A'; wrongManifest.items[0].publisher_answer = 'A';
  assert.throws(() => prepareBatch(wrongManifest, pool, ledger), /independently selected answer mismatch/);
  const ambiguous = structuredClone(manifest);
  ambiguous.items[1].question = 'Which set contains all integers satisfying −2 < 2x − 6 < 4?';
  assert.throws(() => solveAnswers(ambiguous), /set of all integers x satisfying/);
});

test('the selected 2021 collection page keeps explanations closed and leaves public duplicates out', () => {
  const page = renderYear('mathematics', '2021', pool.questions, ledger, ['2021', '2022', '2023', '2024', '2025']);
  assert.deepEqual(page.approvedIds, ids);
  assert.match(page.html, /publisher-labelled 2021 collection/);
  assert.match(page.html, /original UTME sitting and question numbers are unconfirmed/i);
  for (const id of ids) {
    const card = page.html.match(new RegExp(`<article[^>]+data-reviewed-question="${id}"[^>]*>([\\s\\S]*?)<\\/article>`));
    assert(card, id);
    assert.match(card[1], /<details><summary>Answer and explanation<\/summary>/);
    assert.doesNotMatch(card[1], /<details\b[^>]*\bopen\b/);
  }
  for (const sourceItem of DUPLICATES) assert(!page.html.includes('mathematics-2021-myschool-' + sourceItem));
});
