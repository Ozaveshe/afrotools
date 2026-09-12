'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const draft=process.argv.includes('--draft');
const root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const batch=draft?{records:require('./math-1990-004-updates.json')}:require('./math-1990-publishable-004.json');
const pool=draft?batch.records:require(path.join(root,'ops/jamb/source-pool.json')).questions;
assert.equal(batch.records.length,1);
const r=batch.records[0],q=pool.find(q=>q.id===r.id);
if(!draft){assert.equal(require(path.join(root,'scripts/lib/jamb-content-trust')).questionFingerprint(q),r.content_sha256);assert.equal(q.explanation,r.explanation);}
assert.match(q.question,/41 to 56 inclusive.*multiple of 9/);
const values=Array.from({length:56-41+1},(_,i)=>41+i),matches=values.filter(n=>n%9===0);
assert.equal(values.length,16);assert.deepEqual(matches,[45,54]);
assert.equal(matches.length/values.length,1/8);assert.equal(q.answer,'A');
assert.deepEqual(q.options,{A:'1/8',B:'2/15',C:'3/16',D:'7/8'});
assert.equal(r.source_url,'https://myschool.ng/classroom/mathematics/31490');
console.log(JSON.stringify({passed:true,question_ids:[q.id],count:1}));
