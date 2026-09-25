'use strict';

// Derive answers from mathematical facts, not the source site's selected keys.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { assessQuestion, questionFingerprint } = require('../../../scripts/lib/jamb-content-trust');
const { snapshotPath, receiptPath } = require('../../nigeria-exams/import-jamb-math-2023-held-recovery-04.cjs');

const root = path.resolve(__dirname, '../../..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const toSignificant = (value, digits) => Number(value.toPrecision(digits));

function independentlySolve() {
  const radialRate = 1.5 / (2 * Math.PI * Math.sqrt(2 / Math.PI));
  const centralAngle = 180 - 36;
  const logarithmSolutions = [-17, 17].filter(y => y > 8 && y * y - 64 === 225);
  const whiteBalls = 8 / 2;
  const mixedDraw = 8 / 12 * whiteBalls / 11 + whiteBalls / 12 * 8 / 11;
  const atLeastQuarter = [3, 5, 3, 8].slice(1).reduce((sum, n) => sum + n, 0);
  const sineSide = 43.2 * Math.sin(56 * Math.PI / 180) / Math.sin(82 * Math.PI / 180);
  const arc = 13 * 2 * Math.asin(12 / 13);
  const standardForm = 16.54e-5 - 6.76e-8 + 0.23e-6;
  const solid = 36 * 6 * 8 + 10 * 6 * (22 - 8);
  assert.deepEqual(logarithmSolutions, [17]);
  assert.ok(Math.abs(mixedDraw - 16 / 33) < 1e-12);
  assert.ok(Math.abs(standardForm - 0.0001655624) < 1e-16);
  return {
    67254: `${radialRate.toPrecision(3)} cm/s`,
    67259: `${centralAngle / 2}°`,
    67279: String(logarithmSolutions[0]),
    67284: `${Math.round(mixedDraw * 33)}/33`,
    67298: String(atLeastQuarter),
    67348: `${toSignificant(sineSide, 3).toFixed(1)} cm`,
    67359: `${toSignificant(arc, 3).toFixed(1)} cm`,
    67370: `${(standardForm / 1e-4).toPrecision(3)}×10⁻⁴`,
    67379: `${solid} cm³`
  };
}

function verify() {
  const manifest = read('ops/nigeria-exams/jamb-math-2023-held-recovery-04.json');
  const pool = read('ops/jamb/source-pool.json').questions;
  const ledger = read('data/jamb/review-ledger.json');
  const snapshotBytes = fs.readFileSync(path.join(root, snapshotPath));
  const snapshot = JSON.parse(snapshotBytes);
  const receipt = read(receiptPath);
  const independentlySelected = independentlySolve();
  assert.equal(manifest.year_basis, 'publisher-collection');
  assert.equal(manifest.sitting_authenticated, false);
  assert.equal(snapshot.collection_year, 2023);
  assert.equal(snapshot.sitting_authenticated, false);
  assert.equal(snapshot.records.length, 9);
  assert.equal(receipt.records.length, 9);
  assert.equal(receipt.source_file, snapshotPath);
  assert.equal(receipt.source_snapshot_sha256,
    crypto.createHash('sha256').update(snapshotBytes).digest('hex'));

  const checkedIds = [];
  for (const item of manifest.items) {
    const id = `mathematics-2023-myschool-${item.sourceItem}`;
    const expected = independentlySelected[item.sourceItem];
    const source = snapshot.records.find(row => row.source_item === item.sourceItem);
    const proof = receipt.records.find(row => row.id === id);
    const question = pool.find(row => row.id === id);
    const review = ledger.questions[id];
    assert.ok(expected && source && proof && question && review, id);
    assert.equal(item.options[item.answer], expected, id);
    assert.equal(question.options[question.answer], expected, id);
    assert.equal(Object.values(item.options).filter(value => value === expected).length, 1, id);
    assert.equal(source.source_url,
      `https://myschool.ng/classroom/mathematics/${item.sourceItem}?exam_type=jamb&exam_year=2023`, id);
    assert.equal(source.source_observation, item.source_observation, id);
    assert.equal(source.adapted_prompt, item.question, id);
    assert.deepEqual(source.options, item.options, id);
    assert.deepEqual(source.source_figure, item.source_figure, id);
    assert.equal(question.question, item.question, id);
    assert.equal(question.explanation, item.explanation, id);
    assert.equal(question.num, null, id);
    assert.equal(question.has_diagram, false, id);
    assert.equal(question.source_provenance.year_basis, 'publisher-collection', id);
    assert.equal(questionFingerprint(question), proof.content_sha256, id);
    assert.equal(review.content_sha256, proof.content_sha256, id);
    assert.equal(ledger.sources[review.source_id].content_sha256, receipt.source_snapshot_sha256, id);
    assert.equal(assessQuestion(question, ledger).state, 'eligible', id);
    assert.doesNotMatch(question.explanation, /source|publisher|repair|transcription|corrected/i, id);
    checkedIds.push(id);
  }
  for (const held of manifest.remaining_held) {
    assert.ok(!pool.some(row => row.id === `mathematics-2023-myschool-${held.sourceItem}`), held.sourceItem);
  }
  return { passed: true, accepted: checkedIds.length, held: manifest.remaining_held.length,
    question_ids: checkedIds, scope: 'adapted publisher-collection practice; authenticated sitting not asserted' };
}

if (require.main === module) process.stdout.write(JSON.stringify(verify()) + '\n');

module.exports = { independentlySolve, verify };
