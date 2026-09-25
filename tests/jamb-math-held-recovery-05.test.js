'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareBatch, receiptPath } = require('../ops/nigeria-exams/import-jamb-math-held-recovery-05.cjs');
const { verify } = require('../ops/jamb/verification/check-mathematics-held-recovery-05.cjs');
const { renderYear } = require('../scripts/build-jamb-reviewed-pages.js');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('ops/nigeria-exams/jamb-math-2024-2025-held-recovery-05.json');
const pool = read('ops/jamb/source-pool.json');
const ledger = read('data/jamb/review-ledger.json');

test('held recovery admits only individually sourced, nonduplicate and independently checked items', () => {
  assert.equal(manifest.sitting_authenticated, false);
  assert.equal(manifest.year_basis, 'publisher-collection');
  assert.equal(new Set([...manifest.items, ...manifest.remaining_held].map(x => x.sourceItem)).size, 19);
  assert.equal(verify(2024).accepted, 3);
  assert.equal(verify(2025).accepted, 8);

  const again = prepareBatch(manifest, pool, ledger);
  assert.equal(again.pool.questions.length, pool.questions.length, 'Reimport must not duplicate questions');
  for (const year of [2024, 2025]) {
    assert.deepEqual(again.outputs[year].receipt, read(receiptPath(year)));
    for (const held of manifest.remaining_held.filter(x => x.year === year)) {
      assert.ok(!again.outputs[year].receipt.records.some(row => row.source_item === held.sourceItem), held.sourceItem);
    }
  }
  const falseYear = structuredClone(manifest);
  falseYear.sitting_authenticated = true;
  assert.throws(() => prepareBatch(falseYear, pool, ledger), /provenance or size/);
  const duplicated = structuredClone(manifest);
  duplicated.remaining_held[0].sourceItem = duplicated.items[0].sourceItem;
  assert.throws(() => prepareBatch(duplicated, pool, ledger), /Duplicate or invalid source item/);
});

test('the year pages show all recovered questions with closed explanations and source caveats', () => {
  for (const year of [2024, 2025]) {
    const page = renderYear('mathematics', String(year), pool.questions, ledger, ['2024', '2025']);
    assert.ok(page.approvedIds.length >= (year === 2024 ? 44 : 53));
    assert.match(page.html, new RegExp(`publisher-labelled ${year} collection`));
    assert.match(page.html, /original UTME sitting and question numbers are unconfirmed/i);
    for (const item of manifest.items.filter(x => x.year === year)) {
      const id = `mathematics-${year}-myschool-${item.sourceItem}`;
      assert.ok(page.approvedIds.includes(id), id);
      const card = page.html.match(new RegExp(`<article[^>]+data-reviewed-question="${id}"[^>]*>([\\s\\S]*?)<\\/article>`));
      assert.ok(card, id);
      assert.match(card[1], /<details><summary>Answer and explanation<\/summary>/, id);
      assert.doesNotMatch(card[1], /<details\b[^>]*\bopen\b|source_repair|The source asks|The source omits/i, id);
    }
  }
});
