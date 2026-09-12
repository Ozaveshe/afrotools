'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const draft=process.argv.includes('--draft');
const root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const records=draft?require('./math-1992-001-candidates.json'):require('./math-1992-publishable-001.json').records;
const pool=draft?records.map(r=>r.candidate):JSON.parse(fs.readFileSync(path.join(root,'ops/jamb/source-pool.json'))).questions;
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const near=(a,b)=>Math.abs(a-b)<1e-8,letters='ABCD';
assert.deepEqual(records.map(r=>r.candidate.num),[6,10,12,19]);
for(const r of records){
  const q=pool.find(q=>q.id===r.id);
  assert.equal(questionFingerprint(q),r.content_sha256);
  assert.equal(q.year,1992);
  assert.equal(r.source_pdf_page,31);
  assert.equal(r.source_pdf_sha256,'dfc7168d207757e9db0b59b378aa16aa0f1449c501d6af3bf040abb37af95264');
  assert.equal(q.explanation,q.ai_explanation);
  assert.doesNotMatch(q.explanation,/source note|repair|original key|rechecking|guessed/i);
  if(q.num===6){
    assert.equal(q.question,'Simplify 5√18 − 3√72 + 4√50.');
    assert.deepEqual(q.options,{A:'17√4',B:'4√17',C:'17√2',D:'12√4'});
    const value=5*Math.sqrt(18)-3*Math.sqrt(72)+4*Math.sqrt(50);
    assert.deepEqual([17*Math.sqrt(4),4*Math.sqrt(17),17*Math.sqrt(2),12*Math.sqrt(4)].flatMap((x,i)=>near(x,value)?[letters[i]]:[]),[q.answer]);
  }else if(q.num===10){
    assert.equal(q.question,'Make t the subject of the formula s = ut + ½at².');
    assert.deepEqual(q.options,{A:'(u ± √(u² − 2as))/a',B:'(−u ± √(u² − 2as))/a',C:'(u ± √(u² + 2as))/a',D:'(−u ± √(u² + 2as))/a'});
    const choices=[[1,-1],[-1,-1],[1,1],[-1,1]];
    const valid=choices.flatMap(([uSign,discSign],i)=>[[2,5,1],[1,4,2],[-1,3,1]].every(([a,u,s])=>[-1,1].every(sign=>{
      const t=(uSign*u+sign*Math.sqrt(u*u+discSign*2*a*s))/a;
      return near(u*t+0.5*a*t*t,s);
    }))?[letters[i]]:[]);
    assert.deepEqual(valid,[q.answer]);
  }else if(q.num===12){
    assert.equal(q.question,'Solve the equation y − 11√y + 24 = 0.');
    assert.deepEqual(q.options,{A:'8, 3',B:'64, 9',C:'6, 4',D:'9, −8'});
    assert.deepEqual([[8,3],[64,9],[6,4],[9,-8]].flatMap((pair,i)=>pair.every(y=>y>=0&&near(y-11*Math.sqrt(y)+24,0))?[letters[i]]:[]),[q.answer]);
  }else if(q.num===19){
    assert.equal(q.question,'What is the nth term of the sequence 2, 6, 12, 20, …?');
    assert.deepEqual(q.options,{A:'4n − 2',B:'2(3n − 1)',C:'n² + n',D:'n² + 3n + 2'});
    const values=[2,6,12,20];
    assert.deepEqual([n=>4*n-2,n=>2*(3*n-1),n=>n*n+n,n=>n*n+3*n+2].flatMap((fn,i)=>values.every((v,k)=>fn(k+1)===v)?[letters[i]]:[]),[q.answer]);
  }else throw Error('Unchecked question');
}
console.log(JSON.stringify({passed:true,count:records.length,question_ids:records.map(r=>r.id)}));
