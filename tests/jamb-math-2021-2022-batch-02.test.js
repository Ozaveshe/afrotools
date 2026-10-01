'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {readInstalled,verifyInstalled}=require('../ops/jamb/verification/check-mathematics-2021-2022-002.cjs');
const baseline=readInstalled();
test('22 Mathematics 2021/2022 tasks retain source/receipt/pool/ledger parity and independent answers',()=>assert.equal(verifyInstalled(baseline).verified,22));
const mutations={
 'changed answer':a=>a.batches[0].manifest.items[0].answer='A',
 'changed prompt':a=>a.batches[0].manifest.items[0].question+=' altered',
 'changed option':a=>a.batches[0].manifest.items[0].options.A='altered',
 'changed explanation':a=>a.batches[0].manifest.items[0].explanation+=' altered',
 'missing recent item':a=>a.batches[0].manifest.items.pop(),
 'invented sitting authentication':a=>a.batches[0].manifest.sitting_authenticated=true,
 'changed observed source transcription':a=>{a.batches[0].manifest.items[0].observed_question+=' altered';a.batches[0].snapshot.records=structuredClone(a.batches[0].manifest.items);a.batches[0].snapshotLF=JSON.stringify(a.batches[0].snapshot,null,2)+'\n';},
 'changed observed source hash':a=>a.batches[0].manifest.items[0].source_prompt_sha256='a'.repeat(64),
 'pool source URL drift':a=>a.pool.questions.find(q=>q.id==='mathematics-2022-myschool-64173').source_provenance.url+='altered',
 'invented exam number':a=>a.pool.questions.find(q=>q.id==='mathematics-2022-myschool-64173').num=6,
 'duplicate source task':a=>{a.pool.questions.push(structuredClone(a.pool.questions.find(q=>q.id==='mathematics-2022-myschool-64173')));a.pool.count++;a.pool.answered_count++;},
 'receipt answer drift':a=>a.batches[0].receipt.records[0].independently_selected_answer='A',
 'source permission hash drift':a=>a.ledger.sources['owner-directed-myschool-mathematics-2022-64173'].reuse_authorization.material_sha256='a'.repeat(64),
 'ledger answer review missing':a=>delete a.ledger.questions['mathematics-2022-myschool-64173'].answer_review
};
for(const[name,mutate]of Object.entries(mutations))test('rejects '+name,()=>{const a=structuredClone(baseline);mutate(a);assert.throws(()=>verifyInstalled(a));});
test('snapshot receipt hashes use canonical LF across Git autocrlf checkouts',()=>{const a=structuredClone(baseline);for(const b of a.batches){const checkoutCRLF=b.snapshotLF.replace(/\n/g,'\r\n');b.snapshotLF=checkoutCRLF.replace(/\r\n/g,'\n');}assert.equal(verifyInstalled(a).verified,22);});
