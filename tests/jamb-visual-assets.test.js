'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { visualAssetHash, assertVisualAssetFiles } = require('../scripts/lib/jamb-visual-assets');

test('reviewed figure files must exist and match the content-addressed path and ledger', t => {
  const temporaryParent = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(temporaryParent, 'jamb-figure-assets-'));
  assert.equal(path.dirname(fs.realpathSync(root)), temporaryParent);
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const bytes = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40"/></svg>');
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  const question = { id: 'synthetic-visual', image: '/assets/img/jamb/' + hash + '.svg' };
  const ledger = { questions: { [question.id]: { asset_review: { content_sha256: hash } } } };
  const directory = path.join(root, 'assets/img/jamb');
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(root, question.image.slice(1));
  assert.throws(() => assertVisualAssetFiles(root, [question], ledger), /ENOENT/);
  fs.writeFileSync(file, bytes);
  assert.equal(assertVisualAssetFiles(root, [question], ledger), 1);
  assert.equal(assertVisualAssetFiles(root, [{ id: 'text-only' }], ledger), 0);
  ledger.questions[question.id].asset_review.content_sha256 = 'b'.repeat(64);
  assert.throws(() => assertVisualAssetFiles(root, [question], ledger), /review does not match/);
  ledger.questions[question.id].asset_review.content_sha256 = hash;
  fs.appendFileSync(file, 'changed');
  assert.throws(() => assertVisualAssetFiles(root, [question], ledger), /bytes changed/);
  fs.writeFileSync(file, Buffer.alloc(65537));
  assert.throws(() => assertVisualAssetFiles(root, [question], ledger), /figure size/);
});

test('external, traversal, query-string and mutable image paths are unsupported', () => {
  const hash = 'a'.repeat(64);
  assert.equal(visualAssetHash('/assets/img/jamb/' + hash + '.svg'), hash);
  for (const value of [null, '/assets/img/jamb/figure.svg', '/assets/img/jamb/../' + hash + '.svg',
    'https://example.com/assets/img/jamb/' + hash + '.svg', '/assets/img/jamb/' + hash + '.svg?v=1']) assert.equal(visualAssetHash(value), null);
});
