'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepareBatch } = require('../ops/nigeria-exams/import-jamb-math-2022-batch-02.cjs');
const { renderYear } = require('../scripts/build-jamb-reviewed-pages.js');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('ops/nigeria-exams/jamb-math-2022-curated-batch-02.json');
const first = read('ops/nigeria-exams/jamb-math-2022-curated-batch-01.json');
const pool = read('ops/jamb/source-pool.json');
const ledger = read('data/jamb/review-ledger.json');

test('second 2022 Mathematics batch is traceable, unique and idempotent', () => {
  const prepared = prepareBatch(manifest, pool, ledger);
  assert.equal(prepared.receipt.records.length, 14);
  assert.equal(prepared.pool.questions.length, pool.questions.length);
  assert.deepEqual(manifest.items.map(item => item.position),
    [6, 7, 8, 9, 10, 11, 19, 32, 33, 34, 36, 37, 38, 40]);
  assert.equal(new Set(manifest.items.map(item => item.sourceItem)).size, 14);
  assert.ok(manifest.items.every(item => !first.items.some(prior => prior.position === item.position || prior.sourceItem === item.sourceItem)));
  const duplicate = structuredClone(manifest);
  duplicate.items[0].position = first.items[0].position;
  assert.throws(() => prepareBatch(duplicate, pool, ledger), /Duplicate or invalid source position/);
  const wronglyAuthenticated = structuredClone(manifest);
  wronglyAuthenticated.sitting_authenticated = true;
  assert.throws(() => prepareBatch(wronglyAuthenticated, pool, ledger), /provenance or size/);
});

test('second batch renders as publisher-labelled practice with closed explanations', () => {
  const page = renderYear('mathematics', '2022', pool.questions, ledger, ['2022', '2023', '2024', '2025']);
  assert.equal(page.approvedIds.length, 30);
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
    assert.doesNotMatch(card[1], /repaired|publisher error|source defect/i, id);
  }
});
