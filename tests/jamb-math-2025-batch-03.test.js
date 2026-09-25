'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareBatch } = require('../ops/nigeria-exams/import-jamb-math-2025-batch-03.cjs');
const { renderYear } = require('../scripts/build-jamb-reviewed-pages.js');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('ops/nigeria-exams/jamb-math-2025-curated-batch-03.json');
const pool = read('ops/jamb/source-pool.json');
const ledger = read('data/jamb/review-ledger.json');

test('all ten collection positions have a single decision and importing again adds no duplicate', () => {
  assert.deepEqual([...manifest.items, ...manifest.held].map(item => item.position).sort((a, b) => a - b),
    Array.from({ length: 10 }, (_, index) => index + 46));
  assert.equal(new Set([...manifest.items, ...manifest.held].map(item => item.sourceItem)).size, 10);
  assert.deepEqual(manifest.items.map(item => item.position), [48, 54]);
  assert.equal(manifest.year_basis, 'publisher-collection');
  assert.equal(manifest.sitting_authenticated, false);

  const prepared = prepareBatch(manifest, pool, ledger);
  assert.equal(prepared.receipt.records.length, 2);
  assert.equal(prepared.pool.questions.length, pool.questions.length);
  assert.equal(prepared.receipt.source_snapshot_sha256,
    read('ops/jamb/verification/mathematics-2025-publishable-003.json').source_snapshot_sha256);
  for (const item of manifest.held) {
    assert.ok(!pool.questions.some(question => question.id === `mathematics-2025-myschool-${item.sourceItem}`),
      `Held position ${item.position} entered the pool`);
  }

  const falselyAuthenticated = structuredClone(manifest);
  falselyAuthenticated.sitting_authenticated = true;
  assert.throws(() => prepareBatch(falselyAuthenticated, pool, ledger), /provenance or size/);
  const duplicateSource = structuredClone(manifest);
  duplicateSource.held[0].sourceItem = duplicateSource.items[0].sourceItem;
  assert.throws(() => prepareBatch(duplicateSource, pool, ledger), /Duplicate or invalid source item/);
});

test('the 2025 page shows two new closed answers with the collection-year caveat', () => {
  const page = renderYear('mathematics', '2025', pool.questions, ledger, ['2024', '2025']);
  assert.equal(page.approvedIds.length, 36);
  assert.match(page.html, /publisher-labelled 2025 collection/);
  assert.match(page.html, /original UTME sitting and question numbers are unconfirmed/i);
  for (const item of manifest.items) {
    const id = `mathematics-2025-myschool-${item.sourceItem}`;
    assert.ok(page.approvedIds.includes(id), id);
    const card = page.html.match(new RegExp(`<article[^>]+data-reviewed-question="${id}"[^>]*>([\\s\\S]*?)<\\/article>`));
    assert.ok(card, id);
    assert.match(card[1], /<details><summary>Answer and explanation<\/summary>/, id);
    assert.match(card[1], /Original sitting and question number unconfirmed/, id);
    assert.doesNotMatch(card[1], /<details\b[^>]*\bopen\b/, id);
  }
  for (const item of manifest.held) assert.ok(!page.html.includes(`mathematics-2025-myschool-${item.sourceItem}`));
});
