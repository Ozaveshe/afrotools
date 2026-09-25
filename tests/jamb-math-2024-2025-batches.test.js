'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const { assessQuestion, questionFingerprint } = require('../scripts/lib/jamb-content-trust');

const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const batches = [2024, 2025].map(year => read(`ops/nigeria-exams/jamb-math-${year}-reviewed-batch-01.json`));
const items = batches.flatMap(batch => batch.items);
const pool = read('ops/jamb/source-pool.json');
const ledger = read('data/jamb/review-ledger.json');
const factorial = n => Array.from({ length: n }, (_, i) => i + 1).reduce((a, b) => a * b, 1);
const determinant = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
  - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
  + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
const money = n => `₦${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const matrixText = m => `[[${m[0].join(',')}],[${m[1].join(',')}]]`.replaceAll('-', '−');

test('35 distinct recent Maths briefs have pinned source, answer and explanation reviews', () => {
  assert.deepEqual(batches.map(batch => batch.items.length), [20, 15]);
  assert.equal(new Set(items.map(item => item.sourceItem)).size, 35);
  for (const batch of batches) {
    assert.equal(batch.year_basis, 'publisher-collection');
    assert.equal(batch.sitting_authenticated, false);
    const snapshotPath = `ops/nigeria-exams/jamb-math-${batch.collection_year}-source-snapshot-01.json`;
    const snapshotBytes = fs.readFileSync(path.join(root, snapshotPath));
    const snapshotHash = crypto.createHash('sha256').update(snapshotBytes).digest('hex');
    const snapshot = JSON.parse(snapshotBytes);
    assert.equal(snapshot.records.length, batch.items.length);
    for (const item of batch.items) {
      const id = `mathematics-${batch.collection_year}-myschool-${item.sourceItem}`;
      const question = pool.questions.find(q => q.id === id);
      assert.ok(question, id);
      assert.equal(question.year, batch.collection_year);
      assert.equal(question.num, null);
      assert.equal(question.source_provenance.year_basis, 'publisher-collection');
      assert.equal(question.source_provenance.url,
        `https://myschool.ng/classroom/mathematics/${item.sourceItem}?exam_type=jamb&exam_year=${batch.collection_year}`);
      assert.equal(questionFingerprint(question), ledger.questions[id].content_sha256);
      assert.equal(ledger.sources[ledger.questions[id].source_id].content_sha256, snapshotHash);
      assert.equal(assessQuestion(question, ledger).state, 'eligible');
      assert.equal(snapshot.records.find(record => record.source_item === item.sourceItem).adapted_prompt, item.question);
      assert.ok(item.explanation.length >= 65, id);
      assert.equal(new Set(Object.values(item.options)).size, 4, id);
    }
  }
});

test('independent calculations and definitions select every reviewed answer', () => {
  const a = [[2, -4, 3], [5, 1, 0]];
  const b = [[1, 4, -2], [-3, 3, -1]];
  const sum = a.map((row, i) => row.map((value, j) => value + 2 * b[i][j]));
  const scores = [4, 3, 3, 2, 1, 2, 5, 7, 8, 3, 5];
  const counts = new Map(scores.map(value => [value, scores.filter(score => score === value).length]));
  const mode = [...counts].sort((x, y) => y[1] - x[1])[0][0];
  const circleSeatings = factorial(6 - 1);
  const xFromPowers = (4 * 2 - 2) / (6 - 4);
  const slope = (11 - 7) / (5 - 3);
  const constant = 7 - slope * 3;
  const profitFourOranges = 30 - 4 * (24 / 5);
  const expected = {
    70170: String(determinant([[3, 4, 6], [2, 1, -1], [-1, 3, 5]])),
    70171: money(200000 * (1 + .05 * 3)).replace('.00', ''),
    70174: `${(4 * .5) / 10 === .2 ? '1/5' : 'incorrect'}`,
    70176: `${33 / (28 * 22 / 7) * 360}°`,
    70177: Math.log(.25) / Math.log(16) === -.5 ? '−1/2' : 'incorrect',
    70179: String(15 * 2 / 3 - 5),
    70180: String(40 - 1),
    70181: 'Mean',
    70186: String(circleSeatings),
    70189: matrixText(sum),
    70192: String(100 * (1 - (-.5))),
    70205: `${25 - 10}√3 m`,
    70249: money(profitFourOranges),
    70250: `${4 * 5}(5x+1)^${4 - 1}`,
    70251: '4−√7',
    70253: `${6 - 3}+√${(4 - 3) ** 2 + (5 - 2) ** 2}+√${(6 - 4) ** 2 + (2 - 5) ** 2}`,
    70254: String(-10 * (-5) ** 6).replace('-', '−'),
    70255: String(mode),
    70256: String(2 * 9 - 10),
    70259: String(xFromPowers),
    74093: 'x<−5/3',
    74094: '11/6',
    74095: `1/${Math.cbrt(125) * Math.sqrt(49)}`,
    74096: `(${(-3 + 5) / 2},${(4 + 6) / 2})`,
    74097: `${Math.sqrt(13 ** 2 - 12 ** 2)}/12`,
    74099: String(factorial(6) / factorial(2)),
    74100: `(${constant},${slope})`,
    74101: `${15 * 1000 - 14 * (1000 - 5)} kg`,
    74102: String((5 - 2 - 3 + 1) / (1 * 5 - 2 * 3)).replace('-', '−'),
    74151: String(4 / 1 ** 2 * 2 ** 2),
    74152: String(1 * 1 - 0 * 0),
    74153: String((1 + 5) / 2),
    74154: String((4 * 4 - 16) / 8),
    74155: `${5}y−${16}x−${5 * 15 - 16 * 3}=0`,
    74157: '7/11'
  };
  assert.equal(Object.keys(expected).length, 35);
  for (const item of items) assert.equal(item.options[item.answer], expected[item.sourceItem], item.sourceItem);

  // Check the two symbolic and mixed-number results numerically as well.
  assert.ok(Math.abs((4 - Math.sqrt(7)) * (3 + Math.sqrt(7)) - (5 + Math.sqrt(7))) < 1e-12);
  assert.ok(Math.abs((3 / 4) / (2 + 1 / 4) * (1 + 7 / 11) * (3 + 2 / 3 - 15 / 6) - 7 / 11) < 1e-12);
  for (const x of [-2, 0, 3]) {
    const h = 1e-6;
    const f = t => (5 * t + 1) ** 4;
    assert.ok(Math.abs((f(x + h) - f(x - h)) / (2 * h) - 20 * (5 * x + 1) ** 3) < 1e-3);
  }
});

test('historical holds stay unpublished unless a later recovery separately verifies them', () => {
  const held = read('ops/nigeria-exams/jamb-math-2024-2025-held-20260924.json').held;
  const recovered = new Set(read('ops/nigeria-exams/jamb-math-2025-curated-recovery-04.json').items
    .map(item => item.sourceItem));
  for (const item of read('ops/nigeria-exams/jamb-math-2024-2025-held-recovery-05.json').items)
    recovered.add(item.sourceItem);
  assert.equal(held.length, 10);
  for (const item of held) {
    if (recovered.has(item.sourceItem)) continue;
    assert.ok(!pool.questions.some(q => q.id === `mathematics-${item.collection_year}-myschool-${item.sourceItem}`));
  }
});
