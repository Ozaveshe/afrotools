'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const {questionFingerprint,assessQuestion}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const batch=require('./english-2019-publishable-900.json');
const pool=JSON.parse(fs.readFileSync(path.join(root,'ops/jamb/source-pool.json'))).questions;
const ledger=JSON.parse(fs.readFileSync(path.join(root,'data/jamb/review-ledger.json')));
// Independently reviewed option meanings/grammar forms, not the compilation key.
const expected={27:'A',28:'D',29:'C',30:'D',32:'C',34:'B',37:'C',39:'A',41:'D',45:'A',49:'A',50:'A',56:'D',60:'D',64:'A',66:'A',67:'B',70:'B',73:'A',74:'A',79:'B',82:'B',86:'A',87:'A',89:'C',90:'C',91:'A',92:'B',93:'C',94:'D',95:'B',100:'D'};
assert.equal(batch.records.length,Object.keys(expected).length);
assert.equal(new Set(batch.records.map(r=>r.num)).size,batch.records.length);
for(const r of batch.records){
 const q=pool.find(q=>q.id===r.id);assert.ok(q,r.id);
 assert.deepEqual(q,r.after);assert.equal(questionFingerprint(q),r.content_sha256);
 assert.equal(q.year,2019);assert.equal(q.num,r.num);assert.equal(q.answer,expected[r.num]);
 assert.equal(q.verification.method,'ai-source-checked');assert.equal(assessQuestion(q,ledger).state,'eligible');
 assert.ok(r.source_pdf_page>=667&&r.source_pdf_page<=679);assert.ok(q.ai_explanation.length>100);
 assert.equal(pool.filter(p=>p.subject==='english'&&p.year===2019&&p.num===q.num).length,1);
 assert.doesNotMatch(q.question+' '+Object.values(q.options).join(' '),/\[PAGE|myschoolgist|Download/i);
}
const get=n=>batch.records.find(r=>r.num===n).after;
// Contrast tests: these critical items must not inherit the printed wrong keys.
assert.equal(get(49).options[get(49).answer],'spiritual');
assert.equal(get(89).options[get(89).answer],'part');
assert.equal(get(90).options[get(90).answer],'cite');
for(const [n,aux,pronoun] of [[70,'could','she'],[73,'were','they'],[82,'does','she']]){
 assert.equal(get(n).options[get(n).answer],aux+' '+pronoun);
 assert.match(get(n).question,/not/);
}
const soundCases=[
 [86,'ɔː',['ɔː','ɜː','ɒ','ʌ']], [87,'e',['e','ɜː','ɜː','ɜː']],
 [89,'ɑːt',['æʃ','æt','ɑːt','æk']], [90,'aɪt',['eɪt','ɔːt','aɪt','æt']],
 [91,'ʃ',['ʃ','tʃ','ʒ','sk']], [92,'s',['k','s','ʃ','tʃ']]
];
for(const [n,target,options] of soundCases){assert.deepEqual(options.flatMap((s,i)=>s===target?['ABCD'[i]]:[]),[get(n).answer]);}
assert.equal(get(93).options[get(93).answer],'departMENtal (third syllable stressed)');
assert.equal(get(94).options[get(94).answer],'juDIciary (second syllable stressed)');
assert.match(get(95).options.B,/lament.*right to her privacy/);
assert.match(get(100).options.D,/What did my mother buy/);
console.log(JSON.stringify({passed:true,question_ids:batch.records.map(r=>r.id)}));
