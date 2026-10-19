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

test('retained original200 batch reconciles only the eleven reviewed source asset deliveries', () => {
  const input = context();
  const originalStems = new Set(input.library.images.map(row => row.path.replace(/\.[^.]+$/, '')));
  assert.deepEqual(batch.images.filter(row => originalStems.has(row.path.replace(/\.[^.]+$/, ''))).map(row => row.id).sort(),
    ['recipe-ibihaza-rw', 'recipe-ikivuguto-rw', 'recipe-kapenta-stew-zm', 'recipe-kat-kat-banane-sc', 'recipe-koba-mg', 'recipe-kunu-zaki-ng', 'recipe-latchiri-kossan-gn', 'recipe-mandazi-tanzania-tz', 'recipe-mchemsho-tz', 'recipe-ndizi-nyama-tz', 'recipe-oleleh-sl']);
  assert.deepEqual(reconcileImageBatch(input), {
    retainedRequests: 200, reviewedSourceDeliveries: 11, unreconciledRequests: 189
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
test('an unexpected delivered request among the other189 retains the no-existing-stem guard', () => {
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

// Additional finite source deliveries; neither this fixture nor the eight rows are a full inventory/deploy proof.
const FUTURE = {
  'recipe-mandazi-tanzania-tz': ['mandazi-tanzania-tz', '7b24d43e-e00f-47fe-8943-0dbf74b81bc0', 'mandazi-malaquias-20171122-v1', '5b5268c4db7456bd6c5bb979a98008758fa66230'],
  'recipe-koba-mg': ['koba-mg', '3b4af630-750d-467f-939c-7befadf44d32', 'koba-firstglobal-p13-small-parcels-v1', '5b5268c4db7456bd6c5bb979a98008758fa66230'],
  'recipe-ibihaza-rw': ['ibihaza-rw', 'd7d7e305-3c5d-40db-9033-36843e102176', 'ibihaza-georgia-reader-20261017-v1', 'e5163b4485ecb08352d78176fd430c3d2560ce9c'],
  'recipe-kat-kat-banane-sc': ['kat-kat-banane-sc', 'feabebb3-cd55-48c6-be9a-17f118dddfcc', 'katkat-creole-melting-pot-20190910-v1', 'e5163b4485ecb08352d78176fd430c3d2560ce9c'],
  'recipe-ndizi-nyama-tz': ['ndizi-nyama-tz', '63325da8-6678-414f-b431-f88d8d6b2fe1', 'ndizi-darlene-international-cuisine-20261017-v1', '1b3573739d34a0b415949b6d2cbbf49914ca1d17'],
  'recipe-latchiri-kossan-gn': ['latchiri-kossan-gn', '91740809-c813-417e-8af4-c5c7c989c1be', 'latchiri-gassama-maize-cultured-milk-20261017-v1', '1b3573739d34a0b415949b6d2cbbf49914ca1d17']
};
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
function reviewedRow(id) { const row=proof.deliveries.find(row=>row.id===id); assert.ok(row,'Missing reviewed source delivery: '+id); return row; }
test('actual helper admits the independent finite eleven-ledger inventory and no additional request',()=>{
 const input=context(),slugs=['kapenta-stew-zm','oleleh-sl',...Object.values(FUTURE).map(row=>row[0]),'kunu-zaki-ng','ikivuguto-rw','mchemsho-tz'];
 input.library.images=slugs.map(slug=>{const intake=ledger.images.find(row=>row.slug===slug);assert.ok(intake);return {...intake.variants.find(v=>v.path===intake.target)};});
 assert.deepEqual(reconcileImageBatch(input),{retainedRequests:200,reviewedSourceDeliveries:11,unreconciledRequests:189});
});
test('six additional rows join exact request, recipe revision, ledger prompt and accepted source lineage',()=>{
 for(const [id,[slug,recipeId,revision,commit]] of Object.entries(FUTURE)){
  const row=reviewedRow(id),request=batch.images.find(x=>x.id===id),intake=ledger.images.find(x=>x.slug===slug);
  assert.equal(row.slug,slug);assert.equal(row.recipe_id,recipeId);assert.equal(intake.recipe_id||intake.expected_recipe_id,recipeId);assert.equal(row.method_revision,revision);assert.equal(intake.method_revision,revision);
  assert.equal(row.accepted_source_commit,commit);assert.match(row.accepted_asset_blob,/^[a-f0-9]{40}$/);assert.equal(row.path,request.path);assert.equal(row.route,request.route);assert.equal(row.path,intake.target);assert.equal(row.route,intake.route);
  assert.equal(row.historical_request_prompt_sha256,digest(request.prompt));assert.equal(row.recorded_generation_prompt_sha256,digest(intake.prompt));assert.notEqual(row.historical_request_prompt_sha256,row.recorded_generation_prompt_sha256);
  assert.match(row.delivery_scope,/repository bytes only/);assert.match(row.delivery_scope,/no deployment/);
 }
 assert.ok(Array.isArray(proof.additional_source_intakes));assert.equal(proof.additional_source_intakes.length,5);
 const expected=[
  {ordered_source_commits:['5b5268c4db7456bd6c5bb979a98008758fa66230'],root_acceptance_sha256:'4cd2dd33ee303cb92e13b24233f35bf6eb743d44db2785bcf8c2db30e0caaa24',committed_readback_sha256:'39c958047016a8e104e9e92693fc62d75fba611bf2f7f40d77324e4fccf29050',delivery_ids:['recipe-mandazi-tanzania-tz','recipe-koba-mg']},
  {ordered_source_commits:['e5163b4485ecb08352d78176fd430c3d2560ce9c'],root_acceptance_sha256:'b486de213b87cd011c3087a8cf8396df098a76d04ac07f2c70c93d42134f9c03',committed_readback_sha256:'754e0f2350c5ef83fc91fab6f7d8d2d9b90c7f314dc35661e11320a66ca20d76',delivery_ids:['recipe-ibihaza-rw','recipe-kat-kat-banane-sc']},
  {ordered_source_commits:['1b3573739d34a0b415949b6d2cbbf49914ca1d17'],root_acceptance_sha256:'915d087da31b4298633db7825ed910aeb1ff5feea5c286edcc3bf1414b72b458',committed_readback_sha256:'f4548fa77a7c44e5918b17ee9cbe3cb0ed710b56b444d593748fca68c6834935',independent_implementation_peer_sha256:'e032b19a8ff85674c1b8fe4d3cb7691ba422f39b7cde5677fe14f2a250305985',delivery_ids:['recipe-ndizi-nyama-tz','recipe-latchiri-kossan-gn']}
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
test('every one of the other189 requests retains its no-existing-stem guard',()=>{
 const pending=batch.images.filter(row=>!proof.deliveries.some(x=>x.id===row.id));assert.equal(pending.length,189);
 for(const request of pending){const input=context();input.library.images.push({path:request.path});assert.throws(()=>reconcileImageBatch(input),/Unexpected existing request stem/,request.id);}
});

// Appearance-only gap-fill admission; neither image certifies an executable recipe method.
const GAP_FILL = {
 'recipe-kunu-zaki-ng': ['kunu-zaki-ng','8a2bb743-87d9-462e-bc09-335e78f9584a',7],
 'recipe-ikivuguto-rw': ['ikivuguto-rw','f2850789-0ffd-41b3-bbaf-e3229132c9e6',2]
};
test('two new illustrations join exact original requests, physical Git assets and accepted source provenance',()=>{
 for(const [id,[slug,recipeId,order]] of Object.entries(GAP_FILL)){
  const row=reviewedRow(id),request=batch.images.find(x=>x.id===id),intake=ledger.images.find(x=>x.slug===slug);
  assert.equal(request.order,order);assert.equal(row.slug,slug);assert.equal(row.recipe_id,recipeId);assert.equal(intake.recipe_id,recipeId);
  assert.equal(row.path,request.path);assert.equal(row.route,request.route);assert.equal(row.path,intake.target);assert.equal(row.route,intake.route);
  assert.equal(row.accepted_source_commit,'9045cd502623febd5ee8dce4bacc0be098c4f71a');assert.equal(row.method_review_status,'pending-source-method');assert.equal(row.method_revision,undefined);
  const physical=fs.readFileSync(path.join(root,row.path.slice(1)));assert.equal(row.accepted_asset_blob,crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+physical.length+'\0'),physical])).digest('hex'));
  assert.equal(row.historical_request_prompt_sha256,digest(request.prompt));assert.equal(row.recorded_generation_prompt_sha256,digest(intake.prompt));assert.notEqual(row.historical_request_prompt_sha256,row.recorded_generation_prompt_sha256);
  assert.match(row.delivery_scope,/repository bytes only/);assert.match(row.delivery_scope,/no deployment/);assert.match(intake.provenance,/not documentary photography/);
 }
 const admitted=proof.additional_source_intakes[3];assert.deepEqual(admitted.ordered_source_commits,['9045cd502623febd5ee8dce4bacc0be098c4f71a']);assert.equal(admitted.root_acceptance_sha256,'5af1f417c3c75c2a92fe7bf54851ea93e21c917ab6dbdd7f23d976507b2de921');assert.deepEqual(admitted.delivery_ids,Object.keys(GAP_FILL));
});
for(const id of Object.keys(GAP_FILL)){
 test(id+': wrong physical bytes fail',()=>{const row=reviewedRow(id),input=context(),read=input.readAsset;input.readAsset=file=>{const b=Buffer.from(read(file));if(file===row.path)b[b.length-1]^=1;return b};assert.throws(()=>reconcileImageBatch(input),/physical hash drift/)});
 test(id+': wrong inventory hash fails',()=>{const row=reviewedRow(id),input=context();input.library.images.find(x=>x.path===row.path).sha256='0'.repeat(64);assert.throws(()=>reconcileImageBatch(input),/inventory sha256 drift/)});
 test(id+': wrong intake hash fails',()=>{const row=reviewedRow(id),input=context();input.ledger.images.find(x=>x.slug===row.slug).variants.find(x=>x.path===row.path).sha256='0'.repeat(64);assert.throws(()=>reconcileImageBatch(input),/intake sha256 drift/)});
 test(id+': missing inventory fails',()=>{const row=reviewedRow(id),input=context();input.library.images=input.library.images.filter(x=>x.path!==row.path);assert.throws(()=>reconcileImageBatch(input),/delivery missing/)});
 test(id+': duplicate delivery fails',()=>{const row=reviewedRow(id),input=context();input.proof.deliveries.push(clone(row));input.proof.reviewed_deliveries++;assert.throws(()=>reconcileImageBatch(input),/Duplicate delivery ID/)});
 test(id+': extra extension fails',()=>{const row=reviewedRow(id),input=context();input.library.images.push({...input.library.images.find(x=>x.path===row.path),path:row.path.replace(/\.webp$/,'.png')});assert.throws(()=>reconcileImageBatch(input),/unexpected extra extension/)});
}

test('only recovered canonical Mchemsho advances delivery; three fixed 1280 candidates remain pending',()=>{
 const row=reviewedRow('recipe-mchemsho-tz'),request=batch.images.find(x=>x.id===row.id);
 assert.equal(row.recipe_id,'4caf4ed6-13ec-4fbb-8039-ce51a4201cfe');assert.equal(row.width,1200);assert.equal(row.height,800);
 assert.equal(row.path,'/assets/img/kitchen/mchemsho-tz.webp');assert.equal(row.path,request.path);assert.equal(request.dimensions,'1200x800');
 assert.equal(row.sha256,'b2ec5ce348680aa0fa54216ac60c0d44afcc5a40bec9550a5e35fdff44b9a26a');
 assert.equal(row.recovered_asset_commit,'24429e29c022dae6b89b31d61470835d3a2302d3');assert.equal(row.admission_status,'accepted-private-source-not-deployed');assert.equal(row.accepted_source_commit,'f239e7985355b20fad4f79c3db5df3aa58908fe4');
 const accepted=proof.additional_source_intakes[4];assert.deepEqual(accepted.ordered_source_commits,['f239e7985355b20fad4f79c3db5df3aa58908fe4']);assert.equal(accepted.root_acceptance_sha256,'fdc81ae27aae0e3780bba89a875be0e3e8c7b0312fd0e1abf0cd198c3da6e837');assert.equal(accepted.committed_readback_sha256,'4e447259a3c8aac1d6fd6f6507b569586dacbdab51b6be3443fa905d36796a94');assert.deepEqual(accepted.delivery_ids,['recipe-mchemsho-tz']);assert.match(accepted.scope,/private repository source bytes/);assert.match(accepted.scope,/native qualification remains separate/);assert.equal(proof.proposal_status,'ACCEPTED_PRIVATE_SOURCE_NOT_READY_NOT_DEPLOYED');
 const physical=fs.readFileSync(path.join(root,row.path.slice(1)));assert.equal(row.accepted_asset_blob,crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+physical.length+'\0'),physical])).digest('hex'));
 for(const slug of ['kisra-south-sudan-ss','maheu-zm','octopus-curry-sc']){
  assert.equal(proof.deliveries.some(x=>x.id==='recipe-'+slug),false);
  const intake=ledger.images.find(x=>x.slug===slug),primary=intake.variants.find(x=>x.path===intake.target),retained=batch.images.find(x=>x.id==='recipe-'+slug);
  assert.equal(primary.width,1280);assert.equal(primary.height,853);assert.notEqual(primary.path,retained.path);assert.equal(retained.dimensions,'1200x800');
  const input=context();input.library.images.push({path:retained.path});assert.throws(()=>reconcileImageBatch(input),/Unexpected existing request stem/);
 }
});
for(const fault of ['physical','inventory','intake','missing','duplicate','extension']) test('Mchemsho recovery retains '+fault+' negative',()=>{
 const row=reviewedRow('recipe-mchemsho-tz'),input=context(),read=input.readAsset;
 if(fault==='physical')input.readAsset=file=>{const b=Buffer.from(read(file));if(file===row.path)b[b.length-1]^=1;return b};
 if(fault==='inventory')input.library.images.find(x=>x.path===row.path).sha256='0'.repeat(64);
 if(fault==='intake')input.ledger.images.find(x=>x.slug===row.slug).variants.find(x=>x.path===row.path).sha256='0'.repeat(64);
 if(fault==='missing')input.library.images=input.library.images.filter(x=>x.path!==row.path);
 if(fault==='duplicate'){input.proof.deliveries.push(clone(row));input.proof.reviewed_deliveries++}
 if(fault==='extension')input.library.images.push({...input.library.images.find(x=>x.path===row.path),path:row.path.replace(/\.webp$/,'.png')});
 assert.throws(()=>reconcileImageBatch(input));
});
