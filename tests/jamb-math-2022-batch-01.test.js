'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareBatch } = require('../ops/nigeria-exams/import-jamb-math-2022-batch-01.cjs');
const { renderYear } = require('../scripts/build-jamb-reviewed-pages.js');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('ops/nigeria-exams/jamb-math-2022-curated-batch-01.json');
const pool = read('ops/jamb/source-pool.json');
const ledger = read('data/jamb/review-ledger.json');

test('2022 batch has traceable publisher positions, unique answers and repeatable intake', () => {
  const prepared = prepareBatch(manifest, pool, ledger);
  assert.equal(prepared.receipt.records.length, 16);
  assert.equal(prepared.pool.questions.length, pool.questions.length, 'Repeated import must not add duplicates');
  assert.deepEqual(manifest.items.map(item => item.position),
    [1, 2, 4, 5, 13, 14, 16, 17, 18, 23, 25, 26, 27, 28, 29, 30]);
  assert.equal(new Set(manifest.items.map(item => item.sourceItem)).size, 16);
  for (const item of manifest.items) {
    assert.equal(new Set(Object.values(item.options)).size, 4, item.sourceItem);
    assert.ok(item.options[item.answer], item.sourceItem);
  }
  const wronglyAuthenticated = structuredClone(manifest);
  wronglyAuthenticated.sitting_authenticated = true;
  assert.throws(() => prepareBatch(wronglyAuthenticated, pool, ledger), /provenance or size/);
  const duplicateSource = structuredClone(manifest);
  duplicateSource.items[1].sourceItem = duplicateSource.items[0].sourceItem;
  assert.throws(() => prepareBatch(duplicateSource, pool, ledger), /Duplicate or invalid source position/);
});

test('2022 Mathematics page discloses collection provenance and keeps solutions closed', () => {
  const page = renderYear('mathematics', '2022', pool.questions, ledger, ['2022', '2023', '2024', '2025']);
  assert.equal(page.approvedIds.length, 16);
  assert.match(page.html, /publisher-labelled 2022 collection/);
  assert.match(page.html, /original UTME sitting and question numbers are unconfirmed/i);
  assert.match(page.html, /Practice selection: full-paper coverage has not been confirmed/);
  for (const item of manifest.items) {
    const id = `mathematics-2022-myschool-${item.sourceItem}`;
    assert.ok(page.approvedIds.includes(id), id);
    const card = page.html.match(new RegExp(`<article[^>]+data-reviewed-question="${id}"[^>]*>([\\s\\S]*?)<\\/article>`));
    assert.ok(card, id);
    assert.match(card[1], /<details><summary>Answer and explanation<\/summary>/, id);
    assert.doesNotMatch(card[1], /<details\b[^>]*\bopen\b/, id);
  }
});
