'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const { questionFingerprint } = require('../scripts/lib/jamb-content-trust');
const { renderYear } = require('../scripts/build-jamb-reviewed-pages');
const { prepareBatch, manifestPath, batchPath } = require('../ops/nigeria-exams/import-jamb-english-2025-vantelum-batch-01.cjs');
const { verify } = require('../ops/jamb/verification/check-english-2025-005.cjs');

const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));

test('English 2025 Vantelum revision batch is independently checked and idempotent', () => {
  const bytes = fs.readFileSync(path.join(root, manifestPath));
  const manifest = JSON.parse(bytes);
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  const pool = read('ops/jamb/source-pool.json');
  const ledger = read('data/jamb/review-ledger.json');
  const batch = read(batchPath);
  const originalCount = pool.questions.length;
  assert.equal(manifest.records.length, 15);
  assert.deepEqual(manifest.held_source_items.map(row => row.source_item), [17]);
  assert.equal(verify(manifest, hash, pool, ledger, batch).passed, true);
  const replay = prepareBatch(manifest, hash, pool, ledger);
  assert.equal(replay.pool.questions.length, originalCount);
  assert.deepEqual(replay.batch, batch);
  for (const row of manifest.records) {
    const id = `english-2025-vantelum-${String(row.source_item).padStart(2, '0')}`;
    const question = pool.questions.find(candidate => candidate.id === id);
    assert.equal(question.num, null, id);
    assert.equal(question.source_provenance.year_basis, 'publisher-collection', id);
    assert.doesNotMatch(question.explanation, /source note:|publisher|internal repair|source repair|transcription/i, id);
  }
  assert.equal(pool.questions.some(question => question.id === 'english-2025-vantelum-17'), false);
  const page = renderYear('english', '2025', pool.questions, ledger);
  assert.match(page.html, /55 reviewed questions with answers and explanations/);
  assert.match(page.html, /publisher-labelled 2025 collections/);
  assert.match(page.html, /Original sitting and question number unconfirmed/);
});

test('English 2025 Vantelum review rejects forged year and poisoned key', () => {
  const bytes = fs.readFileSync(path.join(root, manifestPath));
  const manifest = JSON.parse(bytes);
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  const pool = read('ops/jamb/source-pool.json');
  const ledger = read('data/jamb/review-ledger.json');
  const batch = read(batchPath);
  const forgedYear = structuredClone(manifest);
  forgedYear.year_basis = 'authenticated-sitting';
  assert.throws(() => prepareBatch(forgedYear, hash, pool, ledger), /Unexpected 2025 English Vantelum/);
  const acceptedAndHeld = structuredClone(manifest);
  acceptedAndHeld.held_source_items.push({ source_item: 3, reason: 'Synthetic conflict: this item is both held and accepted.' });
  assert.throws(() => prepareBatch(acceptedAndHeld, hash, pool, ledger), /accepted-and-held/);

  const changedPool = structuredClone(pool);
  const changedLedger = structuredClone(ledger);
  const changedBatch = structuredClone(batch);
  const id = 'english-2025-vantelum-03';
  const question = changedPool.questions.find(candidate => candidate.id === id);
  question.answer = 'A';
  const fingerprint = questionFingerprint(question);
  changedLedger.questions[id].content_sha256 = fingerprint;
  const record = changedBatch.records.find(candidate => candidate.id === id);
  record.content_sha256 = fingerprint;
  record.independently_selected_answer = 'hid';
  assert.throws(() => verify(manifest, hash, changedPool, changedLedger, changedBatch), /independently selected answer/);
});
