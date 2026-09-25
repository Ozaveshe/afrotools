'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const bank=require('../assets/js/lib/ssce-written-bank');const manifest=require('../ops/nigeria-exams/selected-waec-components.json');
test('selected WAEC component evidence matches current briefs without claiming complete papers',()=>{
 assert.ok(manifest.components.length>=4);assert.ok(manifest.sources.length>=8);
 for(const c of manifest.components){assert.equal(c.complete_paper,false);assert.equal(new Set(c.expectedIds).size,c.expectedIds.length);
  for(const id of c.expectedIds){const q=bank.items.find(q=>q.id===id);assert.ok(q,id);assert.equal(q.year,c.year);assert.equal(q.subject,c.subject);assert.equal(q.paper,c.paper);assert.ok(q.steps.length>=3&&q.checks.length>=2);
   if(c.complete_selected_prompts){const s=manifest.sources.find(s=>s.id===id);assert.ok(s,id);assert.equal(q.source,s.url);assert.match(s.sha256,/^[a-f0-9]{64}$/);assert.equal(s.questionBriefSha256,crypto.createHash('sha256').update(q.prompt).digest('hex'));}
   else{assert.equal(q.passage,undefined);assert.match(q.sourceUse,/does not host the passage/);}
  }
 }
 assert.deepEqual(manifest.components.find(c=>c.id==='waec-2021-maths-q2-q3').expectedIds,['waec-2021-mathematics-p2-q2','waec-2021-mathematics-p2-q3']);
 const maths2022q8=manifest.components.find(c=>c.id==='waec-2022-maths-q8');
 assert.deepEqual(maths2022q8.expectedIds,['waec-2022-mathematics-p2-q8ab','waec-2022-mathematics-p2-q8c']);
 assert.equal(maths2022q8.complete_selected_prompts,true);assert.equal(maths2022q8.complete_paper,false);
 assert.match(maths2022q8.official_worked_image_sha256,/^[a-f0-9]{64}$/);
 const english2022=manifest.components.find(c=>c.id==='waec-2022-english-writing-prompts');
 assert.deepEqual(english2022.expectedIds,[1,2,3,4,5].map(n=>'waec-2022-english-p2-q'+n));
 assert.equal(english2022.official_hub_url,'https://www.waeconline.org.ng/e-learning/English/Engl255mc.html');
 assert.match(english2022.shared_rubric_review,/do not display.*word limit.*secondary.*not authenticated/i);
 assert.equal(english2022.complete_selected_prompts,true);
 assert.equal(english2022.complete_paper,false);
 for(const id of english2022.expectedIds){
  const source=manifest.sources.find(row=>row.id===id),q=bank.items.find(row=>row.id===id);
  assert.ok(source&&q);
  assert.equal(source.fingerprint_scope,'UTF-8 visible WAEC question text, excluding examiner observations and page HTML');
  assert.notEqual(source.sha256,source.questionBriefSha256,'adapted brief must differ from official question text');
  assert.equal(source.checked_at,'2026-09-25');
 }
 assert.deepEqual(manifest.components.find(c=>c.id==='waec-2023-english-writing-prompts').expectedIds,[1,2,3,4,5].map(n=>'waec-2023-english-p2-q'+n));
 const comprehension2022=manifest.components.find(c=>c.id==='waec-2022-english-comprehension-guide');
 assert.deepEqual(comprehension2022.expectedIds,['waec-2022-english-p2-q6']);
 assert.equal(comprehension2022.complete_selected_prompts,false);assert.equal(comprehension2022.complete_paper,false);
 assert.deepEqual(comprehension2022.answer_review.map(row=>row.part),[...'abcdefgh']);
 assert.ok(comprehension2022.answer_review.every(row=>row.basis.length>30));
 assert.match(comprehension2022.rights_basis,/no claim of permission/);
 assert.ok(comprehension2022.source_urls.some(url=>url.includes('waeconline.org.ng/e-learning/English/Engl255mq6.html')));
 assert.ok(comprehension2022.source_urls.includes(bank.items.find(q=>q.id===comprehension2022.expectedIds[0]).source));
 const summary2022=manifest.components.find(c=>c.id==='waec-2022-english-summary-guide');
 assert.deepEqual(summary2022.expectedIds,['waec-2022-english-p2-q7']);
 assert.equal(summary2022.complete_selected_prompts,false);
 assert.equal(summary2022.complete_paper,false);
 assert.ok(summary2022.source_urls.some(url=>url.includes('waeconline.org.ng/e-learning/English/Engl255mq7.html')));
 assert.deepEqual(manifest.components.find(c=>c.id==='waec-2023-english-reading-guides').expectedIds,[6,7].map(n=>'waec-2023-english-p2-q'+n));
 assert.deepEqual(manifest.components.find(c=>c.id==='waec-2023-mathematics-q10').expectedIds,['waec-2023-mathematics-p2-q10']);
});
