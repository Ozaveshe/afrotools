'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const study = require('../assets/js/pages/ha-yo-study-arithmetic');
const normal = { points: '48', units: '16', oldPoints: '120', oldUnits: '40' };
test('GPA retains weighted totals arithmetic, zero history and two-decimal rounding', () => {
  assert.deepEqual(study.gpa(normal), { current: '3.00', combined: '3.00' });
  assert.deepEqual(study.gpa({ points: 35, units: 9, oldPoints: 42, oldUnits: 12 }), { current: '3.89', combined: '3.67' });
  assert.deepEqual(study.gpa({ points: 12.25, units: 3, oldPoints: 0, oldUnits: 0 }), { current: '4.08', combined: '4.08' });
  assert.deepEqual(study.gpa({ points: 0, units: 16, oldPoints: 0, oldUnits: 40 }), { current: '0.00', combined: '0.00' });
});
test('GPA blocks missing, nonfinite, negative and invalid units instead of producing a plausible zero', () => {
  for (const key of Object.keys(normal)) for (const value of ['', ' ', null, Infinity, 'bad', -1]) {
    const values = { ...normal, [key]: value };
    assert.equal(study.validateGpa(values)[0].field, key);
    assert.throws(() => study.gpa(values), RangeError);
  }
  for (const [key, value] of [['units', 0], ['units', 1.5], ['oldUnits', 0.5]]) assert.throws(() => study.gpa({ ...normal, [key]: value }), RangeError);
  assert.throws(() => study.gpa({ points: 1e308, units: 1, oldPoints: 1e308, oldUnits: 1 }), RangeError);
});
function rows(grades) { return grades.map((grade, index) => ({ name: 'Synthetic subject ' + index, grade })); }
test('WAEC retains best-five sort, credit threshold, first-two core check and tone thresholds', () => {
  const examples = [
    [Array(9).fill('A1'), 5, 9, true, 'Dára gan'],
    [Array(9).fill('F9'), 45, 0, false, 'Ṣàyẹ̀wò lẹ́ẹ̀kansi'],
    [['C6', 'D7', 'A1', 'B2', 'B3', 'C4', 'C5', 'E8', 'F9'], 15, 6, false, 'Dára gan'],
    [Array(9).fill('C5'), 25, 9, true, 'Ó dára'],
    [Array(9).fill('C6'), 30, 9, true, 'Ṣàyẹ̀wò lẹ́ẹ̀kansi']
  ];
  for (const [grades, total, credits, coreOk, tone] of examples) {
    const outcome = study.waec(rows(grades));
    assert.deepEqual([outcome.total, outcome.credits, outcome.coreOk, outcome.tone], [total, credits, coreOk, tone]);
    assert.equal(outcome.best.length, 5);
  }
});
test('WAEC rejects blank subject names and unknown/prototype grade keys; preserves stable tied order', () => {
  const entries = rows(Array(9).fill('A1'));
  assert.deepEqual(study.waec(entries).best.map(row => row.name), entries.slice(0, 5).map(row => row.name));
  for (const value of ['', 'A0', 'constructor', '__proto__']) {
    const changed = entries.map(row => ({ ...row })); changed[2].grade = value;
    assert.equal(study.validateWaec(changed)[0].field, 'grade-2');
    assert.throws(() => study.waec(changed), RangeError);
  }
  entries[1].name = '   ';
  assert.equal(study.validateWaec(entries)[0].field, 'subject-1');
  assert.throws(() => study.waec(entries.slice(1)), /Nine subjects/);
});
test('WAEC report carries current grades, results, local processing and official verification limits', () => {
  const entries = rows(['C6', 'D7', 'A1', 'B2', 'B3', 'C4', 'C5', 'E8', 'F9']);
  const text = study.report(entries, study.waec(entries));
  for (const fragment of ['Àpapọ̀ márùn-ún: 15', 'Kírẹ́dítì C6+: 6/9', 'Ṣàyẹ̀wò wọn', 'Synthetic subject 1: D7', 'ìpinnu ìgbàwọlé', 'lórí ẹ̀rọ rẹ']) assert.ok(text.includes(fragment), fragment);
});
