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
 assert.deepEqual(manifest.components.find(c=>c.id==='waec-2021-maths-q7-q8').expectedIds,[7,8].map(n=>'waec-2021-mathematics-p2-q'+n));
 assert.deepEqual(manifest.components.find(c=>c.id==='waec-2021-maths-q9-q10').expectedIds,[9,10].map(n=>'waec-2021-mathematics-p2-q'+n));
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

test('WAEC 2021 Q7–Q8 guidance keeps graph readings distinct from exact answers',()=>{
 const q7=bank.items.find(q=>q.id==='waec-2021-mathematics-p2-q7');
 const q8=bank.items.find(q=>q.id==='waec-2021-mathematics-p2-q8');
 const f=x=>2*x*x-x-2,g=x=>2*x+3;
 assert.deepEqual(Array.from({length:9},(_,i)=>f(i-4)),[34,19,8,1,-2,-1,4,13,26]);
 assert.deepEqual([-1,2.5].map(x=>f(x)-g(x)),[0,0]);
 const lower=(1-Math.sqrt(17))/4,upper=(1+Math.sqrt(17))/4;
 assert.ok(lower<0&&upper>0&&f((lower+upper)/2)<0);
 assert.ok(f(lower-0.1)>0&&f(upper+0.1)>0);
 assert.match(q7.answer,/√17/);assert.match(q7.answer,/−0\.781.*1\.281/);
 assert.equal(q7.figure,'quadratic-line');assert.ok(q7.figureAlt.length>100);
 const k=Math.sqrt(216/6);assert.equal(k,6);assert.equal(Math.hypot(3*k,4*k),30);
 const years=47-2*17;assert.equal(years,13);assert.equal(47+years,2*(17+years));
 assert.equal(q8.figure,'right-triangle-ratio');assert.match(q8.answer,/30 cm.*13 years/);
 const {writtenBank}=require('../scripts/build-ssce-practice-locales');
 for(const locale of ['fr','sw']){
  const translated=writtenBank(locale);
  for(const id of [q7.id,q8.id]){
   const source=bank.items.find(q=>q.id===id),item=translated.items.find(q=>q.id===id);
   assert.ok(item&&item.figureAlt!==source.figureAlt&&item.figureAlt.length>80);
   assert.ok(item.figureCaption!==source.figureCaption&&item.figureCaption.length>30);
   assert.equal(item.source,source.source);assert.equal(item.checks.length,source.checks.length);
  }
 }
});

test('WAEC 2021 Q9–Q10 guides match independent geometry, bearing and ladder calculations',()=>{
 const ids=[9,10].map(n=>'waec-2021-mathematics-p2-q'+n);
 const selected=manifest.components.find(row=>row.id==='waec-2021-maths-q9-q10');
 assert.deepEqual(selected.expectedIds,ids);assert.equal(selected.complete_selected_prompts,true);assert.equal(selected.complete_paper,false);
 const [trapezium,bearings]=ids.map(id=>bank.items.find(q=>q.id===id));
 const radians=Math.PI/180,top=2*20/12,lower=5+top+12/Math.tan(50*radians);
 const perimeter=Math.hypot(5,12)+top+12/Math.sin(50*radians)+lower,area=(top+lower)*12/2;
 assert.equal(Math.round(perimeter),50);assert.equal(Math.round(area),130);
 assert.equal(trapezium.answer,'Perimeter = 50 cm; area = 130 cm².');
 assert.equal(trapezium.figure,'trapezium-geometry');assert.ok(trapezium.figureAlt.length>100);
 const point=(km,bearing)=>({east:km*Math.sin(bearing*radians),north:km*Math.cos(bearing*radians)});
 const D=point(5,20),M=point(3,290),east=M.east-D.east,north=M.north-D.north;
 assert.equal(Math.hypot(east,north).toPrecision(2),'5.8');
 assert.equal(Math.round((Math.atan2(east,north)/radians+360)%360),231);
 const positiveWallHeight=(-2+Math.sqrt(4+192))/2;assert.equal(positiveWallHeight,6);
 assert.equal(bearings.answer,'DM = 5.8 km; bearing of M from D = 231°; wall height x = 6 m.');
 assert.equal(bearings.figure,'farm-bearings');assert.equal(bearings.figureAfterAnswer,true);
 assert.match(bearings.steps.join(' '),/020°.*290°.*90°/);
 const {writtenBank}=require('../scripts/build-ssce-practice-locales');
 for(const locale of ['fr','sw']){
  const translated=writtenBank(locale);
  for(const id of ids){
   const source=bank.items.find(q=>q.id===id),item=translated.items.find(q=>q.id===id);
   assert.ok(item);assert.notEqual(item.prompt,source.prompt);assert.notEqual(item.answer,source.answer);
   assert.notEqual(item.figureAlt,source.figureAlt);assert.ok(item.figureAlt.length>100);
   assert.notEqual(item.figureCaption,source.figureCaption);
   assert.equal(item.checks.length,source.checks.length);assert.equal(item.source,source.source);
  }
 }
});
