'use strict';

// Independently recompute the sixteen selected answers and verify intake proof.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { assessQuestion, questionFingerprint } = require('../../../scripts/lib/jamb-content-trust');

const root = path.resolve(__dirname, '../../..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('ops/nigeria-exams/jamb-math-2022-curated-batch-01.json');
const snapshotPath = 'ops/nigeria-exams/jamb-math-2022-source-snapshot-01.json';
const snapshotBytes = fs.readFileSync(path.join(root, snapshotPath));
const snapshot = JSON.parse(snapshotBytes);
const receipt = read('ops/jamb/verification/mathematics-2022-publishable-001.json');
const pool = read('ops/jamb/source-pool.json').questions;
const ledger = read('data/jamb/review-ledger.json');
const factorial = n => Array.from({ length: n }, (_, i) => i + 1).reduce((a, b) => a * b, 1);
const choose = (n, k) => factorial(n) / (factorial(k) * factorial(n - k));
const six = [2, 5, 6, 7, 7, 9];
const medianSix = list => { const sorted = [...list].sort((a, b) => a - b); return (sorted[2] + sorted[3]) / 2; };
const h = 1e-6;
for (const x of [0, 1, 2]) {
  const primitive = value => (2 * value + 1) ** 4 / 8;
  const derivative = (primitive(x + h) - primitive(x - h)) / (2 * h);
  assert.ok(Math.abs(derivative - (2 * x + 1) ** 3) < 1e-6);
}
const volume = Math.PI * 3 * 2 ** 2 / 3;
assert.ok(Math.abs(Math.sqrt(3 * volume / (Math.PI * 3)) - 2) < 1e-12);
const selected = {
  64147: String(Math.log(1) / Math.log(1 / 8) - 2).replace('-', '−'),
  64148: (parseInt('101', 2) ** 3).toString(2) + '₂',
  64156: '3/4',
  64161: String(medianSix(six)),
  64271: String(factorial(7) / factorial(3)),
  64272: '(2x+1)^4/8+C',
  64274: 'πhr²/3',
  64275: String(2 * 3 - 3 * 1),
  64276: String(Math.log2(8 * Math.sqrt(2))),
  64350: String(1 ** 2 + 1 + 7),
  64354: String(medianSix([14, 17, 10, 13, 18, 10])),
  64359: String(parseInt('10110', 2) + 1 / 4 + 1 / 8),
  64366: String(1000000 / (10000 / 20)),
  64368: '(−1/2, 15/2)',
  64373: String(choose(3 ** 2 + 1, 3 + 5)),
  64380: '5 m/s'
};

assert.equal(manifest.year_basis, 'publisher-collection');
assert.equal(manifest.sitting_authenticated, false);
assert.equal(manifest.items.length, 16);
assert.equal(snapshot.records.length, 16);
assert.equal(receipt.records.length, 16);
assert.equal(receipt.source_file, snapshotPath);
assert.equal(receipt.source_snapshot_sha256, crypto.createHash('sha256').update(snapshotBytes).digest('hex'));
assert.equal(Object.keys(selected).length, 16);
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
process.stdout.write(JSON.stringify({ passed: true, accepted: 16,
  scope: 'Independently calculated adapted Mathematics 2022 revision items; publisher year is not an authenticated UTME sitting.' }) + '\n');
