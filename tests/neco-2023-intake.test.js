const {test}=require('node:test');const assert=require('node:assert/strict');
const intake=require('../ops/nigeria-exams/neco-2023-mathematics-intake.json');
test('NECO intake arithmetic is independently checked without inventing paper identities',()=>{
 const [percentage,walking,modulus,logarithm,interest]=intake.items;
 assert.equal(percentage.given.initial-percentage.given.initial*percentage.given.decreasePercent/100,percentage.answer);
 assert.ok(Math.abs(walking.answerHours*60*walking.given.pacesPerMinute*walking.given.metresPerPace-walking.given.distanceMetres)<1e-9);
 const product=modulus.given.factors.reduce((a,b)=>a*b,1);assert.equal(product%modulus.given.modulus,modulus.answer);
 assert.equal(Number((4*logarithm.given.log10of3-1).toFixed(4)),logarithm.answer);
 let balance=interest.given.principal;for(let i=0;i<interest.given.years;i++)balance+=balance*interest.given.annualRate;
 assert.equal(Number((balance-interest.given.principal).toFixed(2)),interest.answer);
 assert.equal(intake.status,'candidate-only');assert.equal(percentage.number,1);assert.ok(intake.items.slice(1).every(q=>q.number===null));
});

test('NECO starter draft retains selected scope and independently checked results',()=>{
 const draft=require('../ops/nigeria-exams/neco-starter-draft.json');
 assert.equal(draft.status,'draft-not-published');assert.equal(draft.items.length,3);
 assert.equal(draft.items[0].answer,'90.');assert.equal(draft.items[1].answer,'2/3 hour.');assert.equal(draft.items[2].answer,'₦432.59.');
 for(const q of draft.items){assert.equal(q.exam,'NECO');assert.equal(q.year,2023);assert.equal(q.paper,'III');assert.equal(q.steps.length,3);assert.equal(q.checks.length,2);assert.match(q.sourceUse,/not a complete paper/);}
});
