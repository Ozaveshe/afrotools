'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareBatch } = require('../ops/nigeria-exams/import-jamb-math-2024-batch-03.cjs');
const { renderYear } = require('../scripts/build-jamb-reviewed-pages.js');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('ops/nigeria-exams/jamb-math-2024-curated-batch-03.json');
const pool = read('ops/jamb/source-pool.json');
const ledger = read('data/jamb/review-ledger.json');

test('positions 41–50 have distinct decisions and repeat import cannot add duplicates', () => {
  assert.deepEqual([...manifest.items, ...manifest.held].map(item => item.position).sort((a, b) => a - b),
    Array.from({ length: 10 }, (_, index) => index + 41));
  assert.equal(new Set([...manifest.items, ...manifest.held].map(item => item.sourceItem)).size, 10);
  assert.deepEqual(manifest.held.map(item => item.position), [45]);
  assert.equal(manifest.year_basis, 'publisher-collection');
  assert.equal(manifest.sitting_authenticated, false);

  const prepared = prepareBatch(manifest, pool, ledger);
  assert.equal(prepared.receipt.records.length, 9);
  assert.equal(prepared.pool.questions.length, pool.questions.length);
  assert.equal(prepared.receipt.source_snapshot_sha256,
    read('ops/jamb/verification/mathematics-2024-publishable-003.json').source_snapshot_sha256);
  assert.ok(!pool.questions.some(row => row.id === 'mathematics-2024-myschool-70347'));

  const falselyAuthenticated = structuredClone(manifest);
  falselyAuthenticated.sitting_authenticated = true;
  assert.throws(() => prepareBatch(falselyAuthenticated, pool, ledger), /provenance or size/);
  const duplicateSource = structuredClone(manifest);
  duplicateSource.held[0].sourceItem = duplicateSource.items[0].sourceItem;
  assert.throws(() => prepareBatch(duplicateSource, pool, ledger), /Duplicate or invalid source item/);
  const missingFigureEvidence = structuredClone(manifest);
  missingFigureEvidence.items.find(item => item.position === 48).source_figure.transcription = '';
  assert.throws(() => prepareBatch(missingFigureEvidence, pool, ledger), /Incomplete reviewed item/);
});

test('the 2024 page keeps the collection-year caveat and all new answers closed', () => {
  const page = renderYear('mathematics', '2024', pool.questions, ledger, ['2024', '2025']);
  assert.ok(page.approvedIds.length >= 41);
  assert.match(page.html, /publisher-labelled 2024 collection/);
  assert.match(page.html, /original UTME sitting and question numbers are unconfirmed/i);
  assert.match(page.html, /Practice selection: full-paper coverage has not been confirmed/);
  for (const item of manifest.items) {
    const id = `mathematics-2024-myschool-${item.sourceItem}`;
    assert.ok(page.approvedIds.includes(id), id);
    const card = page.html.match(new RegExp(`<article[^>]+data-reviewed-question="${id}"[^>]*>([\\s\\S]*?)<\\/article>`));
    assert.ok(card, id);
    assert.match(card[1], /<details><summary>Answer and explanation<\/summary>/, id);
    assert.match(card[1], /Original sitting and question number unconfirmed/, id);
    assert.doesNotMatch(card[1], /<details\b[^>]*\bopen\b/, id);
  }
  assert.ok(!page.html.includes('mathematics-2024-myschool-70347'));
});
