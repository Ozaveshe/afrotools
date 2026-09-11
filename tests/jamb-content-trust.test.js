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
