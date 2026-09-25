'use strict';

// Recompute answers from each adapted prompt and verify question/source fingerprints.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { assessQuestion, questionFingerprint } = require('../../../scripts/lib/jamb-content-trust');

const root = path.resolve(__dirname, '../../..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('ops/nigeria-exams/jamb-math-2024-curated-batch-02.json');
const snapshotPath = 'ops/nigeria-exams/jamb-math-2024-source-snapshot-02.json';
const snapshotBytes = fs.readFileSync(path.join(root, snapshotPath));
const snapshot = JSON.parse(snapshotBytes);
const receipt = read('ops/jamb/verification/mathematics-2024-publishable-002.json');
const pool = read('ops/jamb/source-pool.json').questions;
const ledger = read('data/jamb/review-ledger.json');
const choose = (n, k) => {
  let result = 1;
  for (let i = 1; i <= k; i++) result = result * (n - k + i) / i;
  return result;
};
const exclusive = (a, b) => [...new Set([...a.filter(x => !b.includes(x)), ...b.filter(x => !a.includes(x))])].sort((x, y) => x - y);
const scores = [5, 4, 6, 7, 8];
const scoreMean = scores.reduce((a, b) => a + b, 0) / scores.length;
const populationVariance = scores.reduce((sum, n) => sum + (n - scoreMean) ** 2, 0) / scores.length;
assert.equal(populationVariance, 2);
const selected = {
  70264: '{' + exclusive([2, 3, 5, 7], [1, 3, 5, 7, 9]).join(',') + '}',
  70269: parseInt('10111', 2) + (1 / 2 + 1 / 4) === 23.75 ? '23¾' : 'invalid',
  70271: (parseInt('20045', 7) - parseInt('14256', 7)).toString(7) + '₇',
  70272: String((4 * 40 + 8 * 25) / 12) + ' years',
  70274: String(2 ** 5),
  70281: String((7 * 22 - (13 + 16 + 18 + 21 + 35)) / 3),
  70283: String(Math.round(12.34 ** 2)),
  70289: populationVariance === 2 ? '√2' : 'invalid',
  70290: String(choose(5, 2) * choose(7, 3)),
  70292: (7 ** 2 + 4 ** 2) + '/' + (7 + 4) ** 2,
  70294: String((16 / (24 / Math.sqrt(9))) ** 2),
  70297: String(2 * Math.cbrt(27))
};

assert.equal(manifest.year_basis, 'publisher-collection');
assert.equal(manifest.sitting_authenticated, false);
assert.equal(manifest.items.length, 12);
assert.equal(manifest.held.length, 3);
assert.equal(snapshot.records.length, 12);
assert.equal(receipt.records.length, 12);
assert.equal(receipt.source_file, snapshotPath);
assert.equal(receipt.source_snapshot_sha256, crypto.createHash('sha256').update(snapshotBytes).digest('hex'));
assert.equal(Object.keys(selected).length, 12);
const ids = [];
for (const item of manifest.items) {
  const id = `mathematics-2024-myschool-${item.sourceItem}`;
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
  assert.ok(!pool.some(row => row.id === `mathematics-2024-myschool-${held.sourceItem}`), held.sourceItem);
}
process.stdout.write(JSON.stringify({ passed: true, question_ids: ids, accepted: 12, held: 3,
  scope: 'Independently calculated adapted revision items; publisher collection year is not an authenticated UTME sitting.' }) + '\n');
