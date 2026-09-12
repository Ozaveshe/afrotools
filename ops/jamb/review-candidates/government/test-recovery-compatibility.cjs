'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),moduleApi=require('node:module'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]),dir=path.join(root,'ops/jamb/review-candidates/government'),local=__dirname;
assert.ok(process.argv[2],'Supply coordinator root (read-only)');
const fp=require(path.join(root,'scripts/lib/jamb-content-trust')).questionFingerprint,read=p=>JSON.parse(fs.readFileSync(p)),b=read(path.join(local,'recovery-001.json')),basePool=read(path.join(root,'ops/jamb/source-pool.json')),baseLedger=read(path.join(root,'data/jamb/review-ledger.json'));
const pool=structuredClone(basePool),ledger=structuredClone(baseLedger);for(const r of b.records.filter(r=>r.candidate)){const index=pool.questions.findIndex(q=>q.id===r.id);assert.ok(index>=0);pool.questions[index]=r.candidate;const review={status:'accepted',reviewer:'Codex (AI)',reviewer_type:'ai',reviewed_at:'2026-09-12',evidence:'Simulated Government recovery001 '+r.id};ledger.questions[r.id]={content_sha256:r.content_sha256,source_id:r.source_id,question_review:review,answer_review:review,explanation_review:review};}
const baselineChecker=fs.readFileSync(path.join(dir,'check-batch.cjs'),'utf8');
function run(file,args,options={}){
 const cache=new Map(),fakeFs=Object.assign({},fs,{readFileSync:(f,encoding)=>{const absolute=path.resolve(String(f)),rel=path.relative(dir,absolute).replace(/\\/g,'/');let value;
 if(absolute===path.join(root,'ops/jamb/source-pool.json'))value=JSON.stringify(options.pool||pool);
 else if(absolute===path.join(root,'data/jamb/review-ledger.json'))value=JSON.stringify(options.ledger||ledger);
 else if(['recovery-001.json','accepted-recovery-hash.cjs','pool-record-hash.cjs'].includes(rel)&&!options.baseline)value=fs.readFileSync(path.join(local,rel),'utf8');
 if(value!==undefined)return encoding?value:Buffer.from(value);return fs.readFileSync(f,encoding);
 }});
 function load(filename){if(cache.has(filename))return cache.get(filename).exports;const mod={exports:{}};cache.set(filename,mod);let code;
 if(filename===path.join(dir,'check-batch.cjs')){code=baselineChecker;if(!options.baseline)code=code.replace('ledger=mixedPrior?','ledger=(mixedPrior||integrated)?').replace('poolRecordHash(r,{integrated,mixedPrior,currentIds,ledger})','poolRecordHash(r,{integrated,mixedPrior,currentIds,ledger,current})');}
 else if(filename===path.join(dir,'test-final-coverage.cjs'))code=fs.readFileSync(path.join(options.baseline?dir:local,'test-final-coverage.cjs'),'utf8');
 else code=fakeFs.readFileSync(filename,'utf8');
 const native=moduleApi.createRequire(filename),req=name=>{if(name==='node:fs')return fakeFs;const virtual=path.basename(name)==='accepted-recovery-hash.cjs'?path.join(dir,'accepted-recovery-hash.cjs'):null;const resolved=virtual||native.resolve(name);if(resolved.startsWith(dir+path.sep)&&resolved.endsWith('.cjs'))return load(resolved);return native(name);};
 const fn=vm.runInThisContext('(function(require,module,exports,__filename,__dirname,process,console){'+code+'\n})',{filename});fn(req,mod,mod.exports,filename,path.dirname(filename),{argv:['node',filename,...args]},{log:()=>{}});return mod.exports;
 }
 load(path.join(dir,file));
}
assert.throws(()=>run('check-batch.cjs',['001','--integrated','--mixed-prior'],{baseline:true}),/Pool drift|Held prior/);
assert.throws(()=>run('test-final-coverage.cjs',['--integrated'],{baseline:true}),/Held original changed/);
for(let n=1;n<=67;n++)run('check-batch.cjs',[String(n).padStart(3,'0'),'--integrated','--mixed-prior']);run('test-final-coverage.cjs',['--integrated']);
let negatives=0;const recovered=b.records.find(r=>r.candidate),held=b.records.find(r=>!r.candidate);
for(const mutate of [l=>delete l.questions[recovered.id],l=>l.questions[recovered.id].content_sha256='0'.repeat(64),l=>l.questions[recovered.id].source_id='unknown',l=>l.sources[recovered.source_id].content_sha256='0'.repeat(64),l=>l.sources[recovered.source_id].source_file='wrong.pdf',...['question_review','answer_review','explanation_review'].map(k=>l=>l.questions[recovered.id][k].status='pending'),l=>l.sources[recovered.source_id].reuse_authorization.status='pending']){const changed=structuredClone(ledger);mutate(changed);assert.throws(()=>run('check-batch.cjs',['001','--integrated','--mixed-prior'],{ledger:changed}));assert.throws(()=>run('test-final-coverage.cjs',['--integrated'],{ledger:changed}));negatives++;}
for(const r of [recovered,held]){const changed=structuredClone(pool),forged=structuredClone(ledger),q=changed.questions.find(x=>x.id===r.id);q.question+=' changed';forged.questions[r.id]={...ledger.questions[recovered.id],content_sha256:fp(q),source_id:r.source_id};assert.throws(()=>run('check-batch.cjs',['001','--integrated','--mixed-prior'],{pool:changed,ledger:forged}));assert.throws(()=>run('test-final-coverage.cjs',['--integrated'],{pool:changed,ledger:forged}));negatives++;}
console.log(JSON.stringify({baselineFailuresReproduced:2,integratedGovernmentWrappers:67,finalCoverage:'passed',recovered:11,compatibilityNegativeScenarios:negatives,negativePaths:negatives*2,coordinatorWrites:0}));
