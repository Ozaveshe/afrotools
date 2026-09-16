'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const bank=require('../assets/js/lib/jamb-recent-written-bank'),ssce=require('../assets/js/lib/ssce-written-bank'),api=require('../assets/js/lib/ssce-written');
const {render,route}=require('../scripts/build-jamb-recent-practice');
test('recent revision answers independently match counting, operations and numerical integration',()=>{
 const answers=bank.items.map(q=>q.answer);
 assert.equal(answers[0],'10,080.');assert.equal(8*7*6*5*4*3*2/(2*2),10080);
 assert.ok(Math.abs(16**.16*16**.04*2**.2-2)<1e-12);assert.equal(answers[1],'2.');
 const star=(a,b)=>a*a*b,diamond=(a,b)=>2*a+b;assert.equal(diamond(star(-4,2),star(7,-1)),15);assert.equal(answers[2],'15.');
 // Midpoint quadrature provides a check independent of the published antiderivative.
 const n=100000;let integral=0;for(let i=0;i<n;i++){const x=(i+.5)/n;integral+=(4*x-6*x**(2/3))/n;}
 assert.ok(Math.abs(integral+8/5)<1e-7);assert.equal(answers[3],'−8/5.');
 assert.equal(((1230-1040)/1230*100).toFixed(2),'15.45');assert.equal(answers[4],'15.45%.');
 assert.equal(bank.items.length,5);assert.equal(new Set(bank.items.map(q=>q.id)).size,5);
 for(const q of bank.items){assert.equal(q.year,null);assert.equal(q.number,null);assert.equal(q.sourceYear,2023);assert.match(q.source,/^https:\/\/myschool.ng\/classroom\/mathematics\//);}
});
test('revision saves cannot overwrite legacy WAEC and NECO responses or accept their backups',()=>{
 const values=new Map(),store={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 const entry={answer:'Synthetic saved response',checks:[true,false]};
 api.write(store,ssce,'written-m1',entry);const original=values.get(api.key);
 api.write(store,bank,bank.items[0].id,entry);
 assert.equal(values.get(api.key),original);assert.equal(api.read(store,bank).entries[bank.items[0].id].answer,entry.answer);
 assert.throws(()=>api.normalize(api.read(store,ssce),bank));assert.throws(()=>api.keyFor({id:'../invalid'}));
});
test('recent route exposes useful crawlable content and honest year attribution',()=>{
 const html=render();assert.ok(html.includes('https://afrotools.com'+route));assert.match(html,/not a complete authenticated exam sitting/);
 for(const q of bank.items){assert.ok(html.includes(q.prompt));assert.ok(html.includes(q.id));}
 assert.match(html,/build-jamb-recent-practice.js/);assert.match(html,/index, follow/);
});
