'use strict';

// Recompute the two published answers from the stated inputs. The publisher
// key is a comparison input, not evidence for either calculation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { assessQuestion, questionFingerprint } = require('../../../scripts/lib/jamb-content-trust');

const root = path.resolve(__dirname, '../../..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('ops/nigeria-exams/jamb-math-2025-curated-batch-03.json');
const recoveredSourceItems = new Set(read('ops/nigeria-exams/jamb-math-2025-curated-recovery-04.json').items.map(item => item.sourceItem));
for (const item of read('ops/nigeria-exams/jamb-math-2024-2025-held-recovery-05.json').items.filter(x => x.year === 2025)) {
  recoveredSourceItems.add(item.sourceItem);
}
const snapshotPath = 'ops/nigeria-exams/jamb-math-2025-source-snapshot-03.json';
const snapshotBytes = fs.readFileSync(path.join(root, snapshotPath));
const snapshot = JSON.parse(snapshotBytes);
const receipt = read('ops/jamb/verification/mathematics-2025-publishable-003.json');
const pool = read('ops/jamb/source-pool.json').questions;
const ledger = read('data/jamb/review-ledger.json');

const P = [[1, 3], [2, -5]];
const Q = [[3, -7], [1, 2]];
const matrix = P.map((row, i) => row.map((entry, j) => entry + 2 * Q[i][j]));
const matrixAnswer = `[[${matrix[0].join(', ')}], [${matrix[1].join(', ')}]]`.replace(/-/g, '−');
assert.equal(matrixAnswer, '[[7, −11], [4, −1]]');

const northwardKm = 200 * Math.cos(Math.PI / 3);
const southwardFraction = Math.cos(Math.PI / 6);
const secondLegKm = northwardKm / southwardFraction;
assert.ok(Math.abs(secondLegKm - 200 / Math.sqrt(3)) < 1e-10);
assert.ok(Math.abs(northwardKm - secondLegKm * southwardFraction) < 1e-10);

const independentlySelected = { 74196: matrixAnswer, 74202: '200/√3 km' };
assert.equal(manifest.year_basis, 'publisher-collection');
assert.equal(manifest.sitting_authenticated, false);
assert.equal(manifest.items.length, 2);
assert.equal(manifest.held.length, 8);
assert.equal(snapshot.records.length, 2);
assert.equal(receipt.records.length, 2);
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
for (const held of manifest.held) {
  if (recoveredSourceItems.has(held.sourceItem)) continue;
  assert.ok(!pool.some(row => row.id === `mathematics-2025-myschool-${held.sourceItem}`), held.sourceItem);
}
process.stdout.write(JSON.stringify({ passed: true, accepted: checkedIds.length, held: manifest.held.length, question_ids: checkedIds,
  scope: 'adapted publisher-collection practice; authenticated UTME sitting not asserted' }) + '\n');
