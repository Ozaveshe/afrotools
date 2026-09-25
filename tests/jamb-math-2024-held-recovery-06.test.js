'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareBatch, receiptPath } = require('../ops/nigeria-exams/import-jamb-math-2024-held-recovery-06.cjs');
const { verify } = require('../ops/jamb/verification/check-mathematics-2024-006.cjs');
const { renderYear } = require('../scripts/build-jamb-reviewed-pages.js');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('ops/nigeria-exams/jamb-math-2024-held-recovery-06.json');
const pool = read('ops/jamb/source-pool.json');
const ledger = read('data/jamb/review-ledger.json');

test('three recovered diagrams have independent answer checks and publication receipts', () => {
  const result = verify();
  assert.equal(result.accepted, 3);
  assert.equal(result.held, 5);
  assert.equal(manifest.year_basis, 'publisher-collection');
  assert.equal(manifest.sitting_authenticated, false);
  assert.equal(new Set([...manifest.items, ...manifest.remaining_held].map(row => row.sourceItem)).size, 8);
  const again = prepareBatch(manifest, pool, ledger);
  assert.equal(again.pool.questions.length, pool.questions.length, 'Reimport must not duplicate questions');
  assert.deepEqual(again.receipt, read(receiptPath));
  const falseYear = structuredClone(manifest);
  falseYear.sitting_authenticated = true;
  assert.throws(() => prepareBatch(falseYear, pool, ledger), /provenance or size/);
  const duplicated = structuredClone(manifest);
  duplicated.remaining_held[0].sourceItem = duplicated.items[0].sourceItem;
  assert.throws(() => prepareBatch(duplicated, pool, ledger), /Duplicate or invalid source item/);
});

test('year page teaches each recovered item without surfacing internal source defects', () => {
  const page = renderYear('mathematics', '2024', pool.questions, ledger, ['2024', '2025']);
  assert.ok(page.approvedIds.length >= 47);
  assert.match(page.html, /publisher-labelled 2024 collection/);
  assert.match(page.html, /original UTME sitting and question numbers are unconfirmed/i);
  for (const item of manifest.items) {
    const id = `mathematics-2024-myschool-${item.sourceItem}`;
    assert.ok(page.approvedIds.includes(id), id);
    const card = page.html.match(new RegExp(`<article[^>]+data-reviewed-question="${id}"[^>]*>([\\s\\S]*?)<\\/article>`));
    assert.ok(card, id);
    assert.match(card[1], /<details><summary>Answer and explanation<\/summary>/, id);
    assert.doesNotMatch(card[1], /<details\b[^>]*\bopen\b|source_repair|The source asks|The source omits/i, id);
  }
});
