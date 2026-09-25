'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareBatch } = require('../ops/nigeria-exams/import-jamb-math-2024-batch-02.cjs');
const { renderYear } = require('../scripts/build-jamb-reviewed-pages.js');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('ops/nigeria-exams/jamb-math-2024-curated-batch-02.json');
const subsequentlyRecovered = new Set(read('ops/nigeria-exams/jamb-math-2024-2025-held-recovery-05.json').items
  .filter(item => item.year === 2024).map(item => item.sourceItem));
const pool = read('ops/jamb/source-pool.json');
const ledger = read('data/jamb/review-ledger.json');

test('the 15 publisher positions have distinct decisions and the import is repeatable', () => {
  assert.deepEqual([...manifest.items, ...manifest.held].map(item => item.position).sort((a, b) => a - b),
    Array.from({ length: 15 }, (_, index) => index + 26));
  assert.equal(new Set([...manifest.items, ...manifest.held].map(item => item.sourceItem)).size, 15);
  assert.deepEqual(manifest.held.map(item => item.position), [27, 32, 37]);
  assert.equal(manifest.year_basis, 'publisher-collection');
  assert.equal(manifest.sitting_authenticated, false);

  const prepared = prepareBatch(manifest, pool, ledger);
  assert.equal(prepared.receipt.records.length, 12);
  assert.equal(prepared.pool.questions.length, pool.questions.length, 'Repeated import must not add duplicates');
  assert.equal(prepared.receipt.source_snapshot_sha256,
    read('ops/jamb/verification/mathematics-2024-publishable-002.json').source_snapshot_sha256);
  for (const item of manifest.held) {
    if (subsequentlyRecovered.has(item.sourceItem)) continue;
    assert.ok(!pool.questions.some(question => question.id === `mathematics-2024-myschool-${item.sourceItem}`),
      `Held position ${item.position} entered the pool`);
  }

  const falselyAuthenticated = structuredClone(manifest);
  falselyAuthenticated.sitting_authenticated = true;
  assert.throws(() => prepareBatch(falselyAuthenticated, pool, ledger), /provenance or size/);
  const duplicateSource = structuredClone(manifest);
  duplicateSource.items[1].sourceItem = duplicateSource.items[0].sourceItem;
  assert.throws(() => prepareBatch(duplicateSource, pool, ledger), /Duplicate or invalid source item/);
});

test('the 2024 year page discloses provenance and keeps batch-02 worked answers closed by default', () => {
  const page = renderYear('mathematics', '2024', pool.questions, ledger, ['2024', '2024']);
  assert.ok(page.approvedIds.length >= 32);
  assert.match(page.html, /publisher-labelled 2024 collection/);
  assert.match(page.html, /original UTME sitting and question numbers are unconfirmed/i);
  assert.match(page.html, /Practice selection: full-paper coverage has not been confirmed/);
  for (const item of manifest.items) {
    const id = `mathematics-2024-myschool-${item.sourceItem}`;
    assert.ok(page.approvedIds.includes(id), id);
    const card = page.html.match(new RegExp(`<article[^>]+data-reviewed-question="${id}"[^>]*>([\\s\\S]*?)<\\/article>`));
    assert.ok(card, id);
    assert.match(card[1], /<details><summary>Answer and explanation<\/summary>/, id);
    assert.match(card[1], /AI-reviewed · calculation checked/, id);
    assert.match(card[1], /Original sitting and question number unconfirmed/, id);
    assert.doesNotMatch(card[1], /<details\b[^>]*\bopen\b/, id);
  }
  for (const item of manifest.held) {
    if (subsequentlyRecovered.has(item.sourceItem)) continue;
    assert.ok(!page.html.includes(`mathematics-2024-myschool-${item.sourceItem}`));
  }
});
