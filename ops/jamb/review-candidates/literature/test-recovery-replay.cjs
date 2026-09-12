const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),a=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../..'),base=require('../../../jamb/source-pool.json'),iv=require('./source-inventory.json'),rec=require('./literature-recovery-001.json');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'literature-recovery-replay-')),poolfile=path.join(dir,'pool.json'),ledgerfile=path.join(dir,'ledger.json');
const pool=structuredClone(base),ledger=JSON.parse(fs.readFileSync(path.join(root,'data/jamb/review-ledger.json')));ledger.sources[iv.source_id]={...iv.source,status:'owner-authorized review source',pages:[]};
const recoveries=fs.readdirSync(__dirname).filter(f=>/^literature-recovery-\d{3}\.json$/.test(f)).map(f=>require('./'+f));
const batches=Array.from({length:9},(_,i)=>require('./literature-'+String(i+1).padStart(3,'0')+'.json'));
for(const b of [...batches,...recoveries])for(const r of b.records.filter(r=>r.candidate)){pool.questions[pool.questions.findIndex(q=>q.id===r.id)]=r.candidate;const review={status:'accepted',reviewer:'Codex (AI)',reviewer_type:'ai',reviewed_at:b.reviewed_at,evidence:'Exact source and independently reasoned answer'};ledger.questions[r.id]={source_id:b.source_id,content_sha256:r.content_sha256,question_review:review,answer_review:review,explanation_review:review};}
const run=name=>cp.spawnSync(process.execPath,[path.join(__dirname,'check-batch.cjs'),name,'--integrated','--pool='+poolfile,'--ledger='+ledgerfile],{encoding:'utf8'}),write=()=>{fs.writeFileSync(poolfile,JSON.stringify(pool));fs.writeFileSync(ledgerfile,JSON.stringify(ledger));};
try{write();for(const b of [...batches,...recoveries]){const p=run(b.batch_id);a.equal(p.status,0,p.stderr);}const r=rec.records.find(r=>r.candidate),name=batches.find(b=>b.records.some(x=>x.id===r.id)).batch_id,entry=structuredClone(ledger.questions[r.id]);let negatives=0;
delete ledger.questions[r.id];write();a.notEqual(run(name).status,0);negatives++;
ledger.questions[r.id]={...entry,content_sha256:'0'.repeat(64)};write();a.notEqual(run(name).status,0);negatives++;
ledger.questions[r.id]=structuredClone(entry);ledger.questions[r.id].answer_review.status='held';write();a.notEqual(run(name).status,0);negatives++;
ledger.questions[r.id]=entry;pool.questions.find(q=>q.id===r.id).question+=' changed';write();a.notEqual(run(name).status,0);negatives++;
console.log(JSON.stringify({pass:true,integrated_batches:batches.length+recoveries.length,candidates:[...batches,...recoveries].reduce((n,b)=>n+b.counts.candidates,0),missing_or_mismatched_ledger_and_candidate_negatives:negatives,shared_writes:0}));
}finally{fs.rmSync(poolfile,{force:true});fs.rmSync(ledgerfile,{force:true});fs.rmdirSync(dir);}
