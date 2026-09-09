'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { publishHandoff, readHandoffRecords, reconcileRecords, buildQueue } = require('../scripts/automation-handoff');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'receipt-history-'));
function receipt(run, overrides = {}) {
  return { schema_version: 1, handoff_id: 'fixture-' + run, automation_id: 'fixture', run_id: run,
    created_at: '2026-09-09T08:00:00Z', updated_at: '2026-09-09T08:00:00Z', summary: 'Synthetic receipt',
    status: 'ready', change_kind: 'repository', merge_candidate: true, base_sha: 'a'.repeat(40), branch: 'automation/fixture-' + run, commit: 'b'.repeat(40),
    changed_files: ['data/' + run + '.json'], source_files: ['data/' + run + '.json'], generated_files: [], conflict_keys: [], dependencies: [], live_mutations: [],
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
  assert.throws(()=>publish(receipt('safe',{run_id:'../escape'})),/safe directory/);
  assert.strictEqual(fs.readFileSync(path.join(root,'fixture','handoff.json'),'utf8'),before);
  fs.writeFileSync(path.join(root,'fixture','.handoff-write.lock'),'');
  assert.throws(()=>publish(receipt('four')),/EEXIST/,'concurrent writers must fail closed');
  fs.unlinkSync(path.join(root,'fixture','.handoff-write.lock'));
  const changedIdentity = {...receipt('three'),commit:'d'.repeat(40),updated_at:'2026-09-09T10:00:00Z'};
  assert.throws(()=>publish(changedIdentity),/conflicts/);
  assert.strictEqual(queue().invalid.length,0);
  fs.writeFileSync(path.join(root,'fixture','runs','three','handoff.json'),JSON.stringify(changedIdentity));
  assert.ok(queue().invalid.length > 0,'conflicting copies must not silently select a different source commit');
  console.log('automation receipt history tests passed');
} finally { fs.rmSync(root,{recursive:true,force:true}); }
