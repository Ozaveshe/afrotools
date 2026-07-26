const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const engine = require(path.join(root, 'tools/ielts-calculator/ielts-vip-engine.js'));
const html = fs.readFileSync(path.join(root, 'tools/ielts-calculator/index.html'), 'utf8');

assert.strictEqual(engine.calculateOverall({
  listening: 6.5, reading: 6.5, writing: 5, speaking: 7
}).overall, 6.5, 'an average ending .25 should round up to the next half band');

assert.strictEqual(engine.calculateOverall({
  listening: 4, reading: 3.5, writing: 4, speaking: 4
}).overall, 4, '3.875 should round to 4.0');

assert.strictEqual(engine.calculateOverall({
  listening: 6.5, reading: 6.5, writing: 5.5, speaking: 6
}).overall, 6, '6.125 should round to 6.0');

assert.throws(() => engine.calculateOverall({
  listening: 6.2, reading: 6.5, writing: 6.5, speaking: 6.5
}), /whole or half band/, 'section scores outside whole or half bands should be rejected');

assert.strictEqual(engine.rawEstimate(30, 'listening', 'academic').band, 7, 'Listening 30/40 reference should estimate band 7');
assert.strictEqual(engine.rawEstimate(30, 'reading', 'academic').band, 7, 'Academic Reading 30/40 reference should estimate band 7');
assert.strictEqual(engine.rawEstimate(30, 'reading', 'general').band, 6, 'General Training Reading 30/40 reference should estimate band 6');
assert.strictEqual(engine.rawEstimate(10, 'reading', 'general').display, 'Below 4.0', 'scores below the reference table should not invent a precise band');
assert.strictEqual(engine.rawEstimate(30.5, 'reading', 'academic').valid, false, 'raw scores must be whole numbers');
assert.strictEqual(engine.compare(6.5, 7).status, 'within-half-band');
assert.strictEqual(engine.compare(7, 6.5).status, 'at-or-above');

assert(html.includes('/assets/fonts/typography.css'), 'self-hosted typography should be loaded');
assert(!html.includes('fonts.googleapis.com'), 'Google font stylesheets should be removed');
assert(html.includes('ielts-vip-engine.js'), 'the verified engine should be wired');
assert(html.includes('ielts-calculator-vip.js'), 'the VIP controller should be wired');
assert(html.includes('Print / save PDF'), 'print/PDF export should be offered');
assert(html.includes('does not decide admission, scholarship, work, or visa eligibility'), 'hero should state the decision boundary');
assert(!html.includes('What You Qualify For Now'), 'unsupported qualification claims should be removed from visible copy');
assert(!html.includes('equivalent planning ranges'), 'unverified cross-test equivalence framing should be removed');

console.log('IELTS Calculator VIP engine and static contract verified.');
