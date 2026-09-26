'use strict';

// Recompute this publisher-labelled revision batch independently of the intake.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { assessQuestion, questionFingerprint } = require('../../../scripts/lib/jamb-content-trust');

const root = path.resolve(__dirname, '../../..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('ops/nigeria-exams/jamb-math-2022-curated-batch-02.json');
const snapshotPath = 'ops/nigeria-exams/jamb-math-2022-source-snapshot-02.json';
const snapshotBytes = fs.readFileSync(path.join(root, snapshotPath));
const snapshot = JSON.parse(snapshotBytes);
const receipt = read('ops/jamb/verification/mathematics-2022-publishable-002.json');
const pool = read('ops/jamb/source-pool.json').questions;
const ledger = read('data/jamb/review-ledger.json');

// Numeric and structural checks are kept separate from the answer letters.
const cosMagnitude = Math.sqrt(1 - (3 / 5) ** 2);
assert.equal(cosMagnitude, 4 / 5);
const rationalised = (3 + Math.sqrt(2)) / 7;
assert.ok(Math.abs(rationalised - 1 / (3 - Math.sqrt(2))) < 1e-12);
const halfChord = Math.sqrt(5 ** 2 - 3 ** 2);
assert.equal(2 * halfChord, 8);
const pyramidVolume = 24 * 7.5 / 3;
assert.equal(pyramidVolume, 60);
const apStep = (32 - 3 / 2) / 9;
assert.ok(Math.abs((3 / 2 + 3 * apStep) - 35 / 3) < 1e-12);
for (const [a, b] of [[0, 4], [2, 3], [-5, 7]]) {
  assert.equal((2 * a - 3 * b) * (2 * a + 3 * b), 4 * a ** 2 - 9 * b ** 2);
}
for (const x of [-3, -2, 0, 4]) {
  assert.equal(3 * x - 2 < x - 6, x < -2);
}
const intersection = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
assert.equal(20 + 30 - 40, intersection.size);
const radius = 7;
for (const angle of [0, Math.PI / 3, Math.PI, 5 * Math.PI / 3]) {
  assert.ok(Math.abs(Math.hypot(radius * Math.cos(angle), radius * Math.sin(angle)) - radius) < 1e-12);
}

const selected = {
  64173: '−4/5',
  64209: '(3+√2)/7',
  64218: (2 * halfChord) + ' cm',
  64229: (28 * 360 / 100).toFixed(1) + '°',
  64239: pyramidVolume.toFixed(1) + ' cm³',
  64250: '35/3',
  64277: 'A circle',
  64391: String(3 - 5 + (3 * 5) ** 2),
  64392: String((3 * 4) / 12),
  64393: `p=${8 + 6}, q=${8 + 2 * 6}`,
  64395: '(2a−3b)(2a+3b)',
  64402: String(20 + 30 - 40),
  64404: 'x<−2',
  64412: '₦' + new Intl.NumberFormat('en-NG').format(3800 / 0.8)
};

assert.equal(manifest.year_basis, 'publisher-collection');
assert.equal(manifest.sitting_authenticated, false);
assert.equal(manifest.items.length, 14);
assert.equal(snapshot.records.length, 14);
assert.equal(receipt.records.length, 14);
assert.equal(receipt.source_file, snapshotPath);
assert.equal(receipt.source_snapshot_sha256, crypto.createHash('sha256').update(snapshotBytes).digest('hex'));
assert.equal(Object.keys(selected).length, 14);
for (const item of manifest.items) {
  const id = `mathematics-2022-myschool-${item.sourceItem}`;
  const expected = selected[item.sourceItem];
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
}
process.stdout.write(JSON.stringify({ passed: true, accepted: 14,
  question_ids: receipt.records.map(record => record.id),
  scope: 'Independently checked 2022 Mathematics adaptations; publisher year only, not an authenticated sitting.' }) + '\n');
