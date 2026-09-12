const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(process.argv.find(x=>x.startsWith('--source-root='))?.slice(14)||path.resolve(__dirname,'../../../..'));
const trust=require(path.join(root,'scripts/lib/jamb-content-trust')),b=require('./math-uncovered-003.json'),audit=require('./original-coverage-audit.json'),sha=v=>crypto.createHash('sha256').update(v).digest('hex');
assert.equal(sha(fs.readFileSync(path.join(__dirname,'math-uncovered-003.json'))),'fbc3ebe0d0b89658929f2d5213aa47c2185045e29ca84a1c1f6bb9ebecb8e05a');
assert.equal(sha(JSON.stringify(audit.uncovered_ids)),'00b5b81765b6116152fe6bd51a38243c5a1133c33d1ac27cdd02145d4c7cd42b');
const pdf=process.argv.find(x=>x.startsWith('--pdf='))?.slice(6)||path.join(root,'.jamb/MATHEMATICS-JAMB-Past-Questions.pdf');
if(fs.existsSync(pdf))assert.equal(sha(fs.readFileSync(pdf)),b.source.content_sha256);else assert(process.argv.includes('--integrated'),'Pre-intake source check requires --pdf=path; integrated replay uses pinned committed provenance');
assert.equal(b.source.content_sha256,'dfc7168d207757e9db0b59b378aa16aa0f1449c501d6af3bf040abb37af95264');
const ledger=JSON.parse(fs.readFileSync(process.argv.find(x=>x.startsWith('--ledger='))?.slice(9)||path.join(root,'data/jamb/review-ledger.json'))),pool=JSON.parse(fs.readFileSync(process.argv.find(x=>x.startsWith('--pool='))?.slice(7)||path.join(root,'ops/jamb/source-pool.json'))).questions;
assert.deepEqual(b.records.map(r=>r.id),audit.uncovered_ids.slice(29,49));
const review={status:'accepted',reviewer:'Codex (AI)',reviewer_type:'ai',reviewed_at:b.reviewed_at,evidence:'Temporary independent Mathematics source review test'};
let candidates=0,held=0,wrong=0,negative=0;
const solve=require('./solve-uncovered-003.cjs');
for(const r of b.records){assert.equal(trust.questionFingerprint(r.original_record),r.original_content_sha256);assert.equal(r.original_content_sha256,audit.records.find(q=>q.id===r.id).current_content_sha256);const current=pool.find(q=>q.id===r.id);assert(current);
if(!r.candidate){held++;assert(r.hold_reason.length>100);assert.equal(trust.questionFingerprint(current),r.original_content_sha256);assert.notEqual(trust.assessQuestion(current,ledger).state,'eligible');continue;}
candidates++;solve(r.candidate);assert.equal(trust.questionFingerprint(r.candidate),r.content_sha256);
if(trust.questionFingerprint(current)!==r.original_content_sha256){assert(process.argv.includes('--integrated'));assert.deepEqual(current,r.candidate);assert.equal(trust.assessQuestion(current,ledger).state,'eligible');}
for(const answer of Object.keys(r.candidate.options).filter(k=>k!==r.candidate.answer)){assert.throws(()=>solve({...r.candidate,answer}));wrong++;}
const temporary=structuredClone(ledger);temporary.questions[r.id]={source_id:b.source_id,content_sha256:r.content_sha256,question_review:review,answer_review:review,explanation_review:review,...r.diagram_evidence?{asset_review:{...review,content_sha256:r.diagram_evidence.asset_sha256}}:{}};assert.equal(trust.assessQuestion(r.candidate,temporary).state,'eligible');
assert.notEqual(trust.assessQuestion({...r.candidate,question:r.candidate.question+' altered'},temporary).state,'eligible');negative++;
delete temporary.questions[r.id].answer_review;assert.notEqual(trust.assessQuestion(r.candidate,temporary).state,'eligible');negative++;
}
assert.equal(candidates,9);assert.equal(held,11);
console.log(JSON.stringify({pass:true,examined:20,candidates,held,wrong_answer_negatives:wrong,publication_negatives:negative,shared_mutation:false,private_pdf_checked:fs.existsSync(pdf)}));
