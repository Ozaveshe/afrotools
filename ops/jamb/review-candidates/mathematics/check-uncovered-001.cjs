const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../../..'),trust=require(path.join(root,'scripts/lib/jamb-content-trust')),b=require('./math-uncovered-001.json'),audit=require('./original-coverage-audit.json');
const ledger=JSON.parse(fs.readFileSync(path.join(root,'data/jamb/review-ledger.json'))),pool=JSON.parse(fs.readFileSync(path.join(root,'ops/jamb/source-pool.json'))).questions;
const sourcePdf='C:/Users/Oza/Documents/afrotools/.jamb/MATHEMATICS-JAMB-Past-Questions.pdf';
assert.equal(b.source.content_sha256,'dfc7168d207757e9db0b59b378aa16aa0f1449c501d6af3bf040abb37af95264');
assert.equal(ledger.sources[b.source_id].content_sha256,b.source.content_sha256);
if(fs.existsSync(sourcePdf))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(sourcePdf)).digest('hex'),b.source.content_sha256);
else assert(process.argv.includes('--integrated'),'Original PDF required before intake');
assert.deepEqual(b.records.map(r=>r.id),audit.uncovered_ids.slice(0,9));
const review={status:'accepted',reviewer:'Codex (AI)',reviewer_type:'ai',reviewed_at:b.reviewed_at,evidence:'Temporary check only: source-rendered independent Mathematics review'};
let candidates=0,held=0,wrong=0,mutation=0;
for(const r of b.records){assert.equal(trust.questionFingerprint(r.original_record),r.original_content_sha256);assert.equal(r.original_content_sha256,audit.records.find(q=>q.id===r.id).current_content_sha256);assert.equal(r.source_year,1984);assert.equal(r.source_question_number,r.original_record.num);
 if(!r.candidate){held++;assert(r.hold_reason.length>100);assert.equal(trust.questionFingerprint(pool.find(q=>q.id===r.id)),r.original_content_sha256);assert.notEqual(trust.assessQuestion(r.original_record,ledger).state,'eligible');continue;}
 candidates++;const q=r.candidate;assert.equal(trust.questionFingerprint(q),r.content_sha256);
 const expected=r.source_question_number===44?6*12/8:Math.sqrt((5*5-4*4)+(10-4)**2);
 const values=r.source_question_number===44?{A:4,B:16,C:9,D:14,E:NaN}:{A:5*Math.sqrt(3),B:3*Math.sqrt(5),C:3*Math.sqrt(3),D:5,E:6};
 assert(Math.abs(values[q.answer]-expected)<1e-10);for(const k of Object.keys(values).filter(k=>k!==q.answer)){assert(!(Math.abs(values[k]-expected)<1e-10));wrong++;}
 ledger.questions[q.id]={source_id:b.source_id,content_sha256:r.content_sha256,question_review:review,answer_review:review,explanation_review:review};assert.equal(trust.assessQuestion(q,ledger).state,'eligible');
 const bad={...q,answer:q.answer==='A'?'B':'A'};assert.notEqual(trust.assessQuestion(bad,ledger).state,'eligible');mutation++;
 const missing=structuredClone(ledger);delete missing.questions[q.id].answer_review;assert.notEqual(trust.assessQuestion(q,missing).state,'eligible');mutation++;
}
assert.equal(candidates,2);assert.equal(held,7);
assert.equal(0.5*4*Math.sqrt(25-16)*11,66);
assert(Math.abs((2+Math.sqrt(6))**2-4*(2+Math.sqrt(6))-2)<1e-10);
console.log(JSON.stringify({pass:true,examined:b.records.length,candidates,held,wrong_answer_negatives:wrong,ledger_fingerprint_negatives:mutation,shared_mutation:false}));
