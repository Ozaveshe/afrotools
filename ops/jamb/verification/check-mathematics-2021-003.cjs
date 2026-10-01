"use strict";
// Private HTML bytes were verified at intake. This checker proves committed source
// artifact parity and independent calculations, not fresh retrieval or an official sitting.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {assessQuestion,questionFingerprint}=require('../../../scripts/lib/jamb-content-trust');
const root=path.resolve(__dirname,'../../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const canonical=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/\r\n/g,'\n');
const sha=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
const authoredPin='7033544dac50d6b96a75a232e0d8203c6ed145801ff528276a170ce3ebd93879',snapshotPin='adeca805dccce55970efb38a43d65e47af057b4adb692bf4458c13d7700c753b';
function solveAnswers(){
 const data=[4,16,30,20,10,14,26],total=data.reduce((a,b)=>a+b,0),selected=data.filter(x=>x>=16).reduce((a,b)=>a+b,0);
 assert.equal(total,120);assert.equal(selected,92);assert.equal(selected/total*360,276);
 for(const [P,Q,U,W] of [[120,80,60,40],[30,70,15,35],[8,12,4,6]]){
  const actual=(P+Q)/(P/U+Q/W),choices=[(P+Q)/(P*W+Q*U),U*W*(P+Q)/(P*W+Q*U),U*W*(P+Q)/(P*W),U*W/(P*W+Q*U)];
  assert.deepEqual(choices.map(v=>Math.abs(v-actual)<1e-10),[false,true,false,false]);
 }
 const g=x=>x*x+3*x;
 for(const x of [-4,-1,0,2,7])assert.equal(g(x+1)-g(x),2*(x+2));
 // Independent leading coefficient/vertex calculation: upward-opening quadratic
 // is unbounded above. Keep the source's explicit none-correct option; no invented interval.
 const y=x=>3*x*x+5*x-3;
 assert.equal((y(2)-2*y(1)+y(0))/2,3);
 assert.ok(y(2)>6);assert.ok(y(1000)>y(100));
 for(const x of [-5,0,2])assert.ok(Math.abs(y(x)-(3*(x+5/6)**2-61/12))<1e-10);
 return {'60699':'D','60711':'B','60715':'B','60628':'D'};
}
function verify({pool=read('ops/jamb/source-pool.json'),ledger=read('data/jamb/review-ledger.json')}={}){
 const manifestText=canonical('ops/nigeria-exams/jamb-math-2021-curated-batch-03.json'),snapshotText=canonical('ops/nigeria-exams/jamb-math-2021-source-snapshot-03.json');
 assert.equal(sha(manifestText),authoredPin);assert.equal(sha(snapshotText),snapshotPin);
 const m=JSON.parse(manifestText),s=JSON.parse(snapshotText),r=read('ops/jamb/verification/mathematics-2021-publishable-003.json'),answers=solveAnswers();
 assert.equal(m.items.length,4);assert.equal(s.records.length,4);assert.equal(r.records.length,4);
 assert.equal(m.sitting_authenticated,false);assert.equal(m.collection_year,2021);assert.equal(m.year_basis,'publisher-collection');
 assert.equal(r.authored_manifest_sha256,authoredPin);assert.equal(r.source_snapshot_sha256,snapshotPin);assert.equal(r.source_file,'ops/nigeria-exams/jamb-math-2021-source-snapshot-03.json');
 const ids=[];
 for(const item of m.items){
  const id='mathematics-2021-myschool-'+item.sourceItem,q=pool.questions.find(q=>q.id===id),source=s.records.find(x=>x.source_item===item.sourceItem),proof=r.records.find(x=>x.id===id);assert.ok(q&&source&&proof);ids.push(id);
  assert.equal(source.adapted_prompt,item.question);assert.deepEqual(source.options,item.options);assert.equal(source.observed_question,item.observed_question);assert.deepEqual(source.observed_options,item.observed_options);assert.equal(source.source_page_sha256,item.source_page_sha256);assert.equal(source.source_prompt_sha256,item.source_prompt_sha256);assert.deepEqual(source.independent_source_review,item.independent_source_review);
  assert.match(source.source_page_sha256,/^[a-f0-9]{64}$/);assert.equal(source.collection_position,item.position);
  assert.equal(q.question,item.question);assert.deepEqual(q.options,item.options);assert.equal(q.answer,answers[item.sourceItem]);assert.equal(item.answer,q.answer);assert.equal(q.explanation,item.explanation);assert.equal(q.num,null);assert.equal(q.year,2021);assert.equal(q.has_diagram,false);assert.equal(q.source_provenance.year_basis,'publisher-collection');assert.equal(q.source_provenance.url,source.source_url);
  assert.equal(questionFingerprint(q),proof.content_sha256);assert.equal(proof.answer,q.answer);assert.equal(proof.publication_candidate,true);
  const review=ledger.questions[id],trust=ledger.sources[review.source_id];assert.equal(review.content_sha256,proof.content_sha256);assert.equal(trust.content_sha256,snapshotPin);assert.equal(trust.official_answer_key,false);assert.equal(trust.source_url,source.source_url);assert.equal(assessQuestion(q,ledger).state,'eligible');
 }
 return {passed:true,accepted:4,question_ids:ids,scope:'Publisher-labelled 2021 revision collection; original sitting and full-paper coverage unconfirmed.'};
}
if(require.main===module)process.stdout.write(JSON.stringify(verify())+'\n');
module.exports={solveAnswers,verify};
