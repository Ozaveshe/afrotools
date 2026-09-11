'use strict';

// Reproduce the calculations used in this individually reviewed source batch.
// These checks do not review unlisted questions or establish source rights.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const { questionFingerprint } = require(path.join(root, 'scripts/lib/jamb-content-trust'));
const pool = JSON.parse(fs.readFileSync(path.join(root, 'ops/jamb/source-pool.json'))).questions;
const batch = JSON.parse(fs.readFileSync(path.join(__dirname, 'math-1983-publishable-001.json')));
const numbers = text => (text.replace(/[−–]/g, '-').match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
const get = num => pool.find(q => q.subject === 'mathematics' && q.year === 1983 && q.num === num);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const approximately = (a, b) => Math.abs(a - b) < 1e-10;
const checked = [];
function verify(num, accepts) {
  const q = get(num);
  assert.ok(q, `Question ${num} exists`);
  const evidence = batch.records.find(r => r.id === q.id);
  assert.equal(questionFingerprint(q), evidence.content_sha256, `Q${num} still matches reviewed content`);
  const matches = Object.entries(q.options).filter(([, value]) => accepts(value)).map(([letter]) => letter);
  assert.deepEqual(matches, [q.answer], `Q${num}: exactly one option matches the computed solution`);
  checked.push(q.id);
}

const values = [5, 9, 3, 5, 8].sort((a, b) => a - b);
const frequencies = new Map(values.map(v => [v, values.filter(x => x === v).length]));
const median = values[(values.length - 1) / 2];
const mode = [...frequencies].sort((a, b) => b[1] - a[1])[0][0];
verify(1, text => same(numbers(text), [median, mode]));

const polynomial = x => x ** 3 - 2 * x ** 2 - 5 * x + 6;
const otherRoots = Array.from({ length: 21 }, (_, i) => i - 10).filter(x => x !== 1 && polynomial(x) === 0);
verify(5, text => same(numbers(text).sort((a, b) => a - b), otherRoots));

const proportionalityConstant = 1 * 2 ** 3;
assert.equal(proportionalityConstant / 4 ** 3, 1 / 8);
verify(23, text => text === `u = ${proportionalityConstant}/V³`);

const xRoots = Array.from({ length: 41 }, (_, i) => i - 20).filter(x => x ** 2 + (2 - 5 * x) - 8 === 0);
verify(24, text => same(numbers(text).sort((a, b) => a - b), xRoots));

const data = [6, 10, 14, 16, 26];
const angles = data.map(v => 360 * v / data.reduce((a, b) => a + b, 0));
assert.equal(angles.reduce((a, b) => a + b, 0), 360);
verify(27, text => same(numbers(text), angles));

const word = 'MATRICULATION';
const chance = [...word].filter(c => 'AEIOU'.includes(c)).length / word.length;
verify(29, text => { const [a, b] = numbers(text); return approximately(a / b, chance); });

const roundedProduct = Number((Number((59.81789).toPrecision(3)) * Number((0.0746829).toPrecision(3))).toPrecision(3));
verify(30, text => approximately(Number(text), roundedProduct));

verify(32, text => { const [m, n] = numbers(text); return approximately((2 / 3) ** m * (3 / 4) ** n, 256 / 729); });

const variationOptions = {
  'y = 10x²/31 + 52/(31√x)': x => 10 * x ** 2 / 31 + 52 / (31 * Math.sqrt(x)),
  'y = x² + 1/√x': x => x ** 2 + 1 / Math.sqrt(x),
  'y = x² + 1/x': x => x ** 2 + 1 / x,
  'y = x²/31 + 1/(31√x)': x => x ** 2 / 31 + 1 / (31 * Math.sqrt(x)),
  'y = (10/31)(x² + 1/√x)': x => 10 / 31 * (x ** 2 + 1 / Math.sqrt(x))
};
verify(14, text => { const f = variationOptions[text]; assert.ok(f); return approximately(f(1), 2) && approximately(f(4), 6); });
const fractionOptions = {
  'x/[(x − 3)(x + 7)]': x => x / ((x - 3) * (x + 7)),
  '[(x + 3)(x + 7)]/x': x => ((x + 3) * (x + 7)) / x,
  'x/[(x − 3)(x − 7)]': x => x / ((x - 3) * (x - 7)),
  'x/[(x + 3)(x + 7)]': x => x / ((x + 3) * (x + 7)),
  'x/[(x + 4)(x + 7)]': x => x / ((x + 4) * (x + 7))
};
verify(15, text => { const f = fractionOptions[text]; assert.ok(f); return [-11, -5, -2, 1, 2, 4, 8].every(x => approximately(f(x), (x - 7) / (x * x - 9) * (x * x - 3 * x) / (x * x - 49))); });
assert.equal(checked.length, batch.records.length);
console.log(JSON.stringify({ checked: checked.length, passed: true, question_ids: checked }));
