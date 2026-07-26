const assert = require('assert');
const fs = require('fs');
const path = require('path');
const engine = require('../tools/pregnancy-nutrition/pregnancy-food-engine.js');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools/pregnancy-nutrition/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'tools/pregnancy-nutrition/pregnancy-food-planner.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'tools/pregnancy-nutrition/pregnancy-food-planner.css'), 'utf8');
const context = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context/pregnancy-nutrition.json'), 'utf8'));

assert.match(html, /<title>Pregnancy Food Variety Planner \| AfroTools<\/title>/);
assert.match(html, /Sources checked: 26 July 2026/);
assert.match(html, /not a calorie target, meal prescription/);
assert.match(html, /Do not use this worksheet to manage diabetes/);
assert.match(html, /No food selections or supplement status are saved/);
assert.doesNotMatch(html, /fonts\.googleapis|cdn\.jsdelivr|cdnjs\.cloudflare|health-workflow|email-gated|Save to dashboard|Calculate nutritional needs|Daily calorie/i);
assert.doesNotMatch(script, /localStorage|sessionStorage|fetch\(|\/api\//);
assert.match(script, /assets\/vendor\/jspdf\/jspdf\.umd\.min\.js/);
assert.match(script, /prefers-reduced-motion: reduce/);
assert.match(script, /reducedMotion \? 'auto' : 'smooth'/);
assert.match(css, /font-family:\s*var\(--font-body/);
assert.match(css, /@media \(prefers-color-scheme: dark\)/);
assert.match(context.staticText, /must never calculate or prescribe calories/);
assert.match(context.staticText, /require individualized professional care/);

const invalid = engine.build({ groups: [], safetyChecks: [], supplementStatus: 'confirm' });
assert.strictEqual(invalid.valid, false);

const plan = engine.build({
  groups: ['vegetables', 'staples', 'pulses', 'pulses', 'unknown'],
  safetyChecks: ['clean-water', 'wash-produce', 'no-alcohol'],
  supplementStatus: 'provider-plan'
});
assert.strictEqual(plan.valid, true);
assert.deepStrictEqual(plan.selectedGroups, ['Vegetables', 'Staples or whole grains', 'Beans, peas, nuts or seeds']);
assert.strictEqual(plan.varietyQuestions.length, 3);
assert.strictEqual(plan.safetyQuestions.length, 2);
assert.match(plan.supplementCopy, /Do not change doses/);
assert.match(plan.boundary, /does not assess adequacy/);

const all = engine.build({
  groups: engine.GROUPS.map((item) => item.id),
  safetyChecks: engine.SAFETY.map((item) => item.id),
  supplementStatus: 'not-recorded'
});
assert.strictEqual(all.varietyQuestions.length, 0);
assert.strictEqual(all.safetyQuestions.length, 0);
assert.match(all.supplementCopy, /No supplement status/);

console.log('pregnancy food planner VIP tests passed');
