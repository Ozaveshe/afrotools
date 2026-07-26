const assert = require('assert');
const fs = require('fs');
const path = require('path');
const engine = require('../tools/csection-vs-natural/birth-options-engine.js');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools/csection-vs-natural/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'tools/csection-vs-natural/birth-options.js'), 'utf8');
const context = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context/csection-vs-natural.json'), 'utf8'));

assert.match(html, /<title>Birth Options Question Builder \| AfroTools<\/title>/);
assert.match(html, /does not score risks, decide a mode of birth/);
assert.match(html, /Clinical safety comes before price/);
assert.match(html, /Use vaginal birth, not “natural”/);
assert.match(html, /Sources checked: 26 July 2026/);
assert.doesNotMatch(html, /fonts\.googleapis|cdn\.jsdelivr|cdnjs\.cloudflare|Nigeria's rate|WHO recommended maximum|Compare Birth Costs|costs approximately|VBAC costs/i);
assert.doesNotMatch(script, /(?:localStorage|sessionStorage)\s*\.\s*(?:setItem|getItem|removeItem|clear)|fetch\(|\/api\//);
assert.match(script, /assets\/vendor\/jspdf\/jspdf\.umd\.min\.js/);
assert.match(context.staticText, /must never score, rank or recommend/);
assert.match(context.staticText, /Cost and coverage questions must remain separate/);
assert.strictEqual(context.schemaVersion, 1);
assert.strictEqual(context.status, 'unverified-static');
assert.match(context.legacyTextSha256, /^sha256:[a-f0-9]{64}$/);

assert.strictEqual(engine.build({
  context: 'not-decided',
  topics: [],
  costStatus: 'need-quote'
}).valid, false);

const result = engine.build({
  context: 'previous-caesarean',
  topics: ['reason', 'benefits-risks', 'reason', 'unknown'],
  costStatus: 'need-quote'
});
assert.strictEqual(result.valid, true);
assert.strictEqual(result.contextLabel, 'Discussion after previous caesarean');
assert.strictEqual(result.questions.length, 5);
assert.strictEqual(result.costQuestions.length, 2);
assert.match(result.questions[4], /previous operation details/);
assert.match(result.boundary, /does not rank or recommend/);

const noCost = engine.build({
  context: 'vaginal-discussion',
  topics: ['experience'],
  costStatus: 'not-included'
});
assert.strictEqual(noCost.valid, true);
assert.deepStrictEqual(noCost.costQuestions, []);

console.log('birth options question builder VIP tests passed');
