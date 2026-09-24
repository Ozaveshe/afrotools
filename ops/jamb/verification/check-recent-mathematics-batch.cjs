'use strict';

// Recheck the imported bank against its dated source snapshot and review ledger.
// The independent 35-item calculation suite is a separate test target.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { assessQuestion, questionFingerprint } = require('../../../scripts/lib/jamb-content-trust');

const root = path.resolve(__dirname, '../../..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

module.exports = function check(year) {
  assert.ok(year === 2024 || year === 2025);
  const filename = `mathematics-${year}-publishable-001.json`;
  const receipt = read(`ops/jamb/verification/${filename}`);
  const batch = read(`ops/nigeria-exams/jamb-math-${year}-reviewed-batch-01.json`);
  const snapshotBytes = fs.readFileSync(path.join(root, receipt.source_file));
  const snapshot = JSON.parse(snapshotBytes);
  const snapshotHash = crypto.createHash('sha256').update(snapshotBytes).digest('hex');
  const pool = read('ops/jamb/source-pool.json').questions;
  const ledger = read('data/jamb/review-ledger.json');
  assert.equal(snapshotHash, receipt.source_snapshot_sha256);
  assert.equal(batch.collection_year, year);
  assert.equal(batch.year_basis, 'publisher-collection');
  assert.equal(batch.sitting_authenticated, false);
  assert.equal(snapshot.records.length, batch.items.length);
  assert.equal(receipt.records.length, batch.items.length);

  for (const record of receipt.records) {
    const item = batch.items.find(entry => entry.sourceItem === record.source_item);
    const source = snapshot.records.find(entry => entry.source_item === record.source_item);
    const question = pool.find(entry => entry.id === record.id);
    const review = ledger.questions[record.id];
    assert.ok(item && source && question && review, record.id);
    assert.equal(record.id, `mathematics-${year}-myschool-${item.sourceItem}`);
    assert.equal(source.adapted_prompt, item.question, record.id);
    assert.deepEqual(source.options, item.options, record.id);
    assert.equal(question.question, item.question, record.id);
    assert.deepEqual(question.options, item.options, record.id);
    assert.equal(question.answer, item.answer, record.id);
    assert.equal(question.explanation, item.explanation, record.id);
    assert.equal(question.num, null, record.id);
    assert.equal(question.source_provenance.year_basis, 'publisher-collection', record.id);
    assert.equal(question.source_provenance.url, source.source_url, record.id);
    assert.equal(record.answer, item.answer, record.id);
    assert.equal(questionFingerprint(question), record.content_sha256, record.id);
    assert.equal(review.content_sha256, record.content_sha256, record.id);
    assert.equal(ledger.sources[review.source_id].content_sha256, snapshotHash, record.id);
    assert.equal(assessQuestion(question, ledger).state, 'eligible', record.id);
  }

  process.stdout.write(JSON.stringify({
    passed: true,
    question_ids: receipt.records.map(record => record.id),
    scope: 'Current source, bank, ledger and eligibility; independent calculations are in tests/jamb-math-2024-2025-batches.test.js. Collection year is not an authenticated sitting.'
  }) + '\n');
};
