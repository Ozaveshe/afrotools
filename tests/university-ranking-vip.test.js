const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../tools/university-ranking/university-comparison-engine.js');

test('requires at least two named candidates', () => {
  assert.equal(engine.compare([], '2026-07-26').valid, false);
  assert.equal(engine.compare([{ name: 'One', accreditation: 'not-checked' }], '2026-07-26').valid, false);
  const result = engine.compare([
    { name: 'One', accreditation: 'not-checked' },
    { name: '', accreditation: 'not-checked' }
  ], '2026-07-26');
  assert.equal(result.valid, false);
});

test('accepts only http or https source URLs', () => {
  assert.equal(engine.validUrl('https://university.example/programme'), true);
  assert.equal(engine.validUrl('http://university.example/programme'), true);
  assert.equal(engine.validUrl('javascript:alert(1)'), false);
  assert.equal(engine.validUrl('not a url'), false);
});

test('rejects negative, non-finite and excessive costs', () => {
  const base = { name: 'Candidate', accreditation: 'not-checked' };
  assert.equal(engine.analyseCandidate({ ...base, tuition: -1 }, '2026-07-26').valid, false);
  assert.equal(engine.analyseCandidate({ ...base, tuition: '1e999' }, '2026-07-26').valid, false);
  assert.equal(engine.analyseCandidate({ ...base, tuition: 1000000001 }, '2026-07-26').valid, false);
});

test('compares only complete first-year cost inputs', () => {
  const result = engine.compare([
    { name: 'Complete', tuition: 100, living: 200, other: 50, accreditation: 'confirmed' },
    { name: 'Incomplete', tuition: 50, living: '', other: 0, accreditation: 'confirmed' },
    { name: 'Higher', tuition: 200, living: 200, other: 50, accreditation: 'confirmed' }
  ], '2026-07-26');
  assert.equal(result.valid, true);
  assert.equal(result.comparableCostCount, 2);
  assert.equal(result.candidates[0].firstYearCost, 350);
  assert.equal(result.candidates[0].isLowestEnteredCost, true);
  assert.equal(result.candidates[1].costComplete, false);
  assert.equal(result.candidates[1].isLowestEnteredCost, false);
});

test('calculates date-only deadline distance without local timezone drift', () => {
  assert.equal(engine.daysUntil('2026-07-26', '2026-07-26'), 0);
  assert.equal(engine.daysUntil('2026-07-27', '2026-07-26'), 1);
  assert.equal(engine.daysUntil('2026-07-25', '2026-07-26'), -1);
  assert.equal(engine.daysUntil('', '2026-07-26'), null);
});

test('reports visible evidence gaps rather than generating a quality score', () => {
  const result = engine.analyseCandidate({
    name: 'University — Programme',
    country: 'Kenya',
    tuition: '',
    living: '',
    other: '',
    deadline: '',
    accreditation: 'not-checked',
    notes: ''
  }, '2026-07-26');
  assert.equal(result.valid, true);
  assert.deepEqual(result.gaps, [
    'programme source',
    'complete first-year costs',
    'application deadline',
    'regulator confirmation',
    'decision notes'
  ]);
  assert.equal('score' in result, false);
  assert.equal('rank' in result, false);
});
