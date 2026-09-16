'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const { questionFingerprint } = require(path.join(root, 'scripts/lib/jamb-content-trust'));
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const pool = read('ops/jamb/source-pool.json').questions;
const ledger = read('data/jamb/review-ledger.json');
const batch = read('ops/jamb/verification/math-2023-publishable-001.json');
const snapshotBytes = fs.readFileSync(path.join(root, batch.source_file));
assert.equal(crypto.createHash('sha256').update(snapshotBytes).digest('hex'), batch.source_snapshot_sha256);
const snapshot = JSON.parse(snapshotBytes);
const checked = [];
function verify(item, values, result, tolerance = 1e-10) {
  const id = 'mathematics-2023-myschool-' + item;
  const q = pool.find(q => q.id === id);
  assert.ok(q, id);
  const record = batch.records.find(r => r.id === id);
  assert.equal(questionFingerprint(q), record.content_sha256);
  const source = ledger.sources[ledger.questions[id].source_id];
  assert.equal(source.content_sha256, batch.source_snapshot_sha256);
  const observed = snapshot.records.find(r => r.source_item === item);
  assert.equal(q.question, observed.adapted_prompt);
  assert.deepEqual(q.options, observed.options);
  assert.equal(q.source_provenance.url, observed.source_url);
  assert.deepEqual(Object.keys(values).sort(), Object.keys(q.options).sort());
  const matches = Object.keys(values).filter(key => Math.abs(values[key] - result) <= tolerance);
  assert.deepEqual(matches, [q.answer], id + ': exactly one numeric option matches');
  checked.push(id);
}
const factorial = n => n < 2 ? 1 : n * factorial(n - 1);
// Independently enumerate distinct permutations rather than relying only on the formula.
const arrangements = new Set();
function permute(prefix, remaining) {
  if (!remaining.length) { arrangements.add(prefix); return; }
  const seen = new Set();
  remaining.forEach((letter, i) => {
    if (seen.has(letter)) return;
    seen.add(letter);
    permute(prefix + letter, remaining.filter((_, j) => j !== i));
  });
}
permute('', [...'SYLLABUS']);
assert.equal(arrangements.size, factorial(8) / (factorial(2) ** 2));
verify('67243', { A: factorial(7), B: factorial(8) / factorial(2), C: factorial(8) / factorial(2) ** 2, D: factorial(8) }, arrangements.size);
verify('67244', { A: 2, B: 0, C: 2 ** 0, D: 1 / 2 }, 16 ** 0.16 * 16 ** 0.04 * 2 ** 0.2);
const star = (a, b) => a * a * b;
const diamond = (a, b) => 2 * a + b;
verify('67245', { A: -49, B: 64, C: 113, D: 15 }, diamond(star(-4, 2), star(7, -1)));
// Midpoint numerical integration independently checks the exact antiderivative.
const n = 100000;
let integral = 0;
for (let i = 0; i < n; i++) {
  const x = (i + 0.5) / n;
  integral += (4 * x - 6 * Math.cbrt(x * x)) / n;
}
assert.ok(Math.abs(integral - (2 - 18 / 5)) < 1e-7);
verify('67248', { A: -5 / 8, B: -8 / 5, C: 8 / 5, D: 5 / 8 }, integral, 1e-7);
verify('67251', { A: 15.44, B: 15.43, C: 15.42, D: 15.45 }, Number((100 * (1230 - 1040) / 1230).toFixed(2)));
verify('67253', { A: 12, B: 19, C: 20, D: 11 }, 360 / (180 / 6));
// Substitute several nondegenerate inputs in each offered rearrangement.
const formulaOptions = {
  A: (c,d,y) => -(9*c-5*d*y)/(4*y-3), B: (c,d,y) => (9*c+5*d*y)/(4*y-3),
  C: (c,d,y) => (9*c-5*d*y)/(4*y-3), D: (c,d,y) => -(9*c+5*d*y)/(4*y-3)
};
const formulaErrors = Object.fromEntries(Object.entries(formulaOptions).map(([key, formula]) => [key,
  [[2,3,4],[-1,2,5],[3,-2,-1]].reduce((error,[c,d,y]) => {
    const x = formula(c,d,y);
    return error + Math.abs((3*x-9*c)/(4*x+5*d)-y);
  },0)]));
verify('67257', formulaErrors, 0);
// Exhaust the four candidate half-lines over boundary and nearby test values.
const domains = { A: x=>x<=-3, B:x=>x>=-3, C:x=>x<=3, D:x=>x>=3 };
const mismatches = Object.fromEntries(Object.entries(domains).map(([key, accepts]) => [key,
  [-100,-4,-3.001,-3,-2.999,0,3,4,100].filter(x=>accepts(x)!==(3*(x-1)<=2*(x-3))).length]));
verify('67258', mismatches, 0);
assert.equal(checked.length, batch.records.length);
console.log(JSON.stringify({ passed: true, question_ids: checked }));
