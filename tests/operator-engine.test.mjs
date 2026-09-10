import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {sanitizeEngine} from '../netlify/functions/_shared/operator-engine.mjs';
import {collectRuntime} from '../scripts/sync-operator-engine.mjs';
const require=createRequire(import.meta.url),fixture=require('./fixtures/operator-engine.cjs');
const {advice,latestChecks}=require('../admin/operator-engine.js');
test('summary projection excludes prompts, errors, credentials and local paths',()=>{
  const input=fixture();input.secret='secret';input.git.rows[0].path='C:/private';input.automations.rows[0].prompt='private instructions';input.runtime.rows[0].error_message='private';
  const clean=sanitizeEngine(input),encoded=JSON.stringify(clean);
  assert.ok(!encoded.includes('secret'));assert.ok(!encoded.includes('private'));
  assert.equal(clean.git.rows[0].ahead,3);assert.throws(()=>sanitizeEngine({...input,project_ref:'another-product'}));
  assert.throws(()=>sanitizeEngine({...input,collected_at:'not a timestamp'}));
});
test('morning priorities distinguish incomplete work, old evidence and completed runs',()=>{
  const input=fixture(),items=advice(input,null);
  assert.ok(items.some(r=>r.title.includes('awaiting review')));assert.ok(items.some(r=>r.title.includes('need a decision')));
  assert.ok(items.some(r=>r.title.includes('pending work')));assert.ok(!items.some(r=>r.title.includes('GitHub checks need review')));
  input.collected_at='2000-01-01T00:00:00Z';assert.equal(advice(input,null)[0].title,'Refresh operational evidence');
  input.git={status:'unavailable',rows:[]};assert.ok(advice(input,null).some(r=>r.title==='Git evidence needs attention'));
});
test('a superseded CI failure is not a current failing check',()=>{
  const rows=[{name:'CI',branch:'main',conclusion:'failure',created_at:'2026-09-10T00:00:00Z'},{name:'CI',branch:'main',conclusion:'success',created_at:'2026-09-10T01:00:00Z'}];
  assert.deepEqual(latestChecks(rows).map(r=>r.conclusion),['success']);
});
test('runtime timestamps survive a sync and wrong-project evidence is rejected',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'operator-engine-test-')),filename=path.join(dir,'runtime.json'),now=Date.now(),checked_at=new Date(now-3*3600000).toISOString();
  try{fs.writeFileSync(filename,JSON.stringify({project_ref:'zpclagtgczsygrgztlts',checked_at,rows:[]}));assert.equal(collectRuntime(filename,now).status,'stale');assert.equal(collectRuntime(filename,now).checked_at,checked_at);
    fs.writeFileSync(filename,JSON.stringify({project_ref:'wrong',checked_at,rows:[]}));assert.throws(()=>collectRuntime(filename,now));
  }finally{fs.unlinkSync(filename);fs.rmdirSync(dir);}
});
