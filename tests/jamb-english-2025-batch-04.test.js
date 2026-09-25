'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { prepareBatch } = require('../ops/nigeria-exams/import-jamb-english-2025-batch-04.cjs');
const { verify } = require('../ops/jamb/verification/check-english-2025-004.cjs');
const { renderYear } = require('../scripts/build-jamb-reviewed-pages.js');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifestPath = 'ops/nigeria-exams/jamb-english-2025-curated-batch-04.json';
const bytes = fs.readFileSync(path.join(root, manifestPath));
const manifest = JSON.parse(bytes);
const hash = crypto.createHash('sha256').update(bytes).digest('hex');
const pool = read('ops/jamb/source-pool.json');
const ledger = read('data/jamb/review-ledger.json');
const receipt = read('ops/jamb/verification/english-2025-publishable-004.json');

test('all 12 collection positions are classified, with no held item imported', () => {
  assert.deepEqual([...manifest.records, ...manifest.held_source_items].map(row => row.source_item).sort((a, b) => a - b),
    Array.from({ length: 12 }, (_, index) => index + 246));
  assert.deepEqual(manifest.records.map(row => row.source_item),
    [246, 247, 249, 250, 251, 252, 253, 254, 255, 256, 257]);
  assert.equal(manifest.sitting_authenticated, false);
  const replay = prepareBatch(manifest, hash, pool, ledger);
  assert.equal(replay.pool.questions.length, pool.questions.length, 'replay must not append duplicates');
  assert.equal(replay.batch.records.length, 11);
  for (const row of manifest.held_source_items) {
    assert.ok(!pool.questions.some(question => question.id === `english-2025-myschool-${row.source_question_id}`));
  }
  const falseSitting = structuredClone(manifest);
  falseSitting.sitting_authenticated = true;
  assert.throws(() => prepareBatch(falseSitting, hash, pool, ledger), /source manifest/);
});

test('independent answer checker agrees with source-linked review and catches an altered answer', () => {
  assert.equal(verify(manifest, hash, pool, ledger, receipt).passed, true);
  const changed = structuredClone(pool);
  const question = changed.questions.find(row => row.id === 'english-2025-myschool-74857');
  question.answer = 'A';
  assert.throws(() => verify(manifest, hash, changed, ledger, receipt));
});

test('the 2025 English page presents the new reviewed items as a labelled collection', () => {
  const page = renderYear('english', '2025', pool.questions, ledger, ['2024', '2025']);
  assert.ok(page.approvedIds.length >= 40);
  assert.match(page.html, /publisher-labelled 2025 collection/);
  assert.match(page.html, /original UTME sitting and question numbers are unconfirmed/i);
  for (const row of manifest.records) {
    const id = `english-2025-myschool-${row.source_question_id}`;
    assert.ok(page.approvedIds.includes(id));
    assert.match(page.html, new RegExp(`data-reviewed-question="${id}"`));
  }
  for (const row of manifest.held_source_items) {
    assert.ok(!page.html.includes(`english-2025-myschool-${row.source_question_id}`));
  }
});
