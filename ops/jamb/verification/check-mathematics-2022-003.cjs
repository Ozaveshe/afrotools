'use strict';
// Private HTML/figure bytes were checked during intake. This durable checker proves
// committed source-artifact parity and independent mathematics; it does not fetch
// or re-authenticate the original sitting or require private source files.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {assessQuestion,questionFingerprint}=require('../../../scripts/lib/jamb-content-trust');
const root=path.resolve(__dirname,'../../..'),snapshotPath='ops/nigeria-exams/jamb-math-2022-source-snapshot-03.json';
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const canonical=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/\r\n/g,'\n');
const sha=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
const snapshotPin='39643973f23bf7f324f422bb1a35373bad79b71a30ef48e64a625dccf1be20f4';
const authoredPin='56f5b2b374f1fe43acf8ee0bbead070b3aaad032f24cb5b484c8e7d8a6336c67';
function solveAnswers(){
  for(const [g,h] of [[20,30],[40,70],[35,60],[65,15]]){
    const rad=x=>x*Math.PI/180;
    const dot=Math.cos(rad(180-g))*Math.cos(rad(h))+Math.sin(rad(180-g))*Math.sin(rad(h));
    const actual=Math.acos(dot)*180/Math.PI;
    const options=[180-g-h,360-g+h,180-g+h,360-g-h];
    assert.ok(Math.abs(actual-options[0])<1e-10);
    assert.deepEqual(options.map((x,i)=>Math.abs(x-actual)<1e-10?i:null).filter(x=>x!==null),[0]);
  }
  return {'64266':'A'};
}
function verify({pool=read('ops/jamb/source-pool.json'),ledger=read('data/jamb/review-ledger.json')}={}){
  const text=canonical('ops/nigeria-exams/jamb-math-2022-curated-batch-03.json');assert.equal(sha(text),authoredPin,'Frozen independently authored intake');
  const manifest=JSON.parse(text),item=manifest.items[0],snapshotText=canonical(snapshotPath),snapshot=JSON.parse(snapshotText),receipt=read('ops/jamb/verification/mathematics-2022-publishable-003.json');
  assert.equal(manifest.items.length,1);assert.equal(manifest.sitting_authenticated,false);assert.equal(manifest.year_basis,'publisher-collection');
  assert.equal(receipt.authored_manifest_sha256,authoredPin);assert.equal(receipt.source_file,snapshotPath);assert.equal(receipt.source_snapshot_sha256,sha(snapshotText));
  assert.equal(sha(snapshotText),snapshotPin);assert.equal(snapshot.records.length,1);assert.equal(receipt.records.length,1);
  const source=snapshot.records[0],proof=receipt.records[0],q=pool.questions.find(x=>x.id==='mathematics-2022-myschool-64266');assert.ok(q);
  assert.equal(source.source_item,'64266');assert.equal(source.collection_position,12);assert.equal(source.adapted_prompt,item.question);assert.deepEqual(source.options,item.options);
  assert.equal(source.source_detail_page_sha256,'6a68e68a754f17fe0a661a320906d02648543e197eead789a1627de4eaf10baf');
  assert.equal(source.diagram_evidence.sha256,'8ecc7a1387f194bc825cb18e080f7a4365e92a1c41cce584d55a896c894a4f0d');
  assert.deepEqual(source.diagram_evidence,item.diagram_evidence);assert.equal(source.observed_question,item.observed_question);assert.deepEqual(source.observed_options,item.observed_options);
  assert.equal(q.question,item.question);assert.deepEqual(q.options,item.options);assert.equal(q.explanation,item.explanation);assert.equal(q.answer,solveAnswers()['64266']);assert.equal(item.answer,q.answer);
  assert.equal(q.num,null);assert.equal(q.year,2022);assert.equal(q.has_diagram,false);assert.equal(q.source_provenance.year_basis,'publisher-collection');assert.equal(q.source_provenance.url,source.source_url);
  assert.equal(questionFingerprint(q),proof.content_sha256);assert.equal(proof.id,q.id);assert.equal(proof.answer,q.answer);assert.equal(proof.source_item,'64266');assert.equal(proof.collection_position,12);assert.equal(proof.publication_candidate,true);
  const review=ledger.questions[q.id];assert.equal(review.content_sha256,proof.content_sha256);assert.equal(ledger.sources[review.source_id].content_sha256,sha(snapshotText));assert.equal(ledger.sources[review.source_id].official_answer_key,false);assert.equal(ledger.sources[review.source_id].source_url,q.source_provenance.url);assert.equal(assessQuestion(q,ledger).state,'eligible');
  return {passed:true,accepted:1,question_ids:[q.id],scope:'Independently calculated diagram-derived revision item; publisher collection year only.'};
}
if(require.main===module)process.stdout.write(JSON.stringify(verify())+'\n');
module.exports={solveAnswers,verify};
