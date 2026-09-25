'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareBatch } = require('../ops/nigeria-exams/import-jamb-math-2025-batch-02.cjs');
const { renderYear } = require('../scripts/build-jamb-reviewed-pages.js');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('ops/nigeria-exams/jamb-math-2025-curated-batch-02.json');
const recoveredItems = read('ops/nigeria-exams/jamb-math-2025-curated-recovery-04.json').items;
const recoveredSourceItems = new Set(recoveredItems.map(item => item.sourceItem));
for (const item of read('ops/nigeria-exams/jamb-math-2024-2025-held-recovery-05.json').items.filter(x => x.year === 2025)) {
  recoveredSourceItems.add(item.sourceItem);
}
const pool = read('ops/jamb/source-pool.json');
const ledger = read('data/jamb/review-ledger.json');

test('the 25 publisher positions have distinct decisions and the import is repeatable', () => {
  assert.deepEqual([...manifest.items, ...manifest.held].map(item => item.position).sort((a, b) => a - b),
    Array.from({ length: 25 }, (_, index) => index + 21));
  assert.equal(new Set([...manifest.items, ...manifest.held].map(item => item.sourceItem)).size, 25);
  assert.deepEqual(manifest.held.map(item => item.position), [34, 35, 36, 40, 42, 44]);
  assert.equal(manifest.year_basis, 'publisher-collection');
  assert.equal(manifest.sitting_authenticated, false);

  const prepared = prepareBatch(manifest, pool, ledger);
  assert.equal(prepared.receipt.records.length, 19);
  assert.equal(prepared.pool.questions.length, pool.questions.length, 'Repeated import must not add duplicates');
  assert.equal(prepared.receipt.source_snapshot_sha256,
    read('ops/jamb/verification/mathematics-2025-publishable-002.json').source_snapshot_sha256);
  for (const item of manifest.held) {
    if (recoveredSourceItems.has(item.sourceItem)) continue;
    assert.ok(!pool.questions.some(question => question.id === `mathematics-2025-myschool-${item.sourceItem}`),
      `Held position ${item.position} entered the pool`);
  }

  const falselyAuthenticated = structuredClone(manifest);
  falselyAuthenticated.sitting_authenticated = true;
  assert.throws(() => prepareBatch(falselyAuthenticated, pool, ledger), /provenance or size/);
  const duplicateSource = structuredClone(manifest);
  duplicateSource.items[1].sourceItem = duplicateSource.items[0].sourceItem;
  assert.throws(() => prepareBatch(duplicateSource, pool, ledger), /Duplicate or invalid source item/);
});

test('the 2025 year page discloses provenance and keeps reviewed answers closed by default', () => {
  const page = renderYear('mathematics', '2025', pool.questions, ledger, ['2024', '2025']);
  assert.ok(page.approvedIds.length >= 34 + recoveredItems.length);
  assert.match(page.html, /publisher-labelled 2025 collection/);
  assert.match(page.html, /original UTME sitting and question numbers are unconfirmed/i);
  assert.match(page.html, /Practice selection: full-paper coverage has not been confirmed/);
  for (const item of manifest.items) {
    const id = `mathematics-2025-myschool-${item.sourceItem}`;
    assert.ok(page.approvedIds.includes(id), id);
    const card = page.html.match(new RegExp(`<article[^>]+data-reviewed-question="${id}"[^>]*>([\\s\\S]*?)<\\/article>`));
    assert.ok(card, id);
    assert.match(card[1], /<details><summary>Answer and explanation<\/summary>/, id);
    assert.match(card[1], /AI-reviewed · calculation checked/, id);
    assert.match(card[1], /Original sitting and question number unconfirmed/, id);
    assert.doesNotMatch(card[1], /<details\b[^>]*\bopen\b/, id);
  }
  for (const item of manifest.held) {
    if (!recoveredSourceItems.has(item.sourceItem))
      assert.ok(!page.html.includes(`mathematics-2025-myschool-${item.sourceItem}`));
  }
});
