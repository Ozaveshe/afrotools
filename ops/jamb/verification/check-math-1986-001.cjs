'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const batch=require('./math-1986-publishable-001.json');
assert.equal(batch.records.length,1);
const record=batch.records[0];
const q=require(path.join(root,'ops/jamb/source-pool.json')).questions.find(q=>q.id===record.id);
assert.equal(q.year,1986,'Year follows the actual rendered source heading, not the legacy ID');
assert.equal(questionFingerprint(q),record.content_sha256);
function baseThree(text){const m=text.match(/^\(([0-9]+)\)₃$/);assert.ok(m);return /^[012]+$/.test(m[1])?[...m[1]].reduce((value,digit)=>value*3+Number(digit),0):NaN;}
const answer=baseThree('(212)₃')-baseThree('(121)₃')+baseThree('(222)₃');
assert.equal(answer,33);
assert.deepEqual(Object.entries(q.options).filter(([,value])=>baseThree(value)===answer).map(([letter])=>letter),[q.answer]);
console.log(JSON.stringify({passed:true,count:1,question_ids:[q.id]}));
