'use strict';

// Recompute all nine recovered answers from the transcribed source inputs.
// Publisher keys were comparison inputs, not calculation evidence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { assessQuestion, questionFingerprint } = require('../../../scripts/lib/jamb-content-trust');

const root = path.resolve(__dirname, '../../..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('ops/nigeria-exams/jamb-math-2025-curated-recovery-04.json');
const snapshotPath = 'ops/nigeria-exams/jamb-math-2025-source-snapshot-04.json';
const snapshotBytes = fs.readFileSync(path.join(root, snapshotPath));
const snapshot = JSON.parse(snapshotBytes);
const receipt = read('ops/jamb/verification/mathematics-2025-publishable-004.json');
const pool = read('ops/jamb/source-pool.json').questions;
const ledger = read('data/jamb/review-ledger.json');

const triangleArea = ((11 + 9) * 13) / 2;
const determinant = 5 * 3 - (-2) * (-1);
const simultaneousX = (10 * 3 - (-2) * 24) / determinant;
const simultaneousY = (5 * 24 - 10 * (-1)) / determinant;
const toBase = (number, radix) => {
  let value = number;
  let digits = '';
  do { digits = String(value % radix) + digits; value = Math.floor(value / radix); } while (value);
  return digits;
};
const fourthRoot = 0.16 ** (1 / 4);
const exponentialForm = 2 * 10 ** (-1 / 2);
const pieAngle = 360 * 16 / (16 + 8 + 24 + 21 + 27);
const vennRegion = (inP, inQ, inR) => inQ && !(inP || inR);
const modeX = (12 - (1 + 2 + 3)) / (1 + 2);
const weights = [54, 56, 58, 60, 62];
const frequencies = [modeX, 1, 2 * modeX, 2, 3];
const modalWeight = weights[frequencies.indexOf(Math.max(...frequencies))];
const classes = [[1, 10, 2], [11, 20, 7], [21, 30, 10], [31, 40, 3], [41, 50, 1]];
const modalClass = classes.reduce((best, row) => row[2] > best[2] ? row : best);
const upperBoundary = (modalClass[1] + 31) / 2;
const adjacent = Math.sqrt(13 ** 2 - 11 ** 2);
assert.equal(triangleArea, 130);
assert.deepEqual([simultaneousX, simultaneousY], [6, 10]);
assert.equal(toBase(54, 4), '312');
assert.ok(Math.abs(fourthRoot - exponentialForm) < 1e-12);
assert.equal(pieAngle, 60);
assert.deepEqual([vennRegion(false, true, false), vennRegion(true, true, false),
  vennRegion(false, true, true), vennRegion(false, false, false)], [true, false, false, false]);
assert.equal(modeX, 2);
assert.equal(modalWeight, 58);
assert.equal(modalClass[0], 21);
assert.equal(upperBoundary, 30.5);
assert.ok(Math.abs(adjacent ** 2 - 48) < 1e-12);

const independentlySelected = {
  74090: `${triangleArea} cm²`,
  74092: `x=${simultaneousX}, y=${simultaneousY}`,
  74190: `${toBase(54, 4)}₄`,
  74192: '2×10^(−1/2)',
  74197: `${pieAngle}°`,
  74198: "Q∩(P∪R)'",
  74199: `${modalWeight} kg`,
  74201: String(upperBoundary),
  74203: '√48/11 and √48 cm'
};
assert.equal(manifest.year_basis, 'publisher-collection');
assert.equal(manifest.sitting_authenticated, false);
assert.equal(manifest.items.length, 9);
assert.equal(manifest.reinspected_holds.length, 2);
assert.equal(manifest.unavailable_requested_positions.from, 56);
assert.equal(manifest.unavailable_requested_positions.to, 75);
assert.deepEqual(manifest.unavailable_requested_positions.checked_empty_pages, [12, 13, 14, 15]);
assert.equal(snapshot.records.length, 9);
assert.equal(receipt.records.length, 9);
assert.equal(receipt.source_file, snapshotPath);
assert.equal(receipt.source_snapshot_sha256,
  crypto.createHash('sha256').update(snapshotBytes).digest('hex'));

const checkedIds = [];
for (const item of manifest.items) {
  const id = `mathematics-2025-myschool-${item.sourceItem}`;
  const expected = independentlySelected[item.sourceItem];
  const source = snapshot.records.find(row => row.source_item === item.sourceItem);
  const proof = receipt.records.find(row => row.id === id);
  const question = pool.find(row => row.id === id);
  const review = ledger.questions[id];
  assert.ok(expected && source && proof && question && review, id);
  assert.equal(item.options[item.answer], expected, id);
  assert.equal(question.options[question.answer], expected, id);
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
  checkedIds.push(id);
}
for (const held of manifest.reinspected_holds) {
  assert.ok(!pool.some(row => row.id === `mathematics-2025-myschool-${held.sourceItem}`), held.sourceItem);
}
process.stdout.write(JSON.stringify({ passed: true, accepted: checkedIds.length, held: manifest.reinspected_holds.length,
  unavailable: 20, question_ids: checkedIds,
  scope: 'adapted publisher-collection practice; authenticated UTME sitting not asserted' }) + '\n');
