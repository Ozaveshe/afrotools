'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prepareBatch}=require('../ops/nigeria-exams/import-jamb-math-2022-batch-03.cjs');
const {verify,solveAnswers}=require('../ops/jamb/verification/check-mathematics-2022-003.cjs');
const {renderYear}=require('../scripts/build-jamb-reviewed-pages');
const manifest=require('../ops/nigeria-exams/jamb-math-2022-curated-batch-03.json'),pool=require('../ops/jamb/source-pool.json'),ledger=require('../data/jamb/review-ledger.json');
test('diagram-derived straight angle is checked with independent vectors and frozen artifacts',()=>{assert.deepEqual(solveAnswers(),{'64266':'A'});assert.equal(verify().accepted,1);});
test('one-item importer is repeatable and preserves all unrelated questions and reviews',()=>{
 const result=prepareBatch(manifest,pool,ledger);assert.deepEqual(result.pool,pool);assert.deepEqual(result.ledger,ledger);
 const missing=structuredClone(pool);missing.questions=missing.questions.filter(q=>q.id!=='mathematics-2022-myschool-64266');missing.count--;missing.answered_count--;
 const restored=prepareBatch(manifest,missing,ledger);assert.deepEqual(restored.pool.questions.slice(0,-1),missing.questions);assert.equal(restored.pool.questions.at(-1).id,'mathematics-2022-myschool-64266');
 const changed=structuredClone(manifest);changed.items[0].answer='C';assert.throws(()=>prepareBatch(changed,pool,ledger),/Frozen/);
});
test('durable verifier rejects answer, explanation and source trust changes',()=>{
 for(const field of ['answer','question','explanation']){const changed=structuredClone(pool),q=changed.questions.find(q=>q.id==='mathematics-2022-myschool-64266');q[field]=field==='answer'?'C':'tampered';assert.throws(()=>verify({pool:changed,ledger}));}
 const altered=structuredClone(ledger);altered.questions['mathematics-2022-myschool-64266'].content_sha256='0'.repeat(64);assert.throws(()=>verify({pool,ledger:altered}));
});
test('reviewed 2022 page includes the faithful task with its teaching guide closed',()=>{
 const page=renderYear('mathematics','2022',pool.questions,ledger,['2022']);assert.ok(page.approvedIds.includes('mathematics-2022-myschool-64266'));
 const card=page.html.match(/<article[^>]+data-reviewed-question="mathematics-2022-myschool-64266"[^>]*>([\s\S]*?)<\/article>/);assert.ok(card);assert.match(card[1],/<details><summary>Answer and explanation<\/summary>/);assert.doesNotMatch(card[1],/<details\b[^>]*\bopen/);assert.match(page.html,/original UTME sitting and question numbers are unconfirmed/i);
});
