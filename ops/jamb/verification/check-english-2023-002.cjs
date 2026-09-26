'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const { questionFingerprint, assessQuestion } = require('../../../scripts/lib/jamb-content-trust');
const { manifestPath, batchPath, itemId } = require('../../nigeria-exams/import-jamb-english-2023-myschool-batch-01.cjs');

// Independently selected answer text is pinned separately from option letters.
const expectedAnswerText = {
  27: 'essential',
  30: 'short',
  48: 'courteous',
  50: 'abhorrent',
  56: 'imitate those habits',
  58: 'brother',
  67: 'still in existence',
  86: 'hurried inside',
  87: 'half',
  89: 'after dark',
  108: 'It was completely full.',
  109: '2026',
  113: 'auxiliary',
  114: 'It is completely true.',
  117: 'witch'
};

function verify(manifest, manifestHash, pool, ledger, batch) {
  assert.equal(batch.source_file, manifestPath);
  assert.equal(batch.source_snapshot_sha256, manifestHash);
  assert.equal(batch.year_basis, 'publisher-collection');
  assert.equal(manifest.sitting_authenticated, false);
  assert.equal(manifest.records.length, Object.keys(expectedAnswerText).length);
  assert.equal(batch.records.length, manifest.records.length);
  const held = new Set(manifest.held_source_items.map(row => row.source_item));
  const checked = [];
  for (const row of manifest.records) {
    const id = itemId(row.source_item);
    const question = pool.questions.find(candidate => candidate.id === id);
    const record = batch.records.find(candidate => candidate.id === id);
    const review = ledger.questions[id];
    const source = ledger.sources[review?.source_id];
    assert.ok(question && record && review && source, id);
    assert.ok(!held.has(row.source_item), id + ': held item imported');
    assert.equal(questionFingerprint(question), record.content_sha256, id);
    assert.equal(review.content_sha256, record.content_sha256, id);
    assert.equal(source.content_sha256, manifestHash, id);
    assert.equal(source.source_url, row.source_url, id);
    assert.equal(source.source_item, row.source_item, id);
    assert.equal(source.year_basis, 'publisher-collection', id);
    assert.equal(source.official_answer_key, false, id);
    assert.equal(question.question, row.question, id);
    assert.deepEqual(Object.values(question.options), row.choices, id);
    assert.equal(question.options[question.answer], expectedAnswerText[row.source_item], id + ': independently selected answer');
    assert.equal(question.explanation, row.explanation, id);
    assert.doesNotMatch(question.explanation, /source note:|publisher|internal repair|source repair|transcription/i, id);
    assert.equal(question.verification.method, 'ai-source-checked', id);
    assert.equal(question.source_provenance.url, row.source_url, id);
    assert.equal(question.source_provenance.year_basis, 'publisher-collection', id);
    assert.equal(question.num, null, id + ': collection position is not a paper number');
    assert.equal(question.passage, undefined, id);
    assert.equal(record.source_item, row.source_item, id);
    assert.equal(record.source_url, row.source_url, id);
    assert.deepEqual(record.independent_source_urls, row.independent_source_urls, id);
    assert.equal(record.independently_selected_answer, expectedAnswerText[row.source_item], id);
    assert.equal(record.independent_reasoning, row.explanation, id);
    assert.equal(assessQuestion(question, ledger).state, 'eligible', id);
    checked.push(id);
  }
  assert.equal(new Set(checked).size, checked.length);
  assert.deepEqual(batch.records.map(row => row.id).sort(), checked.slice().sort());
  return { passed: true, question_ids: checked };
}

function main() {
  const bytes = fs.readFileSync(path.join(root, manifestPath));
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  const result = verify(JSON.parse(bytes), hash,
    read('ops/jamb/source-pool.json'), read('data/jamb/review-ledger.json'), read(batchPath));
  console.log(JSON.stringify(result));
}

if (require.main === module) main();
module.exports = { verify, expectedAnswerText };
