'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const bank=require('../assets/js/lib/ssce-written-bank');
const owner=require('../scripts/build-ssce-practice-locales');
const api=require('../assets/js/lib/ssce-written');
const selected=require('../ops/nigeria-exams/selected-neco-components.json');
const intake=require('../ops/nigeria-exams/neco-2023-mathematics-intake.json');
const ids=['neco-2023-mathematics-p3-q23-worked','neco-2023-mathematics-p3-q48-worked'];
const get=id=>bank.items.find(q=>q.id===id);
test('quadratic zero-equation teaching preserves roots for every nonzero scaling without asserting a y-function',()=>{
 const q=get(ids[0]);assert.ok(q);assert.match(q.prompt,/x=−1.*x=2.*equal to zero/);assert.match(q.answer,/nonzero constant multiple/);assert.doesNotMatch(q.prompt+' '+q.answer,/y\s*=/);
 const polynomial=x=>x*x-x-2;for(const a of [-7,-.25,.5,1,2,9]){assert.equal(Math.abs(a*polynomial(-1)),0);assert.equal(Math.abs(a*polynomial(2)),0);assert.notEqual(a*polynomial(0),0);}
 const choices=[x=>x*x-x-2,x=>x*x-3*x-2,x=>x*x-2*x-3,x=>x*x-x+2,x=>x*x-3*x+2];assert.deepEqual(choices.map(f=>f(-1)===0&&f(2)===0),[true,false,false,false,false]);
 assert.equal(q.steps.length,3);assert.equal(q.checks.length,3);
});
test('water depth converts litres, reverses the exact rational computation and states two significant figures',()=>{
 const q=get(ids[1]);assert.ok(q);assert.match(q.prompt,/4\.2 cm.*1\.109 litres.*π=22\/7.*two significant figures/);
 const area=(22/7)*4.2**2,depth=1109/area;assert.ok(Math.abs(area-55.44)<1e-12);assert.ok(Math.abs(depth-27725/1386)<1e-12);assert.ok(Math.abs(area*(27725/1386)-1109)<1e-10);assert.equal(depth.toPrecision(2),'20');assert.match(q.answer,/2\.0×10¹ cm/);assert.doesNotMatch(q.answer,/20\.00 cm/);
 assert.equal(q.steps.length,3);assert.equal(q.checks.length,3);assert.deepEqual(intake.held_items.map(q=>q.number),[48]);
});
test('all 60 numbered adapted companions have complete source-derived prompts without an authenticated-paper claim',()=>{
 const math=bank.items.filter(q=>q.exam==='NECO'&&q.subject==='Mathematics');assert.equal(math.length,60);assert.deepEqual([...math.map(q=>q.number)].sort((a,b)=>a-b),Array.from({length:60},(_,i)=>i+1));assert.equal(new Set(math.map(q=>q.id)).size,60);
 const review=selected.mathematics_gap_review_20261001;assert.equal(review.source_pdf_sha256,null);assert.equal(review.sitting_authenticated,false);assert.equal(review.official_mark_scheme,false);assert.deepEqual(review.source_page_images.map(x=>x.page),[5,10]);for(const image of review.source_page_images)assert.match(image.sha256,/^[a-f0-9]{64}$/);
 for(const id of ids){const q=get(id);assert.equal(q.source,'https://www.scribd.com/document/842881920/NECO-20230001');assert.match(q.sourceUse,/Adapted brief.*not a complete paper/);assert.equal(crypto.createHash('sha256').update(q.prompt).digest('hex'),review.adapted_prompt_sha256[id]);assert.equal(q.figure,undefined);assert.equal(q.passage,undefined);}
 for(const component of selected.components)assert.equal(component.complete_paper,false);
});
test('EN FR SW gap tasks translate guidance and retain portable three-slot local responses',()=>{
 const entry={version:1,bankId:'ssce-written-v1',entries:{[ids[0]]:{answer:'Synthetic factor working',checks:[true,false,true]},[ids[1]]:{answer:'Synthetic volume working',checks:[false,true,false]}}};
 for(const locale of ['en','fr','sw']){const b=locale==='en'?bank:owner.writtenBank(locale);assert.deepEqual(api.normalize(structuredClone(entry),b),entry);for(const id of ids){const q=b.items.find(x=>x.id===id);assert.equal(q.steps.length,3);assert.equal(q.checks.length,3);assert.equal(q.number,get(id).number);if(locale!=='en'){assert.notEqual(q.prompt,get(id).prompt);assert.notEqual(q.title,get(id).title);assert.notEqual(q.sourceUse,get(id).sourceUse);assert.deepEqual(q.source,get(id).source);}}}
});
