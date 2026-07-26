const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const contextBuilder = require('../scripts/build-ai-tool-context.js');
const engine = require('../tools/breastfeeding-tracker/feeding-log-engine.js');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools/breastfeeding-tracker/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'tools/breastfeeding-tracker/feeding-log.js'), 'utf8');
const context = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context/breastfeeding-tracker.json'), 'utf8'));

assert.match(html, /<title>Private Feeding and Nappy Log \| AfroTools<\/title>/);
assert.match(html, /cannot measure milk transfer, diagnose low supply/);
assert.match(html, /A log must never delay help/);
assert.match(html, /Sources checked: 26 July 2026/);
assert.match(html, /Nothing persists automatically/);
assert.doesNotMatch(html, /fonts\.googleapis|cdn\.jsdelivr|cdnjs\.cloudflare|health-workflow|email-gated|Save to dashboard|personalised ranges|all 54 African countries/i);
assert.doesNotMatch(script, /(?:localStorage|sessionStorage)\s*\.\s*(?:setItem|getItem|removeItem|clear)|fetch\(|\/api\//);
assert.match(script, /assets\/vendor\/jspdf\/jspdf\.umd\.min\.js/);
assert.match(context.staticText, /must never infer milk transfer/);
assert.match(context.staticText, /never silently persist/);
contextBuilder.validateDefinition(context, 'breastfeeding-tracker.json');
assert.strictEqual(
  context.legacyTextSha256,
  'sha256:' + crypto.createHash('sha256').update(context.staticText).digest('hex')
);

const breastfeed = engine.create({
  type: 'breastfeed',
  timestamp: '2026-07-26T08:30',
  side: 'left',
  durationMinutes: '18',
  amountMl: '200',
  asOf: '2026-07-26T09:00:00Z'
});
assert.strictEqual(breastfeed.valid, true);
assert.strictEqual(breastfeed.entry.sideLabel, 'Left');
assert.strictEqual(breastfeed.entry.durationMinutes, 18);
assert.strictEqual(breastfeed.entry.amountMl, null);

const expressed = engine.create({
  type: 'expressed-milk',
  timestamp: '2026-07-26T08:30',
  durationMinutes: '',
  amountMl: '75',
  asOf: '2026-07-26T09:00:00Z'
});
assert.strictEqual(expressed.valid, true);
assert.strictEqual(expressed.entry.amountMl, 75);
assert.strictEqual(expressed.entry.side, null);

const nappy = engine.create({
  type: 'wet-nappy',
  timestamp: '2026-07-26T08:30',
  durationMinutes: '10',
  amountMl: '40',
  asOf: '2026-07-26T09:00:00Z'
});
assert.strictEqual(nappy.valid, true);
assert.strictEqual(nappy.entry.durationMinutes, null);
assert.strictEqual(nappy.entry.amountMl, null);

assert.strictEqual(engine.create({
  type: 'breastfeed',
  timestamp: '2026-07-27T08:30',
  side: 'both',
  asOf: '2026-07-26T09:00:00Z'
}).valid, false);
assert.deepStrictEqual(engine.create({
  type: 'breastfeed',
  timestamp: '2026-02-30T08:30',
  side: 'left',
  asOf: '2026-03-01T09:00:00Z'
}), {
  valid: false,
  error: 'Enter a valid local date and time.',
  field: 'event-time'
});
assert.strictEqual(engine.create({
  type: 'breastfeed',
  timestamp: '2026-07-26T09:01',
  side: 'left',
  asOf: '2026-07-26T09:00:00'
}).valid, false);
assert.strictEqual(engine.create({
  type: 'breastfeed',
  timestamp: '2026-07-26T08:30',
  side: 'left',
  durationMinutes: '1.5',
  asOf: '2026-07-26T09:00:00'
}).field, 'duration-minutes');
assert.strictEqual(engine.create({
  type: 'expressed-milk',
  timestamp: '2026-07-26T08:30',
  amountMl: '501',
  asOf: '2026-07-26T09:00:00'
}).field, 'amount-ml');
assert.strictEqual(engine.create({
  type: 'breastfeed',
  timestamp: '2026-07-26T08:30',
  side: 'unknown',
  asOf: '2026-07-26T09:00:00Z'
}).valid, false);

const summary = engine.summarize([breastfeed.entry, expressed.entry, nappy.entry]);
assert.strictEqual(summary.eventCount, 3);
assert.strictEqual(summary.counts.breastfeed, 1);
assert.match(summary.boundary, /cannot confirm feeding adequacy/);

console.log('feeding and nappy log VIP tests passed');
