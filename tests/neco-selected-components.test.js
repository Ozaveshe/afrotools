'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const bank=require('../assets/js/lib/ssce-written-bank');
const manifest=require('../ops/nigeria-exams/selected-neco-components.json');

test('NECO 2023 English Section A covers all four inspected choices without claiming the paper',()=>{
 assert.equal(manifest.components.length,1);const section=manifest.components[0];
 assert.equal(section.exam,'NECO');assert.equal(section.subject,'English');assert.equal(section.year,2023);assert.equal(section.paper,'II');assert.equal(section.paper_code,'S1012');
 assert.equal(section.complete_selected_prompts,true);assert.equal(section.complete_paper,false);
 assert.deepEqual(section.expectedIds,[1,2,3,4].map(n=>'neco-2023-english-p2-q'+n));
 assert.match(manifest.source.sha256,/^[a-f0-9]{64}$/);assert.match(manifest.source.rights_basis,/no claim of permission/);
 for(const id of section.expectedIds){const q=bank.items.find(item=>item.id===id);assert.ok(q,id);assert.equal(q.source,manifest.source.url);assert.equal(q.exam,section.exam);assert.equal(q.subject,section.subject);assert.equal(q.year,section.year);assert.equal(q.paper,section.paper);assert.equal(q.passage,undefined);assert.match(q.sourceUse,/at least 450 words/);assert.match(q.answer,/no single model answer/);assert.equal(manifest.questionBriefSha256[id],crypto.createHash('sha256').update(q.prompt).digest('hex'));}
 assert.equal(bank.items.filter(item=>item.exam==='NECO'&&item.subject==='English').length,4);
});
