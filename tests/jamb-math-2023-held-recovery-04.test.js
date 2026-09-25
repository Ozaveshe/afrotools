'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareBatch, receiptPath } = require('../ops/nigeria-exams/import-jamb-math-2023-held-recovery-04.cjs');
const { independentlySolve, verify } = require('../ops/jamb/verification/check-mathematics-2023-004.cjs');
const { renderYear } = require('../scripts/build-jamb-reviewed-pages.js');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('ops/nigeria-exams/jamb-math-2023-held-recovery-04.json');
const originalHolds = read('ops/nigeria-exams/jamb-math-2023-held-20260924.json');
const pool = read('ops/jamb/source-pool.json');
const ledger = read('data/jamb/review-ledger.json');

test('nine previously held Maths items have independent answers and a pinned review receipt', () => {
  const result = verify();
  assert.equal(result.accepted, 9);
  assert.equal(result.held, 11);
  assert.equal(Object.keys(independentlySolve()).length, 9);
  assert.equal(new Set([...manifest.items, ...manifest.remaining_held].map(row => row.sourceItem)).size, 20);
  const again = prepareBatch(manifest, originalHolds, pool, ledger);
  assert.equal(again.pool.questions.length, pool.questions.length, 'Reimport must not duplicate questions');
  assert.deepEqual(again.receipt, read(receiptPath));
  const falseYear = structuredClone(manifest);
  falseYear.sitting_authenticated = true;
  assert.throws(() => prepareBatch(falseYear, originalHolds, pool, ledger), /provenance or size/);
  const duplicated = structuredClone(manifest);
  duplicated.remaining_held[0].sourceItem = duplicated.items[0].sourceItem;
  assert.throws(() => prepareBatch(duplicated, originalHolds, pool, ledger), /Duplicate or invalid source item/);
});

test('publisher-labelled year page hides the checked answers until students ask for them', () => {
  const page = renderYear('mathematics', '2023', pool.questions, ledger, ['2023', '2024', '2025']);
  assert.ok(page.approvedIds.length >= 69);
  assert.match(page.html, /publisher-labelled 2023 collection/);
  assert.match(page.html, /original UTME sitting and question numbers are unconfirmed/i);
  for (const item of manifest.items) {
    const id = `mathematics-2023-myschool-${item.sourceItem}`;
    assert.ok(page.approvedIds.includes(id), id);
    const card = page.html.match(new RegExp(`<article[^>]+data-reviewed-question="${id}"[^>]*>([\\s\\S]*?)<\\/article>`));
    assert.ok(card, id);
    assert.match(card[1], /<details><summary>Answer and explanation<\/summary>/, id);
    assert.doesNotMatch(card[1], /<details\b[^>]*\bopen\b|source_repair|The source asks|The source omits/i, id);
  }
});
