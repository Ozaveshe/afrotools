'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { prepareBatch } = require('../ops/nigeria-exams/import-jamb-english-2024-batch-03.cjs');
const { verify } = require('../ops/jamb/verification/check-english-2024-904.cjs');
const { renderYear } = require('../scripts/build-jamb-reviewed-pages.js');

const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const manifestPath = 'ops/nigeria-exams/jamb-english-2024-curated-batch-03.json';
const bytes = fs.readFileSync(path.join(root, manifestPath));
const manifest = JSON.parse(bytes);
const hash = crypto.createHash('sha256').update(bytes).digest('hex');
const pool = read('ops/jamb/source-pool.json');
const ledger = read('data/jamb/review-ledger.json');
const receipt = read('ops/jamb/verification/english-2024-publishable-904.json');

test('the bounded 2024 English review classifies all 40 positions and replays without duplicate questions', () => {
  assert.deepEqual([...manifest.records, ...manifest.held_source_items]
    .map(row => row.source_item).sort((a, b) => a - b),
  Array.from({ length: 40 }, (_, index) => index + 76));
  const replay = prepareBatch(manifest, hash, pool, ledger);
  assert.equal(replay.pool.questions.length, pool.questions.length);
  assert.equal(replay.batch.records.length, 14);
  assert.deepEqual(replay.batch.records.map(row => row.id), receipt.records.map(row => row.id));
});

test('independently selected answer text catches a changed key', () => {
  assert.equal(verify(manifest, hash, pool, ledger, receipt).passed, true);
  const changed = structuredClone(pool);
  changed.questions.find(row => row.id === 'english-2024-myschool-70098').answer = 'A';
  assert.throws(() => verify(manifest, hash, changed, ledger, receipt));
});

test('the English 2024 page labels the collection without claiming an authenticated sitting', () => {
  const page = renderYear('english', '2024', pool.questions, ledger, ['2024', '2025']);
  assert.match(page.html, /publisher-labelled 2024 collection/i);
  assert.match(page.html, /original UTME sitting and question numbers are unconfirmed/i);
  for (const row of manifest.records) {
    const id = `english-2024-myschool-${row.source_question_id}`;
    assert.ok(page.approvedIds.includes(id));
    assert.match(page.html, new RegExp(`data-reviewed-question="${id}"`));
  }
});
