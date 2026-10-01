'use strict';
// Durable artifact and independent-calculation verification. Private fresh raw HTML
// and Nuxt payload checks were performed before intake; this verifier proves installed
// authored/source-snapshot/receipt/pool/ledger parity, not a fresh publisher fetch.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {questionFingerprint,assessQuestion}=require('../../../scripts/lib/jamb-content-trust');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const PINNED={
  "60666": {
    "answer": "B",
    "authored_sha256": "ef151b2d6931f8df158db8ec41feddf918415227e14e39f0d1cfc07cab998c10"
  },
  "60670": {
    "answer": "D",
    "authored_sha256": "86abc16b89a77d8af689a3aceeb6691d20bbaefe5aa478032edf6befb9770165"
  },
  "60674": {
    "answer": "A",
    "authored_sha256": "cda3ff10142a4d5294dfaa113d9659184354b52fe3bb46661342ef0959403981"
  },
  "60677": {
    "answer": "C",
    "authored_sha256": "33c78bc0af9989b3ff79d919d719e16662a63a34a556e7a436fe7b1c87e9ec5d"
  },
  "60680": {
    "answer": "B",
    "authored_sha256": "348a33f2c42c8212c5449c55f784134cad68f37eebc955c1e6cdd1da38d3bb7a"
  },
  "60692": {
    "answer": "A",
    "authored_sha256": "c956a70dc2e60d86b8bc90cec097c3e0edc13195a45ae2e5112d483c372278a5"
  },
  "60696": {
    "answer": "D",
    "authored_sha256": "9133302cbfa64767fc4b7e436933d6ca3d7a7a4a2760b4e6bf74f619ef6d8299"
  },
  "60701": {
    "answer": "C",
    "authored_sha256": "2ca8fc7d668e0642e40cf9760843105356d9e9a394dacc3eec196337ca9eed38"
  },
  "64173": {
    "answer": "D",
    "authored_sha256": "5b87a41e79fbfe95dda15cca2e487b93da940611e9ce8f2e39e01991b351bdca"
  },
  "64209": {
    "answer": "D",
    "authored_sha256": "85900abb25ff154e5406b744913ad1217d4e657b89a23c7008d2a118f4e019f0"
  },
  "64218": {
    "answer": "A",
    "authored_sha256": "80eb3c68380fc666a0a4a5f625eae2b7554dd03135511a32e75109b6e1ce74a8"
  },
  "64229": {
    "answer": "B",
    "authored_sha256": "620194d9a21ef9d33948f95652a009fa243243164c8f5b48bfb073f9c9a8099b"
  },
  "64250": {
    "answer": "A",
    "authored_sha256": "767827c1b91fa890b7e59703b264e638dd83d3a2ef5ac632f85bc7716d8fa883"
  },
  "64273": {
    "answer": "D",
    "authored_sha256": "5b851348794cb08a8e6d87a82b1a9795ffed39f068b40285b2965556558ba16a"
  },
  "64278": {
    "answer": "A",
    "authored_sha256": "8ec5f66717cb86efa2a723895337b1b89ab0a08cb4bd4d65947aebb58ca82c93"
  },
  "64391": {
    "answer": "A",
    "authored_sha256": "7e3f53ef260d8761a01fef27f8a4f7ba0b69530809a2607a466dd2753b99bf0f"
  },
  "64392": {
    "answer": "B",
    "authored_sha256": "281ee124b98d62772380d3724680940cd6bba690b815a778bd26eb2f3e740689"
  },
  "64393": {
    "answer": "D",
    "authored_sha256": "8a7e0d13f2362a72164bcb51d325ebac38a2cb7449ceaa57659af8ad562b12df"
  },
  "64395": {
    "answer": "A",
    "authored_sha256": "be47206b646848501fc6375df8883578ed771f096e6d19c5d88d6227c2696d22"
  },
  "64402": {
    "answer": "A",
    "authored_sha256": "82a476af348b759ed589e574a6da07fb8aca7d9f4a236ec3a542cf7c4358eadb"
  },
  "64404": {
    "answer": "A",
    "authored_sha256": "0e9fe93105e617ad2047c17411a058ce3fec20e30d98f327286d2fea94a691e4"
  },
  "64412": {
    "answer": "D",
    "authored_sha256": "63dff7a5dd241d78d9209e8c415253ccc4df7559c235abe92402ce1b3032f8e5"
  }
};
const ACCEPTED={2022:['64173','64209','64218','64229','64250','64273','64278','64391','64392','64393','64395','64402','64404','64412'],2021:['60666','60670','60674','60677','60680','60692','60696','60701']};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
function solveAnswers(manifest){
 const y=manifest.collection_year;assert.deepEqual(manifest.items.map(q=>q.sourceItem),ACCEPTED[y]);
 for(const q of manifest.items){assert.equal(sha(JSON.stringify({question:q.question,options:q.options,answer:q.answer,explanation:q.explanation})),PINNED[q.sourceItem].authored_sha256,'Authored task changed: '+q.sourceItem);}
 const solved={};
 if(y===2022){
 near(-Math.sqrt(1-(3/5)**2),-4/5);solved['64173']='D';
 near(1/(3-Math.sqrt(2)),3/7+Math.sqrt(2)/7);solved['64209']='D';
 near(2*Math.sqrt(25-9),8);solved['64218']='A';
 near(.28*360,100.8);solved['64229']='B';
 near(1.5+3*(32-1.5)/9,35/3);solved['64250']='A';
 const A=[[2,1],[2,3],[1,2]],B=[[3,2],[4,2]];assert.deepEqual(A.map(r=>B[0].map((_,j)=>r.reduce((s,v,k)=>s+v*B[k][j],0))),[[10,6],[18,10],[11,6]]);solved['64273']='D';
 near(96*.625/(50*.8),1.5);solved['64278']='A';
 near(3-5+(3*5)**2,223);solved['64391']='A';near(3*4/12,1);solved['64392']='B';
 assert.deepEqual([8+(26-8)/3,8+2*(26-8)/3],[14,20]);solved['64393']='D';
 for(const [a,b] of [[1,2],[-3,4],[.7,-.4]])near((2*a-3*b)*(2*a+3*b),4*a*a-9*b*b);solved['64395']='A';
 near(20+30-40,10);solved['64402']='A';near((-6+2)/(3-1),-2);assert.ok(3*(-3)-2<(-3)-6);assert.ok(!(3*(-2)-2<(-2)-6));solved['64404']='A';near(3800/.8,4750);solved['64412']='D';
 }else if(y===2021){
 near(12*(-1)**2-4*(-1),16);solved['60666']='B';assert.equal(Number((241.34*(3e-3)**2).toPrecision(4)),.002172);solved['60670']='D';
 near(.25*.75,3/16);solved['60674']='A';near(.00275*.0064/(.025*.08),8.8e-3);solved['60677']='C';near(12000/(2/9),54000);solved['60680']='B';near(360/(180-140),9);solved['60692']='A';near((13**2-10**2)*300,20700);solved['60696']='D';near(11*18-10*16,38);solved['60701']='C';
 }else throw Error('Unsupported year');
 for(const q of manifest.items)assert.equal(q.answer,solved[q.sourceItem]);return solved;
}

const SOURCE_ARTIFACT_PINS={
  "60666": "c50ed07dd4ca08785fcd099d8942c05c44e6a9eb621c07148dd6abbb0f57373b",
  "60670": "5f51f076445c479cf1fba7f0739e1fcef2876947c0035fd63311201ad9208117",
  "60674": "c596845128890b53116626e6c4ddd8dba41fcbadc0d4a87350acce1e2439308b",
  "60677": "0bf1030eec1c920747e1ab12c5e700124ed7e9c829896be71478418131025633",
  "60680": "780dd5873a91c8554563310542f556f899f1bf25df733762c68d0031865b3e17",
  "60692": "3870964a3372a52825c1e67decb116523696c442bc718e1ed4773234919c238d",
  "60696": "b3ccbe59af1929915674271b9305f30edfe8d7e650ded6a76e3df7335ad787af",
  "60701": "d1d69d25bbae9f5b3b0ac760486b7d730857667beee6bc88e445e26e581be8ba",
  "64173": "d886f60ddb253e17c74d99c591ee8b719643dcf69e2658947c5ee680459c0205",
  "64209": "2d695b9c8aace77fd5b958a690b72e8859b7610ed1c0ec3af36577fdee65d53a",
  "64218": "b8231070bcc068ab200fecdd7e66d29f4aeb1d39db7a9fad1a3bed9d6649c63f",
  "64229": "59708e80ba0f521b364b6379fce1d24c6407724eca4a4f58a5e0ff26b546d58b",
  "64250": "19b665fc2392914b96c58c939df19d1efab8537f17b7b91f66364ef427f6c165",
  "64273": "b164c90847cc127a3abbcd26248682199f6722183e1adcb2a68866a560903337",
  "64278": "6eab108e32fd7ccc55d0f6b7aeecf364100ae5494f44694958a8185405b74544",
  "64391": "20f244fde60b5c709d259ee30476233d011cf05dc7959452f5494027e449caf2",
  "64392": "d480e6a2a3cc2a8e0e4b4e544bb6ba6e14dd380922555b104d5008f2a4f5a667",
  "64393": "a2d1a8a2565c050b8bb29e38793d3e33efbd2fa96bcea1f0168386b29b7aaf17",
  "64395": "d10e17723b245f4405ba01b73bfd21728ec1224f7a27ca9613f61b346872cebb",
  "64402": "f95169b79aa343119f2647a8886605235db874182191c1e67b002124f268d90b",
  "64404": "4888ae32238dc4b2fd828af859661a80fbf1482cb9fe805dc09634cbbc04d18f",
  "64412": "7d388722904d28ecc61d40fdde1cc51531caeeeacebfc1a1c4e1efd306698cd9"
};
function pathsFor(year){return {manifest:`ops/nigeria-exams/jamb-math-${year}-curated-batch-02.json`,snapshot:`ops/nigeria-exams/jamb-math-${year}-source-snapshot-02.json`,receipt:`ops/jamb/verification/mathematics-${year}-publishable-002.json`};}
function readInstalled(root=path.resolve(__dirname,'../../..')){
 const json=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
 return {pool:json('ops/jamb/source-pool.json'),ledger:json('data/jamb/review-ledger.json'),batches:[2022,2021].map(year=>{const files=pathsFor(year);return {year,files,manifest:json(files.manifest),snapshot:json(files.snapshot),snapshotLF:fs.readFileSync(path.join(root,files.snapshot),'utf8').replace(/\r\n/g,'\n'),receipt:json(files.receipt)};})};
}
function verifyInstalled(artifacts=readInstalled()){
 const {pool,ledger,batches}=artifacts;let count=0;
 assert.equal(pool.count,pool.questions.length);assert.equal(pool.answered_count,pool.questions.filter(q=>q.answer).length);
 assert.deepEqual(batches.map(b=>b.year),[2022,2021]);
 for(const {year,files,manifest,snapshot,snapshotLF,receipt} of batches){
  for(const doc of [manifest,snapshot]){assert.equal(doc.schema_version,1);assert.equal(doc.publisher,'Myschool');assert.equal(doc.collection_year,year);assert.equal(doc.year_basis,'publisher-collection');assert.equal(doc.sitting_authenticated,false);assert.equal(doc.observed_at,'2026-10-01');}
  const answers=solveAnswers(manifest);assert.deepEqual(snapshot.records,manifest.items);assert.deepEqual(JSON.parse(snapshotLF),snapshot);
  const snapshotHash=sha(snapshotLF);assert.equal(receipt.source_snapshot_sha256,snapshotHash,'Snapshot canonical LF bytes must match receipt');assert.equal(receipt.source_file,files.snapshot);assert.equal(receipt.schema_version,1);assert.equal(receipt.reviewed_at,manifest.observed_at);assert.equal(receipt.records.length,ACCEPTED[year].length);
  assert.deepEqual(receipt.records.map(r=>r.source_item),ACCEPTED[year]);
  for(const item of manifest.items){
   assert.equal(sha(JSON.stringify(item)),SOURCE_ARTIFACT_PINS[item.sourceItem],'Installed source evidence changed: '+item.sourceItem);
   const id=`mathematics-${year}-myschool-${item.sourceItem}`,sourceId=`owner-directed-myschool-mathematics-${year}-${item.sourceItem}`;
   const matches=pool.questions.filter(q=>q.id===id);assert.equal(matches.length,1,'Unique pool task '+id);const q=matches[0],review=ledger.questions[id],source=ledger.sources[sourceId],proof=receipt.records.find(r=>r.id===id);
   assert.ok(review&&source&&proof,'Missing installed evidence '+id);
   assert.equal(q.subject,'mathematics');assert.equal(q.year,year);assert.equal(q.num,null);assert.equal(q.format,4);assert.equal(q.has_diagram,false);
   assert.equal(q.question,item.question);assert.deepEqual(q.options,item.options);assert.equal(q.answer,answers[item.sourceItem]);assert.equal(q.explanation,item.explanation);assert.equal(q.topic,item.topic);
   assert.deepEqual(q.verification,{method:'ai-calculation-checked',reviewed_at:manifest.observed_at});
   const expectedURL=`https://myschool.ng/classroom/mathematics/${item.sourceItem}?exam_type=jamb&exam_year=${year}&page=${Math.ceil(item.position/5)}`;
   assert.equal(item.source_url,expectedURL);assert.ok(item.source_observed_at.startsWith('2026-10-01T'));assert.ok(Number.isFinite(Date.parse(item.source_observed_at)));
   for(const field of ['source_prompt_sha256','source_page_sha256'])assert.match(item[field],/^[a-f0-9]{64}$/);
   assert.equal(Object.keys(item.observed_options).sort().join(''),'ABCD');assert.ok(Object.values(item.observed_options).every(v=>typeof v==='string'&&v.trim()));assert.ok(typeof item.observed_question==='string'&&item.observed_question.trim());
   assert.deepEqual(q.source_provenance,{publisher:'Myschool',url:expectedURL,year_basis:'publisher-collection'});
   assert.equal(review.source_id,sourceId);const fingerprint=questionFingerprint(q);assert.equal(review.content_sha256,fingerprint);assert.equal(proof.content_sha256,fingerprint);assert.equal(proof.source_item,item.sourceItem);assert.equal(proof.collection_position,item.position);assert.equal(proof.independently_selected_answer,q.answer);assert.equal(proof.publication_candidate,true);
   assert.equal(source.source_file,files.snapshot);assert.equal(source.content_sha256,snapshotHash);assert.equal(source.source_url,expectedURL);assert.equal(source.publisher,'Myschool');assert.equal(source.collection_year,year);assert.equal(source.year_basis,'publisher-collection');assert.equal(source.sitting_authenticated,false);assert.equal(source.official_answer_key,false);assert.equal(source.reuse_authorization.material_sha256,snapshotHash);
   const trust=assessQuestion(q,ledger);assert.equal(trust.state,'eligible',id+':'+trust.reasons.join(','));
   assert.ok(!Object.keys(q).some(k=>/private|publisher_key|repair|observed_options/.test(k)));count++;
  }
 }
 assert.equal(count,22);return {status:'PASS',verified:count,byYear:{2022:14,2021:8},scope:'Installed source artifact parity and pinned independent calculations; private raw HTML verification occurred before intake.'};
}
if(require.main===module)console.log(JSON.stringify(verifyInstalled()));
module.exports={ACCEPTED,solveAnswers,readInstalled,verifyInstalled,pathsFor};
