'use strict';
// This verifies the integrity and completeness of an independently documented
// language review. It is not an automated demonstration of semantic correctness.
const assert=require('node:assert/strict');
const {questionFingerprint,assessQuestion}=require('../../../../scripts/lib/jamb-content-trust');
module.exports=function check(batch,expectedKeys,heldCount,passageCount=0){
 const ids=new Set(), hosts=new Set(['www.collinsdictionary.com','dictionary.cambridge.org','owl.purdue.edu','learnenglish.britishcouncil.org','learnenglishteens.britishcouncil.org','our-languages.canada.ca','www.oxfordlearnersdictionaries.com','en.wiktionary.org','knowbaseconsult.com']);
 let passages=0;
 for(const r of batch.records){
  assert.ok(!ids.has(r.id));ids.add(r.id);
  assert.equal(r.candidate.id,r.id);
  assert.equal(questionFingerprint(r.candidate),r.content_sha256);
  assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
  assert.equal(r.candidate.answer,expectedKeys[r.candidate.num]);
  assert.equal(r.candidate.explanation,r.candidate.ai_explanation);
  assert.equal(r.candidate.verification.method,'ai-source-checked');
  assert.equal(r.semantic_review.method,'ai-source-checked');
  assert.equal(r.semantic_review.source_checked_at,'2026-09-12');
  assert.ok(r.semantic_review.independent_reasoning.length>80);
  assert.ok(r.semantic_review.support_summary.length>20);
  assert.ok(batch.source.pages.includes(r.source_pdf_page));
  assert.ok(r.repair_history.length>20);
  const publicText=JSON.stringify([r.candidate.question,r.candidate.options,r.candidate.passage,r.candidate.explanation]);
  assert.doesNotMatch(publicText,/Source note:|compilation|malformed|repair history|original key|\[PAGE \d+\]/i);
  if(r.candidate.passage){
   passages++;assert.ok(r.candidate.passage.length>400);
   assert.equal(r.semantic_review.source_document.content_sha256,batch.source.content_sha256);
   assert.equal(r.semantic_review.source_document.source_file,batch.source.source_file);
   assert.ok(r.semantic_review.source_document.pages.length>0);
   assert.ok(r.semantic_review.source_document.pages.every(p=>batch.source.pages.includes(p)));
  }else{
   const u=new URL(r.semantic_review.source_url);assert.equal(u.protocol,'https:');
   const regionalIdiomColumn='https://punchng.com/has-in-stock-or-has-in-store-fairing-well-or-faring-well/';
   assert.ok(hosts.has(u.hostname)||u.href===regionalIdiomColumn);
  }
  const review={status:'accepted',reviewer:'Codex (AI)',reviewer_type:'ai',reviewed_at:'2026-09-12',evidence:'Candidate integrity fixture; see the independently recorded contextual rationale.'};
  const ledger={sources:{[batch.source_id]:batch.source},questions:{[r.id]:{content_sha256:r.content_sha256,source_id:batch.source_id,question_review:review,answer_review:review,explanation_review:review}}};
  const result=assessQuestion(r.candidate,ledger);assert.equal(result.state,'eligible',r.id+': '+result.reasons.join(','));
  // Added reading context is part of the reviewed fingerprint, never inherited.
  if(r.candidate.passage)assert.ok(assessQuestion({...r.candidate,passage:r.candidate.passage+' Altered.'},ledger).reasons.includes('review_content_changed'));
 }
 assert.equal(ids.size,Object.keys(expectedKeys).length);assert.equal(batch.held_records.length,heldCount);
 assert.equal(batch.examined_count,ids.size+heldCount);assert.equal(passages,passageCount);
 for(const h of batch.held_records){assert.ok(!ids.has(h.id));assert.ok(h.reason.length>60);assert.equal(h.status,'needs-source-reconciliation');}
 return {passed:true,question_ids:[...ids],examined:batch.examined_count,held:heldCount,passages,scope:batch.checker_scope};
};
