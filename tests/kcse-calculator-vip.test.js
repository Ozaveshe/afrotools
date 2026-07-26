'use strict';

const assert = require('node:assert/strict');
const engine = require('../tools/kcse-calculator/kcse-engine.js');

assert.equal(engine.gradePoints('A'), 12);
assert.equal(engine.gradePoints('E'), 1);
assert.equal(engine.gradePoints(''), null);
assert.equal(engine.aggregateGrade(84), 'A');
assert.equal(engine.aggregateGrade(81), 'A');
assert.equal(engine.aggregateGrade(80), 'A-');
assert.equal(engine.aggregateGrade(74), 'A-');
assert.equal(engine.aggregateGrade(73), 'B+');
assert.equal(engine.aggregateGrade(7), 'E');

const forcedMath = engine.calculate({
  mathematics: 'E',
  english: 'A',
  kiswahili: 'E',
  others: [
    { subject: 'Biology', grade: 'A' }, { subject: 'Physics', grade: 'A' },
    { subject: 'Chemistry', grade: 'A' }, { subject: 'History', grade: 'A' },
    { subject: 'Geography', grade: 'A' }, { subject: 'Business', grade: 'A' },
    { subject: 'Agriculture', grade: 'A' }
  ]
});
assert.equal(forcedMath.ok, true);
assert.equal(forcedMath.bestLanguage.subject, 'English');
assert.equal(forcedMath.counted[0].subject, 'Mathematics');
assert.equal(forcedMath.aggregate, 73);
assert.equal(forcedMath.meanGrade, 'B+');
assert.equal(forcedMath.excluded.length, 3);

const otherLanguageCounts = engine.calculate({
  mathematics: 'B',
  english: 'A',
  kiswahili: 'A-',
  others: [
    { subject: 'Biology', grade: 'B' }, { subject: 'Physics', grade: 'B-' },
    { subject: 'Chemistry', grade: 'C+' }, { subject: 'History', grade: 'C' },
    { subject: 'Geography', grade: 'C-' }
  ]
});
assert.equal(otherLanguageCounts.ok, true);
assert.equal(otherLanguageCounts.bestFive.some(subject => subject.subject === 'Kiswahili'), true);
assert.equal(otherLanguageCounts.counted.length, 7);

assert.equal(engine.calculate({ mathematics: '', english: 'A', others: [] }).ok, false);
assert.equal(engine.calculate({ mathematics: 'A', english: '', kiswahili: '', others: [] }).ok, false);

console.log('KCSE VIP engine tests: 19 assertions passed');
