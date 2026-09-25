'use strict';

// Independent mathematical checks for the held-item recovery. Source keys were
// comparison inputs only and are deliberately not read to choose an answer.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { assessQuestion, questionFingerprint } = require('../../../scripts/lib/jamb-content-trust');

const root = path.resolve(__dirname, '../../..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const manifest = read('ops/nigeria-exams/jamb-math-2024-2025-held-recovery-05.json');
const pool = read('ops/jamb/source-pool.json').questions;
const ledger = read('data/jamb/review-ledger.json');
const { snapshotPath, receiptPath } = require('../../nigeria-exams/import-jamb-math-held-recovery-05.cjs');
const choose = (n, r) => {
  let result = 1;
  for (let i = 1; i <= r; i++) result = result * (n - i + 1) / i;
  return result;
};

const triangleArea = 0.5 * 8 * 8 * Math.sin(Math.PI / 3);
assert.ok(Math.abs(triangleArea - 16 * Math.sqrt(3)) < 1e-12);
const committees = choose(3, 1) * choose(7, 4);
assert.equal(committees, 105);
const sine = 8 / Math.hypot(8, 15);
const cosine = 15 / Math.hypot(8, 15);
const trigonometricRatio = (sine - cosine) / (sine * sine - sine);
assert.ok(Math.abs(trigonometricRatio - 119 / 72) < 1e-12);
const setSizes = [new Set([2, 3, 1, 4]).size, new Set([1, 2, 3, 4, 5, 6]).size,
  new Set([1, 2, 3, 4]).size, new Set([4, 3, 1, 5, 2]).size];
assert.deepEqual(setSizes, [4, 6, 4, 5]);
const cost = 270000 + 70000;
const profitPercent = ((490000 - cost) / cost) * 100;
assert.equal(profitPercent.toFixed(2), '44.12');
const quadratic = x => 2 - 4 * x - 2 * x * x;
assert.equal(quadratic(-1), 4);
for (const x of [-100, -2, -0.5, 0, 1, 100]) assert.ok(quadratic(x) <= 4);
const p = 3 / 5, q = 2 / 5;
const exactlyOneSurvivor = p * q + q * p;
assert.equal(exactlyOneSurvivor, 2 * p * q);
const frequencies = [1, 5, 6, 12, 8, 3];
const modalIndex = frequencies.indexOf(Math.max(...frequencies));
assert.equal(modalIndex, 3);
const groupedMode = 29.5 + ((frequencies[3] - frequencies[2]) /
  (2 * frequencies[3] - frequencies[2] - frequencies[4])) * 10;
assert.equal(groupedMode, 35.5);
const radicalCoefficient = Math.sqrt(75 / 3) - Math.sqrt(12 / 3) + Math.sqrt(27 / 3);
assert.equal(radicalCoefficient, 6);
for (const [x, y] of [[3, 5], [5, 13], [8, 17]]) {
  const tanFromCos = Math.sqrt(y * y - x * x) / x;
  const theta = Math.acos(x / y);
  assert.ok(Math.abs(tanFromCos - Math.tan(theta)) < 1e-12);
}
const definedOperation = (a, b) => a * b + a + b;
assert.equal(definedOperation(1, 3), 7);

const independentlySelected = {
  70195: '16√3 cm²', 70291: String(committees), 70347: '119/72',
  74091: '{4,3,1,5,2}', 74156: `${profitPercent.toFixed(2)}%`,
  74175: String(quadratic(-1)), 74176: '2pq', 74188: String(groupedMode),
  74194: String(radicalCoefficient), 74195: '√(y²−x²)/x',
  74200: String(definedOperation(1, 3))
};

function verify(year) {
  assert.ok(year === 2024 || year === 2025);
  assert.equal(manifest.year_basis, 'publisher-collection');
  assert.equal(manifest.sitting_authenticated, false);
  const items = manifest.items.filter(item => item.year === year);
  const snapshotFile = snapshotPath(year);
  const snapshotBytes = fs.readFileSync(path.join(root, snapshotFile));
  const snapshot = JSON.parse(snapshotBytes);
  const receipt = read(receiptPath(year));
  assert.equal(snapshot.records.length, items.length);
  assert.equal(receipt.records.length, items.length);
  assert.equal(snapshot.collection_year, year);
  assert.equal(snapshot.sitting_authenticated, false);
  assert.equal(receipt.source_file, snapshotFile);
  assert.equal(receipt.source_snapshot_sha256,
    crypto.createHash('sha256').update(snapshotBytes).digest('hex'));
  const checkedIds = [];
  for (const item of items) {
    const id = `mathematics-${year}-myschool-${item.sourceItem}`;
    const expected = independentlySelected[item.sourceItem];
    const source = snapshot.records.find(row => row.source_item === item.sourceItem);
    const proof = receipt.records.find(row => row.id === id);
    const question = pool.find(row => row.id === id);
    const review = ledger.questions[id];
    assert.ok(expected && source && proof && question && review, id);
    assert.equal(item.options[item.answer], expected, id);
    assert.equal(question.options[question.answer], expected, id);
    assert.equal(source.collection_position, item.position, id);
    assert.equal(source.source_url,
      `https://myschool.ng/classroom/mathematics/${item.sourceItem}?exam_type=jamb&exam_year=${year}`, id);
    assert.equal(source.adapted_prompt, item.question, id);
    assert.deepEqual(source.options, item.options, id);
    assert.deepEqual(source.source_figure, item.source_figure || null, id);
    assert.equal(source.source_repair, item.source_repair, id);
    assert.equal(question.question, item.question, id);
    assert.equal(question.explanation, item.explanation, id);
    assert.equal(question.num, null, id);
    assert.equal(question.source_provenance.year_basis, 'publisher-collection', id);
    assert.equal(questionFingerprint(question), proof.content_sha256, id);
    assert.equal(review.content_sha256, proof.content_sha256, id);
    assert.equal(ledger.sources[review.source_id].content_sha256, receipt.source_snapshot_sha256, id);
    assert.equal(assessQuestion(question, ledger).state, 'eligible', id);
    assert.doesNotMatch(question.explanation, /source|publisher|repair|transcription|corrected/i, id);
    checkedIds.push(id);
  }
  for (const held of manifest.remaining_held.filter(item => item.year === year)) {
    assert.ok(!receipt.records.some(row => row.source_item === held.sourceItem), held.sourceItem);
  }
  return { passed: true, accepted: checkedIds.length,
    held: manifest.remaining_held.filter(item => item.year === year).length,
    question_ids: checkedIds, scope: 'adapted publisher-collection practice; authenticated sitting not asserted' };
}

module.exports = { verify };
