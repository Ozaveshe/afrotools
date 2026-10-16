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

test('retained original200 batch reconciles only the six accepted source asset deliveries', () => {
  const input = context();
  const originalStems = new Set(input.library.images.map(row => row.path.replace(/\.[^.]+$/, '')));
  assert.deepEqual(batch.images.filter(row => originalStems.has(row.path.replace(/\.[^.]+$/, ''))).map(row => row.id).sort(),
    ['recipe-ibihaza-rw', 'recipe-kapenta-stew-zm', 'recipe-kat-kat-banane-sc', 'recipe-koba-mg', 'recipe-mandazi-tanzania-tz', 'recipe-oleleh-sl']);
  assert.deepEqual(reconcileImageBatch(input), {
    retainedRequests: 200, reviewedSourceDeliveries: 6, unreconciledRequests: 194
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
test('an unexpected delivered request among the other194 retains the no-existing-stem guard', () => {
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

// Additional finite source deliveries; neither this fixture nor the six rows are a full inventory/deploy proof.
const FUTURE = {
  'recipe-mandazi-tanzania-tz': ['mandazi-tanzania-tz', '7b24d43e-e00f-47fe-8943-0dbf74b81bc0', 'mandazi-malaquias-20171122-v1', '5b5268c4db7456bd6c5bb979a98008758fa66230'],
  'recipe-koba-mg': ['koba-mg', '3b4af630-750d-467f-939c-7befadf44d32', 'koba-firstglobal-p13-small-parcels-v1', '5b5268c4db7456bd6c5bb979a98008758fa66230'],
  'recipe-ibihaza-rw': ['ibihaza-rw', 'd7d7e305-3c5d-40db-9033-36843e102176', 'ibihaza-georgia-reader-20261017-v1', 'e5163b4485ecb08352d78176fd430c3d2560ce9c'],
  'recipe-kat-kat-banane-sc': ['kat-kat-banane-sc', 'feabebb3-cd55-48c6-be9a-17f118dddfcc', 'katkat-creole-melting-pot-20190910-v1', 'e5163b4485ecb08352d78176fd430c3d2560ce9c']
};
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
function reviewedRow(id) { const row=proof.deliveries.find(row=>row.id===id); assert.ok(row,'Missing reviewed source delivery: '+id); return row; }
test('actual helper admits the independent finite six-ledger inventory and no additional request',()=>{
 const input=context(),slugs=['kapenta-stew-zm','oleleh-sl',...Object.values(FUTURE).map(row=>row[0])];
 input.library.images=slugs.map(slug=>{const intake=ledger.images.find(row=>row.slug===slug);assert.ok(intake);return {...intake.variants.find(v=>v.path===intake.target)};});
 assert.deepEqual(reconcileImageBatch(input),{retainedRequests:200,reviewedSourceDeliveries:6,unreconciledRequests:194});
});
test('four additional rows join exact request, recipe revision, ledger prompt and accepted source lineage',()=>{
 for(const [id,[slug,recipeId,revision,commit]] of Object.entries(FUTURE)){
  const row=reviewedRow(id),request=batch.images.find(x=>x.id===id),intake=ledger.images.find(x=>x.slug===slug);
  assert.equal(row.slug,slug);assert.equal(row.recipe_id,recipeId);assert.equal(intake.recipe_id||intake.expected_recipe_id,recipeId);assert.equal(row.method_revision,revision);assert.equal(intake.method_revision,revision);
  assert.equal(row.accepted_source_commit,commit);assert.match(row.accepted_asset_blob,/^[a-f0-9]{40}$/);assert.equal(row.path,request.path);assert.equal(row.route,request.route);assert.equal(row.path,intake.target);assert.equal(row.route,intake.route);
  assert.equal(row.historical_request_prompt_sha256,digest(request.prompt));assert.equal(row.recorded_generation_prompt_sha256,digest(intake.prompt));assert.notEqual(row.historical_request_prompt_sha256,row.recorded_generation_prompt_sha256);
  assert.match(row.delivery_scope,/repository bytes only/);assert.match(row.delivery_scope,/no deployment/);
 }
 assert.ok(Array.isArray(proof.additional_source_intakes));assert.equal(proof.additional_source_intakes.length,2);
 const expected=[
  {ordered_source_commits:['5b5268c4db7456bd6c5bb979a98008758fa66230'],root_acceptance_sha256:'4cd2dd33ee303cb92e13b24233f35bf6eb743d44db2785bcf8c2db30e0caaa24',committed_readback_sha256:'39c958047016a8e104e9e92693fc62d75fba611bf2f7f40d77324e4fccf29050',delivery_ids:['recipe-mandazi-tanzania-tz','recipe-koba-mg']},
  {ordered_source_commits:['e5163b4485ecb08352d78176fd430c3d2560ce9c'],root_acceptance_sha256:'b486de213b87cd011c3087a8cf8396df098a76d04ac07f2c70c93d42134f9c03',committed_readback_sha256:'754e0f2350c5ef83fc91fab6f7d8d2d9b90c7f314dc35661e11320a66ca20d76',delivery_ids:['recipe-ibihaza-rw','recipe-kat-kat-banane-sc']}
 ];
 for(const [index,want]of expected.entries())for(const key of Object.keys(want))assert.deepEqual(proof.additional_source_intakes[index][key],want[key]);
});
for(const id of Object.keys(FUTURE)) {
 test(id+': wrong physical bytes cannot borrow correct inventory and intake',()=>{
  const row=reviewedRow(id),input=context(),read=input.readAsset;input.readAsset=file=>{const b=Buffer.from(read(file));if(file===row.path)b[b.length-1]^=1;return b;};assert.throws(()=>reconcileImageBatch(input),/physical hash drift/);
 });
 test(id+': wrong inventory hash cannot authorize this source delivery',()=>{
  const row=reviewedRow(id),input=context();input.library.images.find(x=>x.path===row.path).sha256='0'.repeat(64);assert.throws(()=>reconcileImageBatch(input),/inventory sha256 drift/);
 });
 test(id+': wrong intake variant hash cannot authorize this source delivery',()=>{
  const row=reviewedRow(id),input=context();input.ledger.images.find(x=>x.slug===row.slug).variants.find(x=>x.path===row.path).sha256='0'.repeat(64);assert.throws(()=>reconcileImageBatch(input),/intake sha256 drift/);
 });
 test(id+': missing inventory delivery is rejected',()=>{
  const row=reviewedRow(id),input=context();input.library.images=input.library.images.filter(x=>x.path!==row.path);assert.throws(()=>reconcileImageBatch(input),/delivery missing/);
 });
 test(id+': duplicate delivery identity is rejected',()=>{
  const row=reviewedRow(id),input=context();input.proof.deliveries.push(clone(row));input.proof.reviewed_deliveries+=1;assert.throws(()=>reconcileImageBatch(input),/Duplicate delivery ID/);
 });
 test(id+': another extension cannot hide behind the approved stem',()=>{
  const row=reviewedRow(id),input=context();input.library.images.push({...input.library.images.find(x=>x.path===row.path),path:row.path.replace(/\.webp$/,'.png')});assert.throws(()=>reconcileImageBatch(input),/unexpected extra extension/);
 });
}
test('every one of the other194 requests retains its no-existing-stem guard',()=>{
 const pending=batch.images.filter(row=>!proof.deliveries.some(x=>x.id===row.id));assert.equal(pending.length,194);
 for(const request of pending){const input=context();input.library.images.push({path:request.path});assert.throws(()=>reconcileImageBatch(input),/Unexpected existing request stem/,request.id);}
});
