const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const name=process.argv[2],b=require('./'+name+'.json'),pool=structuredClone(require('../../../jamb/source-pool.json'));
for(const r of b.records.filter(r=>r.candidate)){const i=pool.questions.findIndex(q=>q.id===r.id);pool.questions[i]=r.candidate;}
for(const r of require('./biology-recovery-001.json').records.filter(r=>r.candidate)){const i=pool.questions.findIndex(q=>q.id===r.id);pool.questions[i]=r.candidate;}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'biology-guard-')),file=path.join(dir,'pool.json'),checker=path.join(__dirname,'check-later-batch.cjs');
function run(){fs.writeFileSync(file,JSON.stringify(pool));return cp.spawnSync(process.execPath,[checker,name,'--integrated','--pool='+file],{encoding:'utf8'});}
try{let r=run();assert.equal(r.status,0,r.stderr);const held=b.records.find(r=>r.status==='held'),q=pool.questions.find(q=>q.id===held.id);q.answer='A';q.question+=' altered';r=run();assert.notEqual(r.status,0,'Modified held question must fail');console.log(JSON.stringify({pass:true,batch:name,checks:['candidate-applied integrated fixture','exact recovered historical item allowed','altered held question rejected']}));}finally{fs.unlinkSync(file);fs.rmdirSync(dir);}
