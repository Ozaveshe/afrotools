'use strict';

const assert = require('node:assert/strict');
const engine = require('../tools/waec-calculator/waec-engine.js');

const nigeria = engine.calculateNigeria([
  { name: 'English Language', grade: 'B3' },
  { name: 'Mathematics', grade: 'C6' },
  { name: 'Biology', grade: 'A1' },
  { name: 'Chemistry', grade: 'B2' },
  { name: 'Physics', grade: 'C4' },
  { name: 'Civic Education', grade: 'D7' }
]);
assert.equal(nigeria.value, 16);
assert.equal(nigeria.credits, 5);
assert.equal(nigeria.complete, true);
assert.equal(nigeria.checks.every((check) => check.pass), true);
assert.match(nigeria.note, /not an official Nigerian admission aggregate/i);

const ghScience = engine.calculateGhana([
  { name: 'English Language', grade: 'B3' },
  { name: 'Core Mathematics', grade: 'B2' },
  { name: 'Integrated Science', grade: 'C4' },
  { name: 'Social Studies', grade: 'A1' },
  { name: 'Physics', grade: 'B3' },
  { name: 'Chemistry', grade: 'C5' },
  { name: 'Biology', grade: 'A1' },
  { name: 'Elective Mathematics', grade: 'C6' }
], 'science');
assert.equal(ghScience.value, 18);
assert.deepEqual(
  ghScience.selected.map((row) => row.name),
  ['English Language', 'Core Mathematics', 'Integrated Science', 'Biology', 'Physics', 'Chemistry']
);

const ghArts = engine.calculateGhana([
  { name: 'English Language', grade: 'B3' },
  { name: 'Core Mathematics', grade: 'B2' },
  { name: 'Integrated Science', grade: 'F9' },
  { name: 'Social Studies', grade: 'A1' },
  { name: 'Economics', grade: 'B3' },
  { name: 'Government', grade: 'C4' },
  { name: 'History', grade: 'C5' }
], 'non-science');
assert.equal(ghArts.value, 18);
assert.equal(ghArts.selected.some((row) => row.name === 'Integrated Science'), false);

const incomplete = engine.calculateGhana([
  { name: 'English Language', grade: 'A1' },
  { name: 'Core Mathematics', grade: 'A1' }
], 'science');
assert.equal(incomplete.value, null);
assert.equal(incomplete.complete, false);

console.log('WAEC/NECO planner verified: Nigeria planning index, credit audit, Ghana programme-core aggregate, and incomplete-state guard.');
