'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { assessQuestion, auditQuestions, questionFingerprint } = require('../scripts/lib/jamb-content-trust');

function fixture() {
  const question = { id: 'synthetic-math-1', subject: 'mathematics', year: 2027, num: 1,
    question: 'What is the value of 6 multiplied by 7?', options: { A: '36', B: '42', C: '48', D: '49' },
    answer: 'B', format: 4, has_diagram: false, explanation: 'Six groups of seven contain 42 items.' };
  const review = { status: 'accepted', reviewer: 'synthetic-test-reviewer', reviewed_at: '2026-09-10', evidence: 'synthetic test fixture only' };
  const ledger = { sources: { fixture: { permission: { status: 'permitted', basis: 'original-work', evidence: 'synthetic fixture', reviewed_by: 'test', reviewed_at: '2026-09-10' } } },
    questions: { [question.id]: { content_sha256: questionFingerprint(question), source_id: 'fixture', question_review: review, answer_review: review, explanation_review: review } } };
  return { question, ledger };
}

test('a truthy answer and fluent explanation do not bypass missing evidence', () => {
  const { question } = fixture();
  const result = assessQuestion(question);
  assert.equal(result.state, 'quarantined');
  assert.ok(result.reasons.includes('permission_unverified'));
  assert.ok(result.reasons.includes('review_record_missing'));
});

test('recorded complete reviews allow the unchanged synthetic content only', () => {
  const { question, ledger } = fixture();
  assert.equal(assessQuestion(question, ledger).state, 'eligible');
  question.options.B = '43';
  assert.ok(assessQuestion(question, ledger).reasons.includes('review_content_changed'));
});

test('fingerprints are stable across object key order but pin wording and added context', () => {
  const { question } = fixture();
  assert.equal(questionFingerprint(question), questionFingerprint(Object.fromEntries(Object.entries(question).reverse())));
  assert.notEqual(questionFingerprint(question), questionFingerprint({ ...question, passage: 'Added context' }));
});

test('complete six-option questions retain F and reject malformed option sets', () => {
  const { question, ledger } = fixture();
  question.options = { A: '36', B: '40', C: '48', D: '49', E: '41', F: '42' };
  question.answer = 'F'; question.format = 6;
  ledger.questions[question.id].content_sha256 = questionFingerprint(question);
  assert.equal(assessQuestion(question, ledger).state, 'eligible');
  delete question.options.E;
  assert.ok(assessQuestion(question, ledger).reasons.includes('incomplete_options'));
  question.options.E = '41'; question.options.G = '43'; question.format = 7;
  assert.ok(assessQuestion(question, ledger).reasons.includes('incomplete_options'));
});

test('incomplete option sets, unknown answer keys and duplicated choices are blocked', () => {
  const { question } = fixture();
  const result = assessQuestion({ ...question, options: { A: 'same', C: 'same', D: '' }, answer: 'B' });
  for (const reason of ['incomplete_options', 'answer_not_in_options', 'duplicate_option_text', 'empty_option', 'option_format_mismatch']) assert.ok(result.reasons.includes(reason), reason);
});

test('passage and visual dependencies need their actual supporting content', () => {
  const { question } = fixture();
  assert.ok(assessQuestion({ ...question, question: 'According to the passage, what does the author mean?' }).reasons.includes('missing_passage_or_context'));
  assert.ok(assessQuestion({ ...question, question: 'Use the graph below to find the highest value.' }).reasons.includes('missing_visual_or_description'));
  assert.ok(assessQuestion({ ...question, has_diagram: true }).reasons.includes('missing_visual_or_description'));
});

test('OCR debris and uncertain AI explanations stay quarantined even with an answer', () => {
  const { question } = fixture();
  const result = assessQuestion({ ...question, question: question.question + ' [PAGE 8]', explanation: 'The value is 41... (rechecking: 42 matches).' });
  assert.ok(result.reasons.includes('ocr_or_placeholder_artifact'));
  assert.ok(result.reasons.includes('explanation_requires_correction'));
});

test('visual approvals bind the image path to the reviewed asset checksum', () => {
  const { question, ledger } = fixture();
  const hash = 'a'.repeat(64);
  Object.assign(question, { has_diagram: true, image: '/assets/img/jamb/' + hash + '.svg', image_alt: 'Six rows of seven counters.' });
  const review = ledger.questions[question.id];
  review.content_sha256 = questionFingerprint(question);
  review.asset_review = { ...review.question_review, content_sha256: hash };
  assert.equal(assessQuestion(question, ledger).state, 'eligible');
  review.asset_review.content_sha256 = 'b'.repeat(64);
  assert.ok(assessQuestion(question, ledger).reasons.includes('asset_content_changed'));
  question.image = '/assets/img/jamb/mutable.svg';
  assert.ok(assessQuestion(question, ledger).reasons.includes('unsupported_visual_asset'));
});

test('a self-contained author-identification question is not treated as missing a passage', () => {
  const { question } = fixture();
  assert.equal(assessQuestion({ ...question, question: 'Who is the author of Things Fall Apart?' }).reasons.includes('missing_passage_or_context'), false);
});

test('permission cannot be inferred from a PDF filename or incomplete review', () => {
  const { question, ledger } = fixture();
  ledger.sources.fixture.permission.status = 'unknown';
  ledger.questions[question.id].answer_review = { status: 'accepted' };
  const result = assessQuestion(question, ledger);
  assert.ok(result.reasons.includes('permission_unverified'));
  assert.ok(result.reasons.includes('answer_review_missing'));
});

test('duplicate IDs block every affected record rather than silently choosing one', () => {
  const { question, ledger } = fixture();
  const result = auditQuestions([question, { ...question }], ledger);
  assert.equal(result.eligible, 0);
  assert.equal(result.reasons.duplicate_id, 2);
});

test('owner authorization is material-specific and does not replace answer review', () => {
  const { question, ledger } = fixture();
  const hash = 'a'.repeat(64);
  ledger.sources.fixture = {
    source_file: 'user-supplied-fixture.pdf', content_sha256: hash,
    reuse_authorization: { status: 'authorized-by-owner', basis: 'user-provided-material',
      scope: 'AfroTools past-question practice', material_sha256: hash,
      authorized_by: 'Synthetic owner', authorized_at: '2026-09-11', instruction_ref: 'Synthetic explicit instruction' }
  };
  assert.equal(assessQuestion(question, ledger).state, 'eligible');
  ledger.sources.fixture.reuse_authorization.material_sha256 = 'b'.repeat(64);
  assert.ok(assessQuestion(question, ledger).reasons.includes('permission_unverified'));
  ledger.sources.fixture.reuse_authorization.material_sha256 = hash;
  delete ledger.questions[question.id].answer_review;
  assert.ok(assessQuestion(question, ledger).reasons.includes('answer_review_missing'));
});

test('AI answer reviews require a matching public verification label', () => {
  const { question, ledger } = fixture();
  ledger.questions[question.id].answer_review = {
    ...ledger.questions[question.id].answer_review, reviewer_type: 'ai'
  };
  assert.ok(assessQuestion(question, ledger).reasons.includes('verification_label_missing'));
  question.verification = { method: 'ai-calculation-checked', reviewed_at: '2026-09-10' };
  ledger.questions[question.id].content_sha256 = questionFingerprint(question);
  assert.equal(assessQuestion(question, ledger).state, 'eligible');
  question.verification.reviewed_at = '2026-09-11';
  ledger.questions[question.id].content_sha256 = questionFingerprint(question);
  assert.ok(assessQuestion(question, ledger).reasons.includes('verification_label_missing'));
});

test('verification metadata cannot publish private fields or unsupported approval claims', () => {
  const { question, ledger } = fixture();
  for (const verification of [null, [], 'approved',
    { method: 'teacher-approved', reviewed_at: '2026-09-10' },
    { method: 'ai-calculation-checked', reviewed_at: '2026-09-10', private_note: 'internal' }]) {
    const candidate = { ...question, verification };
    ledger.questions[question.id].content_sha256 = questionFingerprint(candidate);
    assert.ok(assessQuestion(candidate, ledger).reasons.includes('invalid_verification_label'));
  }
});

test('source-checked AI review retains date, content, source and structural gates', () => {
  const { question, ledger } = fixture();
  question.subject = 'english';
  question.verification = { method: 'ai-source-checked', reviewed_at: '2026-09-10' };
  ledger.questions[question.id].answer_review.reviewer_type = 'ai';
  ledger.questions[question.id].content_sha256 = questionFingerprint(question);
  assert.equal(assessQuestion(question, ledger).state, 'eligible');
  for (const verification of [
    { method: 'officially-approved', reviewed_at: '2026-09-10' },
    { method: 'ai-source-checked', reviewed_at: '2026-02-30' },
    { method: 'ai-source-checked', reviewed_at: '2026-09-10', private_note: 'repair history' }
  ]) {
    const candidate = { ...question, verification };
    ledger.questions[question.id].content_sha256 = questionFingerprint(candidate);
    assert.ok(assessQuestion(candidate, ledger).reasons.includes('invalid_verification_label'));
  }
  ledger.questions[question.id].content_sha256 = questionFingerprint(question);
  assert.ok(assessQuestion({ ...question, question: 'Changed content' }, ledger).reasons.includes('review_content_changed'));
  question.verification.reviewed_at = '2026-09-11';
  assert.ok(assessQuestion(question, ledger).reasons.includes('verification_label_missing'));
  ledger.sources.fixture.permission.status = 'unknown';
  assert.ok(assessQuestion(question, ledger).reasons.includes('permission_unverified'));
  assert.ok(assessQuestion({ ...question, question: 'According to the passage, what does this mean?' }, ledger).reasons.includes('missing_passage_or_context'));
});
