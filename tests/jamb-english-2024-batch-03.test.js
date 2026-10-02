'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { prepareBatch } = require('../ops/nigeria-exams/import-jamb-english-2024-batch-03.cjs');
const checker = require('../ops/jamb/verification/check-english-2024-904.cjs');
const root = path.resolve(__dirname, '..');
// Optional read-only private preflight; the committed test defaults to its checkout.
const referenceRoot = process.env.AFROTOOLS_REFERENCE_REPO ? path.resolve(process.env.AFROTOOLS_REFERENCE_REPO) : root;
const trust = checker.trustFor(referenceRoot);
const { buildPublications, validateReviewedObject, validatePublication } = require(path.join(referenceRoot, 'scripts/lib/jamb-publication.js'));
const { renderYear } = require(path.join(referenceRoot, 'scripts/build-jamb-reviewed-pages.js'));
const read = (base, relative) => JSON.parse(fs.readFileSync(path.join(base, relative), 'utf8'));
const bytes = Object.fromEntries([['manifest', checker.manifestPath], ['snapshot', checker.snapshotPath], ['review', checker.reviewPath]].map(([key, relative]) => [key, fs.readFileSync(path.join(root, relative))]));
const manifest = JSON.parse(bytes.manifest), snapshot = JSON.parse(bytes.snapshot), independentReview = JSON.parse(bytes.review);
const pool = read(referenceRoot, 'ops/jamb/source-pool.json'), ledger = read(referenceRoot, 'data/jamb/review-ledger.json');
const ids = checker.ACCEPTED.map(id => 'english-2024-myschool-' + id);
const receiptFile = path.join(referenceRoot, checker.receiptPath);
const receipt = fs.existsSync(receiptFile) ? JSON.parse(fs.readFileSync(receiptFile, 'utf8')) : null;
const options = { referenceRoot, bytes, implementationBase: receipt?.implementation_base_sha || null };

function beforeBatch() {
  const beforePool = structuredClone(pool), beforeLedger = structuredClone(ledger);
  beforePool.questions = beforePool.questions.filter(row => !ids.includes(row.id));
  beforePool.count = beforePool.questions.length;
  beforePool.answered_count = beforePool.questions.filter(row => row.answer).length;
  for (const id of ids) {
    const review = beforeLedger.questions[id];
    if (review) delete beforeLedger.sources[review.source_id];
    delete beforeLedger.questions[id];
  }
  return { pool: beforePool, ledger: beforeLedger };
}

function prepare(before = beforeBatch()) {
  return prepareBatch(manifest, snapshot, independentReview, before.pool, before.ledger, options);
}

test('nine exact source questions and independent selected texts have stable provenance and portable digests', () => {
  assert.deepEqual(checker.validateManifest(manifest, snapshot, independentReview, options), {
    70042: 'D', 70060: 'C', 70062: 'A', 70076: 'D', 70077: 'A', 70078: 'D', 70081: 'D', 70082: 'D', 70084: 'D'
  });
  const prepared = prepare();
  assert.equal(prepared.result.passed, true); assert.deepEqual(prepared.result.question_ids, ids);
  for (const row of manifest.records) {
    const captured = snapshot.records.find(item => item.source_question_id === row.source_question_id);
    assert.deepEqual(row.choices, captured.choices.map(option => option.text));
    assert.equal(row.question, checker.displayPrompt(captured)); assert.equal(row.num, null);
    const q = prepared.pool.questions.find(item => item.id === 'english-2024-myschool-' + row.source_question_id);
    assert.equal(q.options[q.answer], checker.ANSWER_TEXT[row.source_question_id]);
    assert.equal(trust.assessQuestion(q, prepared.ledger).state, 'eligible');
  }
  assert.equal(manifest.records.filter(row => row.question === snapshot.records.find(item => item.source_question_id === row.source_question_id).question_text).length, 7);
  assert.match(manifest.records.find(row => row.source_question_id === 70042).question, /Target: the initial P in Public\.$/);
  assert.match(manifest.records.find(row => row.source_question_id === 70076).question, /Target word: cherishes\.$/);
  assert.equal(manifest.implementation_base_sha, null);
});

test('only nine records are added; every previous question, review, source, and publication hold remains unchanged', () => {
  const before = beforeBatch(), pristine = structuredClone(before), prepared = prepare(before);
  assert.deepEqual(before, pristine, 'Preparation cannot mutate caller inputs');
  assert.equal(prepared.pool.questions.length, before.pool.questions.length + 9);
  assert.equal(prepared.pool.answered_count, before.pool.answered_count + 9);
  assert.deepEqual(prepared.pool.questions.filter(row => !ids.includes(row.id)), before.pool.questions);
  for (const [id, row] of Object.entries(before.ledger.questions)) assert.deepEqual(prepared.ledger.questions[id], row, id);
  for (const [id, row] of Object.entries(before.ledger.sources)) assert.deepEqual(prepared.ledger.sources[id], row, id);
  assert.deepEqual(prepared.ledger.publication_holds, before.ledger.publication_holds);
  const recovered = new Set(checker.verifyLaterRecoveries(prepared.pool, prepared.ledger, { referenceRoot }));
  for (const sourceId of checker.HELD) {
    const id = 'english-2024-myschool-' + sourceId;
    if (recovered.has(sourceId)) {
      assert.deepEqual(prepared.pool.questions.find(row => row.id === id), before.pool.questions.find(row => row.id === id));
      assert.deepEqual(prepared.ledger.questions[id], before.ledger.questions[id]);
    } else {
      assert(!prepared.pool.questions.some(row => row.id === id));
      assert(!prepared.ledger.questions[id]);
    }
  }
});

test('replay is idempotent and changed existing content, source review, or key is refused', () => {
  const prepared = prepare();
  const replay = prepareBatch(manifest, snapshot, independentReview, prepared.pool, prepared.ledger, options);
  assert.deepEqual(replay.pool, prepared.pool); assert.deepEqual(replay.ledger, prepared.ledger);
  assert.deepEqual(replay.receipt, prepared.receipt);
  if (receipt) assert.deepEqual(prepared.receipt, receipt, 'Installed receipt must match replay');
  const changed = structuredClone(prepared.pool); changed.questions.find(row => row.id === ids[0]).question += ' Changed.';
  assert.throws(() => prepareBatch(manifest, snapshot, independentReview, changed, prepared.ledger, options), /Existing intake content changed/);
  const changedReview = structuredClone(prepared.ledger);
  changedReview.sources[changedReview.questions[ids[0]].source_id].official_answer_key = true;
  assert.throws(() => prepareBatch(manifest, snapshot, independentReview, prepared.pool, changedReview, options), /Existing source review differs/);
});

test('invented numbering/sitting, ID-position confusion, missing source context/options/targets and held additions are rejected', () => {
  for (const change of [
    row => { row.records[0].num = 76; }, row => { row.sitting_authenticated = true; },
    row => { row.year_basis = 'authenticated-sitting'; }, row => { row.records[0].source_question_id = row.records[0].source_item; },
    row => { row.records[0].source_item = 77; }, row => { row.records[0].choices.pop(); },
    row => { row.records[1].question = row.records[1].question.replace('Tayo', 'Ada'); },
    row => { row.records[1].choices[2] = 'He ended the relationship completely'; },
    row => { row.records[0].question = row.records[0].question.replace(' Target: the initial P in Public.', ''); },
    row => { row.records[3].question = row.records[3].question.replace(' Target word: cherishes.', ''); },
    row => { row.records[0].source_url = row.records[0].source_url.replace('exam_year=2024', 'exam_year=2025'); },
    row => { row.records[0].source_question_id = 70056; }, row => { row.held_source_items.pop(); }
  ]) {
    const wrong = structuredClone(manifest); change(wrong);
    assert.throws(() => prepareBatch(wrong, snapshot, independentReview, pool, ledger, options));
  }
  const duplicate = beforeBatch();
  duplicate.pool.questions.push({ ...structuredClone(prepare().pool.questions.find(row => row.id === ids[1])), id: 'other-existing-id' });
  assert.throws(() => prepare(duplicate), /Duplicate prompt or source identity/);
});

test('independent keys and pinned original source digests defeat tampering after ledger/receipt hashes are recomputed', () => {
  const prepared = prepare(), wrongPool = structuredClone(prepared.pool), wrongLedger = structuredClone(prepared.ledger), wrongReceipt = structuredClone(prepared.receipt);
  const wrong = wrongPool.questions.find(row => row.id === ids[0]); wrong.answer = 'A';
  const changedHash = trust.questionFingerprint(wrong); wrongLedger.questions[wrong.id].content_sha256 = changedHash;
  const proof = wrongReceipt.records.find(row => row.id === wrong.id);
  proof.answer = 'A'; proof.independently_selected_answer = wrong.options.A; proof.content_sha256 = changedHash;
  assert.throws(() => checker.verify(manifest, snapshot, independentReview, wrongPool, wrongLedger, wrongReceipt, bytes, options), /independently selected answer/);
  const wrongManifest = structuredClone(manifest), wrongReview = structuredClone(independentReview);
  wrongManifest.records[0].answer = 'A'; wrongReview.records[0].answer = 'A'; wrongReview.records[0].answer_text = wrongManifest.records[0].choices[0];
  assert.throws(() => prepareBatch(wrongManifest, snapshot, wrongReview, pool, ledger, { referenceRoot }), /independently selected key/);
  const newSource = structuredClone(snapshot), source = newSource.records.find(row => row.source_question_id === 70060);
  source.question_text = source.question_text.replace('Tayo', 'Ada');
  source.reviewer_semantic_payload.promptText = source.reviewer_semantic_payload.promptText.replace('Tayo', 'Ada');
  source.reviewer_semantic_sha256 = trust.questionFingerprint(source.reviewer_semantic_payload);
  source.exact_content_sha256 = trust.questionFingerprint(Object.fromEntries(['question_text', 'choices', 'targeted_text', 'prompt_image_count'].map(key => [key, source[key]])));
  assert.throws(() => checker.validateManifest(manifest, newSource, independentReview, options), /independently pinned source digest/);
});

test('public projection preserves all old published objects, adds nine, and exposes no private intake evidence', () => {
  const before = beforeBatch(), prepared = prepare(before), flashcards = read(referenceRoot, 'ops/jamb/source-flashcards.json');
  const previous = buildPublications(before.pool, flashcards, before.ledger), current = buildPublications(prepared.pool, flashcards, prepared.ledger);
  const oldEnglish = previous.files['pools/english.json'], english = current.files['pools/english.json'];
  assert.equal(english.questions.length, oldEnglish.questions.length + ids.length);
  assert.equal(english.questions.filter(row => row.year === 2024).length,
    oldEnglish.questions.filter(row => row.year === 2024).length + ids.length);
  assert.deepEqual(english.questions.filter(row => ids.includes(row.id)).map(row => row.id).sort(), [...ids].sort());
  assert.deepEqual(english.questions.filter(row => !ids.includes(row.id)), oldEnglish.questions);
  for (const [name, payload] of Object.entries(current.files)) validatePublication(payload, current.revision, name);
  for (const id of ids) {
    const q = english.questions.find(row => row.id === id); validateReviewedObject(q);
    assert.equal(q.num, null); assert.equal(q.source_provenance.year_basis, 'publisher-collection');
    assert.deepEqual(Object.keys(q).sort(), ['answer', 'explanation', 'format', 'has_diagram', 'id', 'num', 'options', 'question', 'review', 'source_provenance', 'subject', 'verification', 'year']);
    assert.doesNotMatch(JSON.stringify(q), /source_prompt_sha256|distractor_review|private_wording|reuse_authorization|raw_response|semantic_payload|independent_source_urls|ops\/|source_snapshot|held_source_items/);
    assert.notEqual(q.review.content_sha256, prepared.receipt.source_snapshot_sha256);
  }
});

test('2024 page keeps every source option and answer disclosure closed; real browser trust accepts the CBT collection', async () => {
  const before = beforeBatch(), prepared = prepare(before);
  const page = renderYear('english', '2024', prepared.pool.questions, prepared.ledger, ['2021', '2022', '2023', '2024', '2025']);
  const previous = renderYear('english', '2024', before.pool.questions, before.ledger, ['2021', '2022', '2023', '2024', '2025']);
  assert.deepEqual([...page.approvedIds].sort(), [...previous.approvedIds, ...ids].sort());
  assert.match(page.html, /publisher-labelled 2024/); assert.match(page.html, /original UTME sitting and question numbers are unconfirmed/i);
  for (const id of ids) {
    const card = page.html.match(new RegExp(`<article[^>]+data-reviewed-question="${id}"[^>]*>([\\s\\S]*?)<\\/article>`));
    assert(card, id); assert.match(card[1], /<details><summary>Answer and explanation<\/summary>/);
    assert.doesNotMatch(card[1], /<details\b[^>]*\bopen\b/);
  }
  assert(!page.html.includes('english-2024-myschool-70056'));
  const publication = buildPublications(prepared.pool, read(referenceRoot, 'ops/jamb/source-flashcards.json'), prepared.ledger);
  const bank = publication.files['pools/english.json'];
  for (const engine of ['engines/src/jamb-cbt-engine.js', 'engines/jamb-cbt-engine.js']) {
    const context = { crypto: webcrypto, TextEncoder, fetch: async () => ({ ok: true, json: async () => structuredClone(bank) }) };
    context.window = context;
    vm.runInNewContext(fs.readFileSync(path.join(referenceRoot, 'assets/js/lib/jamb-question-trust.js'), 'utf8'), context);
    const loaded = await context.AfroJAMB.QuestionTrust.loadPool('/data/jamb/pools/english.json');
    vm.runInNewContext(fs.readFileSync(path.join(referenceRoot, engine), 'utf8'), context);
    const selected = context.AfroJAMB.CBT.selectQuestions({ pool: loaded.questions, poolRevision: loaded.review_revision, subjects: ['english'], year: 2024, questionsPerSubject: page.approvedIds.length, mode: 'subject' });
    assert.equal(selected.length, page.approvedIds.length);
    assert.deepEqual(Array.from(selected, row => row.id).sort(), [...page.approvedIds].sort());
    assert(selected.every(row => row.subject === 'english' && row.year === 2024 && row.answer));
    for (const id of ids) assert(selected.some(row => row.id === id), engine + ': ' + id);
  }
});
