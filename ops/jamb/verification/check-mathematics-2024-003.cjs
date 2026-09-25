'use strict';

// Recompute the adapted answers and bind every approved record to its source snapshot.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { assessQuestion, questionFingerprint } = require('../../../scripts/lib/jamb-content-trust');

const root = path.resolve(__dirname, '../../..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('ops/nigeria-exams/jamb-math-2024-curated-batch-03.json');
const snapshotPath = 'ops/nigeria-exams/jamb-math-2024-source-snapshot-03.json';
const snapshotBytes = fs.readFileSync(path.join(root, snapshotPath));
const snapshot = JSON.parse(snapshotBytes);
const receipt = read('ops/jamb/verification/mathematics-2024-publishable-003.json');
const pool = read('ops/jamb/source-pool.json').questions;
const ledger = read('data/jamb/review-ledger.json');

function matrixText(matrix) { return '[[' + matrix.map(row => row.join(',')).join('],[') + ']]'; }
function multiply(a, b) {
  return a.map(row => b[0].map((_, j) => row.reduce((sum, value, k) => sum + value * b[k][j], 0)));
}
const P = [[1, 2], [2, 3]];
const squared = multiply(P, P);
const matrixDifference = squared.map((row, i) => row.map((value, j) => value - 4 * P[i][j] - Number(i === j)));
const A = [[3, 2, 1], [4, 2, -1]];
const B = [[1, 4], [0, 1], [3, 2]];
const transposeSum = B.map((row, i) => row.map((value, j) => value + A[j][i]));
const weights = [25, 30, 32, 30, 42, 45, 48, 50, 52, 51, 42, 38, 40, 42];
const frequencies = new Map();
for (const weight of weights) frequencies.set(weight, (frequencies.get(weight) || 0) + 1);
const mode = [...frequencies].sort((a, b) => b[1] - a[1])[0][0];
const regions = x => [42 - x, 34, 30 - x, 6 + x, 4 * x, 3 * x, 2 * x];
const total = x => regions(x).reduce((sum, n) => sum + n, 0);
const vennX = (144 - total(0)) / (total(1) - total(0));
const vennBoth = regions(vennX)[4] + regions(vennX)[6];
const expected = {
  70300: '5, −3, and −2',
  70321: `x=${9 * 4}/y`,
  70327: matrixText(matrixDifference),
  70344: matrixText(transposeSum),
  70348: '0 and 1',
  70349: `${mode} kg`,
  70350: String(vennBoth),
  71529: 'q=rt²/(p−r³)',
  71530: `a=${54 / 9}, b=${4 * (54 / 9)}`
};

assert.deepEqual([-5, -3, -2, 2, 3, 5].filter(x => x ** 3 - 19 * x - 30 === 0), [-3, -2, 5]);
assert.deepEqual(matrixDifference, [[0, 0], [0, 0]]);
assert.deepEqual(transposeSum, [[4, 8], [2, 3], [4, 1]]);
assert.equal(weights.length, 14, 'Publisher count is wrong; adapted prompt must use listed values only');
assert.equal(frequencies.get(mode), 3);
assert.equal(vennX, 4);
assert.equal(total(vennX), 144);
assert.equal(vennBoth, 24);
for (const [p, r, t] of [[7, 2, 3], [11, 3, 4], [19, 2, 5]]) {
  const q = r * t ** 2 / (p - r ** 3);
  assert.ok(Math.abs(Math.sqrt(p * q / r - r ** 2 * q) - t) < 1e-10);
}
assert.equal(Object.keys(expected).length, 9);
assert.equal(manifest.year_basis, 'publisher-collection');
assert.equal(manifest.sitting_authenticated, false);
assert.equal(snapshot.records.length, 9);
assert.equal(receipt.records.length, 9);
assert.equal(receipt.source_file, snapshotPath);
assert.equal(receipt.source_snapshot_sha256, crypto.createHash('sha256').update(snapshotBytes).digest('hex'));

for (const item of manifest.items) {
  const id = `mathematics-2024-myschool-${item.sourceItem}`;
  const source = snapshot.records.find(row => row.source_item === item.sourceItem);
  const proof = receipt.records.find(row => row.id === id);
  const question = pool.find(row => row.id === id);
  const review = ledger.questions[id];
  assert.ok(source && proof && question && review, id);
  assert.equal(item.options[item.answer], expected[item.sourceItem], id);
  assert.equal(question.options[question.answer], expected[item.sourceItem], id);
  assert.equal(source.collection_position, item.position, id);
  assert.equal(source.adapted_prompt, item.question, id);
  assert.deepEqual(source.options, item.options, id);
  assert.deepEqual(source.source_figure, item.source_figure || null, id);
  assert.equal(source.source_repair, item.source_repair || null, id);
  assert.equal(question.question, item.question, id);
  assert.equal(question.explanation, item.explanation, id);
  assert.equal(question.num, null, id);
  assert.equal(question.source_provenance.year_basis, 'publisher-collection', id);
  assert.equal(question.source_provenance.url, source.source_url, id);
  assert.equal(questionFingerprint(question), proof.content_sha256, id);
  assert.equal(review.content_sha256, proof.content_sha256, id);
  assert.equal(ledger.sources[review.source_id].content_sha256, receipt.source_snapshot_sha256, id);
  assert.equal(assessQuestion(question, ledger).state, 'eligible', id);
}
for (const held of manifest.held) {
  assert.ok(!pool.some(row => row.id === `mathematics-2024-myschool-${held.sourceItem}`), held.sourceItem);
}
process.stdout.write(JSON.stringify({ passed: true, accepted: 9, held: 1,
  scope: 'Independent calculation and publisher-collection-only review.' }) + '\n');
