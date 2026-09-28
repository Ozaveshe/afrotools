'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '../../..');
const manifestPath = 'ops/nigeria-exams/jamb-english-2024-curated-batch-03.json';
const snapshotPath = 'ops/nigeria-exams/jamb-english-2024-source-snapshot-03.json';
const reviewPath = 'ops/jamb/verification/english-2024-independent-review-904.json';
const receiptPath = 'ops/jamb/verification/english-2024-publishable-904.json';
const ACCEPTED = Object.freeze([70042, 70060, 70062, 70076, 70077, 70078, 70081, 70082, 70084]);
const WINDOW = Object.freeze([70042, 70056, 70057, 70060, 70062, 70064, 70066, 70067, 70069, 70070, 70072, 70074, 70076, 70077, 70078, 70079, 70081, 70082, 70083, 70084]);
const HELD = Object.freeze(WINDOW.filter(id => !ACCEPTED.includes(id)));
// Independently selected texts and exact inspected-source semantic digests.
// These are not derived from the import manifest or publisher answer letters.
const ANSWER_TEXT = Object.freeze({
  70042: 'handicap', 70060: 'He completely severed from his old friend',
  70062: 'needs to study late into the night', 70076: 'admires', 70077: 'were',
  70078: 'reach', 70081: 'theirs', 70082: 'geese', 70084: 'calls for'
});
const SOURCE_HASH = Object.freeze({
  70042: '6609220185c1286b87ba25d3f46d46c2d191df0b87e2ffe66915c983fcbfbcf7',
  70056: '96e83daa803ae60d978ca8b8e24460946cea64dc98bd54c445cbf95a0c65cf66',
  70060: '44fa31ff6637f8ce76382fcaaeb184234c184b74e8e1c36e131340b0948e7f1a',
  70062: '4e2ff000d7fcd4abbdd6fef909c58ba2c7bf9751fec171fa1eff747c3b11cbf7',
  70076: '7bcb962719e7dc0dfca005de9077f81aeb86ea3b2c8a43655d44e95b726b5787',
  70077: 'e8ef89d79f28a22d110e24fe0d8656793450eaea3238865efa27eec6f34543a0',
  70078: 'c3c699d63e0b5aabb14a784e962c55e3e9f8edb8a05f5eeed7a6a82a0e1d040c',
  70081: '73fefb900a8f1fc294d6cc1636adaeb3cfa60c27aa5360c488f2f946f74a666c',
  70082: '89795a810f93f31a97c4f9d03013244210be3d82808b8acaddd3f71f701a3039',
  70084: '794e834ce888b1ec7113dff357bbb03a5d9fc9f3603a1ee014ea17e735d77e2d'
});
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const ws = value => value.replace(/\s+/gu, ' ').trim();
const sourceUrl = (id, position) => `https://myschool.ng/classroom/english-language/${id}?exam_type=jamb&exam_year=2024&page=${Math.ceil(position / 5)}`;
const trustFor = referenceRoot => require(path.join(referenceRoot || ROOT, 'scripts/lib/jamb-content-trust.js'));

function displayPrompt(source) {
  if (source.source_question_id === 70042) {
    assert(source.question_text.endsWith('P ublic'), '70042: complete Public source target');
    return source.question_text.slice(0, -'P ublic'.length) + 'Public Target: the initial P in Public.';
  }
  if (source.source_question_id === 70076) return source.question_text + ' Target word: cherishes.';
  return source.question_text;
}

function checkSnapshotRecord(source, trust) {
  assert.equal(source.source_item, WINDOW.indexOf(source.source_question_id) + 76, 'position/ID mapping');
  assert.equal(source.source_url, sourceUrl(source.source_question_id, source.source_item), 'source URL/query/page');
  assert.equal(source.num, null); assert.equal(source.year_basis, 'publisher-collection');
  assert.equal(source.collection_year, 2024); assert.equal(source.http_status, 200);
  assert(Number.isFinite(Date.parse(source.retrieved_at_utc)), 'dated source observation');
  for (const field of ['raw_response_sha256', 'html_fragment_sha256', 'exact_content_sha256', 'reviewer_semantic_sha256']) assert.match(source[field], /^[a-f0-9]{64}$/);
  assert.deepEqual(source.choices.map(choice => choice.label), ['A', 'B', 'C', 'D']);
  assert(source.choices.every(choice => typeof choice.text === 'string' && choice.text.trim()));
  const payload = {
    promptText: ws(source.question_text),
    optionsText: ws(source.choices.map(choice => choice.label.toLowerCase() + ' ' + choice.text).join(' ')),
    underlined: source.targeted_text.map(ws)
  };
  assert.deepEqual(source.reviewer_semantic_payload, payload, 'source exact prompt/options/target payload');
  assert.equal(trust.questionFingerprint(payload), source.reviewer_semantic_sha256, 'source semantic fingerprint');
  const exact = Object.fromEntries(['question_text', 'choices', 'targeted_text', 'prompt_image_count'].map(key => [key, source[key]]));
  assert.equal(trust.questionFingerprint(exact), source.exact_content_sha256, 'exact structured source fingerprint');
  if (SOURCE_HASH[source.source_question_id]) assert.equal(source.reviewer_semantic_sha256, SOURCE_HASH[source.source_question_id], 'independently pinned source digest');
}

function validateManifest(manifest, snapshot, independentReview, options = {}) {
  const trust = trustFor(options.referenceRoot);
  for (const object of [manifest, snapshot, independentReview]) {
    assert.equal(object.schema_version, 1); assert.equal(object.year_basis, 'publisher-collection');
    assert.equal(object.sitting_authenticated, false); assert.equal(object.official_answer_key, false);
  }
  assert.equal(manifest.observed_at, '2026-09-28'); assert.equal(manifest.publisher, 'Myschool');
  assert.equal(manifest.collection_year, 2024); assert.equal(manifest.implementation_base_sha, null, 'base comes from the later verified implementation invocation');
  assert.equal(snapshot.publisher, 'Myschool'); assert.equal(snapshot.collection_year, 2024);
  assert.deepEqual(manifest.records.map(row => row.source_question_id), ACCEPTED, 'accepted source IDs');
  assert.deepEqual(snapshot.records.map(row => row.source_question_id), ACCEPTED);
  assert.deepEqual(independentReview.records.map(row => row.source_question_id), ACCEPTED);
  assert.deepEqual(manifest.held_source_items.map(row => row.source_question_id), HELD, 'held source IDs');
  assert.deepEqual(snapshot.held_records.map(row => row.source_question_id), HELD);
  const dispositions = [...manifest.records, ...manifest.held_source_items].sort((a, b) => a.source_item - b.source_item);
  assert.deepEqual(dispositions.map(row => row.source_item), Array.from({ length: 20 }, (_, i) => i + 76));
  assert.deepEqual(dispositions.map(row => row.source_question_id), WINDOW);
  assert.equal(independentReview.source_file, snapshotPath);
  assert.equal(independentReview.held_original_candidate.source_question_id, 70056);
  assert.equal(independentReview.held_original_candidate.source_item, 77);
  assert.equal(independentReview.held_original_candidate.verdict, 'held');
  assert.equal(independentReview.held_original_candidate.source_prompt_sha256, SOURCE_HASH[70056]);
  for (const source of [...snapshot.records, ...snapshot.held_records]) checkSnapshotRecord(source, trust);
  const answers = {};
  for (const row of manifest.records) {
    const source = snapshot.records.find(item => item.source_question_id === row.source_question_id);
    const proof = independentReview.records.find(item => item.source_question_id === row.source_question_id);
    assert.equal(row.source_item, source.source_item); assert.equal(proof.source_item, source.source_item);
    assert.equal(row.source_url, source.source_url); assert.equal(row.source_observed_at, source.retrieved_at_utc);
    assert.equal(row.source_prompt_sha256, SOURCE_HASH[row.source_question_id]);
    assert.equal(proof.source_prompt_sha256, row.source_prompt_sha256);
    assert.equal(row.num, null, 'collection position is not a paper number');
    assert.equal(row.question, displayPrompt(source), 'complete source stem/context and only explicit target clarification');
    assert.deepEqual(row.choices, source.choices.map(choice => choice.text), 'exact A-D source option text');
    assert.deepEqual(row.observed_options, Object.fromEntries(source.choices.map(choice => [choice.label, choice.text])));
    assert.equal(source.prompt_image_count, 0); assert.equal(source.shared_passage_required, false); assert.equal(source.attached_figure_required, false);
    assert.equal(typeof row.explanation, 'string'); assert(row.explanation.length >= 65);
    assert.doesNotMatch(row.explanation, /publisher|source|repair|transcription|corrected|restored/iu, 'no public repair/source history');
    assert.equal(proof.independent_reasoning, row.explanation);
    assert.equal(proof.verdict, 'accepted'); assert.deepEqual(Object.keys(proof.distractor_review).sort(), ['A', 'B', 'C', 'D']);
    assert.deepEqual(proof.primary_source_urls, row.independent_source_urls);
    assert(row.independent_source_urls.length > 0 && row.independent_source_urls.every(url => /^https:\/\//.test(url) && !url.includes('myschool.ng')));
    const matches = row.choices.map((text, index) => text === ANSWER_TEXT[row.source_question_id] ? 'ABCD'[index] : null).filter(Boolean);
    assert.equal(matches.length, 1, 'independently selected answer text must identify one exact source option');
    answers[row.source_question_id] = matches[0];
    assert.equal(row.answer, matches[0], 'independently selected key');
    assert.equal(proof.answer, matches[0]); assert.equal(proof.answer_text, ANSWER_TEXT[row.source_question_id]);
  }
  assert.deepEqual(snapshot.records.find(row => row.source_question_id === 70042).targeted_text, ['P']);
  assert.deepEqual(snapshot.records.find(row => row.source_question_id === 70076).targeted_text, ['cherishes']);
  return answers;
}

function verify(manifest, snapshot, independentReview, pool, ledger, receipt, bytes, options = {}) {
  const trust = trustFor(options.referenceRoot);
  const answers = validateManifest(manifest, snapshot, independentReview, options);
  assert.equal(receipt.source_file, snapshotPath); assert.equal(receipt.source_snapshot_sha256, sha(bytes.snapshot));
  assert.equal(receipt.source_manifest_sha256, sha(bytes.manifest)); assert.equal(receipt.independent_review_sha256, sha(bytes.review));
  assert.deepEqual(receipt.records.map(row => row.source_question_id), ACCEPTED);
  const checked = [];
  for (const row of manifest.records) {
    const id = 'english-2024-myschool-' + row.source_question_id;
    const question = pool.questions.find(item => item.id === id), review = ledger.questions[id];
    const proof = receipt.records.find(item => item.id === id), source = review && ledger.sources[review.source_id];
    assert(question && review && proof && source, id);
    assert.equal(question.answer, answers[row.source_question_id], 'independently selected answer');
    assert.equal(question.question, row.question); assert.deepEqual(Object.values(question.options), row.choices);
    assert.equal(question.explanation, row.explanation); assert.equal(question.num, null); assert.equal(question.year, 2024);
    assert.equal(question.subject, 'english'); assert.equal(question.format, 4); assert.equal(question.has_diagram, false);
    assert.equal(question.verification.method, 'ai-source-checked');
    assert.equal(question.verification.reviewed_at, manifest.observed_at);
    assert.deepEqual(Object.keys(question.source_provenance).sort(), ['publisher', 'url', 'year_basis']);
    assert.equal(question.source_provenance.url, row.source_url); assert.equal(question.source_provenance.year_basis, 'publisher-collection');
    assert.deepEqual(Object.keys(question).sort(), ['answer', 'explanation', 'format', 'has_diagram', 'id', 'num', 'options', 'question', 'source_provenance', 'subject', 'verification', 'year']);
    assert.equal(source.source_file, snapshotPath); assert.equal(source.source_url, row.source_url);
    assert.equal(source.sitting_authenticated, false); assert.equal(source.official_answer_key, false);
    assert.equal(source.content_sha256, receipt.source_snapshot_sha256);
    assert.equal(source.reuse_authorization.material_sha256, receipt.source_snapshot_sha256);
    assert.equal(proof.source_item, row.source_item); assert.equal(proof.answer, answers[row.source_question_id]);
    assert.equal(proof.independently_selected_answer, ANSWER_TEXT[row.source_question_id]);
    assert.equal(proof.content_sha256, trust.questionFingerprint(question)); assert.equal(review.content_sha256, proof.content_sha256);
    assert.equal(trust.assessQuestion(question, ledger).state, 'eligible', id);
    checked.push(id);
  }
  for (const heldId of HELD) assert(!pool.questions.some(row => row.id === 'english-2024-myschool-' + heldId), 'held source item must not be introduced');
  return { passed: true, accepted: checked.length, held_or_excluded: HELD.length, question_ids: checked, scope: 'source-faithful publisher collection; formal sitting unconfirmed' };
}

if (require.main === module) {
  const bytes = Object.fromEntries([['manifest', manifestPath], ['snapshot', snapshotPath], ['review', reviewPath]].map(([key, relative]) => [key, fs.readFileSync(path.join(ROOT, relative))]));
  const read = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
  const result = verify(JSON.parse(bytes.manifest), JSON.parse(bytes.snapshot), JSON.parse(bytes.review),
    read('ops/jamb/source-pool.json'), read('data/jamb/review-ledger.json'), read(receiptPath), bytes);
  process.stdout.write(JSON.stringify(result) + '\n');
}
module.exports = { validateManifest, verify, displayPrompt, sha, trustFor, ACCEPTED, HELD, WINDOW, ANSWER_TEXT, SOURCE_HASH, manifestPath, snapshotPath, reviewPath, receiptPath };
