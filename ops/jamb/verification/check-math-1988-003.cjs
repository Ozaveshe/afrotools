'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const draft=process.argv.includes('--draft');
const root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const batch=draft?{records:require('./math-1988-003-updates.json')}:require('./math-1988-publishable-003.json');
const pool=draft?batch.records:require(path.join(root,'ops/jamb/source-pool.json')).questions;
assert.equal(batch.records.length,1);
for(const r of batch.records){
 const q=pool.find(q=>q.id===r.id);
 if(!draft){assert.equal(require(path.join(root,'scripts/lib/jamb-content-trust')).questionFingerprint(q),r.content_sha256);assert.equal(q.explanation,r.explanation);assert.equal(q.ai_explanation,r.explanation);}
 // Integer ten-thousandths preserve exactly the logarithms specified in the question.
 const result=2*4771-3010;assert.equal(result,6532);
 assert.deepEqual(Object.entries(q.options).filter(([,v])=>Math.round(Number(v)*10000)===result).map(([key])=>key),[q.answer]);
 assert.doesNotMatch(q.explanation,/compilation prints|Source note:/);
 if(!draft) assert.ok(r.presentation_history.some(entry=>/compilation prints 0\.6352/.test(entry.previous_explanation)));
}
console.log(JSON.stringify({passed:true,count:1,question_ids:batch.records.map(r=>r.id)}));
