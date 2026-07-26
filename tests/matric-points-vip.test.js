'use strict';

const assert = require('node:assert/strict');
const engine = require('../tools/matric-points/matric-points-engine.js');

assert.equal(engine.levelFromPercentage(80), 7);
assert.equal(engine.levelFromPercentage(79), 6);
assert.equal(engine.levelFromPercentage(50), 4);
assert.equal(engine.levelFromPercentage(29), 1);

const bachelor = engine.calculate({
  homeLanguage: 'Afrikaans Home Language',
  learningLanguage: 'English First Additional Language',
  results: [
    { subject: 'English First Additional Language', percentage: 68 },
    { subject: 'Afrikaans Home Language', percentage: 72 },
    { subject: 'Mathematics', percentage: 65 },
    { subject: 'Physical Sciences', percentage: 58 },
    { subject: 'Life Sciences', percentage: 64 },
    { subject: 'Accounting', percentage: 55 },
    { subject: 'Life Orientation', percentage: 78 }
  ]
});
assert.equal(bachelor.ok, true);
assert.equal(bachelor.planningIndex, 29);
assert.equal(bachelor.route, "Bachelor's minimum");
assert.equal(bachelor.counted.some((row) => row.subject === 'Life Orientation'), false);

const diploma = engine.calculate({
  homeLanguage: 'Afrikaans Home Language',
  learningLanguage: 'English First Additional Language',
  results: [
    { subject: 'English First Additional Language', percentage: 35 },
    { subject: 'Afrikaans Home Language', percentage: 45 },
    { subject: 'Mathematics', percentage: 48 },
    { subject: 'Physical Sciences', percentage: 42 },
    { subject: 'Life Sciences', percentage: 41 },
    { subject: 'Accounting', percentage: 38 },
    { subject: 'Life Orientation', percentage: 70 }
  ]
});
assert.equal(diploma.ok, true);
assert.equal(diploma.route, 'Diploma minimum');

const duplicate = engine.calculate({
  homeLanguage: 'English Home Language',
  learningLanguage: 'English Home Language',
  results: [
    { subject: 'English Home Language', percentage: 60 },
    { subject: 'English Home Language', percentage: 55 }
  ]
});
assert.match(duplicate.error, /only once/);

console.log('Matric planner verified: percentage levels, DBE route checks, LO exclusion, best-six planning index, and duplicate guard.');
