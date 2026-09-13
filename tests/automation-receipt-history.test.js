'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { publishHandoff, readHandoffRecords, reconcileRecords, buildQueue } = require('../scripts/automation-handoff');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'receipt-history-'));
function receipt(run, overrides = {}) {
  return { schema_version: 1, handoff_id: 'fixture-' + run, automation_id: 'fixture', run_id: run,
    created_at: '2026-09-09T08:00:00Z', updated_at: '2026-09-09T08:00:00Z', summary: 'Synthetic receipt',
    status: 'ready', change_kind: 'repository', merge_candidate: true, base_sha: 'a'.repeat(40), branch: 'automation/fixture-' + run, commit: 'b'.repeat(40),
    changed_files: ['data/' + run + '.json'], source_files: ['data/' + run + '.json'], generated_files: [], conflict_keys: [], dependencies: [], live_mutations: [],
    producer: {worktree_path:'C:/synthetic/worktree/' + run, base_fetched_at:'2026-09-09T07:55:00Z', remote_ref:'refs/heads/automation/fixture-' + run, cleanup_after:'2026-09-10T08:00:00Z'},
    validations: [{command: 'synthetic-check', status:'pass', summary:'passed'}],
    risk: {level:'low', reasons:[], touches_routes:false,touches_auth:false,touches_database:false,touches_generated_output:false},
    publisher: {consumed_at:null,release_commit:null,deploy_id:null,live_proof:[]}, ...overrides };
}
function publish(item) {
  const input = path.join(root, 'input.json');
  fs.writeFileSync(input, JSON.stringify(item));
  return publishHandoff(input, root);
}
function queue() { return buildQueue(reconcileRecords(readHandoffRecords(root))); }
try {
  const first = receipt('one');
  publish(first);
  publish(receipt('two'));
  assert.strictEqual(queue().ready.length, 2, 'a later run must not hide older ready work');
  assert.strictEqual(queue().duplicate_ids.length, 0, 'latest and archive are copies, not duplicate jobs');
  const consumed = { ...first, updated_at: '2026-09-09T09:00:00Z', status:'consumed', merge_candidate:false,
    publisher:{consumed_at:'2026-09-09T09:00:00Z',release_commit:'c'.repeat(40),deploy_id:'synthetic-deploy',live_proof:['synthetic-proof']} };
  fs.writeFileSync(path.join(root,'fixture','runs','one','handoff.json'),JSON.stringify(consumed));
  assert.strictEqual(queue().ready.length,1,'consumed archive suppresses an older ready copy');
  fs.writeFileSync(path.join(root,'fixture','handoff.json'),JSON.stringify(first));
  publish(receipt('three'));
  assert.strictEqual(queue().informational.length,1,'publishing preserves newer archived lifecycle state');
  const before = fs.readFileSync(path.join(root,'fixture','handoff.json'),'utf8');
  assert.throws(()=>publish(receipt('missing-ownership',{producer:undefined})),/require producer ownership metadata/,
    'publish rejects a new ready receipt before replacing the previous latest');
  assert.strictEqual(fs.readFileSync(path.join(root,'fixture','handoff.json'),'utf8'),before);
  assert.strictEqual(fs.existsSync(path.join(root,'fixture','runs','missing-ownership')),false,
    'rejected ownership creates no run archive');
  assert.strictEqual(fs.existsSync(path.join(root,'fixture','.handoff-write.lock')),false,
    'rejected ownership never acquires a writer lock');
  const validation = spawnSync(process.execPath,[path.resolve(__dirname,'../scripts/automation-handoff.js'),'validate',path.join(root,'input.json')],{encoding:'utf8'});
  assert.strictEqual(validation.status,1,'the producer CLI validate command fails before publication');
  assert.match(validation.stderr,/require producer ownership metadata/);
  assert.throws(()=>publish(receipt('safe',{run_id:'../escape'})),/safe directory/);
  assert.strictEqual(fs.readFileSync(path.join(root,'fixture','handoff.json'),'utf8'),before);
  fs.writeFileSync(path.join(root,'fixture','.handoff-write.lock'),'');
  assert.throws(()=>publish(receipt('four')),/EEXIST/,'concurrent writers must fail closed');
  fs.unlinkSync(path.join(root,'fixture','.handoff-write.lock'));
  const changedIdentity = {...receipt('three'),commit:'d'.repeat(40),updated_at:'2026-09-09T10:00:00Z'};
  assert.throws(()=>publish(changedIdentity),/conflicts/);
  assert.strictEqual(queue().invalid.length,0);
  const legacy = receipt('legacy',{producer:undefined});
  delete legacy.producer;
  fs.writeFileSync(path.join(root,'fixture','handoff.json'),JSON.stringify(legacy));
  publish(receipt('after-legacy'));
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(root,'fixture','runs','legacy','handoff.json'))),legacy,
    'an existing legacy ready receipt is preserved without inventing ownership metadata');
  assert.ok(queue().ready.some(item=>item.handoff_id===legacy.handoff_id),
    'legacy ready evidence remains available to policy review');
  const legacyConsumed = {...legacy,status:'consumed',merge_candidate:false,updated_at:'2026-09-09T09:00:00Z',publisher:consumed.publisher};
  fs.writeFileSync(path.join(root,'fixture','runs','legacy','handoff.json'),JSON.stringify(legacyConsumed));
  fs.writeFileSync(path.join(root,'fixture','handoff.json'),JSON.stringify(legacy));
  assert.ok(queue().informational.some(item=>item.handoff_id===legacy.handoff_id),
    'legacy ready copies reconcile with later consumed copies without poisoning the queue');
  assert.strictEqual(queue().invalid.length,0);
  publish(receipt('after-legacy-consumed'));
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(root,'fixture','runs','legacy','handoff.json'))),legacyConsumed,
    'replacement preserves the newer consumed state of a legacy receipt');

  const pointerA = receipt('pointer-a', {created_at:'2026-09-10T08:00:00Z',updated_at:'2026-09-10T08:00:00Z'});
  const pointerB = receipt('pointer-b', {created_at:'2026-09-10T09:00:00Z',updated_at:'2026-09-10T09:00:00Z'});
  publish(pointerA);
  publish(pointerB);
  const latestPath = path.join(root,'fixture','handoff.json');
  const newerLatest = fs.readFileSync(latestPath,'utf8');
  const consumedA = {...pointerA,status:'consumed',merge_candidate:false,updated_at:'2026-09-10T10:00:00Z',
    publisher:{...consumed.publisher,consumed_at:'2026-09-10T10:00:00Z'}};
  const archiveA = path.join(root,'fixture','runs','pointer-a','handoff.json');
  assert.strictEqual(publish(consumedA),archiveA,'older lifecycle updates return the archive actually updated');
  assert.strictEqual(fs.readFileSync(latestPath,'utf8'),newerLatest,'consuming older backlog must not regress the newer latest pointer');
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(archiveA,'utf8')),consumedA);
  assert.deepStrictEqual(queue().ready.filter(item=>item.handoff_id.startsWith('fixture-pointer-')).map(item=>item.handoff_id),['fixture-pointer-b']);
  assert.deepStrictEqual(queue().informational.filter(item=>item.handoff_id.startsWith('fixture-pointer-')).map(item=>item.handoff_id),['fixture-pointer-a']);
  assert.strictEqual(queue().invalid.length,0);
  assert.strictEqual(queue().duplicate_ids.length,0);
  assert.throws(()=>publish({...consumedA,updated_at:'2026-09-10T09:30:00Z'}),/Archive conflicts/,
    'older archive lifecycle timestamps are still rejected');
  assert.strictEqual(fs.readFileSync(latestPath,'utf8'),newerLatest);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(archiveA,'utf8')),consumedA);
  const reviewedB = {...pointerB,updated_at:'2026-09-10T11:00:00Z',summary:'Latest producer reviewed'};
  assert.strictEqual(publish(reviewedB),latestPath,'updates to the newest run still return latest');
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(latestPath,'utf8')),reviewedB);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(root,'fixture','runs','pointer-b','handoff.json'),'utf8')),reviewedB,
    'updates to the newest run keep latest and archive in sync');

  fs.writeFileSync(path.join(root,'fixture','handoff.json'),JSON.stringify(receipt('three')));
  fs.writeFileSync(path.join(root,'fixture','runs','three','handoff.json'),JSON.stringify(changedIdentity));
  assert.ok(queue().invalid.length > 0,'conflicting copies must not silently select a different source commit');
  console.log('automation receipt history tests passed');
} finally { fs.rmSync(root,{recursive:true,force:true}); }
