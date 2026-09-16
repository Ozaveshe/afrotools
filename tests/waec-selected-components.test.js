'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const bank=require('../assets/js/lib/ssce-written-bank');const manifest=require('../ops/nigeria-exams/selected-waec-components.json');
test('selected WAEC component evidence matches all current briefs without claiming complete papers',()=>{
 assert.equal(manifest.components.length,2);assert.equal(manifest.sources.length,7);
 for(const c of manifest.components){assert.equal(c.complete_selected_prompts,true);assert.equal(c.complete_paper,false);assert.equal(new Set(c.expectedIds).size,c.expectedIds.length);
  for(const id of c.expectedIds){const q=bank.items.find(q=>q.id===id),s=manifest.sources.find(s=>s.id===id);assert.ok(q&&s);assert.equal(q.year,c.year);assert.equal(q.subject,c.subject);assert.equal(q.paper,c.paper);assert.equal(q.source,s.url);assert.match(s.sha256,/^[a-f0-9]{64}$/);assert.equal(s.questionBriefSha256,crypto.createHash('sha256').update(q.prompt).digest('hex'));assert.ok(q.steps.length>=3&&q.checks.length>=2);}
 }
 assert.deepEqual(manifest.components[0].expectedIds,['waec-2021-mathematics-p2-q2','waec-2021-mathematics-p2-q3']);
 assert.deepEqual(manifest.components[1].expectedIds,[1,2,3,4,5].map(n=>'waec-2023-english-p2-q'+n));
});
