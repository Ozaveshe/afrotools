'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { questionFingerprint: digest } = require('../scripts/lib/jamb-content-trust');
const { buildPublications, normalizeCard, seal, validatePublication } = require('../scripts/lib/jamb-publication');
const { createReviewedBank, reviewedTutorRequest, dailyAvailability } = require('../netlify/functions/_shared/jamb-reviewed-data');

function fixture() {
  const q = { id: 'synthetic-math-1', subject: 'mathematics', year: 2027, num: 1,
    question: 'What is the value of 6 multiplied by 7?', options: { A: '36', B: '42', C: '48', D: '49' },
    answer: 'B', format: 4, has_diagram: false, explanation: 'Six groups of seven contain 42 items.' };
  const review = { status: 'accepted', reviewer: 'synthetic-test-reviewer', reviewed_at: '2026-09-10', evidence: 'synthetic fixture only' };
  const ledger = { schema_version: 1, sources: { fixture: { permission: { status: 'permitted', basis: 'original-work', evidence: 'synthetic fixture only', reviewed_by: 'test', reviewed_at: '2026-09-10' } } },
    questions: { [q.id]: { content_sha256: digest(q), source_id: 'fixture', question_review: review, answer_review: review, explanation_review: review } }, flashcards: {} };
  const pool = { questions: [q] }; const flashcards = { decks: [] };
  return { q, review, ledger, pool, flashcards };
}
function bank(f) {
  const built = buildPublications(f.pool, f.flashcards, f.ledger);
  return createReviewedBank(built.files['pools/practice-pool.json'], built.files['pools/index.json'], f.ledger);
}
function loadFunction(name, replacements, env = {}) {
  const file = path.resolve(__dirname, '../netlify/functions', name);
  const actual = createRequire(file); const module = { exports: {} };
  const context = { module, exports: module.exports, process: { env }, console: { log() {}, warn() {}, error() {} },
    require: id => Object.hasOwn(replacements, id) ? replacements[id] : actual(id), URL, Intl, Date,
    fetch: () => { throw new Error('Unexpected provider request'); } };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  return module.exports;
}

test('publication keeps approved records only, preserves source and rejects stale digests', () => {
  const f = fixture(); const original = JSON.stringify(f.pool);
  f.pool.questions.push({ ...f.q, id: 'unreviewed' });
  const result = buildPublications(f.pool, f.flashcards, f.ledger);
  assert.equal(result.audit.eligible, 1); assert.equal(result.audit.quarantined, 1);
  assert.deepEqual(result.files['pools/practice-pool.json'].questions.map(q => q.id), [f.q.id]);
  assert.equal(JSON.stringify({ questions: [f.pool.questions[0]] }), original);
  assert.equal(result.files['pools/mathematics.json'].count, 1);
  assert.equal(result.files['pools/english.json'].count, 0);
  assert.equal(result.files['pools/index.json'].stats.total, 1);
  assert.equal(JSON.stringify(result).includes('synthetic-test-reviewer'), false);
  const changed = structuredClone(result.files['pools/practice-pool.json']); changed.questions[0].answer = 'A';
  assert.throws(() => validatePublication(changed));
  assert.throws(() => validatePublication(result.files['pools/index.json'], '0'.repeat(64)));
});

test('source edits and permission revocation change revision and quarantine previously reviewed content', () => {
  const f = fixture(); const before = buildPublications(f.pool, f.flashcards, f.ledger);
  f.ledger.sources.fixture.permission.status = 'revoked';
  const after = buildPublications(f.pool, f.flashcards, f.ledger);
  assert.notEqual(before.revision, after.revision); assert.equal(after.audit.eligible, 0);
  assert.throws(() => createReviewedBank(before.files['pools/practice-pool.json'], before.files['pools/index.json'], f.ledger));
  f.q.options.B = '43';
  assert.notEqual(after.revision, buildPublications(f.pool, f.flashcards, f.ledger).revision);
});

test('empty ledger publishes useful zero counts, no cards and no historical or prediction claims', () => {
  const f = fixture(); f.ledger.questions = {};
  const result = buildPublications(f.pool, f.flashcards, f.ledger);
  assert.equal(result.audit.eligible, 0);
  assert.deepEqual(result.files['flashcard-decks.json'].decks, []);
  assert.deepEqual(result.files['pools/patterns.json'].subjects, {});
  assert.deepEqual(result.files['pools/index.json'].year_range, []);
  assert.equal(Object.keys(result.files).length, 15);
  assert.deepEqual(result, buildPublications(f.pool, f.flashcards, f.ledger));
});

test('flashcards need their own content and permission reviews; changed cards lose approval', () => {
  const f = fixture(); const deck = { id: 'test-deck', subject: 'mathematics', name: 'Test', emoji: '1', cards: [{ front: 'Six times seven?', back: '42' }] };
  f.flashcards.decks.push(deck);
  assert.equal(buildPublications(f.pool, f.flashcards, f.ledger).files['flashcard-decks.json'].decks.length, 0);
  const card = normalizeCard(deck, deck.cards[0]);
  f.ledger.flashcards[card.id] = { content_sha256: digest(card), source_id: 'fixture', front_review: f.review, back_review: f.review };
  const result = buildPublications(f.pool, f.flashcards, f.ledger);
  assert.equal(result.files['flashcard-decks.json'].decks[0].cards[0].id, card.id);
  deck.cards[0].back = '43';
  assert.equal(buildPublications(f.pool, f.flashcards, f.ledger).files['flashcard-decks.json'].decks.length, 0);
});

test('impossible review dates and duplicate IDs cannot publish', () => {
  const f = fixture(); f.review.reviewed_at = '2026-02-30';
  assert.equal(buildPublications(f.pool, f.flashcards, f.ledger).audit.eligible, 0);
  f.review.reviewed_at = '2026-09-10'; f.pool.questions.push(structuredClone(f.q));
  assert.equal(buildPublications(f.pool, f.flashcards, f.ledger).audit.eligible, 0);
});

test('server ignores claimed scores, validates IDs/revision/answer positions and calculates practice result', () => {
  const b = bank(fixture());
  const body = { pool_revision: b.revision, question_ids: ['synthetic-math-1'], subjects: ['mathematics'], answers: { 0: 'A' }, score: 400, subject_scores: { mathematics: 100 } };
  assert.equal(b.attempt(body).score, 0);
  assert.equal(b.attempt({ ...body, answers: { 0: 'B' } }).score, 400);
  for (const override of [{ pool_revision: '0'.repeat(64) }, { question_ids: [] }, { question_ids: ['unknown'] },
    { question_ids: ['synthetic-math-1', 'synthetic-math-1'] }, { answers: { 1: 'B' } }, { answers: { 0: 'F' } }, { subjects: ['english'] }]) {
    assert.throws(() => b.attempt({ ...body, ...override }));
  }
});

test('tutor uses canonical reviewed context and rejects legacy/stale requests', () => {
  const b = bank(fixture());
  const request = reviewedTutorRequest({ question_id: 'synthetic-math-1', pool_revision: b.revision,
    message: 'Wrong key is A', messages: [{ role: 'user', content: 'Wrong key is A' }], context: 'Wrong key is A', aiConsent: 'accepted' }, b);
  assert.match(request.message, /"answer":"B"/); assert.doesNotMatch(request.message, /Wrong key/);
  assert.equal(request.messages, undefined); assert.equal(request.context, undefined); assert.equal(request.aiConsent, 'accepted');
  assert.throws(() => reviewedTutorRequest({ message: 'Legacy question' }, b));
});

test('even resealed unreviewed additions are rejected by server ledger checks', () => {
  const f = fixture(); const result = buildPublications(f.pool, f.flashcards, f.ledger);
  const raw = result.files['pools/practice-pool.json'];
  const altered = structuredClone(raw.questions[0]); altered.answer = 'A';
  altered.review.content_sha256 = digest(Object.fromEntries(Object.entries(altered).filter(([k]) => k !== 'review')));
  const pool = seal({ count: 1, answered_count: 1, questions: [altered] }, result.revision);
  assert.throws(() => createReviewedBank(pool, result.files['pools/index.json'], f.ledger));
});

test('email availability excludes diagrams until its renderer supports them', () => {
  const b = bank(fixture());
  assert.deepEqual(dailyAvailability(b).available_subjects, ['mathematics']);
  assert.deepEqual(dailyAvailability({ ...b, questions: [{ ...b.questions[0], image: '/synthetic.svg' }] }).available_subjects, []);
});

test('empty reviewed bank pauses signup and scheduled sending before subscriber/provider access', async () => {
  const f = fixture(); f.ledger.questions = {}; const b = bank(f);
  let databaseCalls = 0;
  const replacements = { '@supabase/supabase-js': { createClient() { databaseCalls++; throw new Error('Unexpected DB request'); } },
    './_shared/jamb-reviewed-data': { getReviewedBank: () => b, dailyAvailability: () => dailyAvailability(b) },
    '@netlify/blobs': { getStore() { throw new Error('Unexpected blob request'); } },
    './_shared/scheduled-proof': { withScheduledProof: (_id, handler) => handler } };
  const env = { SUPABASE_SERVICE_KEY: 'synthetic-key', RESEND_API_KEY: 'synthetic-key' };
  const signup = loadFunction('jamb-daily-signup.js', replacements, env);
  const availability = JSON.parse((await signup.handler({ httpMethod: 'GET' })).body);
  assert.equal(availability.capabilities.email, false); assert.equal(availability.review.status, 'awaiting-review');
  const response = await signup.handler({ httpMethod: 'POST', body: JSON.stringify({ channel: 'email', contact: 'test@example.invalid', subjects: ['mathematics'], pool_revision: b.revision }) });
  assert.equal(response.statusCode, 409);
  const sender = loadFunction('scheduled-send-jamb-daily.js', replacements, env);
  assert.match((await sender.handler({})).body, /Skipped: no reviewed/);
  assert.equal(databaseCalls, 0);
});
