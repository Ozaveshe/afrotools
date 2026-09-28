'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { create, createRevision, resolveRevision } = require('../assets/js/lib/jamb-original-retry');
const published = require('../data/jamb/pools/original-practice.json');

test('retry only advances through graded wrong and skipped review items without altering the original result', () => {
  const options = Object.freeze({ A: 'One', B: 'Two' });
  const reviews = Object.freeze([
    Object.freeze({ index: 0, graded: true, correct: true, wrong: false, skipped: false, options, correctAnswer: 'B' }),
    Object.freeze({ index: 1, graded: true, correct: false, wrong: true, skipped: false, options, correctAnswer: 'B', explanation: 'Two is correct.' }),
    Object.freeze({ index: 2, graded: true, correct: false, wrong: false, skipped: true, options, correctAnswer: 'A', explanation: 'One is correct.' }),
    Object.freeze({ index: 3, graded: false, correct: false, wrong: false, skipped: true, options, correctAnswer: null })
  ]);
  const retry = create(reviews);
  assert.equal(retry.count, 2);
  assert.equal(retry.current().index, 1);
  assert.equal(retry.position(), 1);
  assert.equal(retry.next(), false);
  assert.equal(retry.check(null), null);
  assert.equal(retry.check('C'), null);
  assert.deepEqual(retry.check('A'), { correct: false, correctAnswer: 'B', explanation: 'Two is correct.' });
  assert.equal(retry.check('B'), null);
  assert.equal(retry.next(), true);
  assert.equal(retry.current().index, 2);
  assert.equal(retry.position(), 2);
  assert.deepEqual(retry.check('A'), { correct: true, correctAnswer: 'A', explanation: 'One is correct.' });
  assert.equal(retry.next(), true);
  assert.equal(retry.current(), null);
  assert.equal(retry.check('A'), null);
  assert.equal(retry.next(), false);
  assert.equal(reviews[1].wrong, true);
  assert.equal(reviews[2].skipped, true);
  assert.equal(create([reviews[0]]).count, 0);
});

function savedRevision(questions) {
  return { bankId: published.collection_id, locale: 'en', subject: questions[0].subject,
    ids: questions.map(question => question.id), contentHashes: questions.map(question => question.review.content_sha256),
    reviewRevision: published.review_revision };
}

test('untimed revision keeps the exact saved order and accepts bank additions only when selected content is unchanged', () => {
  const selected = [published.questions[8], published.questions[2], published.questions[5]];
  const saved = savedRevision(selected);
  const initial = JSON.stringify(saved);
  const additive = { ...published, review_revision: 'a'.repeat(64),
    questions: [...published.questions, { ...published.questions[0], id: 'ato-math-v1-99' }] };
  const resolved = resolveRevision(saved, additive);
  assert.deepEqual(resolved.map(question => question.id), saved.ids);
  assert.equal(JSON.stringify(saved), initial);
  const revision = createRevision(resolved);
  assert.equal(revision.count, 3);
  for (const question of selected) {
    assert.equal(revision.current().id, question.id);
    assert.equal(revision.next(), false);
    assert.equal(revision.check('Z'), null);
    assert.deepEqual(revision.check(question.answer), {
      correct: true, correctAnswer: question.answer, explanation: question.explanation
    });
    assert.equal(revision.check(question.answer), null);
    assert.equal(revision.next(), true);
  }
  assert.equal(revision.current(), null);
  assert.equal(revision.next(), false);
  assert.equal(JSON.stringify(saved), initial);
});

test('missing, changed, mixed-subject and malformed saved questions stop revision without substituting questions', () => {
  const selected = [published.questions[1], published.questions[4]];
  const saved = savedRevision(selected);
  const missing = { ...published, questions: published.questions.filter(question => question.id !== saved.ids[1]) };
  const changed = { ...published, questions: published.questions.map(question => question.id !== saved.ids[0] ? question :
    { ...question, review: { ...question.review, content_sha256: 'b'.repeat(64) } }) };
  assert.throws(() => resolveRevision(saved, missing), /no longer matches/);
  assert.throws(() => resolveRevision(saved, changed), /no longer matches/);
  for (const unsafe of [
    { ...saved, ids: [saved.ids[0], saved.ids[0]] },
    { ...saved, ids: [] },
    { ...saved, contentHashes: saved.contentHashes.slice(1) },
    { ...saved, contentHashes: ['x', saved.contentHashes[1]] },
    { ...saved, locale: 'fr' },
    { ...saved, bankId: 'another-bank' },
    { ...saved, subject: 'english' },
    { ...saved, ids: ['ato-math-v1-00', saved.ids[1]] }
  ]) assert.throws(() => resolveRevision(unsafe, published), /not supported|no longer matches/);
  assert.deepEqual(resolveRevision(saved, published), selected);
});

test('revision queue never changes frozen published questions or exposes a practice score', () => {
  const question = JSON.parse(JSON.stringify(published.questions[0]));
  Object.freeze(question.options); Object.freeze(question.review); Object.freeze(question);
  const queue = createRevision(Object.freeze([question]));
  const wrong = Object.keys(question.options).find(choice => choice !== question.answer);
  assert.equal(queue.check(wrong).correct, false);
  assert.equal(queue.next(), true);
  assert.equal(queue.current(), null);
  assert.equal(Object.hasOwn(queue, 'score'), false);
  assert.equal(question.answer, published.questions[0].answer);
  assert.throws(() => createRevision([]), /not supported/);
  assert.throws(() => createRevision([question, question]), /not supported/);
  assert.throws(() => createRevision([{ ...question, review: { status: 'held' } }]), /not supported/);
});
