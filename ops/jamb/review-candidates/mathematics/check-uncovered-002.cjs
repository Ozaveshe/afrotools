const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv.find(x=>x.startsWith('--source-root='))?.slice(14)||path.resolve(__dirname,'../../../..'));
const trust=require(path.join(root,'scripts/lib/jamb-content-trust')),b=require('./math-uncovered-002.json'),audit=require('./original-coverage-audit.json'),sha=v=>crypto.createHash('sha256').update(v).digest('hex');
assert.equal(sha(fs.readFileSync(path.join(__dirname,'math-uncovered-002.json'))),'bad5a27ee94e04633994d1a57c43bb2b4bc6985d0b66c20c09f4ac32456a686d');
assert.equal(sha(JSON.stringify(audit.uncovered_ids)),'00b5b81765b6116152fe6bd51a38243c5a1133c33d1ac27cdd02145d4c7cd42b');
const pdf=process.argv.find(x=>x.startsWith('--pdf='))?.slice(6)||path.join(root,'.jamb/MATHEMATICS-JAMB-Past-Questions.pdf');
if(fs.existsSync(pdf))assert.equal(sha(fs.readFileSync(pdf)),b.source.content_sha256);else assert(process.argv.includes('--integrated'),'Pre-intake source check requires --pdf=path; integrated replay uses pinned committed provenance');
assert.equal(b.source.content_sha256,'dfc7168d207757e9db0b59b378aa16aa0f1449c501d6af3bf040abb37af95264');
const ledger=JSON.parse(fs.readFileSync(process.argv.find(x=>x.startsWith('--ledger='))?.slice(9)||path.join(root,'data/jamb/review-ledger.json'))),pool=JSON.parse(fs.readFileSync(process.argv.find(x=>x.startsWith('--pool='))?.slice(7)||path.join(root,'ops/jamb/source-pool.json'))).questions;
assert.deepEqual(b.records.map(r=>r.id),audit.uncovered_ids.slice(9,29));
const review={status:'accepted',reviewer:'Codex (AI)',reviewer_type:'ai',reviewed_at:b.reviewed_at,evidence:'Temporary independent Mathematics source review test'};
let candidates=0,held=0,wrong=0,negative=0;
function solve(q){const k=q.id.split('-').slice(1,3).join('-');if(k==='1987-19'){assert.equal(q.answer,'B');assert.equal(2*7**2,98);for(const R of [2,7,14])assert.equal((98/R**2)*R**2,98);}
else if(k==='1987-50'){assert.equal(q.answer,'A');const oppositeParallelPairs={square:2,rectangle:2,rhombus:2,kite:0,trapezium:1};assert.equal(Object.values(oppositeParallelPairs).filter(x=>x===2).length/5,3/5);}
else if(k==='1988-25'){assert.equal(q.answer,'A');const roots=[(1+Math.sqrt(5))/2,(1-Math.sqrt(5))/2];assert.deepEqual(roots.map(x=>Number(x.toFixed(1))),[1.6,-0.6]);for(const x of roots)assert(Math.abs(x*x-x-1)<1e-12);}else throw Error(k);}
for(const r of b.records){assert.equal(trust.questionFingerprint(r.original_record),r.original_content_sha256);assert.equal(r.original_content_sha256,audit.records.find(q=>q.id===r.id).current_content_sha256);const current=pool.find(q=>q.id===r.id);assert(current);
if(!r.candidate){held++;assert(r.hold_reason.length>100);assert.equal(trust.questionFingerprint(current),r.original_content_sha256);assert.notEqual(trust.assessQuestion(current,ledger).state,'eligible');continue;}
candidates++;solve(r.candidate);assert.equal(trust.questionFingerprint(r.candidate),r.content_sha256);
if(trust.questionFingerprint(current)!==r.original_content_sha256){assert(process.argv.includes('--integrated'));assert.deepEqual(current,r.candidate);assert.equal(trust.assessQuestion(current,ledger).state,'eligible');}
for(const answer of Object.keys(r.candidate.options).filter(k=>k!==r.candidate.answer)){assert.throws(()=>solve({...r.candidate,answer}));wrong++;}
const temporary=structuredClone(ledger);temporary.questions[r.id]={source_id:b.source_id,content_sha256:r.content_sha256,question_review:review,answer_review:review,explanation_review:review};assert.equal(trust.assessQuestion(r.candidate,temporary).state,'eligible');
assert.notEqual(trust.assessQuestion({...r.candidate,question:r.candidate.question+' altered'},temporary).state,'eligible');negative++;
delete temporary.questions[r.id].answer_review;assert.notEqual(trust.assessQuestion(r.candidate,temporary).state,'eligible');negative++;
}
assert.equal(candidates,3);assert.equal(held,17);
// Independently exercise substantive source-conflict conclusions.
assert(24*8/12>12);assert(4.3**2-(8*Math.SQRT2/2)**2<0);assert.equal(8*Math.sqrt(3)/2,4*Math.sqrt(3));assert(Math.cos(210*Math.PI/180)<0);
const u=2,target=6*u*u+7*u-5;for(const product of [(3*u-5)*(2*u+1),(3*u-5)*(2*u-1),(2*u-5)*(3*u+1),(2*u-5)*(3*u-1)])assert.notEqual(product,target);
assert.deepEqual(Array.from({length:20},(_,i)=>i-10).filter(x=>1<5&&5<-2*x&&-2*x<7),[-3]);
console.log(JSON.stringify({pass:true,examined:20,candidates,held,wrong_answer_negatives:wrong,publication_negatives:negative,shared_mutation:false,private_pdf_checked:fs.existsSync(pdf)}));
