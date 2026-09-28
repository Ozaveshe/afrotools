'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { create } = require('../assets/js/lib/jamb-original-retry');

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
