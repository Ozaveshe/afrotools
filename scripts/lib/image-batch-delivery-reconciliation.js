'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const stem = file => file.replace(/\.[^.]+$/, '');

// Reconcile a retained request batch with explicitly reviewed repository bytes.
// This neither rewrites the queue nor certifies prompt fidelity or publication.
function reconcileImageBatch({ batchBytes, library, proof, ledger, readAsset }) {
  assert.equal(proof.schema_version, 1, 'Unsupported delivery reconciliation');
  assert.equal(proof.kind, 'retained-batch-reviewed-source-deliveries');
  assert.equal(sha256(batchBytes), proof.batch.sha256, 'Delivery proof belongs to a different batch');
  assert.equal(batchBytes.length, proof.batch.bytes, 'Retained batch byte-size drift');
  const batch = JSON.parse(batchBytes.toString('utf8'));
  assert.equal(batch.batch_id, proof.batch.batch_id, 'Batch identity drift');
  assert.equal(batch.images.length, proof.batch.requests, 'Retained request count drift');
  assert.equal(new Set(batch.images.map(row => row.id)).size, batch.images.length, 'Duplicate batch IDs');
  assert.equal(new Set(batch.images.map(row => row.path)).size, batch.images.length, 'Duplicate batch paths');
  assert.equal(proof.deliveries.length, proof.reviewed_deliveries, 'Reviewed delivery count drift');
  const deliveries = new Map();
  for (const delivery of proof.deliveries) {
    assert.ok(!deliveries.has(delivery.id), 'Duplicate delivery ID');
    const request = batch.images.find(row => row.id === delivery.id);
    assert.ok(request && request.path === delivery.path && request.route === delivery.route,
      'Delivery must match its exact retained request identity, path and route');
    assert.match(delivery.path, /^\/assets\/img\/kitchen\/[a-z0-9-]+\.webp$/);
    const intake = ledger.images.filter(row => row.slug === delivery.slug);
    assert.equal(intake.length, 1, 'Missing or duplicate reviewed recipe intake');
    assert.equal(intake[0].route, delivery.route, 'Reviewed intake route drift');
    assert.equal(intake[0].target, delivery.path, 'Reviewed intake target drift');
    const variants = intake[0].variants.filter(row => row.path === delivery.path);
    assert.equal(variants.length, 1, 'Missing or duplicate reviewed intake variant');
    for (const key of ['sha256', 'bytes', 'width', 'height']) {
      assert.equal(variants[0][key], delivery[key], 'Reviewed intake ' + key + ' drift');
    }
    const existing = library.images.filter(row => stem(row.path) === stem(delivery.path));
    assert.equal(existing.length, 1, 'Reviewed delivery missing or has an unexpected extra extension');
    assert.equal(existing[0].path, delivery.path, 'Unexpected delivered extension');
    for (const key of ['sha256', 'bytes', 'width', 'height']) {
      assert.equal(existing[0][key], delivery[key], 'Delivered inventory ' + key + ' drift');
    }
    const bytes = readAsset(delivery.path);
    assert.equal(bytes.length, delivery.bytes, 'Delivered physical byte-size drift');
    assert.equal(sha256(bytes), delivery.sha256, 'Delivered physical hash drift');
    deliveries.set(delivery.id, delivery);
  }
  const existingStems = new Set(library.images.map(row => stem(row.path)));
  for (const request of batch.images) {
    assert.ok(!existingStems.has(stem(request.path)) || deliveries.has(request.id),
      'Unexpected existing request stem: ' + request.path);
  }
  return { retainedRequests: batch.images.length, reviewedSourceDeliveries: deliveries.size,
    unreconciledRequests: batch.images.length - deliveries.size };
}

module.exports = { reconcileImageBatch };
