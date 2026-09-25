'use strict';

// Derive each answer from the transcribed mathematical facts, not publisher keys.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { assessQuestion, questionFingerprint } = require('../../../scripts/lib/jamb-content-trust');
const { snapshotPath, receiptPath } = require('../../nigeria-exams/import-jamb-math-2024-held-recovery-06.cjs');

const root = path.resolve(__dirname, '../../..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));

function verify() {
  const manifest = read('ops/nigeria-exams/jamb-math-2024-held-recovery-06.json');
  const pool = read('ops/jamb/source-pool.json').questions;
  const ledger = read('data/jamb/review-ledger.json');
  const snapshotBytes = fs.readFileSync(path.join(root, snapshotPath));
  const snapshot = JSON.parse(snapshotBytes);
  const receipt = read(receiptPath);
  assert.equal(manifest.year_basis, 'publisher-collection');
  assert.equal(manifest.sitting_authenticated, false);
  assert.equal(snapshot.collection_year, 2024);
  assert.equal(snapshot.sitting_authenticated, false);
  assert.equal(snapshot.records.length, 3);
  assert.equal(receipt.records.length, 3);
  assert.equal(receipt.source_file, snapshotPath);
  assert.equal(receipt.source_snapshot_sha256,
    crypto.createHash('sha256').update(snapshotBytes).digest('hex'));

  // A perpendicular through the centre bisects the chord; the 30-degree
  // right-triangle side is half the chord.
  const radius = 9;
  const angle = Math.PI / 6;
  const chord = 2 * radius * Math.sin(angle);
  assert.ok(Math.abs(chord - 9) < 1e-12);
  const rightOfDashedLine = x => x > 1;
  assert.equal(rightOfDashedLine(2), true);
  assert.equal(rightOfDashedLine(1), false);
  assert.equal(rightOfDashedLine(0), false);
  const shadedTriangle = (x, y) => x >= 0 && y >= 0 && 3 * x + 4 * y < 12;
  assert.equal(shadedTriangle(0, 0), true);
  assert.equal(shadedTriangle(1, 1), true);
  assert.equal(shadedTriangle(4, 0), false);
  assert.equal(shadedTriangle(0, 3), false);
  assert.equal(shadedTriangle(-1, 1), false);
  assert.equal(shadedTriangle(1, -1), false);
  const independentlySelected = { 70182: `${Math.round(chord)} cm`, 70185: 'x>1',
    70188: '3x+4y<12, x≥0, y≥0' };

  const checkedIds = [];
  for (const item of manifest.items) {
    const id = `mathematics-2024-myschool-${item.sourceItem}`;
    const expected = independentlySelected[item.sourceItem];
    const source = snapshot.records.find(row => row.source_item === item.sourceItem);
    const proof = receipt.records.find(row => row.id === id);
    const question = pool.find(row => row.id === id);
    const review = ledger.questions[id];
    assert.ok(expected && source && proof && question && review, id);
    assert.equal(item.options[item.answer], expected, id);
    assert.equal(question.options[question.answer], expected, id);
    assert.equal(Object.values(item.options).filter(value => value === expected).length, 1, id);
    assert.equal(source.collection_position, item.position, id);
    assert.equal(source.source_url,
      `https://myschool.ng/classroom/mathematics/${item.sourceItem}?exam_type=jamb&exam_year=2024`, id);
    assert.equal(source.adapted_prompt, item.question, id);
    assert.deepEqual(source.options, item.options, id);
    assert.deepEqual(source.source_figure, item.source_figure, id);
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
  for (const held of manifest.remaining_held) {
    assert.ok(!pool.some(row => row.id === `mathematics-${held.year}-myschool-${held.sourceItem}`), held.sourceItem);
  }
  return { passed: true, accepted: checkedIds.length, held: manifest.remaining_held.length,
    question_ids: checkedIds,
    scope: 'adapted publisher-collection practice; authenticated sitting not asserted' };
}

if (require.main === module) process.stdout.write(JSON.stringify(verify()) + '\n');

module.exports = { verify };
