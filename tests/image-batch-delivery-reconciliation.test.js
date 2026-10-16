'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { reconcileImageBatch } = require('../scripts/lib/image-batch-delivery-reconciliation');
const { imageSize } = require('../scripts/lib/image-size');
const proof = require('../data/image-generation/next-200-delivery-reconciliation.json');
const ledger = require('../data/image-generation/kitchen-generated-2026-10-09.json');
const root = path.resolve(__dirname, '..');
const batchBytes = fs.readFileSync(path.join(root, 'data/image-generation/next-200.json'));
const batch = JSON.parse(batchBytes);
const clone = value => JSON.parse(JSON.stringify(value));
function context() {
  // Finite inventory fixture for this reconciliation, not a regenerated library.
  return { batchBytes, proof: clone(proof), ledger: clone(ledger),
    library: { images: proof.deliveries.map(row => ({ ...row })) },
    readAsset: file => fs.readFileSync(path.join(root, file.replace(/^\//, ''))) };
}

test('retained original200 batch reconciles only the two accepted source asset deliveries', () => {
  const input = context();
  const originalStems = new Set(input.library.images.map(row => row.path.replace(/\.[^.]+$/, '')));
  assert.deepEqual(batch.images.filter(row => originalStems.has(row.path.replace(/\.[^.]+$/, ''))).map(row => row.id).sort(),
    ['recipe-kapenta-stew-zm', 'recipe-oleleh-sl']);
  assert.deepEqual(reconcileImageBatch(input), {
    retainedRequests: 200, reviewedSourceDeliveries: 2, unreconciledRequests: 198
  });
  for (const row of proof.deliveries) {
    const size = imageSize(path.join(root, row.path.slice(1)));
    assert.deepEqual(size, { w: row.width, h: row.height });
  }
});
test('wrong physical asset hash fails even when inventory and intake still match', () => {
  const input = context(), read = input.readAsset;
  input.readAsset = file => { const bytes = Buffer.from(read(file)); bytes[bytes.length - 1] ^= 1; return bytes; };
  assert.throws(() => reconcileImageBatch(input), /physical hash drift/);
});
test('wrong inventory hash cannot excuse an existing request stem', () => {
  const input = context(); input.library.images[0].sha256 = '0'.repeat(64);
  assert.throws(() => reconcileImageBatch(input), /inventory sha256 drift/);
});
test('wrong reviewed intake variant hash cannot authorize delivery', () => {
  const input = context();
  input.ledger.images.find(row => row.slug === 'kapenta-stew-zm').variants.find(row => row.path === proof.deliveries[0].path).sha256 = '0'.repeat(64);
  assert.throws(() => reconcileImageBatch(input), /intake sha256 drift/);
});
test('an unexpected delivered request among the other198 retains the no-existing-stem guard', () => {
  const input = context(), unexpected = batch.images.find(row => !proof.deliveries.some(delivery => delivery.id === row.id));
  input.library.images.push({ path: unexpected.path });
  assert.throws(() => reconcileImageBatch(input), /Unexpected existing request stem/);
});
test('a missing accepted delivery fails rather than silently becoming pending', () => {
  const input = context(); input.library.images.pop();
  assert.throws(() => reconcileImageBatch(input), /delivery missing/);
});
test('duplicate delivery records fail without broadening the allowlist', () => {
  const input = context(); input.proof.deliveries[1] = clone(input.proof.deliveries[0]);
  assert.throws(() => reconcileImageBatch(input), /Duplicate delivery ID/);
});
test('another extension for an accepted stem is still an unexpected delivery', () => {
  const input = context(); input.library.images.push({ ...input.library.images[0], path: input.library.images[0].path.replace(/\.webp$/, '.png') });
  assert.throws(() => reconcileImageBatch(input), /unexpected extra extension/);
});
test('changed batch bytes or a later batch cannot inherit this reconciliation', () => {
  for (const bytes of [Buffer.concat([batchBytes, Buffer.from('\n')]), Buffer.from(JSON.stringify({ ...batch, batch_id: 'later-batch' }))]) {
    assert.throws(() => reconcileImageBatch({ ...context(), batchBytes: bytes }), /different batch/);
  }
});
test('delivery route/path must match the exact original request', () => {
  const input = context(); input.proof.deliveries[0].route = '/tools/afrokitchen/recipes/kapenta/';
  assert.throws(() => reconcileImageBatch(input), /exact retained request identity/);
});
test('historical queue identity, order, prompts and pending statuses remain intact', () => {
  assert.equal(crypto.createHash('sha256').update(batchBytes).digest('hex'), '4d28e3baf457a996e535bc6c2121e6e10ccbd4f06a19adf9852cf37c22b0b8ad');
  assert.equal(batch.batch_id, '2026-09-08');
  assert.equal(batch.images.length, 200);
  assert.equal(new Set(batch.images.map(row => row.id)).size, 200);
  assert.equal(new Set(batch.images.map(row => row.path)).size, 200);
  for (const [index, row] of batch.images.entries()) {
    assert.equal(row.order, index + 1); assert.equal(row.status, 'pending');
    assert.ok(row.prompt.length > 250); assert.ok(row.locale_reuse);
  }
});
test('unknown Kapenta generation prompt stays unknown; queued prompt is historical only', () => {
  const intake = ledger.images.find(row => row.slug === 'kapenta-stew-zm');
  assert.equal(intake.prompt, null);
  assert.match(intake.upstream_prompt_status, /not established/);
  assert.match(proof.note, /Retained prompts are not evidence/);
});
