'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../../../../scripts/lib/jamb-publication.js'),'utf8');
const declaration=source.match(/const QUESTION_FIELDS = new Set\(\[([\s\S]*?)\]\);/);
assert.ok(declaration,'Publication QUESTION_FIELDS declaration must remain inspectable');
const allowed=new Set([...declaration[1].matchAll(/'([^']+)'/g)].map(m=>m[1]));
assert.ok(allowed.has('id')&&allowed.has('verification'));
module.exports=q=>{
  for(const key of Object.keys(q))assert.ok(allowed.has(key),q.id+' unsupported public field '+key);
  assert.deepEqual(Object.keys(q.verification).sort(),['method','reviewed_at']);
  assert.equal(q.verification.method,'ai-source-checked');
  assert.equal(q.verification.reviewed_at,'2026-09-12');
};
