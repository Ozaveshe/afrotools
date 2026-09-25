'use strict';

// Recompute the selected answers from the stated inputs, then check the exact
// reviewed question and source fingerprints. Myschool keys are not proof here.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { assessQuestion, questionFingerprint } = require('../../../scripts/lib/jamb-content-trust');

const root = path.resolve(__dirname, '../../..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('ops/nigeria-exams/jamb-math-2025-curated-batch-02.json');
const snapshotPath = 'ops/nigeria-exams/jamb-math-2025-source-snapshot-02.json';
const snapshotBytes = fs.readFileSync(path.join(root, snapshotPath));
const snapshot = JSON.parse(snapshotBytes);
const receipt = read('ops/jamb/verification/mathematics-2025-publishable-002.json');
const pool = read('ops/jamb/source-pool.json').questions;
const ledger = read('data/jamb/review-ledger.json');
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const fraction = (a, b) => `${a / gcd(a, b)}/${b / gcd(a, b)}`;
const factorial = n => n < 2 ? 1 : n * factorial(n - 1);
const slope = (32 - 20) / (16 - 12);
const intercept = 20 - slope * 12;
const selected = {
  74158: fraction(6 + 11, 6 + 11 + 13),
  74159: `${(5 - 2) * 180 / 5}°`,
  74160: fraction(4 * 2, 5 * 3),
  74161: fraction(3, 6),
  74162: 'x⁴+x²+sin x+C',
  74163: String(-Math.log10(0.00001)),
  74167: `${Math.sqrt(17 ** 2 - (30 / 2) ** 2)} cm`,
  74168: String(2 ** 2 + 6),
  74169: fraction(1, Math.cbrt(8)),
  74170: `₦${(600000 / (1 + 0.05 * 4)).toLocaleString('en-US')}`,
  74172: '2n−3',
  74173: '4cos(4x)',
  74174: '360A/(πr²)',
  74185: `${(137).toString(5)}₅`,
  74186: String(intercept + slope * 28),
  74187: String(factorial(7)),
  74189: String(1 - Math.log2(64)).replace('-', '−'),
  74191: 'x³+x²−5x+C',
  74193: '−4≤x≤1'
};

// For symbolic answers, separately check the derivation at several values.
for (const x of [-2, -0.5, 0.75, 3]) {
  const h = 1e-6;
  const derivative = f => (f(x + h) - f(x - h)) / (2 * h);
  assert.ok(Math.abs(derivative(t => t ** 4 + t ** 2 + Math.sin(t)) -
    (4 * x ** 3 + 2 * x + Math.cos(x))) < 1e-5);
  assert.ok(Math.abs(derivative(t => Math.sin(4 * t)) - 4 * Math.cos(4 * x)) < 1e-5);
  assert.ok(Math.abs(derivative(t => t ** 3 + t ** 2 - 5 * t) -
    (3 * x ** 2 + 2 * x - 5)) < 1e-5);
  assert.equal((x + 4) * (x - 1) <= 0, x >= -4 && x <= 1);
}
for (let n = 3; n <= 10; n++) assert.equal(3 + 2 * ((n - 2) - 1), 2 * n - 3);
for (const [radius, angle] of [[2, 30], [5, 135], [9, 270]]) {
  const area = (angle / 360) * Math.PI * radius ** 2;
  assert.ok(Math.abs(360 * area / (Math.PI * radius ** 2) - angle) < 1e-10);
}

assert.equal(manifest.year_basis, 'publisher-collection');
assert.equal(manifest.sitting_authenticated, false);
assert.equal(manifest.items.length, 19);
assert.equal(manifest.held.length, 6);
assert.equal(snapshot.records.length, 19);
assert.equal(receipt.records.length, 19);
assert.equal(receipt.source_file, snapshotPath);
assert.equal(receipt.source_snapshot_sha256, crypto.createHash('sha256').update(snapshotBytes).digest('hex'));
assert.equal(Object.keys(selected).length, 19);
const ids = [];
for (const item of manifest.items) {
  const id = `mathematics-2025-myschool-${item.sourceItem}`;
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
  ids.push(id);
}
for (const held of manifest.held) {
  assert.ok(!pool.some(row => row.id === `mathematics-2025-myschool-${held.sourceItem}`), held.sourceItem);
}
process.stdout.write(JSON.stringify({ passed: true, question_ids: ids,
  scope: '19 independently calculated adapted revision items; collection year is not an authenticated UTME sitting.' }) + '\n');
