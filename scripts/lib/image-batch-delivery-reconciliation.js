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


// A current alias may suppress a NEW request only when its reviewed, same-recipe
// inventory binding still matches physical bytes. This never delivers the old
// canonical request: an alternate path/size is not that retained contract.
function reviewedRecipeAlias({ slug, aliases, library, readAsset }) {
  if (!Object.hasOwn(aliases, slug)) return null;
  const canonical = aliases[slug];
  assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid alias recipe slug');
  assert.equal(typeof canonical, 'string', 'Invalid canonical image alias');
  assert.match(canonical, /^(?:responsive\/)?[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid canonical image alias');
  assert.notEqual(canonical, slug, 'Alias must identify a different canonical image');
  const imagePath = '/assets/img/kitchen/' + canonical + '.webp';
  const matches = library.images.filter(row => row.path === imagePath);
  assert.equal(matches.length, 1, 'Reviewed canonical alias image missing or duplicate: ' + slug);
  const image = matches[0], owner = 'tools/afrokitchen/recipes/' + slug + '/index.html';
  assert.equal(image.status, 'placed', 'Canonical alias image is not placed: ' + slug);
  assert.equal(image.text_status, 'text-free-reviewed', 'Canonical alias image is unreviewed: ' + slug);
  assert.equal(image.locale_reuse, true, 'Canonical alias image reuse is unreviewed: ' + slug);
  assert.ok(image.placements.some(row => row.path === owner), 'Canonical alias lacks same-recipe placement: ' + slug);
  assert.match(image.sha256, /^[a-f0-9]{64}$/, 'Invalid canonical alias hash');
  for (const field of ['bytes', 'width', 'height']) assert.ok(Number.isSafeInteger(image[field]) && image[field] > 0, 'Invalid canonical alias ' + field);
  const bytes = readAsset(imagePath);
  assert.equal(bytes.length, image.bytes, 'Canonical alias physical byte-size drift: ' + slug);
  assert.equal(sha256(bytes), image.sha256, 'Canonical alias physical hash drift: ' + slug);
  return { slug, route: '/' + owner.replace(/index\.html$/, ''), path: imagePath,
    canonicalRequestPath: '/assets/img/kitchen/' + slug + '.webp',
    sha256: image.sha256, bytes: image.bytes, width: image.width, height: image.height,
    originalRequestFulfilled: false };
}

module.exports = { reconcileImageBatch, reviewedRecipeAlias };
