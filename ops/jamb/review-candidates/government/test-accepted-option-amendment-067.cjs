'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm'),mod=require('node:module');
const {buildPlan}=require('./amend-accepted-option-067.cjs'),fixture=require('./accepted-option-amendment-067-fixture.json');
const arg=process.argv.find(x=>x.startsWith('--source-root=')),root=arg?path.resolve(arg.slice(14)):path.resolve(__dirname,'../../../..'),dir=path.join(root,'ops/jamb/review-candidates/government');
const local=mod.createRequire(path.join(dir,'check-batch.cjs')),{questionFingerprint:fp,assessQuestion}=local('../../../../scripts/lib/jamb-content-trust');
// Compare this historical amendment fixture without the two separately tested recovery-routing edits.
// All other checker bytes must still match the pinned before/after snapshot.
const hash=s=>crypto.createHash('sha256').update(s).digest('hex'),read=f=>{let text=fs.readFileSync(path.join(dir,f),'utf8');if(f==='check-batch.cjs'){text=text.replace('ledger=(mixedPrior||integrated)?','ledger=mixedPrior?').replace('currentIds,ledger,current}','currentIds,ledger}');}return text;},json=x=>JSON.stringify(x,null,2)+'\n';
// Reconstruct only the exact pinned pre-amendment inputs; never use git history.
const baseline=new Map(),currentFiles=new Map();
for(const [f,before]of Object.entries(fixture.original_files)){const text=read(f);currentFiles.set(f,text);assert.ok([before,fixture.amended_files[f]].includes(hash(text)),f+' current snapshot drift');baseline.set(f,text);}
const selection=JSON.parse(baseline.get('batch-010-selection.json')),index=selection.findIndex(r=>r.id===fixture.target);assert.ok(index>=0);selection[index]=fixture.original_row;baseline.set('batch-010-selection.json',json(selection));
const review=JSON.parse(baseline.get('batch-010-review.json'));review['5']=fixture.original_review;baseline.set('batch-010-review.json',json(review));
for(let n=10;n<=67;n++){const file='batch-'+String(n).padStart(3,'0')+'.json',b=JSON.parse(baseline.get(file));if(n===10){b.records=selection;b.selection_sha256=hash(baseline.get('batch-010-selection.json'));b.integration_allowlist.find(r=>r.id===fixture.target).candidate_content_sha256=fixture.before;}for(const p of b.prior_batches)p.sha256=hash(baseline.get(p.file));baseline.set(file,json(b));}
for(const p of fixture.collision_snapshots){const b=JSON.parse(baseline.get(p.file));b.entries[p.index][p.key]=p.original;baseline.set(p.file,json(b));}
let checker=baseline.get('check-batch.cjs');if(checker.endsWith(fixture.checker_append))checker=checker.slice(0,-fixture.checker_append.length);baseline.set('check-batch.cjs',checker);
baseline.set('prepare-next-batch.cjs',baseline.get('prepare-next-batch.cjs').replace('if(d.corroborating_sources)r.corroborating_sources=d.corroborating_sources;r.repair_history=','r.repair_history='));
for(const [f,pin]of Object.entries(fixture.original_files))assert.equal(hash(baseline.get(f)),pin,f+' original reconstruction drift');
const plan=buildPlan(dir,f=>baseline.get(f)||read(f)),get=f=>plan.changes.get(f)||baseline.get(f)||read(f);
assert.equal(plan.before,fixture.before);assert.equal(plan.after,fixture.after);assert.deepEqual([...plan.changes.keys()].sort(),Object.keys(fixture.amended_files).sort());
for(const [f,pin]of Object.entries(fixture.amended_files))assert.equal(hash(get(f)),pin,f+' amended reconstruction drift');
for(let n=10;n<=67;n++)for(const p of JSON.parse(get('batch-'+String(n).padStart(3,'0')+'.json')).prior_batches)assert.equal(p.sha256,hash(get(p.file)));
assert.ok([...plan.changes.keys()].every(f=>!f.includes('..')&&!f.includes('source-pool')&&!f.includes('review-ledger')));
const rows=Array.from({length:67},(_,i)=>JSON.parse(get('batch-'+String(i+1).padStart(3,'0')+'.json'))).flatMap(b=>b.records);
const rawPool=JSON.parse(fs.readFileSync(path.join(root,'ops/jamb/source-pool.json'),'utf8')),ledger=JSON.parse(fs.readFileSync(path.join(root,'data/jamb/review-ledger.json'),'utf8'));
function run(id,files){
 const map=new Map(rows.map(r=>[r.id,r.publication_candidate?r.candidate:r.original_record]));
 const changed=JSON.parse(files.get('batch-010.json')||get('batch-010.json')).records.find(r=>r.id===plan.target);map.set(plan.target,changed.candidate);
 const pool={...rawPool,questions:rawPool.questions.map(q=>map.get(q.id)||q)};
 const fakeFs=Object.assign({},fs,{existsSync:f=>/\.pdf$/i.test(String(f))?false:fs.existsSync(f),readFileSync:(f,options)=>{const key=path.relative(dir,String(f)).replace(/\\/g,'/');let text;if(key==='../../source-pool.json')text=JSON.stringify(pool);else if(files.has(key))text=files.get(key);else if(baseline.has(key))text=get(key);if(text!==undefined)return options?text:Buffer.from(text);return fs.readFileSync(f,options);}});
 vm.runInNewContext(get('check-batch.cjs'),{require:n=>n==='node:fs'?fakeFs:local(n),process:{argv:['node','check-batch.cjs',id,'--integrated']},__dirname:dir,Buffer,console:{log:()=>{}}},{filename:path.join(dir,'check-batch.cjs')});
}
run('010',plan.changes);run('067',plan.changes);
for(const mutation of ['option','corroboration']){const files=new Map(plan.changes),batch=JSON.parse(files.get('batch-010.json')),r=batch.records.find(r=>r.id===plan.target);if(mutation==='option'){r.candidate.options.B='an area';r.content_sha256=fp(r.candidate);batch.integration_allowlist.find(r=>r.id===plan.target).candidate_content_sha256=r.content_sha256;}else r.corroborating_sources[0].source_pdf_sha256='0'.repeat(64);const selected=json(batch.records);files.set('batch-010-selection.json',selected);batch.selection_sha256=hash(selected);files.set('batch-010.json',json(batch));assert.throws(()=>run('010',files),/reconstruction fingerprint drift|corroboration drift/);}
const currentRow=JSON.parse(currentFiles.get('batch-010.json')).records.find(r=>r.id===plan.target),current=rawPool.questions.find(q=>q.id===plan.target);
const amended=currentRow.content_sha256===plan.after;
for(const [f,text]of currentFiles)assert.equal(hash(text),amended?(fixture.amended_files[f]||fixture.original_files[f]):fixture.original_files[f],f+' partial amendment state');
function accepted(q,l){assert.equal(fp(q),currentRow.content_sha256,'Current pool must match current private candidate');const e=l.questions[q.id];assert.ok(e);assert.equal(e.content_sha256,fp(q));assert.equal(e.source_id,currentRow.source_id);assert.equal(l.sources[e.source_id].content_sha256,currentRow.source_pdf_sha256);assert.equal(assessQuestion(q,l).state,'eligible','Actual current ledger must accept amendment state');}
accepted(current,ledger);
for(const mutate of [l=>delete l.questions[plan.target],l=>l.questions[plan.target].content_sha256='0'.repeat(64),l=>l.questions[plan.target].answer_review.status='held',l=>l.sources[currentRow.source_id].content_sha256='0'.repeat(64)]){const bad=structuredClone(ledger);mutate(bad);assert.throws(()=>accepted(current,bad));}
for(const [f,text]of currentFiles)assert.equal(read(f),text,'Regression must never write candidate snapshots');
console.log(JSON.stringify({passed:true,pinned_original_files:baseline.size,planned_private_files:plan.changes.size,virtual_integrated_batches:['010','067'],rehashed_candidate_negatives:2,current_state:fp(current)===plan.after?'amended':'before-amendment',current_actual_ledger_checked:true,ledger_negatives:4,shared_writes:0}));
