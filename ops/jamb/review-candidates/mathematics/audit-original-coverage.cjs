const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=process.argv.find(x=>x.startsWith('--root='))?.slice(7)||'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools';
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f))),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
const {questionFingerprint,assessQuestion}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const pool=read('ops/jamb/source-pool.json').questions.filter(q=>q.subject==='mathematics'),raw=read('ops/jamb/raw/mathematics.json').questions,ledger=read('data/jamb/review-ledger.json');
const ids=new Set(pool.map(q=>q.id)),proof=new Map(),pins={};assert.equal(ids.size,pool.length);
for(const dir of ['ops/jamb/verification','ops/jamb/review-candidates/mathematics'])for(const file of fs.readdirSync(path.join(root,dir)).filter(f=>/^math(?:ematics)?-.*\.json$/.test(f))){
 const relative=dir+'/'+file,b=read(relative);
 for(const r of b.records||[]){if(!ids.has(r.id))continue;
 const reasoning=r.reasoning||r.independentReasoning||r.explanation||r.candidate?.ai_explanation||r.hold_reason;
 if(typeof reasoning!=='string'||reasoning.trim().length<30)continue;
 if(r.original_record&&r.original_content_sha256)assert.equal(questionFingerprint(r.original_record),r.original_content_sha256,relative+': original fingerprint '+r.id);
 const p={file:relative,record_id:r.id,reasoning,record_sha256:crypto.createHash('sha256').update(JSON.stringify(r)).digest('hex'),source_pdf_page:r.source_pdf_page||r.sourcePage||null,documented_state:r.status||r.state||(r.publication_candidate?'publication-candidate':'examined'),original_content_sha256:r.original_content_sha256||null};
 pins[relative]=hash(relative);proof.set(r.id,[...(proof.get(r.id)||[]),p]);
 }
}
const records=pool.map(q=>{const evidence=proof.get(q.id)||[],a=assessQuestion(q,ledger);return {id:q.id,imported_year:Number(q.id.split('-')[1]),current_content_sha256:questionFingerprint(q),publication_state:a.state,publication_reasons:a.reasons,coverage_state:evidence.length?'documented-review':'uncovered',evidence};});
const counts={pool:pool.length,raw:raw.length,raw_outside_pool:raw.filter(q=>!ids.has(q.id)).length,documented:records.filter(r=>r.evidence.length).length,uncovered:records.filter(r=>!r.evidence.length).length,eligible:records.filter(r=>r.publication_state==='eligible').length,documented_held:records.filter(r=>r.evidence.length&&r.publication_state!=='eligible').length};
assert(records.filter(r=>r.publication_state==='eligible').every(r=>r.evidence.length),'accepted record without documentary reasoning');
const report={schema_version:1,status:'coverage-audit-not-new-answer-review',scope:'All current 535 Mathematics source-pool IDs; raw-only imports explicitly excluded from this scope',counts,limitations:['Evidence presence and original fingerprints audited; prior individual answer calculations were not re-performed by this coverage audit.','Inventory membership, imported AI explanations and checkpoint labels do not count as review evidence.','Uncovered means no substantive record in the scoped verification and candidate receipts; search of ops/reports/docs/artifacts found those IDs only in raw imports and source-pool.'],input_pins:{'ops/jamb/source-pool.json':hash('ops/jamb/source-pool.json'),'ops/jamb/raw/mathematics.json':hash('ops/jamb/raw/mathematics.json'),'data/jamb/review-ledger.json':hash('data/jamb/review-ledger.json')},evidence_pins:pins,records,uncovered_ids:records.filter(r=>!r.evidence.length).map(r=>r.id),raw_outside_pool_ids:raw.filter(q=>!ids.has(q.id)).map(q=>q.id)};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(__dirname,'original-coverage-audit.json'),JSON.stringify(report,null,2)+'\n');
else {const expected=JSON.parse(fs.readFileSync(path.join(__dirname,'original-coverage-audit.json')));assert.deepEqual(report,expected,'Coverage snapshot drift: rerun deliberately after new intake');}
console.log(JSON.stringify({pass:true,...counts}));
