'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const draft = process.argv.includes('--draft');
const root = draft ? 'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools' : path.resolve(__dirname, '../../..');
const batch = draft ? {records: require('./math-1988-004-updates.json')} : require('./math-1988-publishable-004.json');
const pool = draft ? batch.records : require(path.join(root, 'ops/jamb/source-pool.json')).questions;
assert.equal(batch.records.length, 1);
for (const record of batch.records) {
  const q = pool.find(item => item.id === record.id);
  if (!draft) {
    assert.equal(require(path.join(root, 'scripts/lib/jamb-content-trust')).questionFingerprint(q), record.content_sha256);
    assert.equal(q.explanation, record.explanation);
    assert.equal(q.ai_explanation, record.explanation);
  }
  assert.match(q.question, /4a² − 49b²/);
  assert.match(q.question, /2a² \+ 5ab − 7b²/);
  assert.deepEqual(q.options, {A:'(a − b)/(2a + b)', B:'(2a + 7b)/(a − b)', C:'(2a − 7b)/(a + b)', D:'(2a − 7b)/(a − b)'});
  // Compare rational expressions by exact cross multiplication, including cases
  // in which a cancelled factor makes the original expression undefined.
  const options = {
    A: (a,b) => [a-b,2*a+b], B: (a,b) => [2*a+7*b,a-b],
    C: (a,b) => [2*a-7*b,a+b], D: (a,b) => [2*a-7*b,a-b]
  };
  const agrees = {A:true,B:true,C:true,D:true};
  let checked = 0, excluded = 0;
  for (let a=-30;a<=30;a++) for(let b=-20;b<=20;b++) {
    const numerator=4*a*a-49*b*b, denominator=2*a*a+5*a*b-7*b*b;
    assert.ok(numerator===(2*a-7*b)*(2*a+7*b));
    assert.ok(denominator===(2*a+7*b)*(a-b));
    assert.equal(denominator===0, a===b || 2*a+7*b===0);
    if (!denominator) { excluded++; continue; }
    checked++;
    for(const [letter, evaluate] of Object.entries(options)) {
      const [n,d]=evaluate(a,b);
      if(!d || numerator*d!==n*denominator) agrees[letter]=false;
    }
  }
  assert.ok(checked>2000 && excluded>40);
  assert.deepEqual(Object.keys(agrees).filter(key=>agrees[key]),[q.answer]);
  assert.match(q.explanation,/a ≠ b and 2a \+ 7b ≠ 0/);
}
console.log(JSON.stringify({passed:true,count:1,question_ids:batch.records.map(r=>r.id)}));
